import { productPriceFields } from '../productPricing.js';

export const PRODUCT_TEXT_VARIABLES = [
  ['product.price', '商品总价'],
  ['product.price_per_month', '商品月均价'],
  ['product.price_per_period', '商品价格与周期'],
  ['product.period_in_months', '订阅月数'],
];
export const TIMER_TEXT_VARIABLES = [['days','天'],['hours','小时'],['minutes','分钟'],['seconds','秒']].flatMap(([unit,label])=>[[`count_${unit}_with_zero`,`${label}（补零）`],[`count_${unit}_without_zero`,`${label}（不补零）`]]);

export function interpolateVariables(text, document, packageNode, timer) {
  const row = document.products[packageNode?.props.dataKey ?? packageNode?.id];
  const fields = row ? productPriceFields(row) : null;
  const values = fields ? {
    'product.price': fields.total,
    'product.price_per_month': fields.months === 0 ? fields.total : fields.monthly.replace(/\/月$/, ''),
    'product.price_per_period': fields.total && fields.months > 0 ? `${fields.total}/${fields.months === 12 ? '年' : fields.months === 1 ? '月' : `${fields.months}个月`}` : fields.total,
    'product.period_in_months': fields.months === 0 || fields.months === null ? '' : String(fields.months),
  } : Object.fromEntries(PRODUCT_TEXT_VARIABLES.map(([key]) => [key, '']));
  if (timer) for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
    values[`count_${unit}_with_zero`] = timer[unit];
    values[`count_${unit}_without_zero`] = timer[`${unit}WithoutZero`];
  }
  return String(text ?? '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (original, key) => values[key] ?? original);
}
