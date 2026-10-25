import { COMPONENT_NAMES, indexDocument } from './componentDocument.js';

export const isOverlaySurface = (node) => node?.type === 'BottomSheet' || node?.type === 'Stack' && ['overlay', 'sheet'].includes(node.props.presentation);

// Presentation roots are listed separately without changing their document ownership.
export function surfaceContext(document, navigation = {}, selectedId) {
  const { active, shared } = pageContext(document, navigation);
  const surfaces = [];
  const visit = (node) => {
    if (node.type === 'Flow' || node.type === 'Screen' && node !== active) return;
    if (isOverlaySurface(node)) surfaces.push(node);
    node.children.forEach(visit);
  };
  [active, ...shared].forEach(visit);
  const { nodes, parents } = indexDocument(document);
  let selected = nodes.get(selectedId), surface;
  while (selected) {
    if (isOverlaySurface(selected)) { surface = selected; break; }
    selected = nodes.get(parents.get(selected.id));
  }
  return { surfaces, surface, triggers: surface ? [...nodes.values()].filter((node) => node.props.action?.action === 'OpenSheet' && node.props.action.actionPage === surface.id) : [] };
}

export function pageContext(document, navigation = {}) {
  const flows = document.root.children.filter((node) => node.type === 'Flow');
  const flow = flows.length === 1 ? flows[0] : null;
  const pages = flow?.children ?? [document.root];
  const active = flow ? treeChildren(flow, navigation)[0] ?? document.root : document.root;
  return { flow, pages, active, shared: flow ? document.root.children.filter((node) => node !== flow) : [] };
}

export function isUnconfiguredDetailPage(page) {
  if (!page || page.type !== 'Screen' || !/\/detail-screen-\d+$/.test(page.id)) return false;
  const meaningful = (node) => {
    if (node.props.hidden) return false;
    if (node.type === 'Button' && /\/back$/.test(node.id)) return false;
    if (node.type === 'Text' && node.id === `${page.id}/title`) return false;
    if (['Image', 'Video'].includes(node.type) && node.props.src) return true;
    if (node.type === 'Custom' && node.props.html?.trim()) return true;
    if (node.type === 'Text' && (node.props.text?.trim() || node.props.runs?.some((run) => run.text?.trim()))) return true;
    return node.children.some(meaningful);
  };
  return !page.children.some(meaningful);
}

export function treeChildren(node, navigation = {}) {
  if(node.type==='Countdown' && node.props.fallbackEnabled===false)return node.children.filter((child)=>child.props.state!=='fallback');
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
