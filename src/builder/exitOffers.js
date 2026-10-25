import { component, indexDocument, validDocument, insertComponent } from './componentDocument.js';
import { pageContext } from './componentTree.js';
import { createCatalogComponent } from './componentCatalog.js';

// A saved Demo paywall and its packages form one local Offering, not a Sheet.
export function savedOfferings(records, currentPaywallId) {
  return records.filter((record) => record.paywall.id !== currentPaywallId && record.paywall.state !== 'Inactive' && validDocument(record.document)).map((record) => ({
    id: record.paywall.id, name: record.paywall.name, document: record.document,
    packageCount: Object.keys(record.document.products).length,
  }));
}

export function createExitOffer(document, offeringId, surfaceId) {
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

export function exitOfferTarget(document, offerings, currentPaywallId) {
  const id = document.settings?.exitOfferOfferingId;
  return offerings.find((offering) => offering.id === id && offering.id !== currentPaywallId && offering.packageCount > 0 && validDocument(offering.document)) ?? null;
}

export function isExitOfferStep(document, navigation = {}) {
  const { flow, active } = pageContext(document, navigation);
  if (!flow) return true;
  // HT auxiliary detail screens are navigation destinations, not funnel steps.
  const steps = flow.children.filter((page) => !/\/detail-screen-\d+$/.test(page.id) && !page.props.hidden);
  return steps.at(-1)?.id === active.id;
}
