import { component, indexDocument, insertComponent, removeComponent, updateComponent } from './componentDocument.js';
import { workflowContext } from './workflow.js';
import { copyFragment, pasteFragment } from './componentOperations.js';

export const hasCloseTarget = (document, sourceId) => Object.hasOwn(document.settings?.closeTargetsByScreen ?? {}, sourceId);
export const closeTargetId = (document, sourceId) => document.settings?.closeTargetsByScreen?.[sourceId] ?? '';

export function canvasCloseTargets(document, sourceId) {
  return [...indexDocument(document).nodes.values()].filter((node) => node.type === 'BottomSheet' || workflowContext(document).steps.some((page) => page.id === node.id && page.id !== sourceId));
}

export function bindCloseTarget(document, sourceId, targetId) {
  if (!workflowContext(document).steps.some((page) => page.id === sourceId)) return document;
  if (targetId && !canvasCloseTargets(document, sourceId).some((node) => node.id === targetId && !node.props.hidden)) return document;
  return { ...document, settings: { ...document.settings, closeTargetsByScreen: { ...document.settings?.closeTargetsByScreen, [sourceId]: targetId } } };
}

export function closeTargetPresentation(document, sourceId) {
  const id = closeTargetId(document, sourceId), node = indexDocument(document).nodes.get(id);
  if (!id || !canvasCloseTargets(document, sourceId).some((item) => item.id === id) || node?.props.hidden) return null;
  const { flow } = workflowContext(document);
  const presentation = node.type === 'BottomSheet'
    ? modalPresentationDocument(document, id)
    : updateComponent(document, flow.id, { props: { initialStepId: id } });
  return { id: `canvas:${id}`, name: node.name, document: presentation, packageCount: Object.keys(document.products).length, local: true };
}

export function modalPresentationDocument(document, id) {
  const node = indexDocument(document).nodes.get(id);
  return node?.type === 'BottomSheet' ? { ...document, root: component(`${id}/presentation`, 'Screen', node.name, {}, [node]), settings: { presentationSurfaceId: id } } : null;
}

export function createRetentionModal(document, sourceId, blank = false) {
  const id = crypto.randomUUID(), names = new Set([...indexDocument(document).nodes.values()].map((node) => node.name));
  let name = '挽留弹窗', number = 2;
  while (names.has(name)) name = `挽留弹窗 ${number++}`;
  const text = (key, value, props = {}) => component(`${id}/${key}`, 'Text', value, { text: value, textAlign: 'center', ...props });
  const button = (key, value, props = {}) => component(`${id}/${key}`, 'Button', value, { action: { action: 'CloseSheet' }, paddingVertical: 12, ...props }, [text(`${key}/label`, value)]);
  const node = component(id, 'BottomSheet', name, { presentation: 'overlay', retentionScene: true, background: '#ffffff', radius: 8, gap: 16, paddingHorizontal: 24, paddingVertical: 24 }, blank ? [] : [
    text('title', '离开前，看看这份专属优惠', { fontSize: 22, fontWeight: 700 }),
    component(`${id}/image`, 'Image', '优惠礼盒', { src: '/ht-retention-gift.png', heightMode: 'fixed', height: 150, objectFit: 'contain' }),
    text('content', '为你保留的会员权益', { fontSize: 15, color: '#62626e' }),
    button('continue', '继续了解', { background: '#ff8600', color: '#ffffff', radius: 8 }),
    button('dismiss', '暂时离开', { action: { action: 'Dismiss' }, color: '#686875' }),
  ]);
  const next = insertComponent(document, document.root.id, node);
  return { document: bindCloseTarget(next, sourceId, id), id };
}

export function importCloseTarget(document, sourceId, source, nodeId) {
  const chosen = indexDocument(source).nodes.get(nodeId);
  if (!chosen || !['Screen', 'BottomSheet'].includes(chosen.type)) return { document, error: '请选择页面或弹窗' };
  // Import is explicitly a copy. Existing canvas choices never enter this path.
  const fragment = copyFragment(source, nodeId);
  if (chosen.type === 'Screen') {
    fragment.roots = [component(crypto.randomUUID(), 'BottomSheet', `${chosen.name} · 弹窗`, { presentation: 'overlay', retentionScene: true, background: '#ffffff', radius: 8, paddingVertical: 20, paddingHorizontal: 20, gap: 12 }, fragment.roots[0].children)];
  }
  const result = pasteFragment(document, document.root.id, fragment);
  const id = result.ids[0];
  if (!id) return { document, error: '无法复制该内容' };
  return { document: bindCloseTarget(result.document, sourceId, id), id };
}

export function removeCanvasModal(document, id) {
  if (indexDocument(document).nodes.get(id)?.type !== 'BottomSheet') return document;
  let next = removeComponent(document, id);
  const bindings = { ...next.settings?.closeTargetsByScreen };
  for (const [source, target] of Object.entries(bindings)) if (target === id) bindings[source] = '';
  next = { ...next, settings: { ...next.settings, closeTargetsByScreen: bindings } };
  for (const node of indexDocument(next).nodes.values()) if (node.props.action?.action === 'OpenSheet' && node.props.action.actionPage === id) next = updateComponent(next, node.id, { props: { action: { action: 'None' } } });
  return next;
}
