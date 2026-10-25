import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component, validDocument } from '../src/builder/componentDocument.js';
import { savedOfferings, exitOfferTarget, isExitOfferStep, createExitOffer, exitOfferSource, exitOfferConnection, exitContentChoices } from '../src/builder/exitOffers.js';
import { readSavedPaywall, savePaywall, savePaywallBatch } from '../src/paywallStorage.js';
import { indexDocument, importComponentDocument } from '../src/builder/componentDocument.js';
import { createCatalogComponent } from '../src/builder/componentCatalog.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';

const button = (id, action, destination) => component(id, 'Button', id, { action: { action, actionPage: destination } }, [component(`${id}-text`, 'Text', '', { text: id })]);
const fixture = (id = 'primary', children = []) => ({ version: 3, templateId: 'blank', products: { sku: { name: id, price: id === 'offer' ? '¥50' : '¥100' } }, root: component(`${id}-root`, 'Screen', id, {}, [component(`${id}-package`, 'Package', id, { dataKey: 'sku', defaultSelected: true }, [component(`${id}-price`, 'Text', '', { binding: { field: 'price' } })]), ...children]) });
const record = (id, document, state = 'Draft') => ({ version: 1, paywall: { id, name: id, state }, templateId: document.templateId, document });
const storage = () => { const map = new Map(); return { get length() { return map.size; }, key: (index) => [...map.keys()][index], getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; };

let server, Presentation, Settings, Editor;
const mounted = new Set();
const previous = { window: globalThis.window, ResizeObserver: globalThis.ResizeObserver, localStorage: globalThis.localStorage };
before(async () => {
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.localStorage = storage();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, setInterval, clearInterval };
  server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null } });
  Presentation = (await server.ssrLoadModule('/src/builder/PaywallPresentation.jsx')).default;
  Settings = (await server.ssrLoadModule('/src/builder/PaywallSettings.jsx')).default;
  Editor = (await server.ssrLoadModule('/src/builder/ComponentEditor.jsx')).default;
});
after(async () => { for (const app of mounted) await act(async () => app.unmount()); await server?.close(); Object.assign(globalThis, previous); });
const text = (node) => typeof node === 'string' ? node : node.children?.map(text).join('') ?? '';
async function mount(document, offerings, props = {}) {
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Presentation, { document, offerings, currentPaywallId: 'primary', editing: false, onSelect() {}, onStatus() {}, ...props })); });
  mounted.add(renderer);
  const click = async (id) => {
    const node = renderer.root.findAll((item) => typeof item.type === 'string' && (item.props['data-component-id'] === id || item.props['aria-label'] === id) && item.props.onClick)[0];
    assert.ok(node, `click ${id}`); await act(async () => node.props.onClick({ stopPropagation() {}, preventDefault() {} }));
  };
  const visible = (id) => renderer.root.findAll((item) => typeof item.type === 'string' && item.props['data-component-id'] === id).length > 0;
  return { renderer, click, visible };
}

test('Offering targets are independent saved paywalls; missing, self, inactive and productless targets cannot trigger', () => {
  const doc = fixture(), offer = fixture('offer');
  doc.settings = { exitOfferOfferingId: 'offer' };
  const offerings = savedOfferings([record('primary', doc), record('offer', offer), record('inactive', offer, 'Inactive'), record('empty', { ...fixture('empty'), products: {}, root: component('empty', 'Screen', '', {}, []) })], 'primary');
  assert.deepEqual(offerings.map((item) => item.id), ['offer', 'empty']);
  assert.equal(offerings[1].packageCount, 0);
  assert.equal(exitOfferTarget(doc, offerings, 'primary')?.document, offer);
  assert.equal(exitOfferTarget({ ...doc, settings: { exitOfferOfferingId: 'empty' } }, offerings), null);
  assert.equal(exitOfferTarget(doc, offerings, 'offer'), null);
  assert.equal(exitOfferTarget(doc, [], 'primary'), null);
  assert.ok(validDocument(doc)); assert.equal(validDocument({ ...doc, settings: { exitOfferOfferingId: {} } }), false);
  const store = storage(); savePaywall(store, { id: 'primary', name: 'primary', state: 'Draft' }, doc);
  doc.settings.exitOfferOfferingId = '';
  assert.equal(readSavedPaywall(store, 'primary').document.settings.exitOfferOfferingId, 'offer');
});

