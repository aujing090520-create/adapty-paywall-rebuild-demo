import { component } from './componentDocument.js';

// New HT defaults expose every business field as an editable visual child.
export function buildHtPackageFields(document, variant) {
  if (!['blue-privilege', 'membership-plans', 'payment-recovery', 'sku-sheet'].includes(variant)) return document;
  const all = new Map();
  const index = (node) => { all.set(node.id, node); node.children.forEach(index); };
  index(document.root);
  const sampleBadge = [...all.values()].find((node) => /^products\/badge-\d+$/.test(node.id));
  const visit = (node) => {
    if (node.type !== 'Package' || node.props.group !== 'products') return { ...node, children: node.children.map(visit) };
    const key = node.props.dataKey;
    let infoFound = false, labelFound = false;
    const decorate = (child) => {
      let props = child.props;
      if (props.productField === 'badgeText' || /^products\/badge-\d+$/.test(child.id)) { labelFound = true; props = { ...props, productField: 'badgeText' }; }
      if (child.type === 'Text' && (['savingCopy', 'saveCopy', 'productInfo'].includes(props.binding?.field) || props.binding?.field === 'supportingCopy' && /^节省/.test(document.products[key]?.supportingCopy ?? ''))) {
        props = { ...props, binding: { key, field: 'productInfo' }, ...(infoFound ? { hidden: true } : {}) };
        infoFound = true;
      }
      return { ...child, props, children: child.children.map(decorate) };
    };
    let children = node.children.map(decorate);
    const addToSlot = (entries, match, value) => entries.map((entry) => match(entry) ? { ...entry, children: [...entry.children, value] } : { ...entry, children: addToSlot(entry.children, match, value) });
    if (!labelFound) {
      const badge = component(`${node.id}/product-label`, 'Stack', '布局容器', { ...sampleBadge?.props, widthMode: sampleBadge?.props.widthMode ?? 'fill', gap: 0, productField: 'badgeText' }, [component(`${node.id}/product-label/text`, 'Text', '文字', { text: '', binding: { key, field: 'badgeText' }, fontSize: 12, fontWeight: 700, color: '#ffffff', textAlign: 'center' })]);
      const placeholder = [...all.values()].find((entry) => entry.id === `products/badge-space-${node.id.split('-').at(-1)}`);
      children = placeholder ? addToSlot(children, (entry) => entry.id === placeholder.id, badge) : [...children, badge];
    }
    if (!infoFound) {
      const info = component(`${node.id}/product-info`, 'Text', '文字', { text: '', binding: { key, field: 'productInfo' }, fontSize: 12, color: '#2e89ff', textAlign: variant === 'payment-recovery' ? 'right' : 'center' });
      const slot = `products/detail-${node.id.split('-').at(-1)}`;
      children = all.has(slot) ? addToSlot(children, (entry) => entry.id === slot, info) : [...children, info];
    }
    return { ...node, props: { ...node.props, productLabelEnabled: true }, children };
  };
  return { ...document, root: visit(document.root) };
}
