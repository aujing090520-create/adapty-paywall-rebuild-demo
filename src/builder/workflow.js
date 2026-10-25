import { component, indexDocument, updateComponent, removeComponent } from './componentDocument.js';
import { copyFragment, pasteFragment } from './componentOperations.js';
import { pageContext, flowInitialIndex } from './componentTree.js';

export const MAX_STEPS = 10;
export const auxiliaryScreen = (node) => node.props.auxiliary === true || /\/detail-screen-\d+$/.test(node.id);
export function workflowContext(document) {
  const { flow, pages } = pageContext(document);
  const steps = pages.filter((page) => !auxiliaryScreen(page));
  const initial = flow ? flow.children[flowInitialIndex(flow)] : document.root;
  return { flow, steps, initial: steps.find((page) => page.id === initial?.id) ?? steps[0], final: steps.at(-1) };
}
export function owningScreen(document, id) {
  const { nodes, parents } = indexDocument(document);
  let node = nodes.get(id);
  while (node && node.type !== 'Screen') node = nodes.get(parents.get(node.id));
  return node;
}
export function stepDestination(document, node) {
  const action = node.props.action;
  if (!action || !['NextScreen', 'OpenPage'].includes(action.action)) return null;
  if (action.action === 'NextScreen' && action.actionPage === null) return null;
  const { nodes, parents } = indexDocument(document);
  if (action.actionPage) return nodes.get(action.actionPage)?.type === 'Screen' ? nodes.get(action.actionPage) : null;
  if (action.action === 'OpenPage') return null;
  const current = owningScreen(document, node.id), flow = nodes.get(parents.get(current?.id));
  const steps = flow?.type === 'Flow' ? flow.children.filter((page)=>!auxiliaryScreen(page)) : [];
  return steps[steps.findIndex((page) => page.id === current?.id) + 1] ?? null;
}
export function workflowEdges(document) {
  return [...indexDocument(document).nodes.values()].flatMap((node) => {
    const target = stepDestination(document, node), source = owningScreen(document, node.id);
    if (node.props.action?.action !== 'NextScreen' || !target || !source || auxiliaryScreen(target) || auxiliaryScreen(source)) return [];
    const text = node.children.find((child) => child.type === 'Text')?.props.text;
    return [{ id: node.id, source: source.id, target: target.id, label: node.name && node.name !== '按钮' ? node.name : text || '按钮', auxiliary: auxiliaryScreen(target) }];
  });
}
export function workflowIssues(document) {
  const { steps, initial, final } = workflowContext(document);
  const issues = [];
  if (steps.length > MAX_STEPS) issues.push('步骤数量超过10个');
  for (const node of indexDocument(document).nodes.values()) {
    if (node.props.action?.action === 'NextScreen' && !stepDestination(document, node)) issues.push(`${node.name}：请选择有效的目标步骤`);
    if (['Package', 'PurchaseButton'].includes(node.type) && steps.some((page) => page.id === owningScreen(document, node.id)?.id && page.id !== final?.id)) issues.push(`${owningScreen(document, node.id).name}：商品和购买按钮只能位于最终步骤`);
  }
  if (steps.length > 1) {
    const edges = workflowEdges(document), reached = new Set([initial?.id]);
    for (let count = 0; count < steps.length; count++) for (const edge of edges) if (reached.has(edge.source)) reached.add(edge.target);
    if (!reached.has(final?.id)) issues.push('初始步骤尚未连接到最终购买步骤，请配置按钮的目标步骤');
  }
  return [...new Set(issues)];
}
function pinDestinations(document) {
  let next = document;
  for (const node of indexDocument(document).nodes.values()) {
    if (node.props.action?.action === 'NextScreen' && !node.props.action.actionPage) {
      const destination = stepDestination(document, node);
      if (destination) next = updateComponent(next, node.id, { props: { action: { ...node.props.action, actionPage: destination.id } } });
    }
  }
  return next;
}
function ensureFlow(document) {
  if (workflowContext(document).flow) return document;
  const root = document.root;
  return { ...document, root: component(crypto.randomUUID(), 'Screen', '付费墙', { gap: 0, background: 'transparent' }, [component(crypto.randomUUID(), 'Flow', '步骤', { gap: 0, initialStepId: root.id }, [root])]) };
}
export function setInitialStep(document, id) {
  const { flow, steps } = workflowContext(document);
  if (!flow || !steps.some((page) => page.id === id)) return document;
  const props = { ...flow.props, initialStepId: id, defaultIndex: undefined };
  return updateComponent(document, flow.id, { ...flow, props });
}
export function addWorkflowStep(document, { source, screenId, beforeId, afterId } = {}) {
  if (workflowContext(document).steps.length >= MAX_STEPS) return { document, error: '最多支持10个步骤' };
  let next = ensureFlow(pinDestinations(document));
  const { flow, steps, initial, final } = workflowContext(next);
  const before = beforeId ?? final?.id;
  const at = afterId ? flow.children.findIndex((page)=>page.id===afterId)+1 : Math.max(0, flow.children.findIndex((page) => page.id === before));
  let id;
  if (source) {
    const screen = indexDocument(source).nodes.get(screenId ?? workflowContext(source).initial?.id);
    if (screen?.type !== 'Screen') return { document, error: '请选择有效的来源屏幕' };
    let explicitSource=source;
    for(const item of indexDocument(source).nodes.values())if(item.type==='Package'&&!item.props.dataKey&&source.products[item.id])explicitSource=updateComponent(explicitSource,item.id,{props:{dataKey:item.id}});
    const result = pasteFragment(next, flow.id, copyFragment(explicitSource, screen.id), at);
    next = result.document; id = result.ids[0];
    if (!id) return { document, error: '无法导入该屏幕，原内容保留' };
  } else {
    const names = new Set(flow.children.map((page) => page.name));
    let number = 1; while (names.has(`屏幕 ${number}`)) number++;
    const screen = component(crypto.randomUUID(), 'Screen', `屏幕 ${number}`, { background: '#ffffff', gap: 16, paddingVertical: 20, paddingHorizontal: 20 }, []);
    id = screen.id;
    next = updateComponent(next, flow.id, { children: [...flow.children.slice(0, at), screen, ...flow.children.slice(at)] });
  }
  // Inserting an intro before the current initial step starts the flow there.
  next = setInitialStep(next, before === initial?.id || steps.length === 1 ? id : initial.id);
  return { document: next, id };
}
export function moveWorkflowStep(document, id, direction) {
  const prepared = pinDestinations(document), { flow, steps, initial } = workflowContext(prepared);
  const at = steps.findIndex((page) => page.id === id), to = at + direction;
  if (!flow || at < 0 || to < 0 || to >= steps.length) return document;
  const reordered = [...steps]; [reordered[at], reordered[to]] = [reordered[to], reordered[at]];
  let index = 0;
  return setInitialStep(updateComponent(prepared, flow.id, { children: flow.children.map((page) => auxiliaryScreen(page) ? page : reordered[index++]) }), initial.id);
}
export function duplicateWorkflowStep(document, id) {
  const { initial } = workflowContext(document);
  const result = addWorkflowStep(document, { source: document, screenId: id, afterId: id });
  if (result.id) result.document = setInitialStep(updateComponent(result.document, result.id, { name: `${indexDocument(document).nodes.get(id).name} 副本` }),initial.id);
  return result;
}
export function removeWorkflowStep(document, id) {
  const { flow, steps, initial } = workflowContext(document);
  if (!flow || steps.length < 2 || !steps.some((page) => page.id === id)) return document;
  const next = removeComponent(pinDestinations(document), id);
  return setInitialStep(next, initial.id === id ? steps.find((page) => page.id !== id).id : initial.id);
}
