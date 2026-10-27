export const PRICE_DISPLAY_MODES = [
  { id: "0", label: "仅展示月价格" },
  { id: "1", label: "仅展示总价格" },
  { id: "3", label: "总价／月价划线" },
  { id: "4", label: "总价划线" },
  { id: "6", label: "展示月价划线" },
  { id: "7", label: "总价／月价划线显眼版" },
];

// Local demo records stand in for the SKU service; IDs are intentionally not production IDs.
export const DEMO_SKUS = [
  { id: "DEMO-BLUE-MONTH", label: "蓝色特权 · 1个月", displayName: "1个月", months: 1, total: "¥78", monthly: "¥78/月" },
  { id: "DEMO-BLUE-YEAR", label: "蓝色特权 · 12个月", displayName: "12个月", months: 12, total: "¥488", monthly: "¥40.67/月", copy: { savingCopy: "节省 48%", badgeText: "🔥 30% OFF" } },
  { id: "DEMO-BLUE-LIFETIME", label: "蓝色特权 · 终身", displayName: "终身", months: 0, total: "¥698", referenceTotal: "¥1698", copy: { savingCopy: "立减¥1000", saveCopy: "永久会员权益" } },
  { id: "DEMO-MEMBER-MONTH", label: "会员套餐 · 1个月", displayName: "1个月", months: 1, total: "¥78", monthly: "¥78/月" },
  { id: "DEMO-MEMBER-YEAR", label: "会员套餐 · 12个月", displayName: "12个月", months: 12, total: "¥488", monthly: "¥40.67/月", copy: { supportingCopy: "节省48%", badgeText: "最受欢迎" } },
  { id: "DEMO-MEMBER-LIFETIME", label: "会员套餐 · 终身", displayName: "终身", months: 0, total: "¥998", copy: { saveCopy: "永久会员权益" } },
  { id: "DEMO-RECOVERY-YEAR", label: "支付未完成 · 1年", displayName: "1年会员", months: 12, total: "¥338", monthly: "¥28.17/月", copy: { saveCopy: "新用户立省 64%", badgeText: "30% OFF" } },
  { id: "DEMO-RECOVERY-MONTH", label: "支付未完成 · 1个月", displayName: "1个月会员", months: 1, total: "¥78", monthly: "¥78/月" },
  { id: "DEMO-SKU-YEAR", label: "SKU 半窗 · 12个月", displayName: "12个月", months: 12, total: "¥338", monthly: "¥28.17/月", referenceTotal: "¥488" },
  { id: "DEMO-SKU-LIFETIME", label: "SKU 半窗 · 终身", displayName: "终身", months: 0, total: "¥698", referenceTotal: "¥1198", copy: { badgeText: "sku 折扣 EN" } },
  { id: "DEMO-CREDIT-25", label: "点数 · 25 点（一次性）", displayName: "25 点", months: 0, total: "$2.99" },
  { id: "DEMO-CREDIT-50", label: "点数 · 50 点（一次性）", displayName: "50 点", months: 0, total: "$9.99" },
  { id: "DEMO-CREDIT-100", label: "点数 · 100 点（一次性）", displayName: "100 点", months: 0, total: "$17.99" },
  { id: "DEMO-CREDIT-250", label: "点数 · 250 点（一次性）", displayName: "250 点", months: 0, total: "$24.99" },
  { id: "DEMO-CREDIT-500", label: "点数 · 500 点（一次性）", displayName: "500 点", months: 0, total: "$39.99" },
];

const templateSkus = {
  "blue-privilege": ["DEMO-BLUE-MONTH", "DEMO-BLUE-YEAR", "DEMO-BLUE-LIFETIME"],
  "membership-plans": ["DEMO-MEMBER-MONTH", "DEMO-MEMBER-YEAR", "DEMO-MEMBER-LIFETIME"],
  "payment-recovery": ["DEMO-RECOVERY-YEAR", "DEMO-RECOVERY-MONTH"],
  "sku-sheet": ["DEMO-SKU-YEAR", "DEMO-SKU-LIFETIME"],
};

export const templateSkuId = (variant, index) => templateSkus[variant]?.[index] ?? "";
export const skuById = (id) => DEMO_SKUS.find((sku) => sku.id === id);
export const skuCopy = (id) => ({ supportingCopy: "", savingCopy: "", saveCopy: "", badgeText: "", ...skuById(id)?.copy });

