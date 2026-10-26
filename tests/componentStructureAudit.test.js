import test from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE_COMPONENTS, PRESETS, structureIssues, templateDocument, structureCoverage } from '../scripts/lib/component-structure-contract.mjs';
import { COMPONENT_CATALOG, createCatalogComponent } from '../src/builder/componentCatalog.js';
import { component, indexDocument, COMPONENT_TYPES } from '../src/builder/componentDocument.js';
import { templates } from '../src/templates/templateDefinitions.js';

test('every source catalog entry and every native structural type has an explicit coverage owner', () => {
  const catalog = COMPONENT_CATALOG.flatMap((group) => group.items.map(([type]) => type));
  assert.equal(REFERENCE_COMPONENTS.length, 20);
  assert.deepEqual(new Set(catalog), new Set([...REFERENCE_COMPONENTS.map(([entry]) => entry), ...PRESETS]));
  assert.deepEqual(new Set(COMPONENT_TYPES), new Set(['Screen', 'Flow', 'Stack', 'Text', 'Image', 'Video', 'Icon', 'Custom', 'Header', 'Footer', 'Package', 'PurchaseButton', 'BottomSheet', 'ExpressCheckout', 'CheckoutState', 'Wallet', 'Button', 'Tabs', 'Tab', 'TabControl', 'TabButton', 'Carousel', 'Slide', 'PageControl', 'Indicators', 'Timeline', 'TimelineItem', 'Switch', 'SwitchCase', 'Toggle', 'Countdown', 'CountdownState']));
});

for (const [type, rootType] of REFERENCE_COMPONENTS) {
  test(`reference ${type} creates its actual native/composed structure`, () => {
    const node = createCatalogComponent(type, `sample-${type}`);
    assert.equal(node.type, rootType);
    const document = { version: 3, products: type === 'Package' ? { [node.id]: { name: '商品', price: '100' } } : {}, root: component('root', 'Screen', '', {}, [node]) };
    assert.deepEqual(structureIssues(document), []);
    const nodes = [...indexDocument(document).nodes.values()];
    if (type === 'Package') assert.deepEqual(node.children.map((child) => child.type), ['Stack']);
    if (type === 'Countdown') assert.deepEqual(node.children.map((child) => child.props.state), ['active', 'ended', 'fallback']);
    if (type === 'ExpressCheckout') assert.deepEqual(node.children.map((child) => child.props.state), ['available', 'unavailable', 'loading']);
    if (type === 'Switch') assert.deepEqual(node.children.map((child) => child.props.index), [0, 1]);
    if (type === 'Carousel') assert.ok(nodes.some((child) => child.type === 'Indicators'));
    if (['SocialProof', 'FeatureList', 'Award'].includes(type)) assert.ok(nodes.every((child) => ['Screen', 'Stack', 'Text', 'Icon'].includes(child.type)));
  });
}

for (const template of templates) {
  test(`${template.id}: complete imported tree has valid structural ownership, product records and configured targets`, () => {
    assert.deepEqual(structureIssues(templateDocument(template)), []);
  });
}

test('source checkout retains PurchaseButton semantics while multi-step continuation remains Button', () => {
  const source = templateDocument(templates.find((template) => template.id === 'rc-source-1'));
  const nodes = [...indexDocument(source).nodes.values()];
  assert.ok(nodes.filter((node) => node.props.action?.action === 'Purchase').every((node) => node.type === 'PurchaseButton'));
  assert.ok(nodes.filter((node) => node.props.action?.action === 'NextScreen').every((node) => node.type === 'Button'));
  assert.equal(nodes.filter((node) => node.props.action?.action === 'NextScreen').length, 2);
});

test('audit separates observed source gaps from internal validity and cannot call a partial reconstruction fully aligned', () => {
  const coverage = structureCoverage();
  assert.equal(coverage.observedSourceComparison.length, 40);
  assert.ok(!coverage.observedSourceComparison.some((source) => source.id === 'rc-source-38'));
  assert.ok(coverage.observedSourceComparison.every((source) => !source.missingTypes.includes('PurchaseButton')), 'source purchase semantics must not regress into plain Buttons');
  const hasGaps = coverage.observedSourceComparison.some((source) => source.missingTypes.length || source.unmappedSourceTypes.length);
  assert.equal(coverage.referenceAlignment.status, hasGaps ? 'partial' : 'type-presence-only');
  assert.ok(coverage.templates.every((template) => !template.issues.length));
});
