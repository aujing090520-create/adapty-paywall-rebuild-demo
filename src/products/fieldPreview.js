const documents=new WeakMap();
export function fieldPreviewDocument(document) {
  if(!document||document.productFieldPreview)return document;
  if(!documents.has(document))documents.set(document,{...document,productFieldPreview:true});
  return documents.get(document);
}

export function productFieldPlaceholders(packageNode,selected=false) {
  const mode=String(packageNode?.props.priceMode??'1');
  const monthly=['0','4'].includes(mode),monthlyReference=['0','3'].includes(mode);
  return {
    name:'{SKU时长}',price:monthly?'¥{月价}/月':'¥{总价}',
    reference:monthlyReference?'{月价}/月':'{总价}',
    monthlyPrice:'¥{月价}/月',referencePrice:'{总价}',
    badgeText:packageNode?.props.productLabelEnabled===false?'':selected?'{选中商品标签}':'{商品标签}',
    productInfo:'{商品信息}',savingCopy:'节省{节省比例}%',saveCopy:'{商品信息}',supportingCopy:'{辅助文案}',
  };
}

export const PRODUCT_VARIABLE_PLACEHOLDERS={
  'product.price':'¥{总价}','product.price_per_month':'¥{月价}',
  'product.price_per_period':'¥{总价}/{SKU时长}',
  'product.period_in_months':'{SKU时长}','product.period':'{SKU时长}','product.name':'{SKU时长}',
  'product.original_price':'{总价}','product.label':'{商品标签}',
  'product.info':'{商品信息}','product.savings':'节省{节省比例}%','product.gift_count':'{礼包数量}',
};
