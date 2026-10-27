import { component } from './componentDocument.js';

// Only new template documents pass here; saved personal trees are not reparented.
export function buildHtTemplateFooter(document, variant) {
  if (!['blue-privilege', 'membership-plans', 'payment-recovery'].includes(variant)) return document;
  const ids = ['timer', 'agreement', 'purchase', 'legal', 'links', '$home'];
  const hasPurchase = (node) => node.id === 'purchase' || node.children.some((child) => child.type !== 'Screen' && hasPurchase(child));
  const visit = (node) => {
    if (node.type !== 'Screen' || !hasPurchase(node)) return { ...node, children: node.children.map(visit) };
    if (node.children.some((child) => child.type === 'Footer')) return node;
    const moved = new Map();
    const extract = (entry) => {
      if (ids.includes(entry.id)) { moved.set(entry.id, entry); return null; }
      return { ...entry, children: entry.children.map(extract).filter(Boolean) };
    };
    const content = node.children.map(extract).filter(Boolean);
    const blue = variant === 'blue-privilege', member = variant === 'membership-plans';
    const footer = component(`${node.id}/footer`, 'Footer', '页脚', {
      axis: 'vertical', widthMode: 'fill', heightMode: 'fit', gap: blue ? 0 : 12,
      background: member ? '#f7f7f7' : '#ffffff',
      paddingMode: 'individual', paddingTop: blue ? 0 : 12, paddingBottom: 0,
      paddingLeft: blue ? 0 : member ? 16 : 20, paddingRight: blue ? 0 : member ? 16 : 20,
    }, ids.map((id) => moved.get(id)).filter(Boolean));
    return { ...node, children: [...content, footer] };
  };
  return { ...document, root: visit(document.root) };
}
