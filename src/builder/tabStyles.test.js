import test from 'node:test';
import assert from 'node:assert/strict';
import { component, indexDocument, updateComponent, saveComponentDocument, readComponentDocument } from './componentDocument.js';
import { createCatalogComponent } from './componentCatalog.js';
import { patchComponentProperties, pasteStyles, copyStyles } from './componentOperations.js';

const documentFor = (...children) => ({ version: 3, templateId: 'tab-style-audit', products: { protected: { name: '年度', price: '¥488', skuId: 'ht.annual' } }, root: component('root', 'Screen', '页面', {}, children) });
const node = (document, id) => indexDocument(document).nodes.get(id);
const fixture = () => documentFor(createCatalogComponent('Tabs', 'tabs'), createCatalogComponent('Tabs', 'other'));

test('tab control styles synchronize inside their owning Tabs without rewriting content or products', () => {
  const document = fixture(), before = structuredClone(document);
  const next = patchComponentProperties(document, 'tabs/controls-0', { gap: 13, background: '#123456', paddingHorizontal: 17 });
  for (const id of ['tabs/controls-0', 'tabs/controls-1']) {
    assert.equal(node(next, id).props.gap, 13);
    assert.equal(node(next, id).props.background, '#123456');
    assert.equal(node(next, id).props.paddingHorizontal, 17);
  }
  assert.deepEqual(node(next, 'other/controls-0'), node(document, 'other/controls-0'));
  assert.deepEqual(node(next, 'tabs/tab-content-1'), node(document, 'tabs/tab-content-1'));
  assert.equal(next.products, document.products);
  assert.deepEqual(document, before);
});

test('button state styles match by destination index, not array order', () => {
  let document = fixture();
  const control = node(document, 'tabs/controls-1');
  document = updateComponent(document, control.id, { children: [...control.children].reverse() });
  const next = patchComponentProperties(document, 'tabs/tab-button-0-1', { selectedBackground: '#aabbcc', selectedBorderColor: '#123456', selectedPaddingTop: 19, target: 'different', index: 9 });
  const peer = node(next, 'tabs/tab-button-1-1');
  assert.equal(peer.props.selectedBackground, '#aabbcc');
  assert.equal(peer.props.selectedBorderColor, '#123456');
  assert.equal(peer.props.selectedPaddingTop, 19);
  assert.equal(peer.props.target, 'tabs');
  assert.equal(peer.props.index, 1);
  assert.deepEqual(node(next, 'tabs/tab-button-1-0'), node(document, 'tabs/tab-button-1-0'));
});

test('label formatting synchronizes without copying text, rich text content, or bindings', () => {
  let document = fixture();
  document = updateComponent(document, 'tabs/tab-label-0-1', { props: { text: '当前页', runs: [{ text: '当前页', color: '#000000', bold: true }] } });
  document = updateComponent(document, 'tabs/tab-label-1-1', { props: { text: '其他页', binding: { key: 'protected', field: 'name' }, runs: [{ text: '其他页', color: '#ffffff', bold: true }] } });
  const next = patchComponentProperties(document, 'tabs/tab-label-0-1', { fontSize: 13, fontWeight: 400, color: '#223344', text: '只改当前文案' });
  const peer = node(next, 'tabs/tab-label-1-1');
  assert.equal(peer.props.fontSize, 13);
  assert.equal(peer.props.fontWeight, 400);
  assert.equal(peer.props.bold, false);
  assert.deepEqual(peer.props.binding, { key: 'protected', field: 'name' });
  assert.equal(peer.props.text, '其他页');
  assert.equal(peer.props.runs[0].text, '其他页');
  assert.equal(peer.props.runs[0].color, '#223344');
  assert.equal(peer.props.runs[0].bold, false);
});

