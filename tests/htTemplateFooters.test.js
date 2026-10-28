import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, validDocument, saveComponentDocument, readComponentDocument } from '../src/builder/componentDocument.js';
import { buildHtTemplateFooter, repairBlueProductPlacement } from '../src/builder/htTemplateFooters.js';
import { screenChromeLayout } from '../src/builder/screenLayout.js';
import { createDefaultPaywallRecord } from '../src/defaultPaywalls.js';

for (const id of ['ht-blue-privilege', 'ht-membership-plans', 'ht-payment-recovery']) {
  test(`${id} uses one screen-owned Footer with original controls, links and SKU bindings`, () => {
    const template = templates.find((entry) => entry.id === id);
    const document = importComponentDocument(createBuilderNodes(id), template);
    const { nodes, parents } = indexDocument(document);
    const footers = [...nodes.values()].filter((entry) => entry.type === 'Footer');
    assert.ok(validDocument(document));
    assert.equal(footers.length, 1);
    const footer = footers[0], screen = nodes.get(parents.get(footer.id));
    assert.equal(screen.type, 'Screen');
    assert.equal(screen.children.at(-1).id, footer.id);
    assert.equal(parents.get('purchase'), footer.id);
    assert.equal(parents.get('legal'), footer.id);
    if (nodes.has('agreement')) assert.equal(parents.get('agreement'), footer.id);
    if (nodes.has('links')) assert.equal(parents.get('links'), footer.id);
    if (nodes.has('$home')) assert.equal(parents.get('$home'), footer.id);
    assert.equal(nodes.get('purchase').props.action.action, 'Purchase');
    assert.notEqual(parents.get('products'), footer.id);
    if(id==='ht-blue-privilege') { assert.equal(parents.get('products'),screen.id); assert.equal(nodes.get('purchase').type,'PurchaseButton'); }
    assert.equal(parents.get('timer'), footer.id);
    assert.equal(footer.children[0].id,'timer');
    assert.ok([...nodes.values()].filter((entry) => entry.type === 'Package').every((entry) => document.products[entry.props.dataKey].skuId));
    const chrome = screenChromeLayout(screen);
    assert.equal(chrome.footer, footer);
    assert.ok(!chrome.content.includes(footer));
    assert.deepEqual(buildHtTemplateFooter(document, template.documentTemplate), document);
    const values = new Map(), storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
    saveComponentDocument(storage, document);
    assert.deepEqual(readComponentDocument(storage, id), document);
  });
}

test('test3/test4 inherit the fixed Blue footer while preserving their separate package configurations', () => {
  for (const [id, count] of [['test3', 3], ['test4', 2]]) {
    const document = createDefaultPaywallRecord(id).document, { nodes, parents } = indexDocument(document);
    const footer = nodes.get(parents.get('purchase'));
    assert.equal(footer.type, 'Footer');
    assert.notEqual(parents.get('products'),footer.id);
    assert.equal(nodes.get('products').children.length, count);
    assert.equal(nodes.get('products').props.axis, 'vertical');
  }
  const template = templates.find((entry) => entry.id === 'ht-sku-sheet');
  assert.equal([...indexDocument(importComponentDocument(createBuilderNodes(template.id), template)).nodes.values()].filter((entry) => entry.type === 'Footer').length, 0);
});

test('old generated Blue footer repairs its product position once without losing user content or data',()=>{
  const template=templates.find(item=>item.id==='ht-blue-privilege'),source=importComponentDocument(createBuilderNodes(template.id),template);
  delete source.blueProductPlacementVersion;
  const {nodes,parents}=indexDocument(source),footer=nodes.get(parents.get('purchase')),screen=nodes.get(parents.get(footer.id)),products=nodes.get('products');
  products.props.gap=19;products.children[0].props.selectedBackground='#123456';screen.children=screen.children.filter(item=>item!==products);footer.children.unshift(products);
  const original=structuredClone(source),result=repairBlueProductPlacement(source),after=indexDocument(result);
  assert.equal(after.parents.get('products'),screen.id);assert.deepEqual(after.nodes.get('products'),products);assert.deepEqual(result.products,source.products);assert.deepEqual(source,original);
  assert.equal(after.nodes.get(footer.id).children[0].id,'timer');assert.equal(repairBlueProductPlacement(result),result);
  const member={...source,templateId:'ht-membership-plans'};assert.equal(repairBlueProductPlacement(member),member);
});