test('exit eligibility follows the final flow step, not HT auxiliary detail screens', () => {
  const doc = fixture(); doc.root.children = [component('flow', 'Flow', '', {}, [component('first', 'Screen', ''), component('last', 'Screen', '')])];
  assert.equal(isExitOfferStep(doc), false); assert.equal(isExitOfferStep(doc, { flow: 1 }), true);
  doc.root.children[0].children = [component('first', 'Screen', ''), component('first/detail-screen-0', 'Screen', '')];
  assert.equal(isExitOfferStep(doc), true); assert.equal(isExitOfferStep(doc, { flow: 1 }), false);
});

test('editing exit popup backdrop is its predecessor purchase screen, not the initial intro',async()=>{
  const background=fixture();
  background.root.children=[component('flow','Flow','步骤',{initialStepId:'intro'},[
    component('intro','Screen','介绍',{},[component('intro-copy','Text','介绍正文',{text:'Intro'})]),
    component('purchase','Screen','购买',{},[component('purchase-copy','Text','购买正文',{text:'Purchase'})]),
  ])];
  const offer=fixture('offer');
  offer.settings={presentationSurfaceId:'popup'};
  offer.root.children=[component('popup','BottomSheet','挽留',{presentation:'overlay'},[component('offer-copy','Text','优惠',{text:'Offer'})])];
  const {renderer}=await mount(offer,[],{editing:true,backdropDocument:background,navigation:{overlay:'popup'}});
  const underlay=renderer.root.findByProps({className:'ne-exit-underlay'});
  assert.equal(underlay.findAll(item=>typeof item.type==='string'&&item.props['data-component-id']==='purchase-copy').length,1);
  assert.equal(underlay.findAll(item=>typeof item.type==='string'&&item.props['data-component-id']==='intro-copy').length,0);
});

test('exit trigger readback and runtime share the final visible non-auxiliary source, not canvas selection or names', () => {
  const doc = fixture(); doc.settings = { exitOfferOfferingId: 'offer' };
  const first = component('intro', 'Screen', '介绍'), last = component('purchase', 'Screen', '购买页面');
  const detail = component('custom-detail', 'Screen', '详情', { auxiliary: true });
  doc.root.children = [component('flow', 'Flow', '', {}, [first, last, detail, component('hidden', 'Screen', '', { hidden: true })])];
  const offerings = savedOfferings([record('offer', fixture('offer'))]);
  const edge = exitOfferConnection(doc, offerings, 'primary');
  assert.equal(exitOfferSource(doc).id, last.id);
  assert.equal(edge.source, last.id); assert.equal(edge.targetOwner, 'offer'); assert.equal(edge.target, 'offer-root');
  assert.equal(edge.description, '关闭「购买页面」 → offer');
  assert.equal(isExitOfferStep(doc, { flow: 1 }), true); assert.equal(isExitOfferStep(doc, { flow: 2 }), false);
  last.name = '重命名购买页面';
  assert.match(exitOfferConnection(doc, offerings, 'primary').description, /重命名购买页面/);
  doc.root.children[0].children = [last, first, detail];
  assert.equal(exitOfferConnection(doc, offerings, 'primary').source, first.id);
  assert.equal(isExitOfferStep(doc, { flow: 0 }), false); assert.equal(isExitOfferStep(doc, { flow: 1 }), true);
  assert.equal(exitOfferConnection(doc, [], 'primary'), null);
  assert.equal(exitOfferConnection(doc, [{ ...offerings[0], packageCount: 0 }], 'primary'), null);
  doc.settings.exitOfferOfferingId = '';
  assert.equal(exitOfferConnection(doc, offerings, 'primary'), null);
});