test('nested Tabs and additional selectors do not share styles accidentally', () => {
  let document = fixture();
  const tab = node(document, 'tabs/tab-0'), peerTab = node(document, 'tabs/tab-1');
  document = updateComponent(document, tab.id, { children: [createCatalogComponent('Tabs', 'nested'), ...tab.children, createCatalogComponent('TabControl', 'second-0')] });
  document = updateComponent(document, peerTab.id, { children: [...peerTab.children, createCatalogComponent('TabControl', 'second-1')] });
  const next = patchComponentProperties(document, 'tabs/controls-0', { gap: 3 });
  assert.equal(node(next, 'tabs/controls-1').props.gap, 3);
  for (const id of ['nested/controls-0', 'nested/controls-1', 'second-0', 'second-1']) assert.deepEqual(node(next, id), node(document, id));
  const nested = patchComponentProperties(document, 'nested/controls-0', { gap: 29 });
  assert.equal(node(nested, 'nested/controls-1').props.gap, 29);
  assert.deepEqual(node(nested, 'tabs/controls-0'), node(document, 'tabs/controls-0'));
});

test('missing or ambiguous label counterparts are not created or overwritten', () => {
  let document = fixture();
  const peer = node(document, 'tabs/tab-button-1-0');
  document = updateComponent(document, peer.id, { children: [component('extra-label', 'Text', '额外说明', { text: '保持原样' }), ...peer.children] });
  let next = patchComponentProperties(document, 'tabs/tab-label-0-0', { fontSize: 11 });
  assert.deepEqual(node(next, peer.id), node(document, peer.id));
  document = updateComponent(document, 'tabs/controls-1', { children: [] });
  next = patchComponentProperties(document, 'tabs/tab-label-0-0', { fontSize: 11 });
  assert.deepEqual(node(next, 'tabs/controls-1').children, []);
});

test('buttons targeting a different Tabs are not synchronized', () => {
  const document = updateComponent(fixture(), 'tabs/tab-button-1-0', { props: { target: 'other' } });
  const next = patchComponentProperties(document, 'tabs/tab-button-0-0', { background: '#234567' });
  assert.deepEqual(node(next, 'tabs/tab-button-1-0'), node(document, 'tabs/tab-button-1-0'));
  const external = patchComponentProperties(document, 'tabs/tab-button-1-0', { background: '#998877' });
  assert.deepEqual(node(external, 'tabs/tab-button-0-0'), node(document, 'tabs/tab-button-0-0'));
});

test('ordinary tab content and standalone selectors remain independent', () => {
  let document = fixture();
  let next = patchComponentProperties(document, 'tabs/tab-content-0', { fontSize: 27 });
  assert.deepEqual(node(next, 'tabs/tab-content-1'), node(document, 'tabs/tab-content-1'));
  document = documentFor(createCatalogComponent('TabControl', 'standalone'));
  next = patchComponentProperties(document, 'standalone/button-0', { radius: 9 });
  assert.equal(node(next, 'standalone/button-0').props.radius, 9);
  assert.deepEqual(node(next, 'standalone/button-1'), node(document, 'standalone/button-1'));
  assert.equal(patchComponentProperties(document, 'missing', { gap: 2 }), document);
});

test('pasting styles uses the same synchronization and persists after reopening', () => {
  const document = fixture();
  const styles = copyStyles(component('source', 'TabButton', '源', { selectedBackground: '#765432', paddingMode: 'individual', paddingLeft: 7, paddingRight: 9 }));
  const next = pasteStyles(document, 'tabs/tab-button-0-0', { ...styles, target: 'other', text: '不可复制', dataKey: 'protected' });
  const records = new Map();
  const storage = { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  assert.ok(saveComponentDocument(storage, next));
  const reopened = readComponentDocument(storage, next.templateId);
  for (const id of ['tabs/tab-button-0-0', 'tabs/tab-button-1-0']) {
    assert.equal(node(reopened, id).props.selectedBackground, '#765432');
    assert.equal(node(reopened, id).props.paddingLeft, 7);
    assert.equal(node(reopened, id).props.paddingRight, 9);
    assert.equal(node(reopened, id).props.target, 'tabs');
    assert.equal(node(reopened, id).props.text, undefined);
    assert.equal(node(reopened, id).props.dataKey, undefined);
  }
  assert.deepEqual(reopened.products, document.products);
});
