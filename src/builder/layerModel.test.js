import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLayerTree, writeLayerField, editLayerArray, reparentNode, indexNodes } from './layerModel.js';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { productPackageRows, listRowsFor, privilegeRowsFor, agreementSegmentsFor } from './fieldModels.js';
import { packagePartStyle } from '../products/productStyleModel.js';

test('legacy hierarchy is indexed without changing source nodes', () => {
  const nodes = [{ id: 'a', type: 'Stack' }, { id: 'b', depth: 1, type: 'Text', content: 'B' }];
  const before = JSON.stringify(nodes);
  assert.equal(indexNodes(nodes).parent.get('b'), 'a');
  assert.equal(buildLayerTree(nodes).root.children[0].children[0].label, 'B');
  assert.equal(JSON.stringify(nodes), before);
});
test('list leaf edits materialize fallback rows, preserving other fields', () => {
  const node = { id: 'list', type: 'List', content: 'Title|Caption', config: { color: '#000000' } };
  const rows = [{ title: 'Title', caption: 'Caption', leading: '✓' }];
  const tree = buildLayerTree([node], { listRows: () => rows });
  const leaf = tree.entries.get('list::row-0-title');
  const next = writeLayerField(node, leaf.binding, 'New');
  assert.equal(next.config.listRows[0].title, 'New');
  assert.equal(next.config.listRows[0].caption, 'Caption');
  assert.equal(node.config.listRows, undefined);
  assert.equal(next.config.color, '#000000');
});
test('SKU bindings cannot be changed as ordinary text', () => {
  const node = { id: 'products', type: 'Products', config: { packageRows: [{ name: 'Year', price: '¥488' }] } };
  const tree = buildLayerTree([node]);
  assert.equal(tree.entries.get('products::package-0-price').binding.readOnly, true);
  assert.equal(writeLayerField(node, { readOnly: true }, '¥1'), node);
});
test('tab panes bind to the correct linked title without duplicating source', () => {
  const tabs = { id: 'tabs', type: 'Tabs', config: { tabs: [{ title: 'Standard' }, { title: 'Premium' }] } };
  const header = { id: 'heading', type: 'Header', content: 'Original', config: { linkedTabsId: 'tabs', tabContents: ['A', 'B'] } };
  const tree = buildLayerTree([tabs, header]);
  assert.equal(tree.root.children.length, 1);
  const leaf = tree.entries.get('heading@tabs-1');
  assert.equal(leaf.value, 'B');
  assert.deepEqual(writeLayerField(header, leaf.binding, 'C').config.tabContents, ['A', 'C']);
});
test('row sorting and deletion update the real array immutably', () => {
  const node = { config: { slides: [{ id: 'a' }, { id: 'b' }] } };
  const op = { path: ['config', 'slides'], index: 0 };
  assert.deepEqual(editLayerArray(node, op, 1).config.slides.map((row) => row.id), ['b', 'a']);
  assert.equal(node.config.slides[0].id, 'a');
  assert.equal(editLayerArray(node, op, null, true).config.slides.length, 1);
  const single = { config: { slides: [{ id: 'a' }] } };
  assert.equal(editLayerArray(single, op, null, true), single);
});
test('reparent moves entire subtree and updates depths', () => {
  const nodes = [{ id: 'a', type: 'Stack', depth: 0 }, { id: 'b', type: 'Stack', depth: 0 }, { id: 'c', type: 'Text', depth: 1, parentId: 'b' }];
  const next = reparentNode(nodes, 'b', 'a');
  assert.equal(next[1].parentId, 'a');
  assert.equal(next[1].depth, 1);
  assert.equal(next[2].depth, 2);
  assert.equal(nodes[1].depth, 0);
});
test('cycles, text parents and non-screen flow children are rejected', () => {
  const nodes = [{ id: 'a', type: 'Stack' }, { id: 'b', type: 'Text', depth: 1, parentId: 'a' }, { id: 'flow', type: 'Screen Flow' }];
  assert.equal(reparentNode(nodes, 'a', 'b'), nodes);
  assert.equal(reparentNode(nodes, 'b', 'b'), nodes);
  assert.equal(reparentNode(nodes, 'a', 'flow'), nodes);
});
test('composite component fields retain their own semantics', () => {
  const types = [
    { id: 'time', type: 'Timeline', config: { listRows: [{ title: 'Today', caption: 'Free', marker: 'lock' }] } },
    { id: 'carousel', type: 'Carousel', config: { slides: [{ image: '/image.png', title: 'One', caption: 'Two' }] } },
    { id: 'button', type: 'Purchase Button', content: 'Continue' },
    { id: 'agreement', type: 'Agreement', config: { segments: [{ type: 'link', text: 'Terms', url: 'https://example.com' }] } },
  ];
  const tree = buildLayerTree(types);
  assert.equal(tree.entries.get('time::listRows-0').type, 'Timeline Item');
  assert.equal(tree.entries.get('carousel::slides-0').type, 'Slide');
  assert.equal(tree.entries.get('button::button-label').value, 'Continue');
  assert.equal(tree.entries.get('agreement::segments-0').value, 'https://example.com');
});
test('content codecs preserve adjacent labels', () => {
  assert.equal(writeLayerField({ content: 'A · B' }, { codec: 'links', index: 1 }, 'C').content, 'A · C');
  assert.equal(writeLayerField({ content: 'A|B' }, { codec: 'pipe', index: 0 }, 'C').content, 'C|B');
});

