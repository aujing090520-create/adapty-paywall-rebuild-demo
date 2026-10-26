import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, indexDocument, saveComponentDocument, readComponentDocument, componentLayerLabel } from '../src/builder/componentDocument.js';
import { migrateTemplateVisuals } from '../src/builder/templateVisuals.js';
import { activeComponents, checkedControl } from '../src/builder/propertyModel.js';
import { templateDocument, structureCoverage, observedNativeType } from '../scripts/lib/component-structure-contract.mjs';

const source = (order) => templates.find((entry) => entry.id === `rc-source-${order}`);
const raw = (order) => importComponentDocument(createBuilderNodes(source(order).id), source(order), false);
const nodes = (document) => [...indexDocument(document).nodes.values()];
const fixture = JSON.parse(readFileSync(new URL('../docs/reference-structure/revenuecat-hierarchy-2026-10-26.json', import.meta.url))).samples;

test('all forty read-only captures are complete ordered trees, and fixed-region counts match independently', () => {
  for (const sample of fixture) {
    const seen = new Set();
    assert.equal(sample.complete, true);
    for (const row of sample.rows) {
      assert.equal(row.collapsed, false);
      if (row.parent) assert.ok(seen.has(row.parent), `${sample.order}: orphan ${row.key}`);
      seen.add(row.key);
    }
  }
  const coverage = structureCoverage();
  assert.equal(coverage.referenceAlignment.fixedRegionMismatches, 0);
  assert.equal(coverage.referenceAlignment.samplesNeedingTypeMapping, 0);
  assert.equal(coverage.referenceAlignment.samplesWithTypeGaps, 0);
  assert.equal(coverage.referenceAlignment.status, 'type-presence-only');
});

test('switch tab/control source types are mapped using their real ancestors, not their names', () => {
  const sample = fixture.find((entry) => entry.order === 7);
  assert.equal(observedNativeType(sample.rows.find((row) => row.type === 'tab'), sample.rows), 'SwitchCase');
  assert.equal(observedNativeType(sample.rows.find((row) => row.type === 'tab_control'), sample.rows), 'Toggle');
  const tiers = fixture.find((entry) => entry.order === 12);
  assert.equal(observedNativeType(tiers.rows.find((row) => row.type === 'tab'), tiers.rows), 'Tab');
});

test('each multi-step screen owns its own unique footer, and only its actual bottom blocks', () => {
  const document = templateDocument(source(1));
  const index = indexDocument(document);
  assert.equal(nodes(document).filter((entry) => entry.type === 'Footer').length, 3);
  for (const at of [1, 2, 3]) {
    const screen = index.nodes.get(`rc-source-1-screen-${at}`);
    const footer = screen.children.find((entry) => entry.type === 'Footer');
    assert.equal(index.parents.get(footer.id), screen.id);
    assert.ok(!nodes({ root: footer }).some((entry) => entry.type === 'Image'));
  }
  assert.equal(index.parents.get('rc-source-1-products'), 'rc-source-1-screen-3-footer');
});

test('tier packages and body packages are not swept into the footer, while full-footer scene has no duplicate hero', () => {
  for (const order of [12, 18, 23, 24, 27, 34]) {
    const document = templateDocument(source(order));
    const footer = document.root.children.find((entry) => entry.type === 'Footer');
    assert.ok(!nodes({ root: footer }).some((entry) => entry.type === 'Package'), `${order}: body package moved into footer`);
  }
  const document = templateDocument(source(30));
  assert.deepEqual(document.root.children.map((entry) => entry.type), ['Footer']);
  assert.ok(document.root.props.backgroundImage);
  const plane = indexDocument(templateDocument(source(28)));
  assert.equal(plane.parents.get('rc-source-28-copy-0'), 'rc-source-28-hero');
  assert.equal(plane.parents.get('rc-source-28-title'), 'rc-source-28-footer');
});

