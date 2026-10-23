import { COMPONENT_NAMES } from './componentDocument.js';

export function treeChildren(node, navigation = {}) {
  if (node.type !== 'Flow') return node.children;
  const index = navigation[node.id] ?? node.props.defaultIndex ?? 0;
  return node.children.length ? [node.children[index] ?? node.children[0]] : [];
}

export function compositionSummary(node) {
  const counts = new Map();
  for (const child of node.children) counts.set(child.type, (counts.get(child.type) ?? 0) + 1);
  return [...counts].map(([type, count]) => `${COMPONENT_NAMES[type]}${count > 1 ? ` × ${count}` : ''}`).join(' · ');
}

export function initialCollapsed(root) {
  const result = new Set();
  const visit = (node) => {
    if (node !== root && node.children.length && !['Screen', 'Flow'].includes(node.type)) result.add(node.id);
    node.children.forEach(visit);
  };
  visit(root);
  return result;
}
