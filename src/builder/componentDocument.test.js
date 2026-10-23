import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { component, componentProps, importComponentDocument, indexDocument, validDocument, updateComponent, insertComponent, removeComponent, moveComponent, createNativeComponent, cloneComponent, captureNativeComponent, resolveComponentText, readComponentDocument, saveComponentDocument, DOCUMENT_PREFIX } from './componentDocument.js';
import { clearLocalDemoSettings } from '../templateStorage.js';
const catalog = templates.filter((entry) => entry.documentTemplate || entry.isGallery);
const load = (id) => importComponentDocument(createBuilderNodes(id), templates.find((entry) => entry.id === id));
const storage = () => { const values = new Map(); return { get length() { return values.size; }, key(index) { return [...values.keys()][index]; }, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };

test('all 45 current templates import into valid actual trees without mutating legacy data', () => {
  for (const template of catalog) {
    const input = createBuilderNodes(template.id), before = JSON.stringify(input);
    const document = importComponentDocument(input, template);
    assert.ok(validDocument(document), template.id);
    assert.equal(JSON.stringify(input), before);
    const serialized = JSON.stringify(document.root);
    for (const key of ['ownerId','packageLayout','productContentOrders','productArrangementByLayout']) assert.ok(!serialized.includes(`"${key}"`), `${template.id}: ${key}`);
  }
});
test('four HT templates preserve asset sources, package records, hidden benefit rows and retention', () => {
  for (const [id, asset, count] of [['ht-blue-privilege','blue-banner.png',3],['ht-membership-plans','member-hero.png',3],['ht-payment-recovery','recovery-bg.png',2],['ht-sku-sheet','sku-art-alt.png',2]]) {
    const document = load(id), nodes = [...indexDocument(document).nodes.values()];
    assert.ok(nodes.some((node) => node.props.src?.includes(asset)), id);
    assert.equal(Object.keys(document.products).length, count, id);
  }
  const nodes = indexDocument(load('ht-blue-privilege')).nodes;
  assert.ok(nodes.get('benefits').children.length > 6);
  assert.ok(nodes.get('benefits/row-5').props.hidden);
  assert.equal(nodes.get('retention').props.presentation, 'overlay');
  assert.ok([...nodes.values()].some((node) => node.type === 'Screen' && node.props && node.name === '中秋月夜 | 谁看了我'));
});
test('tree edits reparent actual nodes, reject cycles and preserve text sizes and SKU data', () => {
  let document = load('ht-blue-privilege');
  const nodes = indexDocument(document).nodes;
  const price = nodes.get('products/package-0-price');
  const before = componentProps(price).fontSize;
  const products = JSON.stringify(document.products);
  document = moveComponent(document, price.id, 'products/package-header-0', 0);
  assert.equal(indexDocument(document).parents.get(price.id), 'products/package-header-0');
  assert.equal(componentProps(indexDocument(document).nodes.get(price.id)).fontSize, before);
  assert.equal(JSON.stringify(document.products), products);
  assert.equal(moveComponent(document, 'products', price.id), document);
  assert.equal(moveComponent(document, 'products', 'products/package-0'), document);
  assert.equal(removeComponent(document, document.root.id), document);
  assert.equal(insertComponent(document, document.root.id, indexDocument(document).nodes.get('products')), document);
});
test('native add, duplicate and text styling are isolated and do not compile to old fields', () => {
  let document = load('ht-blue-privilege'); const added = createNativeComponent('Stack','new-stack');
  document = insertComponent(document, document.root.id, added);
  document = insertComponent(document, added.id, createNativeComponent('Text','new-text'));
  document = updateComponent(document, 'new-text', { props: { text: '测试', fontSize: 19, color: '#ff0000' } });
  const next = cloneComponent(indexDocument(document).nodes.get('new-stack'));
  document = insertComponent(document, document.root.id, next);
  assert.ok(validDocument(document));
  assert.equal(indexDocument(document).nodes.get('new-text').props.fontSize, 19);
  assert.equal(next.children[0].props.text, '测试');
  assert.notEqual(next.children[0].id, 'new-text');
});
test('tab panes have independent actual heading, feature and package children', () => {
  let document = load('rc-source-12'); const nodes = indexDocument(document).nodes;
  const tabs = [...nodes.values()].find((node) => node.type === 'Tabs');
  assert.equal(tabs.children.length, 2);
  for (const tab of tabs.children) {
    const control = tab.children.find((node) => node.type === 'TabControl');
    assert.equal(control.children.length, 2);
    assert.equal(control.children[0].props.target, tabs.id);
  }
  const first = tabs.children[0].children[0], second = tabs.children[1].children[0];
  document = updateComponent(document, first.id, { props: { text: '独立标题' } });
  assert.equal(indexDocument(document).nodes.get(second.id).props.text, second.props.text);
});
test('family plans bind visibility to the real toggle; per-card purchasing remains an actual button', () => {
  const document = load('rc-source-7'), nodes = [...indexDocument(document).nodes.values()];
  const control = nodes.find((node) => node.type === 'Toggle');
  const packages = nodes.filter((node) => node.type === 'Package');
  assert.equal(packages.length,4);
  assert.ok(packages.every((node) => node.props.visibleWhen.id === control.id));
  assert.equal(packages.filter((node) => node.props.visibleWhen.value).length,2);
  assert.ok([...indexDocument(load('rc-source-10')).nodes.values()].filter((node) => node.type === 'Package').every((node) => node.children.some((child) => child.type === 'Button' && child.props.action.action === 'Purchase')));
});
test('product bindings use centralized SKU prices and library captures exclude SKU ownership', () => {
  const document = load('ht-blue-privilege'), nodes = indexDocument(document).nodes;
  const product = nodes.get('products/package-0');
  assert.ok(resolveComponentText(nodes.get('products/package-0-price'), document, product).includes('78'));
  const saved = JSON.stringify(captureNativeComponent(document, product));
  for (const key of ['skuId','binding','dataKey','group']) assert.ok(!saved.includes(`"${key}"`));
});
test('canonical persistence is independent of v1, invalid records are preserved and reset is scoped', () => {
  const store = storage(), document = load('ht-blue-privilege');
  store.setItem('unrelated','keep'); store.setItem('paywall-template-v1:ht-blue-privilege','legacy');
  assert.ok(saveComponentDocument(store, document));
  assert.deepEqual(readComponentDocument(store, document.templateId), document);
  assert.equal(store.getItem('paywall-template-v1:ht-blue-privilege'),'legacy');
  store.setItem(DOCUMENT_PREFIX + 'broken','{}');
  assert.throws(() => readComponentDocument(store,'broken'));
  assert.equal(store.getItem(DOCUMENT_PREFIX + 'broken'),'{}');
  store.setItem('paywall-component-library-v3','[]'); clearLocalDemoSettings(store);
  assert.equal(store.length,1); assert.equal(store.getItem('unrelated'),'keep');
});
