import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultPaywallRecord, readConfiguredPaywall } from '../src/defaultPaywalls.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, validDocument } from '../src/builder/componentDocument.js';
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
