import { component, indexDocument, validDocument, insertComponent, updateComponent } from './componentDocument.js';
import { pageContext } from './componentTree.js';
import { createCatalogComponent } from './componentCatalog.js';
import { workflowContext, stepDestination } from './workflow.js';
import { copyFragment, pasteFragment } from './componentOperations.js';

// A saved Demo paywall and its packages form one local Offering, not a Sheet.
export function savedOfferings(records, currentPaywallId) {
  return records.filter((record) => record.paywall.id !== currentPaywallId && record.paywall.state !== 'Inactive' && validDocument(record.document)).map((record) => ({
    id: record.paywall.id, name: record.paywall.name, document: record.document,
    packageCount: Object.keys(record.document.products).length,
  }));
}

export function exitContentChoices(document) {
  const presentation = document.settings?.presentationSurfaceId;
  if (presentation) return [indexDocument(document).nodes.get(presentation)].filter(Boolean);
  return [...workflowContext(document).steps, ...[...indexDocument(document).nodes.values()].filter((node) => node.type === 'BottomSheet')];
}

export function createExitOffer(document, offeringId, surfaceId, selection, sourceId) {
  if (sourceId) {
    const source = workflowContext(document).steps.find((page) => page.id === sourceId && !page.props.hidden);
    if (!source) return null;
    const result = createExitOffer(document, offeringId, surfaceId, selection);
    if (!result) return null;
    const name = ['付费墙页面', '退出优惠'].includes(result.name) ? `${source.name} · 退出优惠` : result.name;
    const targetId = result.offerDocument.settings?.presentationSurfaceId ?? workflowContext(result.offerDocument).initial?.id;
    return { ...result, name, offerDocument: updateComponent(result.offerDocument, targetId, { name }), mainDocument: bindExitOffer({ ...result.mainDocument, settings: document.settings }, sourceId, offeringId) };
  }
  if (selection) return createSelectedExitOffer(document, offeringId, selection);
  let source = document;
  if (!surfaceId) {
    const launcher = createCatalogComponent('BottomSheet');
    const sheet = launcher.children.find((node) => node.type === 'BottomSheet');
    sheet.name = '退出优惠';
    source = insertComponent(document, pageContext(document).active.id, sheet);
    surfaceId = sheet.id;
  }
  const surface = indexDocument(source).nodes.get(surfaceId);
  if (surface?.type !== 'BottomSheet') return null;
  const clone = structuredClone(surface);
  const prepare = (node) => {
    if (node.props.action?.action === 'CloseSheet') node.props.action = { action: 'Dismiss' };
    if (node.id === `${surfaceId}/action` && node.name === '领取按钮' && (!node.props.action?.action || node.props.action.action === 'None')) {
      node.type = 'PurchaseButton'; node.props.action = { action: 'Purchase' };
    }
    if (node.id === `${surfaceId}/cancel` && node.type === 'Text') {
      const label = { ...structuredClone(node), id: `${node.id}/label`, props: { ...node.props, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, paddingVertical: 0, paddingHorizontal: 0, marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, marginVertical: 0, marginHorizontal: 0 } };
      node.type = 'Button'; node.name = node.props.text || node.name; node.props = { ...node.props, action: { action: 'Dismiss' } }; node.children = [label];
    }
    node.children.forEach(prepare);
  };
  prepare(clone);
  const remove = (node) => {
    if (node.id === surfaceId) return [];
    const children = node.children.flatMap(remove);
    if (node.type === 'Button' && node.props.action?.action === 'OpenSheet' && node.props.action.actionPage === surfaceId) {
      // Remove only the generated launcher, lifting any other nested Sheets intact.
      if (node.name === '打开底部弹层') return children.filter((child) => child.type !== 'Text');
      return [{ ...node, children, props: { ...node.props, action: { action: 'Dismiss' } } }];
    }
    return [{ ...node, children }];
  };
  const offerDocument = {
    version: document.version, templateId: document.templateId, products: structuredClone(document.products),
    ...(document.fonts ? { fonts: structuredClone(document.fonts) } : {}),
    settings: { presentationSurfaceId: clone.id },
    root: component(`${offeringId}/root`, 'Screen', clone.name, { background: 'transparent', gap: 0 }, [clone]),
  };
  return {
    name: clone.name, offerDocument,
    mainDocument: { ...document, root: remove(source.root)[0], settings: { ...document.settings, exitOfferOfferingId: offeringId } },
  };
}

