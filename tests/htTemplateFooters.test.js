import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, validDocument, saveComponentDocument, readComponentDocument } from '../src/builder/componentDocument.js';
import { buildHtTemplateFooter } from '../src/builder/htTemplateFooters.js';
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
    assert.notEqual(parents.get('timer'), footer.id);
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
    assert.equal(nodes.get('products').children.length, count);
    assert.equal(nodes.get('products').props.axis, 'vertical');
  }
  const template = templates.find((entry) => entry.id === 'ht-sku-sheet');
  assert.equal([...indexDocument(importComponentDocument(createBuilderNodes(template.id), template)).nodes.values()].filter((entry) => entry.type === 'Footer').length, 0);
});
