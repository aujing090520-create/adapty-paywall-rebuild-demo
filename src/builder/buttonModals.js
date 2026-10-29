import { component, componentProps, indexDocument, insertComponent, updateComponent } from './componentDocument.js';
import { createRetentionModal, importCloseTarget } from './closeTargets.js';
import { exitOfferTarget } from './exitOffers.js';
import { owningScreen, owningModal, workflowContext } from './workflow.js';
import { createCatalogComponent } from './componentCatalog.js';
import { pageContext } from './componentTree.js';
import { copyFragment, pasteFragment } from './componentOperations.js';
import { appendNavigationButton } from './navigationRows.js';

const buttons = new Set(['Button', 'PurchaseButton']);

export function modalBindings(document) {
  const { nodes, parents } = indexDocument(document);
  const stepIds = new Set(workflowContext(document).steps.map((screen) => screen.id));
  const visible = (node) => {
    while (node) {
      if (node.props.hidden) return false;
      const parent = nodes.get(parents.get(node.id));
      if (node.type === 'CountdownState' && node.props.state === 'fallback' && parent?.type === 'Countdown' && parent.props.fallbackEnabled === false) return false;
      if (node.type === 'BottomSheet' && buttons.has(parent?.type) && (parent.props.action?.action !== 'OpenSheet' || parent.props.action.actionPage !== node.id)) return false;
      node = parent;
    }
    return true;
  };
  return [...nodes.values()].filter((node) => buttons.has(node.type) && node.props.action?.action === 'OpenSheet' && visible(node))
    .flatMap((button) => {
      const modal = nodes.get(button.props.action.actionPage);
      let screen = button;
      while (screen && !stepIds.has(screen.id)) screen = nodes.get(parents.get(screen.id));
      return modal?.type === 'BottomSheet' && visible(modal) ? [{ button, modal, screen: screen ?? owningScreen(document, button.id) }] : [];
    });
}

export function buttonModalEdges(document, navigation = {}) {
  return modalBindings(document).filter(({screen}) => screen).map(({button, modal, screen}) => ({
    id: button.id, source: nearestSurface(button.id), target: modal.id, label: button.name || '打开弹窗',
    description: `点击「${button.name || '按钮'}」→ ${modal.name}`, kind: 'modal',
  }));
  function nearestSurface(id) {
    const node = owningModal(document,id) ?? owningScreen(document,id);
    return node?.id === document.root.id ? pageContext(document,navigation).active.id : node?.id;
  }
}

export function attachButtonModal(document, buttonId, modalId) {
  const { nodes, parents } = indexDocument(document), button = nodes.get(buttonId), modal = nodes.get(modalId);
  if (!buttons.has(button?.type) || modal?.type !== 'BottomSheet') return document;
  const currentOwner = nodes.get(parents.get(modalId));
  if (buttons.has(currentOwner?.type) && currentOwner.id !== buttonId) return document;
  // A modal cannot own its own opener, including indirectly.
  let ancestor = button;
  while (ancestor) { if (ancestor.id === modalId) return document; ancestor = nodes.get(parents.get(ancestor.id)); }
  const detach = (node) => ({ ...node, children: node.children.filter((child) => child.id !== modalId).map(detach) });
  let next = { ...document, root: detach(document.root), settings: { ...document.settings, buttonModalVersion: 1 } };
  next = updateComponent(next, buttonId, { children: [...indexDocument(next).nodes.get(buttonId).children, modal], props: { action: { ...button.props.action, action: 'OpenSheet', actionPage: modalId } } });
  return next;
}

export function createButtonModal(document, buttonId, blank = false) {
  const button = indexDocument(document).nodes.get(buttonId);
  if (!buttons.has(button?.type)) return { document, id: null };
  const result = createRetentionModal(document, owningScreen(document, buttonId)?.id, blank);
  const restored = { ...result.document, settings: { ...document.settings, buttonModalVersion: 1 } };
  return { document: attachButtonModal(restored, buttonId, result.id), id: result.id };
}

export function navigationButton(kind, id = crypto.randomUUID()) {
  return createCatalogComponent(kind === 'back' ? 'BackButton' : 'CloseButton', id);
}

export function addNavigationButton(document, screenId, kind = 'close') {
  const screen = indexDocument(document).nodes.get(screenId);
  if (screen?.type !== 'Screen') return { document, id: null };
  const existing = findNavigationButton(screen, kind);
  if (existing) return {document,id:existing.id};
  const button = navigationButton(kind);
  return { document: appendNavigationButton(document,screenId,button), id: button.id };
}

export function findNavigationButton(screen, kind = 'close') {
  const glyph = kind==='back'?'tabler:outline:arrow-left':'tabler:outline:x';
  const visit = node => {
    if(node.props.hidden||node.type==='BottomSheet'||node.type==='Screen'&&node!==screen)return null;
    if(node.type==='Button'&&node.children.some(child=>child.type==='Icon'&&child.props.icon===glyph))return node;
    return node.children.map(visit).find(Boolean)??null;
  };
  return screen&&visit(screen);
}

