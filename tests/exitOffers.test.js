import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component, validDocument } from '../src/builder/componentDocument.js';
import { savedOfferings, exitOfferTarget, isExitOfferStep, createExitOffer, exitOfferSource, exitOfferConnection, exitContentChoices, exitOfferId, bindExitOffer, boundExitOfferIds, exitOfferConnections } from '../src/builder/exitOffers.js';
import { moveWorkflowStep, removeWorkflowStep, duplicateWorkflowStep } from '../src/builder/workflow.js';
import { readSavedPaywall, savePaywall, savePaywallBatch } from '../src/paywallStorage.js';
import { indexDocument, importComponentDocument } from '../src/builder/componentDocument.js';
import { createCatalogComponent } from '../src/builder/componentCatalog.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { modalBindings, buttonModalEdges, upgradeButtonModals } from '../src/builder/buttonModals.js';
import { documentArtboards } from '../src/builder/artboards.js';

const button = (id, action, destination) => component(id, 'Button', id, { action: { action, actionPage: destination } }, [component(`${id}-text`, 'Text', '', { text: id })]);
const fixture = (id = 'primary', children = []) => ({ version: 3, templateId: 'blank', products: { sku: { name: id, price: id === 'offer' ? '¥50' : '¥100' } }, root: component(`${id}-root`, 'Screen', id, {}, [component(`${id}-package`, 'Package', id, { dataKey: 'sku', defaultSelected: true }, [component(`${id}-price`, 'Text', '', { binding: { field: 'price' } })]), ...children]) });
const record = (id, document, state = 'Draft') => ({ version: 1, paywall: { id, name: id, state }, templateId: document.templateId, document });
const storage = () => { const map = new Map(); return { get length() { return map.size; }, key: (index) => [...map.keys()][index], getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; };

test('button-modal Back restores the parent popup before returning to the page',async()=>{
  const inner=component('inner','BottomSheet','内弹窗',{presentation:'overlay'},[button('inner-back','NavigateBack')]);
  const outer=component('outer','BottomSheet','外弹窗',{presentation:'overlay'},[component('inner-open','Button','内入口',{action:{action:'OpenSheet',actionPage:'inner'}},[inner]),button('outer-back','NavigateBack')]);
  const source=fixture('primary',[component('outer-open','Button','外入口',{action:{action:'OpenSheet',actionPage:'outer'}},[outer])]);source.settings={buttonModalVersion:1};
  const h=await mount(source,[]);
  await h.click('outer-open');assert.ok(h.visible('outer'));
  await h.click('inner-open');assert.ok(h.visible('inner'));assert.ok(!h.visible('outer'));
  await h.click('inner-back');assert.ok(h.visible('outer'));assert.ok(!h.visible('inner'));
  await h.click('outer-back');assert.ok(!h.visible('outer'));assert.ok(h.visible('primary-package'));
});

test('migrating a saved multi-screen exit preserves destinations and navigation inside its modal',async()=>{
  const source=fixture('primary');source.settings={exitOfferOfferingId:'saved'};
  const saved=fixture('saved');saved.root.children=[component('nested-flow','Flow','原流程',{initialStepId:'offer-a'},[
    component('offer-a','Screen','A',{},[button('offer-next','NextScreen','offer-b')]),
    component('offer-b','Screen','B',{},[component('offer-copy','Text','原文案',{text:'第二屏原内容'}),button('offer-back','NavigateBack')]),
  ])];
  const next=upgradeButtonModals(source,[{id:'saved',name:'原流程',document:saved,packageCount:1}]);
  const binding=modalBindings(next)[0],{nodes}=indexDocument(next);
  const forward=[...nodes.values()].find(node=>node.name==='offer-next'),back=[...nodes.values()].find(node=>node.name==='offer-back');
  assert.ok(nodes.has(forward.props.action.actionPage));
  const h=await mount(next,[]);await h.click(binding.button.id);assert.ok(h.visible(forward.id));
  await h.click(forward.id);assert.ok(text(h.renderer.root).includes('第二屏原内容'));assert.ok(h.visible(binding.modal.id));
  await h.click(back.id);assert.ok(h.visible(forward.id));assert.ok(h.visible(binding.modal.id));
});

test('popup purchase does not require an unrelated background agreement on a non-final source screen',async()=>{
  const modal=component('modal','BottomSheet','弹窗',{presentation:'overlay'},[button('popup-purchase','Purchase')]);
  const source=fixture('primary');source.settings={buttonModalVersion:1};source.root.children=[component('flow','Flow','流程',{},[
    component('a','Screen','A',{},[component('background-agreement','Toggle','背景协议',{required:true}),component('open','Button','打开',{action:{action:'OpenSheet',actionPage:'modal'}},[modal])]),component('b','Screen','B'),
  ])];
  let status;const h=await mount(source,[],{onStatus:value=>{status=value;}});
  await h.click('open');await h.click('popup-purchase');assert.equal(status,'购买预览：未发起真实交易');
});

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
  const rule = renderer.root.findByProps({ 'aria-label': '关闭后显示规则' });
  for (const value of ['触发事件', '购买页面', '显示内容', 'offer']) assert.ok(text(rule).includes(value), value);
  assert.equal(renderer.root.findAllByType('select').length, 0);
  assert.equal(text(renderer.root).includes('Offering'), false);
  await act(async () => renderer.update(React.createElement(Settings, { document: { ...doc, settings: {} }, offerings: [], onChange() {} })));
  assert.match(text(renderer.root), /未关联，关闭后直接离开/);
});

