import { COMPONENT_TYPES, canContain, indexDocument, validDocument } from '../../src/builder/componentDocument.js';
import { COMPONENT_CATALOG, createCatalogComponent, upgradeCanonicalComponents } from '../../src/builder/componentCatalog.js';
import { upgradeNavigationRows } from '../../src/builder/navigationRows.js';
import { upgradeButtonModals } from '../../src/builder/buttonModals.js';
import { importComponentDocument } from '../../src/builder/componentDocument.js';
import { templates, createBuilderNodes } from '../../src/templates/templateDefinitions.js';
import { readFileSync } from 'node:fs';

// External inventory is deliberately independent of the implementation's catalog.
export const REFERENCE_COMPONENTS = [
  ['Text', 'Text'], ['Image', 'Image'], ['Video', 'Video'], ['Icon', 'Icon'], ['Custom', 'Custom'],
  ['Stack', 'Stack'], ['Header', 'Header'], ['Footer', 'Footer'], ['Package', 'Package'],
  ['PurchaseButton', 'PurchaseButton'], ['ExpressCheckout', 'ExpressCheckout'], ['Tabs', 'Tabs'],
  ['Switch', 'Switch'], ['Button', 'Button'], ['Carousel', 'Carousel'], ['Countdown', 'Countdown'],
  ['Timeline', 'Timeline'], ['SocialProof', 'Stack'], ['FeatureList', 'Stack'], ['Award', 'Stack'],
];
export const STRUCTURAL_OWNERS = {
  Tab: 'Tabs', TabButton: 'TabControl', Slide: 'Carousel', PageControl: 'Carousel', Indicators: 'PageControl',
  TimelineItem: 'Timeline', SwitchCase: 'Switch', CheckoutState: 'ExpressCheckout', CountdownState: 'Countdown',
  Header: 'Screen', Footer: 'Screen',
};
export const PRESETS = ['BottomSheet', 'CloseButton', 'BackButton','GiftList','BenefitsStrip','GiftEntry'];
// Demo-specific field reference, not a claimed RevenueCat native component.
export const DEMO_COMPONENTS = ['ProductParameter'];
const OBSERVED_NATIVE_TYPES = { header: 'Header', footer: 'Footer', icon: 'Icon', image: 'Image', package: 'Package', purchase_button: 'PurchaseButton', button: 'Button', carousel: 'Carousel', timeline: 'Timeline', timeline_item: 'TimelineItem', tabs: 'Tabs', tab: 'Tab', tab_control: 'TabControl', tab_control_button: 'TabButton', stack: 'Stack', text: 'Text' };

export function observedNativeType(row, rows) {
  const byKey = new Map(rows.map((entry) => [entry.key, entry]));
  let ancestor = byKey.get(row.parent);
  const ancestors = [];
  while (ancestor) { ancestors.push(ancestor.type); ancestor = byKey.get(ancestor.parent); }
  if (row.type === 'screen') return 'Screen';
  if (row.type === 'toggle') return 'Switch';
  if (row.type === 'tab' && ancestors.includes('toggle')) return 'SwitchCase';
  if (row.type === 'tab_control' && ancestors.includes('toggle')) return 'Toggle';
  if (row.type === 'stack' && ancestors[0] === 'carousel') return 'Slide';
  return OBSERVED_NATIVE_TYPES[row.type];
}

export function structureIssues(document) {
  const issues = [];
  if (!validDocument(document)) return ['invalid-document'];
  const { nodes, parents } = indexDocument(document);
  for (const node of nodes.values()) {
    const parent = nodes.get(parents.get(node.id));
    if (parent && !canContain(parent, node)) issues.push(`${node.id}: invalid parent ${parent.type}/${node.type}`);
    if (STRUCTURAL_OWNERS[node.type] && parent?.type !== STRUCTURAL_OWNERS[node.type]) issues.push(`${node.id}: structural owner must be ${STRUCTURAL_OWNERS[node.type]}`);
    if (node.type === 'TabButton') {
      let owner = parent;
      while (owner && owner.type !== 'Tabs') owner = nodes.get(parents.get(owner.id));
      if (!owner || node.props.target !== owner.id || !owner.children[node.props.index]) issues.push(`${node.id}: stale tab target`);
    }
    if (node.type === 'Package' && !document.products[node.props.dataKey ?? node.id]) issues.push(`${node.id}: missing product record`);
    const action = node.props.action;
    if(action?.packageId&&nodes.get(action.packageId)?.type!=='Package')issues.push(`${node.id}: unresolved purchase package target`);
    if(action?.pagePackages&&action.pagePackages.enabled!==false){
      const sequence=nodes.get(action.pagePackages.source);
      if(!['Carousel','Tabs'].includes(sequence?.type))issues.push(`${node.id}: unresolved purchase sequence`);
      for(const mapping of action.pagePackages.pages??[]){
        if(!sequence?.children.some(page=>page.id===mapping.pageId))issues.push(`${node.id}: unresolved purchase page`);
        if(mapping.packageId&&nodes.get(mapping.packageId)?.type!=='Package')issues.push(`${node.id}: unresolved page purchase package`);
      }
    }
    if (action?.actionPage && ['OpenSheet', 'NextScreen', 'OpenPage'].includes(action.action)) {
      const type = nodes.get(action.actionPage)?.type;
      if (type !== (action.action === 'OpenSheet' ? 'BottomSheet' : 'Screen')) issues.push(`${node.id}: unresolved ${action.action} target`);
    }
  }
  return issues;
}