test('every template has unique, source-preserving editable layers', () => {
  for (const template of templates) {
    const nodes = createBuilderNodes(template.id);
    const before = JSON.stringify(nodes);
    const tree = buildLayerTree(nodes, { productRows: (node) => productPackageRows(node, template.documentTemplate), listRows: listRowsFor, privilegeRows: privilegeRowsFor, agreementSegments: agreementSegmentsFor });
    let count = 0;
    const visit = (entry) => { count++; assert.ok(tree.entries.has(entry.id), template.id); entry.children.forEach(visit); };
    visit(tree.root);
    assert.equal(tree.entries.size, count, `${template.id}: duplicate layer id`);
    assert.equal(JSON.stringify(nodes), before, `${template.id}: defaults were mutated`);
    nodes.forEach((node) => assert.ok([...tree.entries.values()].some((entry) => entry.ownerId === node.id), `${template.id}: missing ${node.id}`));
  }
});
test('package text style changes are isolated from sibling packages and SKU', () => {
  const config = { productTemplate: 'blue-privilege', packageRows: [{ skuId: 'DEMO-BLUE-MONTH' }], packagePartStyles: { 1: { price: { fontSize: 20, color: '#123456' } } } };
  assert.deepEqual(packagePartStyle(config, 0, 'price'), {});
  assert.equal(packagePartStyle(config, 1, 'price').color, '#123456');
  assert.equal(packagePartStyle(config, 1, 'name').fontSize, undefined);
  assert.equal(config.packageRows[0].skuId, 'DEMO-BLUE-MONTH');
});

test('product layer ordering comes from rendered geometry and reserves shared badge slots', () => {
  const node = { id: 'p', type: 'Products', config: { packageLayout: 'horizontal', packageRows: [{ name: 'Month', price: '¥78' }, { name: 'Year', price: '¥488', showBadge: true, badgeText: 'OFF' }] } };
  const productInventory = { p: { 0: { name: { region: 'body', sequence: 10, text: 'Month' }, price: { region: 'body', sequence: 20, text: '¥78' } }, 1: { badge: { region: 'body', sequence: 0, text: 'OFF' }, name: { region: 'body', sequence: 10, text: 'Year' }, price: { region: 'body', sequence: 20, text: '¥488' } } } };
  const tree = buildLayerTree([node], { productInventory });
  assert.deepEqual(tree.entries.get('p::package-1-body').children.map((entry) => entry.productPart), ['badge', 'name', 'price']);
  assert.deepEqual(tree.entries.get('p::package-0-name').productOrder.regions.body, ['badge', 'name', 'price']);
});
test('tab features belong to their panes and edits remain independent', () => {
  const tabs = { id: 'tabs', type: 'Tabs', config: { tabs: [{ title: 'Standard' }, { title: 'Premium' }] } };
  const list = { id: 'features', type: 'List', config: { linkedTabsId: 'tabs', listRows: [{ title: 'Original', leadingMode: 'none' }] } };
  const tree = buildLayerTree([tabs, list], { listRows: listRowsFor });
  const leaf = tree.entries.get('features@tabs-0::row-0-title');
  const next = writeLayerField(list, leaf.binding, 'Standard only');
  assert.equal(next.config.tabListRows[0][0].title, 'Standard only');
  assert.equal(next.config.tabListRows[1], undefined);
  assert.equal(next.config.listRows[0].title, 'Original');
  assert.equal(tree.root.children.length, 1);
});
test('restore actions do not invent a URL field', () => {
  const tree = buildLayerTree([{ id: 'links', type: 'Links', content: 'Restore Purchases · Terms' }]);
  assert.equal(tree.entries.has('links::link-0-url'), false);
  const field = tree.entries.get('links::link-1');
  const next = writeLayerField({ id: 'links', content: 'Restore Purchases · Terms' }, field.binding, 'https://example.com');
  assert.equal(next.config.linkActions[1].action, 'OpenURL');
  assert.equal(next.config.linkActions[1].actionUrl, 'https://example.com');
});