test('migrated canvas connection selects its opener and clearing the button binding removes the modal board and edge', async () => {
  const doc = fixture('购买页面'); doc.settings = { exitOfferOfferingId: 'offer' };
  let renderer, latest;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: savedOfferings([record('offer', fixture('offer'))]), currentPaywallId: 'primary', onDocumentChange: (value) => { latest = value; } })); }); mounted.add(renderer);
  const binding = modalBindings(latest)[0]; assert.ok(binding);
  const connection = renderer.root.findAll((item) => item.type === 'button' && item.props['aria-label'] === `编辑步骤连接：${binding.button.name}`);
  assert.equal(connection.length, 1);
  await act(async () => connection[0].props.onClick());
  const field = renderer.root.findByProps({ 'aria-label': '目标弹窗' });
  assert.equal(field.props.value, binding.modal.id);
  await act(async () => field.props.onChange({ target: { value: '' } }));
  assert.equal(renderer.root.findAll((item) => item.type === 'button' && item.props['aria-label']?.startsWith('配置退出触发：')).length, 0);
  assert.deepEqual(modalBindings(latest), []); assert.deepEqual(buttonModalEdges(latest), []);
  assert.equal(documentArtboards(latest).some((board) => board.node.id === binding.modal.id), false);
  assert.ok(indexDocument(latest).nodes.has(binding.modal.id), 'unbinding retains editable content');
  assert.deepEqual(latest.products.sku, doc.products.sku); assert.equal(doc.settings.buttonModalVersion, undefined);
});
test('flow preview from a migrated modal board starts at the main page and enters the modal only through its button', async () => {
  const doc = fixture('primary'); doc.settings = { exitOfferOfferingId: 'offer' };
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: savedOfferings([record('offer', fixture('offer'))]), currentPaywallId: 'primary', onExitOfferChange() {} })); }); mounted.add(renderer);
  const click = async (name) => { const button = renderer.root.findAll((item) => item.type === 'button' && (item.props['aria-label'] === name || text(item).trim() === name))[0]; assert.ok(button, name); await act(async () => button.props.onClick()); };
  const migrated = upgradeButtonModals(doc, savedOfferings([record('offer', fixture('offer'))]), 'primary');
  const binding = modalBindings(migrated)[0];
  await click(`选择画板：${binding.modal.name}`); await click('预览流程');
  const preview = renderer.root.findByType(Presentation);
  assert.equal(preview.props.document.settings.buttonModalVersion, 1); assert.equal(preview.props.currentPaywallId, 'primary');
  assert.ok(text(preview).includes('页面预览')); assert.ok(text(preview).includes('¥100')); assert.equal(text(preview).includes('¥50'), false);
  const opener = preview.findAll((item) => typeof item.type === 'string' && item.props['data-component-id'] === modalBindings(preview.props.document)[0].button.id && item.props.onClick)[0];
  assert.ok(opener); await act(async () => opener.props.onClick({ stopPropagation() {}, preventDefault() {} }));
  assert.ok(text(preview).includes('¥50'));
  await click('关闭付费墙预览'); assert.ok(text(preview).includes('付费墙已关闭'));
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