const monthlyText = (value = "") => /\/\s*月|每月|per\s*month/i.test(value);

export function billingMonths(row) {
  const source = row.skuId ? skuById(row.skuId) : row;
  if (source?.period?.count > 0) return source.period.count * ({ year: 12, month: 1, week: 12 / 52 }[source.period.unit] ?? 0) || null;
  if (row.skuId) return source?.months ?? null;
  if (row.billingMonths === 0 || /终身|永久|lifetime/i.test(row.name ?? "")) return 0;
  if (Number(row.billingMonths) > 0) return Number(row.billingMonths);
  const years = (row.name ?? "").match(/(\d+)\s*年/);
  if (years) return Number(years[1]) * 12;
  const months = (row.name ?? "").match(/(\d+)\s*个?月/);
  return months ? Number(months[1]) : null;
}

function monthlyFromTotal(total, months) {
  if (!total || !months) return "";
  const match = total.match(/^([^\d]*)([\d,]+(?:\.\d+)?)([^\d]*)$/);
  if (!match || match[3].trim()) return "";
  const amount = Number(match[2].replaceAll(",", ""));
  if (!Number.isFinite(amount)) return "";
  const value = Math.round(amount / months * 100) / 100;
  return `${match[1]}${Number.isInteger(value) ? value : value.toFixed(2)}/月`;
}

export function productPriceFields(row) {
  if (row.skuId) {
    const sku = skuById(row.skuId);
    const reference = validReferencePrice(sku?.total, sku?.referenceTotal);
    const months = billingMonths(row);
    return { total: sku?.total ?? "", monthly: sku?.monthly ?? monthlyFromTotal(sku?.total, months), referenceTotal: row.showReferencePrice === false ? "" : reference, referenceMonthly: row.showReferencePrice === false ? "" : monthlyFromTotal(reference, months), months };
  }
  const months = billingMonths(row);
  const total = row.totalPrice ?? (monthlyText(row.price) ? (months === 1 ? row.price.replace(/\/\s*月.*/, "") : "") : row.price ?? "");
  const monthly = months === 0 ? "" : row.monthlyPrice ?? (monthlyText(row.price) ? row.price : monthlyText(row.supportingCopy) ? row.supportingCopy : monthlyFromTotal(total, months));
  const referenceTotal = row.showReferencePrice === false ? "" : validReferencePrice(total, row.referenceTotalPrice ?? (monthlyText(row.referencePrice) ? "" : row.referencePrice ?? ""));
  const referenceMonthly = months === 0 || row.showReferencePrice === false ? "" : row.referenceMonthlyPrice ?? (monthlyText(row.referencePrice) ? row.referencePrice : monthlyFromTotal(referenceTotal, months));
  return { total, monthly, referenceTotal, referenceMonthly, months };
}

export function validReferencePrice(sale, reference) {
  const parse = (value) => String(value ?? '').match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  const a = parse(sale), b = parse(reference);
  return a && b && a[1].replace('￥', '¥') === b[1].replace('￥', '¥') && a[3] === b[3] && Number(b[2].replaceAll(',', '')) > Number(a[2].replaceAll(',', '')) ? reference : '';
}

export function verticalProductPriceFields(row) {
  const fields = productPriceFields(row);
  return { ...fields, saving: row.showSavingCopy && !fields.referenceTotal ? row.savingCopy ?? "" : "" };
}

export function resolveProductPrice(row, modeId) {
  const fields = productPriceFields(row);
  if (fields.months === 0) return { main: fields.total || "未关联 SKU", strike: fields.referenceTotal, missing: !fields.total, prominent: modeId === "7" };
  const monthlyMain = modeId === "0" || modeId === "4";
  const main = monthlyMain ? fields.monthly : fields.total;
  const strike = modeId === "4" ? fields.referenceTotal : ["3", "6", "7"].includes(modeId) ? fields.referenceMonthly : monthlyMain ? fields.referenceMonthly : fields.referenceTotal;
  return { main: main || (row.skuId ? "未关联 SKU" : `待配置${monthlyMain ? "月价" : "总价"}`), strike: strike && strike !== main ? strike : "", missing: !main, prominent: modeId === "7" };
}
