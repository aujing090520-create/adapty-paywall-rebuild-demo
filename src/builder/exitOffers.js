import { indexDocument, validDocument } from './componentDocument.js';
import { pageContext } from './componentTree.js';

// A saved Demo paywall and its packages form one local Offering, not a Sheet.
export function savedOfferings(records, currentPaywallId) {
  return records.filter((record) => record.paywall.id !== currentPaywallId && record.paywall.state !== 'Inactive' && validDocument(record.document)).map((record) => ({
    id: record.paywall.id, name: record.paywall.name, document: record.document,
    packageCount: [...indexDocument(record.document).nodes.values()].filter((node) => node.type === 'Package' && !node.props.hidden).length,
  }));
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