test('version-one Dismiss buttons and preview close ignore retained legacy global and per-screen exit bindings', async () => {
  const offers = savedOfferings([record('offer', fixture('offer'))]);
  for (const history of [{ exitOfferOfferingId: 'offer' }, { exitOffersByScreen: { 'primary-root': 'offer' } }]) {
    const doc = fixture('primary', [button('dismiss-main', 'Dismiss')]);
    doc.settings = { ...history, buttonModalVersion: 1 };
    assert.ok(exitOfferTarget(doc, offers, 'primary', doc.root.id), 'fixture still has a valid legacy target');
    const h = await mount(doc, offers);
    await h.click('dismiss-main'); assert.match(text(h.renderer.root), /付费墙已关闭/);
    assert.equal(h.visible('offer-package'), false);
    await h.click('重新预览'); assert.ok(h.visible('primary-package'));
    await h.click('关闭付费墙预览'); assert.match(text(h.renderer.root), /付费墙已关闭/);
    assert.equal(h.visible('offer-package'), false);
  }
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
  await act(async () => { renderer = TestRenderer.create(React.createElement(Settings, { document: { ...fixture(), settings: { exitOfferOfferingId: 'removed' } }, offerings: [], onUnlink: () => { latest = true; } })); }); mounted.add(renderer);
  assert.ok(renderer.root.findAll((item) => item.props.role === 'alert').length);
  await act(async () => renderer.root.findAll((item)=>item.type==='button'&&text(item)==='解除关联')[0].props.onClick()); assert.equal(latest, true);
});

test('actual editor migrates legacy retention once, nests the copied modal under a close button and preserves its saved source', async () => {
  const doc = fixture(); doc.settings={exitOfferOfferingId:'offer'}; let latest, renderer;
  const offer = fixture('offer'), before = structuredClone({ doc, offer });
  const offerings = savedOfferings([record('offer', offer)]);
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings, currentPaywallId: 'primary', onDocumentChange: (value) => { latest = value; } })); }); mounted.add(renderer);
  assert.equal(latest.settings.buttonModalVersion, 1); assert.equal(latest.settings.exitOfferOfferingId, 'offer', 'legacy history remains');
  const { button: opener, modal } = modalBindings(latest)[0];
  assert.equal(opener.name, '关闭按钮'); assert.equal(opener.props.action.action, 'OpenSheet');
  assert.equal(indexDocument(latest).parents.get(modal.id), opener.id);
  assert.deepEqual(indexDocument(latest).nodes.get('primary-package'), indexDocument(doc).nodes.get('primary-package'));
  assert.deepEqual(latest.products.sku, doc.products.sku);
  assert.equal(upgradeButtonModals(latest, offerings, 'primary'), latest, 'version marker makes migration idempotent');
  assert.deepEqual({ doc, offer }, before);
  assert.equal(renderer.root.findAll((item) => item.props['aria-label'] === '页面退出触发').length, 0);
});

const multiScreen = () => ({ ...fixture(), root: component('root', 'Screen', '主流程', {}, [component('flow', 'Flow', '步骤', { initialStepId: 'a' }, [
  component('a', 'Screen', '介绍 A', {}, [button('a-next', 'NextScreen', 'b'), button('a-close', 'Dismiss')]),
  component('b', 'Screen', '介绍 B', {}, [button('b-back', 'NavigateBack'), button('b-close', 'Dismiss')]),
  component('c', 'Screen', '购买 C', {}, [button('c-close', 'Dismiss')]),
])]) });

test('page properties own the initial page and navigation buttons without page-close settings or a standalone modal section', async () => {
  const doc=multiScreen(); let renderer,latest;
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Editor,{template:{id:'blank'},initialNodes:[],initialDocument:doc,persistence:'session',onDocumentChange:value=>{latest=value;}}));}); mounted.add(renderer);
  assert.equal(renderer.root.findAll(item=>item.type==='button'&&text(item).trim()==='付费墙设置').length,0);
  const initial=renderer.root.findByProps({'aria-label':'初始页面'});
  assert.equal(initial.props.value,'a');
  await act(async()=>initial.props.onChange({target:{value:'b'}}));
  assert.equal(latest.root.children[0].props.initialStepId,'b');
  assert.deepEqual(latest.products,doc.products);
  assert.equal(renderer.root.findAll(item=>item.props['aria-label']==='关闭后显示规则'||item.props['aria-label']==='页面退出触发'||item.type==='section'&&item.props['aria-label']==='弹窗').length,0);
  const addClose=renderer.root.findAll(item=>item.type==='button'&&text(item).trim()==='添加关闭按钮')[0];
  assert.ok(addClose); await act(async()=>addClose.props.onClick());
  const added=[...indexDocument(latest).nodes.values()].find(node=>node.name==='关闭按钮'); assert.ok(added);
  assert.equal(added.props.action.action,'Dismiss'); assert.equal(latest.root.children[0].props.initialStepId,'b');
  assert.equal(renderer.root.findByProps({'aria-label':'点击动作'}).props.value,'Dismiss');
});