function createSelectedExitOffer(document, offeringId, { source, nodeId } = {}) {
  if (!source) {
    const sheet = createCatalogComponent('BottomSheet').children.find((node) => node.type === 'BottomSheet');
    sheet.name = '退出优惠'; sheet.children = [];
    return { name: sheet.name, mainDocument: { ...document, settings: { ...document.settings, exitOfferOfferingId: offeringId } }, offerDocument: { version: document.version, templateId: 'blank', products: {}, settings: { presentationSurfaceId: sheet.id }, root: component(`${offeringId}/root`, 'Screen', sheet.name, { background: 'transparent', gap: 0 }, [sheet]) } };
  }
  if (!validDocument(source)) return null;
  const selected = indexDocument(source).nodes.get(nodeId);
  if (!selected || !['Screen', 'BottomSheet'].includes(selected.type)) return null;
  let prepared = source;
  for (const node of indexDocument(source).nodes.values()) {
    if (node.type === 'Package' && !node.props.dataKey && source.products[node.id]) prepared = updateComponent(prepared, node.id, { props: { dataKey: node.id } });
    if (node.props.action?.action === 'NextScreen' && node.props.action.actionPage !== null && !node.props.action.actionPage) {
      const target = stepDestination(source, node);
      if (target) prepared = updateComponent(prepared, node.id, { props: { action: { ...node.props.action, actionPage: target.id } } });
    }
  }
  const nodes = indexDocument(prepared).nodes;
  const chosen = nodes.get(nodeId), fragments = [], pending = [chosen], seen = new Set();
  while (pending.length) {
    const node = pending.shift();
    if (seen.has(node.id)) continue;
    for (const item of indexDocument({ root: node }).nodes.values()) seen.add(item.id);
    if (node.type === 'BottomSheet') {
      const converted = createExitOffer(prepared, `${offeringId}/source`, node.id);
      const fragment = copyFragment(converted.offerDocument, node.id);
      if (![...indexDocument({ root: node }).nodes.values()].some((item) => item.type === 'Package')) fragment.products = structuredClone(source.products);
      fragment.roots = [component(crypto.randomUUID(), 'Screen', node.name, { background: 'transparent', gap: 0 }, fragment.roots)];
      fragments.push(fragment);
    } else fragments.push(copyFragment(prepared, node.id));
    for (const item of indexDocument({ root: node }).nodes.values()) {
      const target = nodes.get(item.props.action?.actionPage);
      if (['OpenPage', 'NextScreen'].includes(item.props.action?.action) && target?.type === 'Screen' && !seen.has(target.id)) pending.push(target);
    }
  }
  const flow = component(`${offeringId}/flow`, 'Flow', '步骤', { gap: 0 }, []);
  const empty = { version: source.version, templateId: source.templateId, products: {}, root: component(`${offeringId}/root`, 'Screen', chosen.name, { background: 'transparent', gap: 0 }, [flow]) };
  const fragment = { roots: fragments.flatMap((item) => item.roots), products: Object.assign({}, ...fragments.map((item) => item.products)), fonts: fragments.flatMap((item) => item.fonts ?? []) };
  const copied = pasteFragment(empty, flow.id, fragment);
  if (!copied.ids.length) return null;
  const copiedNodes = indexDocument(copied.document).nodes, first = copiedNodes.get(copied.ids[0]);
  let offerDocument = copied.document;
  const originalPackages = fragment.roots.flatMap((root) => [...indexDocument({ root }).nodes.values()].filter((node) => node.type === 'Package'));
  const copiedPackages = [...copiedNodes.values()].filter((node) => node.type === 'Package');
  for (const [index, node] of copiedPackages.entries()) offerDocument = updateComponent(offerDocument, node.id, { props: { defaultSelected: originalPackages[index]?.props.defaultSelected ?? false } });
  if (copied.ids.length === 1) offerDocument = { ...offerDocument, root: indexDocument(offerDocument).nodes.get(first.id) };
  else offerDocument = updateComponent(offerDocument, flow.id, { props: { initialStepId: first.id } });
  if (chosen.type === 'BottomSheet') offerDocument = { ...offerDocument, settings: { presentationSurfaceId: first.children[0].id } };
  return { name: chosen.name, offerDocument, mainDocument: { ...document, settings: { ...document.settings, exitOfferOfferingId: offeringId } } };
}

export function exitOfferId(document, sourceId = exitOfferSource(document)?.id) {
  if (!workflowContext(document).steps.some((page) => page.id === sourceId && !page.props.hidden)) return '';
  const bindings = document.settings?.exitOffersByScreen ?? {};
  return Object.hasOwn(bindings, sourceId) ? bindings[sourceId] : sourceId === exitOfferSource(document)?.id ? document.settings?.exitOfferOfferingId ?? '' : '';
}

export function bindExitOffer(document, sourceId, offeringId) {
  return { ...document, settings: { ...document.settings, exitOffersByScreen: { ...document.settings?.exitOffersByScreen, [sourceId]: offeringId } } };
}

export function boundExitOfferIds(document) {
  return [...new Set(workflowContext(document).steps.map((page) => exitOfferId(document, page.id)).filter(Boolean))];
}

export function exitOfferTarget(document, offerings, currentPaywallId, sourceId) {
  const id = exitOfferId(document, sourceId);
  return offerings.find((offering) => offering.id === id && offering.id !== currentPaywallId && offering.packageCount > 0 && validDocument(offering.document)) ?? null;
}

export function exitOfferSource(document) {
  return workflowContext(document).steps.filter((page) => !page.props.hidden).at(-1) ?? null;
}

export function exitOfferConnection(document, offerings, currentPaywallId, sourceId = exitOfferSource(document)?.id) {
  const source = workflowContext(document).steps.find((page) => page.id === sourceId);
  const target = exitOfferTarget(document, offerings, currentPaywallId, sourceId);
  if (!source || !target) return null;
  const destination = workflowContext(target.document).initial ?? target.document.root;
  return {
    id: `exit-offer:${source.id}`, kind: 'exit', source: source.id, target: target.document.settings?.presentationSurfaceId ?? destination.id,
    targetOwner: target.id, label: '关闭页面', description: `关闭「${source.name}」 → ${target.name}`,
  };
}

export function exitOfferConnections(document, offerings, currentPaywallId) {
  return workflowContext(document).steps.map((page) => exitOfferConnection(document, offerings, currentPaywallId, page.id)).filter(Boolean);
}

export function isExitOfferStep(document, navigation = {}) {
  return exitOfferSource(document)?.id === pageContext(document, navigation).active.id;
}