test('settings visibly report source, close event, destination and terminal result without adding a second trigger field', async () => {
  const doc = fixture('购买页面'); doc.settings = { exitOfferOfferingId: 'offer' };
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Settings, { document: doc, offerings: savedOfferings([record('offer', fixture('offer'))]), onChange() {} })); }); mounted.add(renderer);
  const rule = renderer.root.findByProps({ 'aria-label': '退出优惠触发规则' });
  for (const value of ['触发页面', '购买页面', '触发事件', '关闭页面', '展示内容', 'offer', '关闭优惠后', '结束整个付费墙流程']) assert.ok(text(rule).includes(value), value);
  assert.equal(renderer.root.findAllByType('select').length, 1);
  await act(async () => renderer.update(React.createElement(Settings, { document: { ...doc, settings: {} }, offerings: [], onChange() {} })));
  assert.match(text(renderer.root), /未绑定，直接关闭/);
});

test('exit canvas connection opens the canonical settings and removing the binding removes the connection', async () => {
  const doc = fixture('购买页面'); doc.settings = { exitOfferOfferingId: 'offer' };
  let renderer, latest;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: savedOfferings([record('offer', fixture('offer'))]), currentPaywallId: 'primary', onDocumentChange: (value) => { latest = value; } })); }); mounted.add(renderer);
  const connection = renderer.root.findAll((item) => item.type === 'button' && item.props['aria-label']?.startsWith('配置退出触发：'));
  assert.equal(connection.length, 1); assert.match(connection[0].props['aria-label'], /关闭「购买页面」 → offer/);
  await act(async () => connection[0].props.onClick());
  assert.ok(text(renderer.root.findByProps({ 'aria-label': '退出优惠触发规则' })).includes('购买页面'));
  const field = renderer.root.findAll((item) => item.type === 'select' && item.props['aria-label'] === '退出优惠 Offering')[0];
  await act(async () => field.props.onChange({ target: { value: '' } }));
  assert.equal(renderer.root.findAll((item) => item.type === 'button' && item.props['aria-label']?.startsWith('配置退出触发：')).length, 0);
  assert.deepEqual(latest.root, doc.root); assert.deepEqual(latest.products, doc.products);
});
test('preview from a selected independent exit board starts at the main page and requires closing it to enter the offer', async () => {
  const doc = fixture('primary'); doc.settings = { exitOfferOfferingId: 'offer' };
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: savedOfferings([record('offer', fixture('offer'))]), currentPaywallId: 'primary', onExitOfferChange() {} })); }); mounted.add(renderer);
  const click = async (name) => { const button = renderer.root.findAll((item) => item.type === 'button' && (item.props['aria-label'] === name || text(item) === name))[0]; assert.ok(button, name); await act(async () => button.props.onClick()); };
  await click('选择画板：offer'); await click('交互预览');
  const preview = renderer.root.findByType(Presentation);
  assert.equal(preview.props.document, doc); assert.equal(preview.props.currentPaywallId, 'primary');
  assert.ok(text(preview).includes('主付费墙')); assert.ok(text(preview).includes('¥100')); assert.equal(text(preview).includes('¥50'), false);
  await click('关闭付费墙预览'); assert.ok(text(preview).includes('退出优惠 · offer')); assert.ok(text(preview).includes('¥50'));
});

test('closing the primary displays the saved offer with its own products; closing the offer ends the session without chaining', async () => {
  const doc = fixture('primary', [button('dismiss-main', 'Dismiss')]); doc.settings = { exitOfferOfferingId: 'offer' };
  const offer = fixture('offer', [button('dismiss-offer', 'Dismiss')]); offer.settings = { exitOfferOfferingId: 'primary' };
  const offerings = savedOfferings([record('offer', offer), record('primary', doc)]);
  const h = await mount(doc, offerings);
  assert.ok(h.visible('primary-package')); await h.click('dismiss-main');
  assert.equal(h.visible('primary-package'), false); assert.ok(h.visible('offer-package'));
  assert.ok(text(h.renderer.root).includes('¥50')); assert.equal(text(h.renderer.root).includes('¥100'), false);
  await h.click('dismiss-offer'); assert.ok(text(h.renderer.root).includes('付费墙已关闭')); assert.equal(h.visible('primary-package'), false);
  await h.click('重新预览'); assert.ok(h.visible('primary-package'));
  await h.click('关闭付费墙预览'); assert.ok(h.visible('offer-package'));
  await h.click('关闭付费墙预览'); assert.ok(text(h.renderer.root).includes('付费墙已关闭'));
});

