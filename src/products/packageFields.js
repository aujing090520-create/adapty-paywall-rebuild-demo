import { billingMonths, productPriceFields, resolveProductPrice, skuById, skuCopy } from '../productPricing.js';
import { productFieldPlaceholders } from './fieldPreview.js';

// 1 year = 12 months = 52 weeks, represented exactly without rounded month prices.
const periodUnits = { year: 156, month: 13, week: 3 };
export function productPeriod(row) {
  const source = row.skuId ? skuById(row.skuId) : row;
  if (!source) return null;
  if (source.period && periodUnits[source.period.unit] && Number.isInteger(source.period.count) && source.period.count > 0) return { ...source.period, units: periodUnits[source.period.unit] * source.period.count };
  const months = billingMonths(row);
  if (Number(months) > 0) return { unit: 'month', count: Number(months), units: 13 * Number(months) };
  return null;
}

export function priceAmount(value, currency) {
  const match = String(value ?? '').match(/^([^\d]*)(\d[\d,]*)(?:\.(\d+))?(?:\/.*)?$/);
  if (!match) return null;
  const fraction = match[3] ?? '';
  return { amount: BigInt(match[2].replaceAll(',', '') + fraction), scale: 10n ** BigInt(fraction.length), currency: currency ?? match[1].trim().replace('￥', '¥') };
}

export function productSavings(row, candidates) {
  const period = productPeriod(row), source = row.skuId ? skuById(row.skuId) : row;
  const price = priceAmount(productPriceFields(row).total, source?.currency);
  if (!period || !price || price.amount <= 0n) return '';
  const eligible = candidates.map((candidate) => {
    const source = candidate.skuId ? skuById(candidate.skuId) : candidate;
    return { row: candidate, period: productPeriod(candidate), price: priceAmount(productPriceFields(candidate).total, source?.currency) };
  }).filter((item) => item.period && item.price?.amount > 0n && item.price.currency === price.currency);
  if (!eligible.length) return '';
  const shortest = Math.min(...eligible.map((item) => item.period.units));
  if (period.units <= shortest) return '';
  const bases = eligible.filter((item) => item.period.units === shortest);
  const base = bases[0];
  // Conflicting shortest-period prices cannot silently pick a more flattering baseline.
  if (bases.some((item) => item.price.amount * base.price.scale !== base.price.amount * item.price.scale)) return '';
  const denominator = base.price.amount * price.scale * BigInt(period.units);
  const numerator = denominator - price.amount * base.price.scale * BigInt(shortest);
  const percent = numerator > 0n ? Number(numerator * 100n / denominator) : 0;
  return percent > 0 ? `节省${percent}%` : '';
}

const cache = new WeakMap();
function packagePeers(document, target) {
  let indexed = cache.get(document);
  if (!indexed) {
    indexed = [];
    const visit = (node, boundary = '', hidden = false) => {
      if (['Screen', 'BottomSheet', 'Tab', 'SwitchCase', 'CheckoutState'].includes(node.type)) boundary = node.id;
      hidden ||= Boolean(node.props.hidden);
      if (node.type === 'Package') indexed.push({ node, boundary, hidden });
      node.children.forEach((child) => visit(child, boundary, hidden));
    };
    visit(document.root); cache.set(document, indexed);
  }
  const entry = indexed.find((item) => item.node.id === target?.id);
  if (!entry) return [];
  return indexed.filter((item) => !item.hidden && item.boundary === entry.boundary && (item.node.props.group ?? item.node.id) === (target.props.group ?? target.id) && JSON.stringify(item.node.props.visibleWhen) === JSON.stringify(target.props.visibleWhen)).map((item) => document.products[item.node.props.dataKey ?? item.node.id]).filter(Boolean);
}

export function packageDisplayFields(document, packageNode, selected = false, fallbackKey) {
  if(document.productFieldPreview)return productFieldPlaceholders(packageNode,selected);
  const row = document.products[packageNode?.props.dataKey ?? fallbackKey] ?? {};
  const sku = skuById(row.skuId);
  if (row.skuId && !sku) return {};
  const copy = sku ? skuCopy(sku.id) : row;
  const value = sku ? { ...row, ...copy, name: sku.displayName } : row;
  const period = productPeriod(row), fields = productPriceFields(value);
  const lifetime = Boolean(sku?.lifetime || /终身|永久|lifetime/i.test(sku?.displayName ?? row.name ?? ''));
  const configuredLabel = selected ? row.selectedBadgeText ?? row.badgeText ?? copy.selectedBadgeText ?? copy.badgeText : row.badgeText ?? copy.badgeText;
  const badgeText = (packageNode?.props.productLabelEnabled ?? row.showBadge) === false ? '' : configuredLabel || (lifetime ? '物有所值' : period?.units === 156 ? '最受欢迎' : '');
  const info = lifetime ? '永久会员权益' : productSavings(row, packagePeers(document, packageNode));
  const price = resolveProductPrice(value, packageNode?.props.priceMode ?? '1');
  return { ...value, name: value.name, price: price.main, reference: price.strike, monthlyPrice: fields.monthly, referencePrice: fields.referenceTotal, badgeText, productInfo: info, savingCopy: lifetime ? '' : info, saveCopy: info, supportingCopy: /^节省\s*\d/.test(copy.supportingCopy ?? '') ? info : copy.supportingCopy };
}