test('Demo per-screen bindings override but never broaden legacy final-only defaults, including explicit disable', () => {
  let doc = multiScreen(); doc.settings = { exitOfferOfferingId: 'legacy' };
  assert.equal(exitOfferId(doc, 'a'), ''); assert.equal(exitOfferId(doc, 'c'), 'legacy');
  doc = bindExitOffer(bindExitOffer(doc, 'a', 'offer-a'), 'b', 'offer-b');
  const offers = ['legacy', 'offer-a', 'offer-b'].map((id) => ({ id, name: id, document: fixture(id), packageCount: 1 }));
  assert.deepEqual(exitOfferConnections(doc, offers).map((edge) => [edge.source, edge.targetOwner]), [['a','offer-a'],['b','offer-b'],['c','legacy']]);
  assert.equal(isExitOfferStep(doc, { flow: 0 }), false);
  assert.equal(exitOfferId(bindExitOffer(doc, 'c', ''), 'c'), '');
  assert.equal(exitOfferId(doc, 'missing'), '');
  assert.equal(validDocument({ ...doc, settings: { exitOffersByScreen: [] } }), false);
  assert.equal(validDocument({ ...doc, settings: { exitOffersByScreen: { a: {} } } }), false);
  const moved = moveWorkflowStep(doc, 'a', 1);
  assert.equal(exitOfferId(moved, 'a'), 'offer-a'); assert.equal(exitOfferId(moved, 'b'), 'offer-b');
  const duplicated = duplicateWorkflowStep(doc, 'a');
  assert.equal(exitOfferId(duplicated.document, duplicated.id), '');
  assert.deepEqual(boundExitOfferIds(removeWorkflowStep(doc, 'a')), ['offer-b','legacy']);
});

test('actual closing screen chooses its independent offer; Back does not trigger; dismissal terminates without offer chaining', async () => {
  const doc = bindExitOffer(bindExitOffer(multiScreen(), 'a', 'offer-a'), 'b', 'offer-b');
  const offers = ['offer-a','offer-b'].map((id) => ({ id, name: id, packageCount: 1, document: fixture(id, [button(`${id}-close`, 'Dismiss')]) }));
  const h = await mount(doc, offers);
  await h.click('a-close'); assert.ok(h.visible('offer-a-root')); assert.equal(h.visible('offer-b-root'), false);
  await h.click('offer-a-close'); assert.match(text(h.renderer.root), /付费墙已关闭/);
  await h.click('重新预览'); await h.click('a-next');
  await h.click('b-back'); assert.ok(h.visible('a-close')); assert.equal(h.visible('offer-b-root'), false);
  await h.click('a-next'); await h.click('关闭付费墙预览'); assert.ok(h.visible('offer-b-root'));
  await h.click('offer-b-close'); assert.match(text(h.renderer.root), /付费墙已关闭/);
});

test('per-screen creation keeps other bindings and batch saving retains every independent offer after reopening', () => {
  let doc = bindExitOffer(multiScreen(), 'a', 'offer-a');
  const result = createExitOffer(doc, 'offer-b', undefined, { source: fixture('discount'), nodeId: 'discount-root' }, 'b');
  assert.ok(result); assert.equal(exitOfferId(result.mainDocument, 'a'), 'offer-a'); assert.equal(exitOfferId(result.mainDocument, 'b'), 'offer-b');
  assert.equal(result.mainDocument.settings.exitOfferOfferingId, undefined);
  const store = storage(), drafts = { 'offer-a': record('offer-a', fixture('offer-a')), 'offer-b': record('offer-b', result.offerDocument) };
  assert.equal(savePaywallBatch(store, [...boundExitOfferIds(result.mainDocument).map((id) => drafts[id]), record('primary', result.mainDocument)]), true);
  const reopened = readSavedPaywall(store, 'primary').document;
  assert.deepEqual(boundExitOfferIds(reopened), ['offer-a','offer-b']);
  assert.ok(readSavedPaywall(store, 'offer-a')); assert.ok(readSavedPaywall(store, 'offer-b'));
  assert.equal(createExitOffer(doc, 'x', undefined, {}, 'unknown'), null);
});

