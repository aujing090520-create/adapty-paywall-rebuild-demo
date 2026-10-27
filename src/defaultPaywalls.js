import { createBuilderNodes, templates } from './templates/templateDefinitions.js';
import { importComponentDocument } from './builder/componentDocument.js';
import { upgradeCanonicalComponents } from './builder/componentCatalog.js';
import { upgradeNavigationRows } from './builder/navigationRows.js';
import { upgradeButtonModals } from './builder/buttonModals.js';
import { readSavedPaywall } from './paywallStorage.js';

export const DEFAULT_VERTICAL_PAYWALL = { id: 'test3', name: 'test3', state: 'Draft', products: 3, startedAt: '27 Oct 2026', icon: false };

export function createDefaultPaywallRecord(id) {
  if (id !== DEFAULT_VERTICAL_PAYWALL.id) return null;
  const template = templates.find((entry) => entry.id === 'ht-blue-privilege');
  const initial = importComponentDocument(createBuilderNodes(template.id), template);
  const document = upgradeButtonModals(upgradeNavigationRows(upgradeCanonicalComponents(initial)));
  const visit = (node) => {
    let props = node.props;
    if (node.id === 'products') props = { ...props, axis: 'vertical', gap: 12, background: '#ffffff' };
    if (/^products\/package-[012]$/.test(node.id)) props = { ...props, axis: 'horizontal', align: 'center', gap: 12, widthMode: 'fill', heightMode: 'fit', minHeight: 96, paddingMode: 'individual', paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12 };
    if (/^products\/package-header-[012]$/.test(node.id)) props = { ...props, heightMode: 'fit', gap: 4 };
    if (['products/badge-space-0', 'products/badge-space-2'].includes(node.id)) props = { ...props, hidden: true };
    return { ...node, props, children: node.children.map(visit) };
  };
  return { version: 1, paywall: { ...DEFAULT_VERTICAL_PAYWALL }, templateId: template.id, document: { ...document, root: visit(document.root) } };
}

// Saved personal edits take precedence; bundled examples never write to storage on open.
export function readConfiguredPaywall(storage, id) {
  return readSavedPaywall(storage, id) ?? createDefaultPaywallRecord(id);
}