export function upgradeButtonModals(document, offerings = [], currentPaywallId) {
  if (document.settings?.buttonModalVersion || document.settings?.presentationSurfaceId) return document;
  let next = document;
  for (const screen of workflowContext(document).steps) {
    const target = exitOfferTarget(document, offerings, currentPaywallId, screen.id);
    if (!target) continue;
    let targetId = target.local ? document.settings?.closeTargetsByScreen?.[screen.id] : null;
    if (!target.local) {
      const source = target.document;
      const imported = importLegacyModal(next, screen.id, source);
      if (imported.error) continue;
      next = imported.document; targetId = imported.id;
    }
    const targetIndex = indexDocument(next), targetOwner = targetIndex.nodes.get(targetIndex.parents.get(targetId));
    if (buttons.has(targetOwner?.type)) {
      const imported = importCloseTarget(next, screen.id, explicitProductKeys(next), targetId);
      if (!imported.error) { next = imported.document; targetId = imported.id; }
    }
    const targetNode = indexDocument(next).nodes.get(targetId);
    const existing = [...indexDocument(next).nodes.values()].find((node) => node.type === 'Button' && node.props.action?.action === 'Dismiss' && owningScreen(next, node.id)?.id === screen.id && !hasModalAncestor(next, node.id));
    const added = existing ? { document: next, id: existing.id } : addNavigationButton(next, screen.id);
    next = added.document;
    if (targetNode?.type === 'BottomSheet') next = attachButtonModal(next, added.id, targetId);
    else if (targetNode?.type === 'Screen') next = updateComponent(next, added.id, { props: { action: { action: 'NextScreen', actionPage: targetId } } });
  }
  // Keep legacy fields as read-only history. Runtime uses button actions from now on.
  next = { ...next, settings: { ...document.settings, buttonModalVersion: 1 } };
  for (const { button, modal } of modalBindings(next)) {
    const { nodes, parents } = indexDocument(next), parent = nodes.get(parents.get(modal.id));
    if (buttons.has(parent?.type) && parent.id !== button.id) {
      const imported = importCloseTarget(next, owningScreen(next, button.id)?.id, explicitProductKeys(next), modal.id);
      if (!imported.error) next = attachButtonModal(imported.document, button.id, imported.id);
    } else next = attachButtonModal(next, button.id, modal.id);
  }
  return next;
}

function hasModalAncestor(document, id) {
  const { nodes, parents } = indexDocument(document);
  let node = nodes.get(parents.get(id));
  while (node) { if (node.type === 'BottomSheet' || ['overlay','sheet'].includes(componentProps(node).presentation)) return true; node = nodes.get(parents.get(node.id)); }
  return false;
}

function importLegacyModal(document, sourceId, source) {
  source = explicitProductKeys(source);
  const id = source.settings?.presentationSurfaceId;
  if (!id) return importCloseTarget(document, sourceId, source, source.root.id);
  const { nodes } = indexDocument(source), primary = nodes.get(id);
  if (primary?.type !== 'BottomSheet') return { document, error: '原弹窗不可用' };
  const roots = [primary], included = new Set();
  const collect = (node) => { included.add(node.id); node.children.forEach(collect); };
  collect(primary);
  // Copy cross-sheet destinations in one forest so cloneComponent remaps every link.
  for (let at = 0; at < roots.length; at++) {
    const visit = (node) => {
      const target = nodes.get(node.props.action?.actionPage);
      if (target?.type === 'BottomSheet' && !included.has(target.id)) { roots.push(target); collect(target); }
      node.children.forEach(visit);
    };
    visit(roots[at]);
  }
  const forest = { ...source, root: component(crypto.randomUUID(),'Screen','迁移内容',{},roots) };
  const result = pasteFragment(document,document.root.id,copyFragment(forest,forest.root.id,true));
  return result.ids.length ? { document:result.document,id:result.ids[0] } : {document,error:'无法复制原弹窗'};
}

function explicitProductKeys(document) {
  let next = document;
  for (const node of indexDocument(document).nodes.values()) if (node.type === 'Package' && !node.props.dataKey && document.products[node.id]) next = updateComponent(next,node.id,{props:{dataKey:node.id}});
  return next;
}

export function openSheetNavigation(runtime, id) {
  if (runtime.overlay === id) return runtime;
  return { ...runtime, overlay: id, overlayHistory: runtime.overlay ? [...runtime.overlayHistory ?? [], runtime.overlay] : [] };
}

export function closeSheetNavigation(runtime) {
  const history = runtime.overlayHistory ?? [];
  return { ...runtime, overlay: history.at(-1) ?? null, overlayHistory: history.slice(0,-1) };
}