test('Sheet close and Back navigation do not invoke an exit offer; final-screen dismiss does', async () => {
  const doc = fixture(); doc.settings = { exitOfferOfferingId: 'offer' };
  const sheet = component('sheet', 'BottomSheet', '', { presentation: 'sheet' }, [button('close-sheet', 'CloseSheet')]);
  doc.root.children = [component('flow', 'Flow', '', {}, [component('first', 'Screen', '', {}, [button('open-sheet', 'OpenSheet', 'sheet'), sheet, button('next', 'NextScreen'), button('dismiss-first', 'Dismiss')]), component('last', 'Screen', '', {}, [button('back', 'NavigateBack'), button('dismiss-last', 'Dismiss')])])];
  const offerings = savedOfferings([record('offer', fixture('offer'))]);
  const h = await mount(doc, offerings);
  await h.click('open-sheet'); assert.ok(h.visible('close-sheet')); await h.click('close-sheet'); assert.equal(h.visible('close-sheet'), false); assert.equal(h.visible('offer-package'), false);
  await h.click('next'); await h.click('back'); assert.ok(h.visible('next')); assert.equal(h.visible('offer-package'), false);
  await h.click('dismiss-first'); assert.ok(text(h.renderer.root).includes('付费墙已关闭'));
  await h.click('重新预览'); await h.click('next'); await h.click('dismiss-last'); assert.ok(h.visible('offer-package'));
  await h.click('关闭付费墙预览'); await h.click('重新预览'); assert.ok(h.visible('next')); assert.equal(h.visible('back'), false);
});

test('no binding or removed target closes directly, while settings preserve an unavailable selection for repair', async () => {
  for (const id of ['', 'removed']) {
    const doc = fixture('primary', [button('dismiss', 'Dismiss')]); doc.settings = { exitOfferOfferingId: id };
    const h = await mount(doc, []); await h.click('dismiss'); assert.ok(text(h.renderer.root).includes('付费墙已关闭'));
  }
  let latest, renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Settings, { document: { ...fixture(), settings: { exitOfferOfferingId: 'removed' } }, offerings: [], onChange: (value) => { latest = value; } })); }); mounted.add(renderer);
  assert.ok(renderer.root.findAll((item) => item.props.role === 'alert').length);
  await act(async () => renderer.root.findByType('select').props.onChange({ target: { value: '' } })); assert.equal(latest.exitOfferOfferingId, '');
});

test('actual editor owns exit configuration at document level and does not change any component or template', async () => {
  const doc = fixture(); let latest, renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: savedOfferings([record('offer', fixture('offer'))]), currentPaywallId: 'primary', onDocumentChange: (value) => { latest = value; } })); }); mounted.add(renderer);
  const settingsButton = renderer.root.findAll((item) => item.type === 'button' && text(item) === '付费墙设置')[0];
  await act(async () => settingsButton.props.onClick());
  const field = renderer.root.findAll((item) => item.type === 'select' && item.props['aria-label'] === '退出优惠 Offering')[0];
  await act(async () => field.props.onChange({ target: { value: 'offer' } }));
  assert.equal(latest.settings.exitOfferOfferingId, 'offer'); assert.deepEqual(latest.root, doc.root); assert.deepEqual(latest.products, doc.products);
  assert.equal(doc.settings, undefined);
});

