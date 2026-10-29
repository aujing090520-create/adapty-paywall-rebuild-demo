import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, validDocument, resolveComponentText, saveComponentDocument, readComponentDocument } from './componentDocument.js';
import { upgradeCanonicalComponents } from './componentCatalog.js';
import { documentArtboards } from './artboards.js';
import { addWorkflowStep, workflowContext } from './workflow.js';

const load = (id) => upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(id), templates.find((entry) => entry.id === id)));
for (const id of ['ht-membership-plans', 'ht-payment-recovery', 'ht-sku-sheet']) {
  test(`${id}: one editable scene, close/checkout ownership, original SKU records and persistence`, () => {
    const document = load(id), { nodes, parents } = indexDocument(document);
    assert.ok(validDocument(document));
    assert.equal(documentArtboards(document).filter(board=>board.kind==='页面').length, 1);
    assert.equal(documentArtboards(document).filter(board=>board.kind==='弹层').length,id==='ht-membership-plans'?1:0);
    assert.equal(nodes.get('purchase').type, 'PurchaseButton');
    assert.equal(nodes.get('purchase').props.action.action, 'Purchase');
    assert.notEqual(parents.get('products'), document.root.id);
    assert.ok([...nodes.values()].some((entry) => entry.type === 'Button' && entry.props.action?.action === 'Dismiss'));
    assert.ok([...nodes.values()].filter((entry) => entry.type === 'Package').every((entry) => document.products[entry.props.dataKey].skuId));
    const store = new Map(), storage = { setItem: (key, value) => store.set(key, value), getItem: (key) => store.get(key) };
    saveComponentDocument(storage, document);
    assert.deepEqual(readComponentDocument(storage, id), document);
    const next = addWorkflowStep(document).document;
    assert.equal(workflowContext(next).steps.length, 2);
    assert.ok(validDocument(next));
  });
}
test('member monthly and SKU original price parameters do not depend on a bound SKU or layout literal', () => {
  const member = load('ht-membership-plans'), nodes = indexDocument(member).nodes;
  assert.equal(resolveComponentText(nodes.get('products/monthly-1'), member, nodes.get('products/package-1')), '¥{月价}/月');
  const changed = { ...member, products: { ...member.products, [nodes.get('products/package-1').props.dataKey]: { skuId: 'DEMO-MEMBER-MONTH' } } };
  assert.equal(resolveComponentText(nodes.get('products/monthly-1'), changed, nodes.get('products/package-1')), '¥{月价}/月');
  const sku = load('ht-sku-sheet'), skuNodes = indexDocument(sku).nodes;
  assert.equal(resolveComponentText(skuNodes.get('products/reference-0'), sku, skuNodes.get('products/package-0')), '{总价}');
});
test('membership keeps real carousel child count, distinct purchase section and editable header', () => {
  const nodes = indexDocument(load('ht-membership-plans')).nodes;
  assert.equal(nodes.get('carousel').children.filter((entry) => entry.type === 'Slide').length, 1);
  assert.ok(nodes.get('carousel').children.some((entry) => entry.type === 'PageControl'));
  assert.equal(nodes.get('member/plans-title').props.text, '选择套餐');
  assert.equal(nodes.get('carousel/slide-image-0').props.height, 260);
  assert.equal(nodes.get('carousel/slide-title-0').props.color, '#2e89ff');
});
test('recovery separates dimmed source from sheet and badge/price no longer share the expanding label column', () => {
  const nodes = indexDocument(load('ht-payment-recovery')).nodes;
  assert.equal(nodes.get('recovery/backdrop').props.overlayOpacity, 48);
  assert.equal(nodes.get('products/package-0').props.priceMode, '0');
  assert.equal(nodes.get('products/badge-0').props.widthMode, 'fit');
  assert.equal(nodes.get('products/right-0').props.widthMode, 'fit');
});
test('SKU has a native title/subtitle header, 358 by 156 media slot and native bound reference texts', () => {
  const { nodes, parents } = indexDocument(load('ht-sku-sheet'));
  assert.equal(parents.get('headline'), 'sku/titles');
  assert.equal(parents.get('caption'), 'sku/titles');
  assert.equal(nodes.get('hero-image/image').props.height, 156);
  assert.equal(nodes.get('sku/content').props.paddingLeft, 16);
  assert.equal(nodes.get('products/reference-0').props.strike, true);
});
