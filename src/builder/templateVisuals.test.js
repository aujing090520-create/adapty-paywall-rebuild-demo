import test from 'node:test';
import assert from 'node:assert/strict';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { component, componentProps, importComponentDocument, indexDocument, updateComponent, validDocument } from './componentDocument.js';
import { migrateTemplateVisuals } from './templateVisuals.js';
import { upgradeCanonicalComponents } from './componentCatalog.js';

const template = (id) => templates.find((entry) => entry.id === id);
const load = (id, calibrated = true) => importComponentDocument(createBuilderNodes(id), template(id), calibrated);

test('legacy padding and asymmetric margins survive axis controls with no zero-default override', () => {
  const props = componentProps(component('button', 'Button', '', { paddingTop: 14, paddingBottom: 14, paddingLeft: 18, paddingRight: 18, marginTop: 12, marginBottom: 3 }));
  assert.equal(props.paddingVertical, 14);
  assert.equal(props.paddingHorizontal, 18);
  assert.equal(props.marginMode, 'individual');
  assert.equal(componentProps(component('stack', 'Stack', '', { paddingTop: 28, paddingBottom: 28, paddingRight: 28, paddingLeft: 44 })).paddingMode, 'individual');
  assert.equal(componentProps(component('explicit', 'Stack', '', { paddingVertical: 0, paddingHorizontal: 0, paddingTop: 20, paddingMode: 'axis' })).paddingVertical, 0);
});

test('four HT defaults retain node ids, copy, media and product records while calibrating visuals', () => {
  for (const id of ['ht-blue-privilege', 'ht-membership-plans', 'ht-payment-recovery', 'ht-sku-sheet']) {
    const before = load(id, false), after = load(id);
    assert.ok(validDocument(after));
    assert.deepEqual(after.products, before.products);
    const oldNodes = indexDocument(before).nodes, nextNodes = indexDocument(after).nodes;
    assert.deepEqual([...nextNodes.keys()], [...oldNodes.keys()]);
    for (const [key, node] of oldNodes) {
      for (const prop of ['text', 'runs', 'src', 'binding', 'action', 'dataKey']) assert.deepEqual(nextNodes.get(key).props[prop], node.props[prop], `${id}:${key}:${prop}`);
    }
  }
});

test('blue page restores measured hero height, privilege rows, unequal column proportions and shared card slots', () => {
  const nodes = indexDocument(load('ht-blue-privilege')).nodes;
  assert.equal(nodes.get('hero-image/image').props.height, 226.2);
  assert.equal(nodes.get('benefits/row-0').props.height, 46.8);
  assert.equal(nodes.get('benefits/row-0/0').props.flexGrow, 1.85);
  for (let i = 0; i < 3; i++) {
    assert.equal(nodes.get(`products/package-header-${i}`).props.height, 50);
    assert.equal(nodes.get(`products/package-${i}`).props.borderWidth, 1);
    assert.equal(nodes.get(`products/package-${i}`).props.minHeight, 147);
  }
  assert.equal(nodes.get('timer').props.fontSize, 18);
});

test('saved documents receive changed default values once without losing manual edits or added nodes', () => {
  const previous = load('ht-blue-privilege', false), next = load('ht-blue-privilege');
  let saved = updateComponent(previous, 'hero-image/image', { props: { src: 'data:image/png;base64,user', height: 333 } });
  saved = updateComponent(saved, 'products/package-0-price', { props: { fontSize: 23, color: '#123456' } });
  saved = updateComponent(saved, 'legal', { props: { text: '用户文案', fontSize: 13 } });
  const result = migrateTemplateVisuals(saved, previous, next), nodes = indexDocument(result).nodes;
  assert.equal(nodes.get('hero-image/image').props.height, 333);
  assert.equal(nodes.get('hero-image/image').props.src, 'data:image/png;base64,user');
  assert.equal(nodes.get('products/package-0-price').props.fontSize, 23);
  assert.equal(nodes.get('products/package-0-price').props.color, '#123456');
  assert.equal(nodes.get('legal').props.text, '用户文案');
  assert.equal(nodes.get('legal').props.fontSize, 13);
  assert.equal(nodes.get('purchase').props.paddingTop, 14);
  assert.deepEqual(result.products, saved.products);
  assert.equal(migrateTemplateVisuals(result, previous, next), result);
});

test('previously split countdown digits receive the calibrated size without overwriting a custom digit', () => {
  const old = load('ht-blue-privilege', false), current = load('ht-blue-privilege');
  let saved = upgradeCanonicalComponents(old);
  const digit = [...indexDocument(saved).nodes.values()].find((node) => node.props.timerField === 'hours');
  saved = updateComponent(saved, digit.id, { props: { fontSize: 31 } });
  const result = migrateTemplateVisuals(saved, old, current);
  const texts = [...indexDocument({ root: indexDocument(result).nodes.get('timer') }).nodes.values()].filter((node) => node.props.timerField);
  assert.equal(texts.find((node) => node.id === digit.id).props.fontSize, 31);
  assert.ok(texts.filter((node) => node.id !== digit.id).every((node) => node.props.fontSize === 18));
});

test('RevenueCat gallery trees do not receive HT-only defaults', () => {
  assert.deepEqual(load('rc-source-1'), load('rc-source-1', false));
});

test('missing default recovery backdrop is restored but an uploaded page background stays intact', () => {
  const previous = load('ht-payment-recovery', false), current = load('ht-payment-recovery');
  assert.equal(migrateTemplateVisuals(previous, previous, current).root.props.backgroundImage, '/figma-paywall-assets/recovery-art.png');
  const edited = updateComponent(previous, previous.root.id, { props: { backgroundImage: 'data:image/png;base64,custom' } });
  assert.equal(migrateTemplateVisuals(edited, previous, current).root.props.backgroundImage, 'data:image/png;base64,custom');
});