test('converting existing HT retention preserves copy, assets, geometry and products without a visible generated launcher', () => {
  const template = templates.find((item) => item.id === 'ht-blue-privilege');
  const doc = importComponentDocument(createBuilderNodes(template.id), template);
  const original = structuredClone(doc);
  const surface = [...indexDocument(doc).nodes.values()].find((node) => node.name === '挽留弹窗');
  const launcher = createCatalogComponent('BottomSheet', 'launcher');
  launcher.props.action.actionPage = surface.id;
  doc.root.children.push(launcher);
  const result = createExitOffer(doc, 'exit-id', surface.id);
  assert.ok(validDocument(result.mainDocument)); assert.ok(validDocument(result.offerDocument));
  assert.equal(result.mainDocument.settings.exitOfferOfferingId, 'exit-id');
  const main = indexDocument(result.mainDocument).nodes, offer = indexDocument(result.offerDocument).nodes;
  assert.equal(main.has(surface.id), false); assert.equal(main.has('launcher'), false);
  assert.ok(main.has('launcher/sheet'), 'unrelated nested sheet is retained');
  assert.deepEqual(offer.get(surface.id).props, surface.props);
  assert.deepEqual(result.offerDocument.products, original.products); assert.notEqual(result.offerDocument.products, doc.products);
  for (const node of indexDocument(original).nodes.values()) if (node.id.startsWith(surface.id) && ['Text', 'Image', 'Countdown'].includes(node.type) && node.id !== `${surface.id}/cancel`) assert.deepEqual(offer.get(node.id), node);
  assert.equal(offer.get(`${surface.id}/cancel`).props.action.action, 'Dismiss');
  assert.equal(offer.get(`${surface.id}/action`).type, 'PurchaseButton');
  assert.deepEqual(doc.root.children.slice(0, -1), original.root.children, 'source document was not mutated');
});

test('new exit offers have no ordinary launcher and multi-record explicit saving rolls back if either write fails', () => {
  const doc = fixture(); const result = createExitOffer(doc, 'new-exit');
  assert.ok(result); assert.deepEqual(result.mainDocument.root, doc.root);
  assert.equal([...indexDocument(result.offerDocument).nodes.values()].filter((node) => node.name === '打开底部弹层').length, 0);
  const records = [record('new-exit', result.offerDocument), record('primary', result.mainDocument)];
  const store = storage(); savePaywall(store, { id: 'primary', name: 'primary', state: 'Draft' }, doc);
  let writes = 0;
  const denied = { ...store, setItem(key, value) { writes++; if (writes === 2) throw new Error('quota'); store.setItem(key, value); } };
  assert.equal(savePaywallBatch(denied, records), false);
  assert.equal(readSavedPaywall(store, 'new-exit'), null);
  assert.deepEqual(readSavedPaywall(store, 'primary').document, doc);
  assert.ok(savePaywallBatch(store, records));
  assert.equal(readSavedPaywall(store, 'primary').document.settings.exitOfferOfferingId, 'new-exit');
});

test('blank exit creation is genuinely empty and does not inherit the main products or add a step/launcher', () => {
  const doc = fixture(), before = structuredClone(doc), result = createExitOffer(doc, 'blank-exit', undefined, {});
  assert.ok(validDocument(result.offerDocument));
  const surface = indexDocument(result.offerDocument).nodes.get(result.offerDocument.settings.presentationSurfaceId);
  assert.equal(surface.type, 'BottomSheet'); assert.deepEqual(surface.children, []); assert.deepEqual(result.offerDocument.products, {});
  assert.deepEqual(doc, before); assert.deepEqual(result.mainDocument.root, before.root);
  assert.equal(exitOfferTarget(result.mainDocument, [{ id: 'blank-exit', name: result.name, document: result.offerDocument, packageCount: 0 }]), null);
});

