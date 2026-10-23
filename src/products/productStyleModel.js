

export const PRODUCT_LAYOUTS = [
  { id: "horizontal", label: "横向卡片" },
  { id: "standard", label: "标准卡片" },
  { id: "compact", label: "紧凑横行" },
  { id: "vertical", label: "纵向列表" },
  { id: "info-row", label: "左右信息行" },
];

export function productLayout(config = {}, variant = "") {
  return config.packageLayout ?? ({ "blue-privilege": "horizontal", "membership-plans": "standard", "payment-recovery": "compact", "sku-sheet": "standard" }[config.productTemplate ?? variant] ?? "standard");
}

export const validHexColor = (value) => /^#[\da-fA-F]{6}$/.test(value);

export const productGradient = (colors, fallback) => `linear-gradient(90deg, ${(Array.isArray(colors) && colors.length === 3 ? colors : fallback).map((color, index) => validHexColor(color) ? color : fallback[index]).join(", ")})`;

export const PRODUCT_PART_DEFAULT_SIZES = { name: 14, price: 18, reference: 10, monthly: 11, supporting: 11, saving: 10, save: 10, badge: 11 };

export const HT_PRODUCT_DESIGN_DEFAULTS = {
  "blue-privilege": { parts: { name: 12, price: 18, reference: 14, monthly: 14, supporting: 14, saving: 12, save: 12, badge: 13 }, frame: { planHeight: 147, planPaddingTop: 20, planPaddingRight: 2, planPaddingBottom: 8, planPaddingLeft: 2 } },
  "membership-plans": { parts: { name: 12, price: 20, reference: 14, monthly: 14, supporting: 14, saving: 12, save: 12, badge: 13 }, frame: { planHeight: 150, planPaddingTop: 10, planPaddingRight: 4, planPaddingBottom: 6, planPaddingLeft: 4 } },
  "payment-recovery": { parts: { name: 17, price: 17, reference: 12, monthly: 17, supporting: 12, saving: 12, save: 10, badge: 10 }, frame: { planHeight: 73, planPaddingTop: 8, planPaddingRight: 12, planPaddingBottom: 8, planPaddingLeft: 12 } },
  "sku-sheet": { parts: { name: 12, price: 18, reference: 14, monthly: 14, supporting: 12, saving: 12, save: 12, badge: 13 }, frame: { planHeight: 147, planPaddingTop: 10, planPaddingRight: 4, planPaddingBottom: 6, planPaddingLeft: 4 } },
};

export function productFontSize(config, value) {
  return HT_PRODUCT_DESIGN_DEFAULTS[config.productTemplate] ? `${Number(value) * 100 / 390}cqw` : `${value}px`;
}

export const PRODUCT_PARTS = [
  ["name", "商品名称"], ["price", "主价格"], ["reference", "参考价"], ["monthly", "月均价"],
  ["supporting", "辅助文案"], ["saving", "优惠信息"], ["save", "SAVE 文案"], ["badge", "商品角标"],
  ["secondaryName", "副名称"], ["billing", "计费说明"], ["marker", "选择标记"], ["durationUnit", "期限单位"],
];

export function productPartStyle(config, part) {
  const value = config.productPartStyles?.[part] ?? {};
  return {
    ...(Number(value.fontSize) > 0 ? { fontSize: productFontSize(config, value.fontSize) } : {}),
    ...(validHexColor(value.color) ? { color: value.color } : {}),
  };
}

export function packagePartStyle(config, index, part) {
  return productPartStyle({ ...config, productPartStyles: config.packagePartStyles?.[index] }, part);
}
