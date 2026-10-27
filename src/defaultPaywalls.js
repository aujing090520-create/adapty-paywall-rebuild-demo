import { createBuilderNodes, templates } from './templates/templateDefinitions.js';
import { component, importComponentDocument } from './builder/componentDocument.js';
import { upgradeCanonicalComponents } from './builder/componentCatalog.js';
import { upgradeNavigationRows } from './builder/navigationRows.js';
import { upgradeButtonModals } from './builder/buttonModals.js';
import { readSavedPaywall } from './paywallStorage.js';

export const DEFAULT_VERTICAL_PAYWALL = { id: 'test3', name: 'test3', state: 'Draft', products: 3, startedAt: '27 Oct 2026', icon: false };
export const DEFAULT_ROW_PAYWALL = { id: 'test4', name: 'test4', state: 'Draft', products: 2, startedAt: '27 Oct 2026', icon: false };

function configureTwoPackageRows(document) {
  const row = (index, annual) => {
    const id = `products/package-${index}`, key = `products/data-${index}`;
    const text = (suffix, value, props = {}) => component(`${id}/${suffix}`, 'Text', '文字', { text: value, widthMode: 'fit', fontSize: 16, fontWeight: 600, lineHeight: 1.25, ...props });
    const stack = (suffix, children, props = {}) => component(`${id}/${suffix}`, 'Stack', '布局容器', { gap: 4, widthMode: 'fit', ...props }, children);
    const title = stack('title', [text('term', annual ? '1年' : '1个月'), ...(annual ? [text('reference', '', { binding: { key, field: 'referencePrice' }, strike: true, color: '#aaaaaa' })] : [])], { axis: 'horizontal', align: 'center', gap: 6 });
    const left = stack('left', [title, ...(annual ? [text('saving', '新用户立省64%', { fontSize: 13 })] : [])], { justify: 'center' });
    const right = stack('right', [...(annual ? [text('badge', '🔥30% OFF', { fontSize: 12, fontWeight: 500, color: '#ffffff', background: '#ff8a00', radius: 20, paddingMode: 'axis', paddingVertical: 1, paddingHorizontal: 10, textAlign: 'center', lineHeight: 1.3 })] : []), text('monthly', '', { binding: { key, field: 'monthlyPrice' }, fontSize: 17, textAlign: 'right' })], { align: 'end', justify: 'center', gap: 2 });
    return component(id, 'Package', '商品套餐', { dataKey: key, group: 'products', defaultSelected: annual, priceMode: '0', widthMode: 'fill', heightMode: 'fixed', height: 72, radius: 16, background: '#f0f0f0', selectedBackground: '#ffede9', borderWidth: 1, borderColor: 'transparent', selectedBorderColor: '#ff8a00', color: '#202020', selectedColor: '#202020', paddingMode: 'axis', paddingVertical: 8, paddingHorizontal: 10, gap: 0 }, [stack('content', [left, right], { widthMode: 'fill', heightMode: 'fill', axis: 'horizontal', align: 'center', justify: 'between', gap: 8 })]);
  };
  const visit = (node) => node.id === 'products' ? { ...node, props: { ...node.props, axis: 'vertical', gap: 16, background: 'transparent' }, children: [row(0, true), row(1, false)] } : { ...node, children: node.children.map(visit) };
  return { ...document, root: visit(document.root), products: {
    'products/data-0': { skuId: 'DEMO-SKU-YEAR', name: '1年', showReferencePrice: true },
    'products/data-1': { skuId: 'DEMO-BLUE-MONTH', name: '1个月' },
  } };
}

export function createDefaultPaywallRecord(id) {
  if (![DEFAULT_VERTICAL_PAYWALL.id, DEFAULT_ROW_PAYWALL.id].includes(id)) return null;
  const template = templates.find((entry) => entry.id === 'ht-blue-privilege');
  const initial = importComponentDocument(createBuilderNodes(template.id), template);
  const document = upgradeButtonModals(upgradeNavigationRows(upgradeCanonicalComponents(initial)));
  if (id === DEFAULT_ROW_PAYWALL.id) return { version: 1, paywall: { ...DEFAULT_ROW_PAYWALL }, templateId: template.id, document: configureTwoPackageRows(document) };
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