test('template and saved screen copies retain style, products, selected package and link dependencies with independent IDs', () => {
  const template = templates.find((item) => item.id === 'ht-blue-privilege');
  const source = importComponentDocument(createBuilderNodes(template.id), template), before = structuredClone(source), main = fixture();
  const screen = exitContentChoices(source).find((node) => node.type === 'Screen');
  const result = createExitOffer(main, 'copy', undefined, { source, nodeId: screen.id });
  assert.ok(validDocument(result.offerDocument)); assert.deepEqual(source, before); assert.deepEqual(result.mainDocument.root, main.root);
  const old = indexDocument(source).nodes, copied = indexDocument(result.offerDocument).nodes;
  const originalPackages = [...indexDocument({ root: screen }).nodes.values()].filter((node) => node.type === 'Package');
  const copiedPackages = [...copied.values()].filter((node) => node.type === 'Package');
  assert.equal(copiedPackages.length, originalPackages.length);
  for (const [index, node] of copiedPackages.entries()) {
    const previous = originalPackages[index]; assert.notEqual(node.id, previous.id); assert.notEqual(node.props.dataKey, previous.props.dataKey);
    assert.equal(node.props.defaultSelected, previous.props.defaultSelected ?? false);
    assert.deepEqual(result.offerDocument.products[node.props.dataKey], source.products[previous.props.dataKey ?? previous.id]);
  }
  for (const node of copied.values()) if (node.props.action?.action === 'OpenPage') assert.ok(copied.has(node.props.action.actionPage), 'detail destination copied, never silently dropped');
  assert.ok([...copied.keys()].every((id) => !old.has(id)));
  copiedPackages[0].props.radius = 99; result.offerDocument.products[copiedPackages[0].props.dataKey].name = 'copy-only'; assert.deepEqual(source, before);
});

test('template popup source preserves its artwork and purchase content without copying unrelated screens or mutating the source', () => {
  const template = templates.find((item) => item.id === 'ht-blue-privilege');
  const source = importComponentDocument(createBuilderNodes(template.id), template), before = structuredClone(source), main = fixture();
  const sheet = exitContentChoices(source).find((node) => node.type === 'BottomSheet');
  const result = createExitOffer(main, 'popup-copy', undefined, { source, nodeId: sheet.id });
  assert.ok(validDocument(result.offerDocument)); assert.deepEqual(source, before); assert.deepEqual(result.mainDocument.root, main.root);
  const nodes = [...indexDocument(result.offerDocument).nodes.values()];
  assert.equal(nodes.filter((node) => node.type === 'Screen').length, 1);
  assert.ok(nodes.some((node) => node.type === 'PurchaseButton'));
  assert.ok(nodes.some((node) => node.props.action?.action === 'Dismiss'));
  assert.deepEqual(nodes.filter((node) => node.type === 'Image').map((node) => node.props.src), [...indexDocument({ root: sheet }).nodes.values()].filter((node) => node.type === 'Image').map((node) => node.props.src));
  assert.equal(Object.keys(result.offerDocument.products).length, Object.keys(source.products).length);
  assert.equal(createExitOffer(main, 'invalid', undefined, { source, nodeId: 'missing' }), null);
});

test('converted overlay presents over an inert primary page and cancel or backdrop ends the whole session', async () => {
  const template = templates.find((item) => item.id === 'ht-blue-privilege');
  const doc = importComponentDocument(createBuilderNodes(template.id), template);
  const surface = [...indexDocument(doc).nodes.values()].find((node) => node.name === '挽留弹窗');
  const result = createExitOffer(doc, 'converted', surface.id);
  const h = await mount(result.mainDocument, savedOfferings([record('converted', result.offerDocument)]));
  await h.click('关闭付费墙预览');
  assert.ok(h.visible(`${surface.id}/cancel`));
  assert.equal(h.renderer.root.findAll((node) => node.props.className === 'ne-exit-underlay' && node.props.inert === '').length, 1);
  await h.click(`${surface.id}/cancel`); assert.ok(text(h.renderer.root).includes('付费墙已关闭'));
  await h.click('重新预览'); await h.click('关闭付费墙预览');
  const backdrop = h.renderer.root.findAll((node) => node.props.className === 'nc-floating-backdrop')[0];
  await act(async () => backdrop.props.onClick()); assert.ok(text(h.renderer.root).includes('付费墙已关闭'));
});