export function templateDocument(template) {
  return upgradeButtonModals(upgradeNavigationRows(upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id), template))));
}

export function structureCoverage() {
  const catalog = new Set(COMPONENT_CATALOG.flatMap((group) => group.items.map(([type]) => type)));
  const coverage = {
    date: '2026-10-26',
    scope: 'Catalog and structural contracts, not full visual/SDK/parameter parity',
    sources: [
      'https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/components',
      'https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/component-properties',
      'https://app.revenuecat.com/projects/c345937e/paywalls/wf93b803836a034296/builder',
    ],
    reference: REFERENCE_COMPONENTS.map(([entry, rootType]) => ({ entry, rootType, available: catalog.has(entry) })),
    presets: PRESETS.map((entry) => ({ entry, rootType: createCatalogComponent(entry, `preset-${entry}`).type })),
    nativeTypes: COMPONENT_TYPES,
    templates: templates.map((template) => {
      const document = templateDocument(template), nodes = [...indexDocument(document).nodes.values()];
      return { id: template.id, family: template.id.startsWith('rc-source-') ? 'reference-gallery' : template.id.startsWith('ht-') ? 'HT' : 'compatibility', nodes: nodes.length, types: [...new Set(nodes.map((node) => node.type))].sort(), issues: structureIssues(document) };
    }),
  };
  const observed = JSON.parse(readFileSync(new URL('../../docs/reference-structure/revenuecat-hierarchy-2026-10-26.json', import.meta.url), 'utf8')).samples;
  coverage.observedSourceComparison = observed.map((source) => {
    const local = coverage.templates.find((template) => template.id === `rc-source-${source.order}`);
    const rows = [...source.rows, ...(source.states ?? []).flatMap((state) => state.rows)];
    const requiredTypes = [...new Set(rows.map((row) => observedNativeType(row, rows)).filter(Boolean))];
    const document = templateDocument(templates.find((template) => template.id === local.id));
    const localNodes = [...indexDocument(document).nodes.values()];
    const sourceFooters = source.rows.filter((row) => row.type === 'footer').length;
    const actualFooters = localNodes.filter((entry) => entry.type === 'Footer').length;
    return { id: local.id, evidence: 'current read-only complete layer hierarchy, with explicitly inspected switch/tier alternatives; not full pixel/property proof', requiredTypes, missingTypes: requiredTypes.filter((type) => !local.types.includes(type)), unmappedSourceTypes: [...new Set(rows.filter((row) => !observedNativeType(row, rows)).map((row) => row.type))], fixedRegions: { sourceFooters, actualFooters, matches: sourceFooters === actualFooters }, sourceRowCount: source.rows.length };
  });
  const gaps = coverage.observedSourceComparison.filter((source) => source.missingTypes.length || source.unmappedSourceTypes.length);
  coverage.referenceAlignment = { status: gaps.length ? 'partial' : 'type-presence-only', observedSamples: observed.length, samplesWithTypeGaps: coverage.observedSourceComparison.filter((source) => source.missingTypes.length).length, samplesNeedingTypeMapping: coverage.observedSourceComparison.filter((source) => source.unmappedSourceTypes.length).length, fixedRegionMismatches: coverage.observedSourceComparison.filter((source) => !source.fixedRegions.matches).length, limitation: 'Verified fixed-region boundaries and switch ownership do not imply full recursive hierarchy, visual or SDK equivalence. Template 38 has no observed source layer sample.' };
  coverage.navigationPolicy={date:'2026-10-30',scope:'Generated template defaults and explicit navigation edits',behavior:'Existing close/back navigation uses screen-owned fixed Header; media-overlay placement is retained. This is a Demo usability correction, not claimed source Header-type parity.',savedTrees:'No automatic reparenting on read'};
  return coverage;
}