test('each migrated screen has its own button binding and selectable modal board with no page-close ports', async () => {
  let renderer, latest;
  const doc = bindExitOffer(bindExitOffer(multiScreen(),'a','offer-a'),'b','offer-b'), offers = ['offer-a','offer-b'].map((id) => ({ id, name: id, packageCount: 1, document: fixture(id) }));
  await act(async () => { renderer = TestRenderer.create(React.createElement(Editor, { template: { id: 'blank' }, initialNodes: [], initialDocument: doc, persistence: 'session', offerings: offers, onDocumentChange(value) { latest = value; }, onCreateExitOffer() {} })); }); mounted.add(renderer);
  assert.equal(renderer.root.findAll((item) => item.type === 'button' && /^(配置关闭「|配置退出触发：)/.test(item.props['aria-label']??'')).length, 0);
  const bindings=modalBindings(latest); assert.equal(bindings.length,2);
  assert.deepEqual(bindings.map(({screen})=>screen.id),['a','b']);
  for(const {button:opener,modal,screen} of bindings){
    assert.equal(opener.props.action.action,'OpenSheet');
    assert.equal(indexDocument(latest).parents.get(modal.id),opener.id);
    assert.ok(renderer.root.findByProps({'aria-label':`画板：${modal.name}`}));
    const edge=renderer.root.findAll(item=>item.type==='button'&&item.props['aria-label']===`编辑步骤连接：${opener.name}`)[0];assert.ok(edge);
    await act(async()=>edge.props.onClick());
    assert.equal(renderer.root.findByProps({'aria-label':'目标弹窗'}).props.value,modal.id);
    assert.ok(buttonModalEdges(latest).some(edge=>edge.source===screen.id&&edge.target===modal.id));
  }
  assert.equal(renderer.root.findAll(item=>item.type==='section'&&item.props['aria-label']==='弹窗').length,0);
});

test('hover uses the same button drill-in target as click, clears on leave/scroll and is inert in unselected boards or preview', async () => {
  const doc = fixture('hover', [button('cta','None')]); let selected;
  const h = await mount(doc, [], { editing: true, selectedId: 'hover-root', onSelect: (id) => { selected = id; } });
  const phone = () => h.renderer.root.findByProps({ className: 'phone native-phone' });
  const pointer = { target: { closest: () => ({ dataset: { componentId: 'cta-text' } }) } };
  await act(async () => phone().props.onPointerMove(pointer));
  const hovered = () => h.renderer.root.findAll((item) => typeof item.type === 'string' && item.props.className?.split(' ').includes('nc-hovered')).map((item) => item.props['data-component-id']);
  assert.deepEqual(hovered(), ['cta']); await h.click('cta-text'); assert.equal(selected, 'cta');
  await act(async () => phone().props.onPointerLeave()); assert.deepEqual(hovered(), []);
  await act(async () => phone().props.onPointerMove(pointer));
  await act(async () => h.renderer.root.findByProps({ className: 'nc-viewport' }).props.onScroll()); assert.deepEqual(hovered(), []);
  await act(async () => h.renderer.update(React.createElement(Presentation, { document: doc, editing: true, inspectable: false, onSelect() {}, onStatus() {} })));
  await act(async () => phone().props.onPointerMove(pointer)); assert.deepEqual(hovered(), []);
  await act(async () => h.renderer.update(React.createElement(Presentation, { document: doc, editing: false, onSelect() {}, onStatus() {} })));
  await act(async () => phone().props.onPointerMove(pointer)); assert.deepEqual(hovered(), []);
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
  assert.equal(offer.get(`${surface.id}/action`).type, 'Button');
  assert.equal(offer.get(`${surface.id}/action`).props.action.action, 'Dismiss');
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
  assert.equal(exitOfferTarget(result.mainDocument, [{ id: 'blank-exit', name: result.name, document: result.offerDocument, packageCount: 0 }])?.id, 'blank-exit');
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

test('template popup source preserves its artwork and explicit button behavior without copying unrelated screens or mutating the source', () => {
  const template = templates.find((item) => item.id === 'ht-blue-privilege');
  const source = importComponentDocument(createBuilderNodes(template.id), template), before = structuredClone(source), main = fixture();
  const sheet = exitContentChoices(source).find((node) => node.type === 'BottomSheet');
  const result = createExitOffer(main, 'popup-copy', undefined, { source, nodeId: sheet.id });
  assert.ok(validDocument(result.offerDocument)); assert.deepEqual(source, before); assert.deepEqual(result.mainDocument.root, main.root);
  const nodes = [...indexDocument(result.offerDocument).nodes.values()];
  assert.equal(nodes.filter((node) => node.type === 'Screen').length, 1);
  assert.ok(nodes.some((node) => node.name === '领取按钮' && node.props.action?.action === 'Dismiss'));
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
