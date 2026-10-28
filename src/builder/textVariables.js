import { productPriceFields } from '../productPricing.js';
import { packageDisplayFields, productPeriod } from '../products/packageFields.js';
import { ITEM_VARIABLES,businessList } from './businessData.js';
import {businessValues} from './paywallLogic.js';
import {PRODUCT_VARIABLE_PLACEHOLDERS} from '../products/fieldPreview.js';

export const PRODUCT_TEXT_VARIABLES = [
  ['product.price', '商品总价'],
  ['product.price_per_month', '商品月均价'],
  ['product.price_per_period', '商品价格与周期'],
  ['product.period_in_months', '订阅月数'],
  ['product.period', '商品周期'],
  ['product.name', '商品名称'],
  ['product.original_price', '商品原价'],
  ['product.label', '配置商品标签'],
  ['product.info', '商品信息'],
  ['product.savings', '节省比例'],
  ['product.gift_count', '礼包数量'],
];
export const TIMER_TEXT_VARIABLES = [['days','天'],['hours','小时'],['minutes','分钟'],['seconds','秒']].flatMap(([unit,label])=>[[`count_${unit}_with_zero`,`${label}（补零）`],[`count_${unit}_without_zero`,`${label}（不补零）`]]);

export function variableValues(document, packageNode, timer, runtime={}) {
  const row = document.productFieldPreview?undefined:document.products[packageNode?.props.dataKey ?? packageNode?.id];
  const fields = row ? productPriceFields(row) : null;
  const display = row ? packageDisplayFields(document,packageNode) : {};
  const period = row ? productPeriod(row) : null;
  const values = document.productFieldPreview ? {...PRODUCT_VARIABLE_PLACEHOLDERS} : fields ? {
    'product.price': fields.total,
    'product.price_per_month': fields.months === 0 ? fields.total : fields.monthly.replace(/\/月$/, ''),
    'product.price_per_period': fields.total && fields.months > 0 ? `${fields.total}/${fields.months === 12 ? '年' : fields.months === 1 ? '月' : `${fields.months}个月`}` : fields.total,
    'product.period_in_months': fields.months === 0 || fields.months === null ? '' : String(fields.months),
    'product.period': period ? document.previewContentLocale==='en'?`${period.count} ${{year:'year',month:'month',week:'week'}[period.unit]}${period.count===1?'':'s'}`:document.previewContentLocale==='ar'?`${period.count} ${{year:'سنة',month:'شهر',week:'أسبوع'}[period.unit]}`:`${period.count}${{year:'年',month:'个月',week:'周'}[period.unit]}` : /终身|永久|lifetime/i.test(display.name??'')?({en:'Lifetime',ar:'مدى الحياة'}[document.previewContentLocale]??'终身'):'',
    'product.name': display.name,
    'product.original_price': fields.referenceTotal,
    'product.label': display.badgeText,
    'product.info': display.productInfo,
    'product.savings': display.savingCopy,
    'product.gift_count': String(businessList(document,'gifts',packageNode).length),
  } : Object.fromEntries(PRODUCT_TEXT_VARIABLES.map(([key]) => [key, '']));
  if (timer) for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
    values[`count_${unit}_with_zero`] = timer[unit];
    values[`count_${unit}_without_zero`] = timer[`${unit}WithoutZero`];
  }
  for(const [key,value] of Object.entries(businessValues(document,runtime)))if(key)values[`business.${key}`]=String(value??'');
  return values;
}

export function variableIssues(text, document, packageNode, timer, runtime) {
  const values=variableValues(document,packageNode,timer,runtime);
  const known=new Set([...PRODUCT_TEXT_VARIABLES,...TIMER_TEXT_VARIABLES,...ITEM_VARIABLES,...(document.logic?.variables??[]).map(item=>[`business.${item.key}`])].map(([key])=>key));
  return [...new Set([...String(text??'').matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)].map(match=>match[1].trim()))].filter(key=>!known.has(key)||values[key]===undefined||values[key]===null||values[key]==='').map(key=>({key,reason:known.has(key)?'暂无数据':'未知变量'}));
}

export function interpolateVariables(text, document, packageNode, timer, runtime) {
  const values=variableValues(document,packageNode,timer,runtime);
  return String(text ?? '').replace(/\{\{\s*([^{}]*?)\s*\}\}/g, (_, key) => values[key.trim()] ?? '');
}
