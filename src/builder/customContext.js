import {productPriceFields,skuById} from '../productPricing.js';

export function demoPrice(value){
  const match=/^(¥|￥|\$|€|£)\s*([\d,]+(?:\.\d+)?)$/.exec(String(value??'').trim());
  if(!match)return null;
  const amount=Number(match[2].replaceAll(',',''));
  return Number.isFinite(amount)?{amount,currency:{'¥':'CNY','￥':'CNY','$':'USD','€':'EUR','£':'GBP'}[match[1]]}:null;
}
export function customContext(document,packages,owned,selected){
  const mapped=packages.map((node)=>{
    const row=document.products[node.props.dataKey]??{},fields=productPriceFields(row),sku=skuById(row.skuId),price=demoPrice(fields.total);
    const name=sku?.displayName??row.name;
    return {identifier:node.id,...(name?{display_name:name}:{}),products:[{identifier:row.skuId??node.props.dataKey??node.id,...(name?{display_name:name}:{}),...(fields.months!==null?{is_subscription:fields.months>0}:{}),...(fields.months>0?{period:fields.months===12?'P1Y':`P${fields.months}M`}:{}),...(price?{price}:{})}]};
  });
  const find=(node)=>mapped.find((entry)=>entry.identifier===node?.id)??null;
  return {custom:{},offering:null,packages:mapped,package:find(owned??selected),selected_package:find(selected),inputs:{},device_meta:{is_preview:true,locale:'zh-CN',dark_mode:false,updated_at:Date.now()}};
}
