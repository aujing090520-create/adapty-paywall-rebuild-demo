export const PRODUCT_ARRANGEMENTS = {
  horizontal: [{ key: 'priceOrder', label: '价格与优惠', options: [['source', '沿用模板'], ['price-first', '价格在上，优惠在下'], ['offer-first', '优惠在上，价格在下']] }],
  standard: [
    { key: 'contentAlign', label: '卡片内容对齐', options: [['source', '沿用模板'], ['center', '居中'], ['left', '居左']] },
    { key: 'priceOrder', label: '价格区与说明区', options: [['source', '沿用模板'], ['price-first', '价格在上，说明在下'], ['offer-first', '说明在上，价格在下']] },
  ],
  compact: [
    { key: 'priceSide', label: '名称与价格分区', options: [['source', '沿用模板'], ['right', '名称居左，价格居右'], ['left', '价格居左，名称居右']] },
    { key: 'referenceOrder', label: '价格说明顺序', options: [['source', '沿用模板'], ['main-first', '主价格在上'], ['reference-first', '参考价在上']] },
  ],
  vertical: [{ key: 'cardContentLayout', label: '商品行结构', options: [['source', '沿用模板'], ['standard', '名称与价格分列'], ['radio-stacked', '选择标记与纵排价格'], ['split-summary', '名称说明居左，价格居右']] }],
  'info-row': [
    { key: 'priceAlign', label: '右侧价格区', options: [['source', '沿用模板'], ['start', '顶部对齐'], ['center', '垂直居中'], ['end', '底部对齐']] },
    { key: 'markerSide', label: '选择标记', options: [['source', '沿用模板'], ['leading', '放在名称左侧'], ['trailing', '放在价格右侧']] },
  ],
};

export function productArrangement(config, layout) {
  const saved = config.productArrangements?.[layout] ?? {};
  return Object.fromEntries((PRODUCT_ARRANGEMENTS[layout] ?? []).map(({ key, options }) => [key, options.some(([value]) => saved[key] === value) ? saved[key] : 'source']));
}

export function updateProductArrangement(config, layout, key, value) {
  const field = PRODUCT_ARRANGEMENTS[layout]?.find((item) => item.key === key);
  if (!field?.options.some(([option]) => option === value)) return config;
  return { ...config, productArrangements: { ...config.productArrangements, [layout]: { ...config.productArrangements?.[layout], [key]: value } } };
}
