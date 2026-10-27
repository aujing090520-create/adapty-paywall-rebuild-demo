import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultPaywallRecord, readConfiguredPaywall } from '../src/defaultPaywalls.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, validDocument, resolveComponentText } from '../src/builder/componentDocument.js';
import { stateStyleProps } from '../src/builder/propertyModel.js';
import { savePaywall } from '../src/paywallStorage.js';

test('test3 bundles an independent vertical three-package document without changing Blue template defaults', () => {
  const template = templates.find((entry) => entry.id === 'ht-blue-privilege');
  const original = importComponentDocument(createBuilderNodes(template.id), template);
  const record = createDefaultPaywallRecord('test3');
  const { nodes } = indexDocument(record.document);
  assert.equal(record.paywall.name, 'test3');
  assert.ok(validDocument(record.document));
  assert.equal(nodes.get('products').props.axis, 'vertical');
  assert.equal(nodes.get('products').props.gap, 12);
  const packages = [...nodes.values()].filter((node) => node.type === 'Package');
  assert.equal(packages.length, 3);
  assert.ok(packages.every((node) => node.props.axis === 'horizontal' && node.props.minHeight === 96 && node.props.heightMode === 'fit'));
  assert.deepEqual(packages.map((node) => node.props.defaultSelected), [false, true, false]);
  assert.ok(nodes.get('products/badge-space-0').props.hidden);
  assert.ok(nodes.get('products/badge-space-2').props.hidden);
  assert.deepEqual(record.document.products, original.products);
  assert.equal(indexDocument(original).nodes.get('products').props.axis, 'horizontal');
  assert.deepEqual(importComponentDocument(createBuilderNodes(template.id), template), original);
  record.document.root.name = '个人编辑';
  assert.notEqual(createDefaultPaywallRecord('test3').document.root.name, '个人编辑');
});

test('bundled default is read-only on open, personal saved record wins, and other records do not acquire a default', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readConfiguredPaywall(storage, 'test3').paywall.name, 'test3');
  assert.equal(values.size, 0);
  assert.equal(readConfiguredPaywall(storage, 'test'), null);
  assert.equal(readConfiguredPaywall(storage, 'test-2'), null);
  const personal = createDefaultPaywallRecord('test3');
  personal.paywall.name = '我的修改';
  personal.document.root.name = '个人画布';
  assert.ok(savePaywall(storage, personal.paywall, personal.document));
  assert.deepEqual(readConfiguredPaywall(storage, 'test3'), personal);
  assert.equal(createDefaultPaywallRecord('test3').paywall.name, 'test3');
});

test('test4 composes reference two-row cards from editable Packages, layout and bound text only', () => {
  const before = createDefaultPaywallRecord('test3');
  const record = createDefaultPaywallRecord('test4'), document = record.document;
  const { nodes, parents } = indexDocument(document);
  assert.ok(validDocument(document));
  assert.equal(record.paywall.products, 2);
  assert.equal(nodes.get('products').props.gap, 16);
  const packages = nodes.get('products').children;
  assert.deepEqual(packages.map((node) => node.type), ['Package', 'Package']);
  assert.deepEqual(packages.map((node) => node.props.defaultSelected), [true, false]);
  assert.ok(packages.every((node) => node.props.height === 72 && node.props.group === 'products'));
  assert.equal(parents.get('products/package-0/content'), packages[0].id);
  assert.equal(resolveComponentText(nodes.get('products/package-0/reference'), document, packages[0]), '¥488');
  assert.equal(resolveComponentText(nodes.get('products/package-0/monthly'), document, packages[0]), '¥28.17/月');
  assert.equal(resolveComponentText(nodes.get('products/package-1/monthly'), document, packages[1]), '¥78/月');
  assert.equal(resolveComponentText(nodes.get('products/package-0/term'), document, packages[0]), '12个月');
  assert.equal(resolveComponentText(nodes.get('products/package-0/saving'), document, packages[0]), '节省63%');
  assert.equal(resolveComponentText(nodes.get('products/package-0/badge'), document, packages[0]), '🔥30% OFF');
  for (const pack of packages) {
    const visit = node => { if (node.type === 'Text') assert.equal(node.props.binding?.key, pack.props.dataKey, `${node.id} must bind to its own Package`); node.children.forEach(visit); };
    visit(pack);
  }
  const changed = { ...document, products: { ...document.products, 'products/data-0': { ...document.products['products/data-0'], skuId: 'DEMO-MEMBER-LIFETIME' } } };
  assert.equal(resolveComponentText(nodes.get('products/package-0/term'), changed, packages[0]), '终身');
  assert.equal(resolveComponentText(nodes.get('products/package-0/saving'), changed, packages[0]), '永久会员权益');
  assert.equal(resolveComponentText(nodes.get('products/package-0/badge'), changed, packages[0]), '🔥30% OFF');
  assert.equal(stateStyleProps(packages[0].props, true).background, '#ffede9');
  assert.equal(stateStyleProps(packages[0].props, true).borderColor, '#ff8a00');
  assert.equal(stateStyleProps(packages[0].props, false).background, '#f0f0f0');
  assert.ok(nodes.get('products/package-0/reference').props.strike);
  const after = createDefaultPaywallRecord('test3');
  assert.deepEqual(indexDocument(after.document).nodes.get('products'), indexDocument(before.document).nodes.get('products'));
  assert.deepEqual(after.document.products, before.document.products);
  assert.equal(document.products['products/data-2'], undefined);
  record.document.root.name = '个人修改';
  assert.notEqual(createDefaultPaywallRecord('test4').document.root.name, '个人修改');
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(readConfiguredPaywall(storage, 'test4').paywall.products, 2);
  assert.equal(values.size, 0);
  assert.ok(savePaywall(storage, record.paywall, record.document));
  assert.deepEqual(readConfiguredPaywall(storage, 'test4'), record);
});
