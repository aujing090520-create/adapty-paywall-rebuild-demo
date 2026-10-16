export const PRICE_DISPLAY_MODES = [
  { id: "0", label: "仅展示月价格" },
  { id: "1", label: "仅展示总价格" },
  { id: "3", label: "总价／月价划线" },
  { id: "4", label: "总价划线" },
  { id: "6", label: "展示月价划线" },
  { id: "7", label: "总价／月价划线显眼版" },
];

const monthlyText = (value = "") => /\/\s*月|每月|per\s*month/i.test(value);

export function billingMonths(row) {
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
  const months = billingMonths(row);
  const total = row.totalPrice ?? (monthlyText(row.price) ? (months === 1 ? row.price.replace(/\/\s*月.*/, "") : "") : row.price ?? "");
  const monthly = months === 0 ? "" : row.monthlyPrice ?? (monthlyText(row.price) ? row.price : monthlyText(row.supportingCopy) ? row.supportingCopy : monthlyFromTotal(total, months));
  const referenceTotal = row.showReferencePrice === false ? "" : row.referenceTotalPrice ?? (monthlyText(row.referencePrice) ? "" : row.referencePrice ?? "");
  const referenceMonthly = months === 0 || row.showReferencePrice === false ? "" : row.referenceMonthlyPrice ?? (monthlyText(row.referencePrice) ? row.referencePrice : monthlyFromTotal(referenceTotal, months));
  return { total, monthly, referenceTotal, referenceMonthly, months };
}

export function resolveProductPrice(row, modeId) {
  const fields = productPriceFields(row);
  if (fields.months === 0) return { main: fields.total || "待配置总价", strike: modeId === "0" || modeId === "1" ? "" : fields.referenceTotal, missing: !fields.total, prominent: modeId === "7" };
  const monthlyMain = modeId === "0" || modeId === "4";
  const main = monthlyMain ? fields.monthly : fields.total;
  const strike = modeId === "4" ? fields.total : ["3", "6", "7"].includes(modeId) ? fields.monthly : "";
  return { main: main || `待配置${monthlyMain ? "月价" : "总价"}`, strike: strike && strike !== main ? strike : "", missing: !main, prominent: modeId === "7" };
}