for (const order of [7, 8, 9]) test(`${order}: OFF/ON are complete isolated package/control/purchase states with unchanged SKU data`, () => {
  const document = templateDocument(source(order));
  const index = indexDocument(document);
  const sw = index.nodes.get(`rc-source-${order}-switch`);
  assert.equal(index.nodes.get(index.parents.get(sw.id)).type, 'Footer');
  assert.deepEqual(sw.children.map((entry) => entry.props.index), [0, 1]);
  assert.deepEqual(sw.children.map((entry) => componentLayerLabel(entry)), ['开关状态内容 · 关闭', '开关状态内容 · 开启']);
  assert.deepEqual(document.products, raw(order).products);
  const states = [0, 1].map((at) => activeComponents(document, { [sw.id]: at }));
  for (const at of [0, 1]) {
    const control = states[at].find((entry) => entry.type === 'Toggle');
    assert.equal(control.props.switchTarget, sw.id);
    assert.equal(checkedControl(control.props, control.id, { [sw.id]: at }, index.nodes), Boolean(at));
    assert.equal(states[at].filter((entry) => entry.type === 'Package').length, order === 9 ? 1 : 2);
    assert.equal(states[at].filter((entry) => entry.type === 'PurchaseButton').length, 1);
    assert.ok(!states[at].some((entry) => entry.props.visibleWhen));
  }
  const firstIds = new Set(states[0].filter((entry) => entry.type === 'Package').map((entry) => entry.id));
  assert.ok(states[1].filter((entry) => entry.type === 'Package').every((entry) => !firstIds.has(entry.id)));
});

test('navigation remains an actual Button/Icon; only source four has fixed Header', () => {
  for (const order of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 28, 31, 32, 33, 34, 35, 36, 39]) {
    const document = templateDocument(source(order));
    const index = indexDocument(document);
    const close = nodes(document).find((entry) => entry.type === 'Button' && entry.props.action?.action === 'Dismiss' && entry.children.some((child) => child.type === 'Icon'));
    assert.ok(close, `${order}: no real navigation action`);
    assert.equal(index.nodes.get(index.parents.get(close.id)).type, 'Stack');
    assert.equal(nodes(document).filter((entry) => entry.type === 'Header').length, order === 4 ? 1 : 0);
  }
  const document = templateDocument(source(8));
  const hero = indexDocument(document).nodes.get('rc-source-8-hero');
  assert.deepEqual(hero.children.map((entry) => entry.type), ['Stack', 'Image']);
});

test('single SKU renewal copy lives in its Package rather than a hidden decorative card', () => {
  for (const order of [2, 3, 15, 16, 26, 29, 39]) {
    const document = templateDocument(source(order));
    const packages = activeComponents(document, {}).filter((entry) => entry.type === 'Package');
    assert.equal(packages.length, 1);
    assert.ok(packages[0].children.every((entry) => entry.type === 'Text'));
    assert.deepEqual(document.products, raw(order).products);
  }
});

test('feature cards and comparison symbols retain actual editable types and column hierarchy', () => {
  const feature = indexDocument(templateDocument(source(27))).nodes.get('rc-source-27-table');
  assert.equal(feature.children.slice(1).filter((row) => row.children[0].type === 'Icon').length, 5);
  const comparison = indexDocument(templateDocument(source(29))).nodes.get('rc-source-29-table');
  assert.equal(comparison.props.axis, 'horizontal');
  assert.equal(comparison.children.length, 3);
  assert.equal(nodes({ root: comparison }).filter((entry) => entry.type === 'Icon').length, 10);
});

test('light reference package cards do not inherit white text from a dark scene', () => {
  for (const order of [8, 12, 28, 30]) {
    const cards = nodes(templateDocument(source(order))).filter((entry) => entry.type === 'Package' && entry.props.background === '#f5f5f5');
    assert.ok(cards.length);
    assert.ok(cards.every((entry) => entry.props.color === '#171717' && entry.props.selectedColor === '#171717'));
  }
});

test('new defaults roundtrip while saved manual drafts, HT defaults and unobserved source 38 are not structurally migrated', () => {
  for (const order of [1, 4, 7, 8, 9, 12, 28, 30]) {
    const original = raw(order), current = templateDocument(source(order));
    original.root.children.reverse();
    original.root.name = '用户手工页面';
    assert.strictEqual(migrateTemplateVisuals(original, raw(order), current), original);
    const data = new Map();
    const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
    saveComponentDocument(storage, current);
    assert.deepEqual(readComponentDocument(storage, current.templateId), JSON.parse(JSON.stringify(current)));
  }
  for (const template of templates.filter((entry) => entry.id.startsWith('ht-') || entry.id === 'rc-source-38')) assert.equal(templateDocument(template).referenceStructureVersion, undefined);
});
