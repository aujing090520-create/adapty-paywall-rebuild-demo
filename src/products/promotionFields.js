const discounted={totalPrice:'¥{优惠总价}',monthlyPrice:'¥{优惠月价}/月',productInfo:'{优惠商品信息}'};

export function promotionFieldPreview(parameter,fallback,pricing) {
  if(!pricing)return fallback;
  if(pricing.phase==='discount')return discounted[parameter]??fallback;
  if(parameter==='productLabel'&&pricing.hideLabel!==false)return '';
  if(['totalReferencePrice','monthlyReferencePrice'].includes(parameter)&&pricing.hideReference!==false)return '';
  if(parameter==='savings'&&pricing.hideSavings!==false)return '';
  return fallback;
}

export function promotionVariableValues(values,pricing) {
  if(!pricing)return values;
  const total=pricing.phase==='discount'?'¥{优惠总价}':'¥{总价}';
  return {...values,
    'product.price':total,
    'product.price_per_month':pricing.productType==='lifetime'?total:pricing.phase==='discount'?'¥{优惠月价}':'¥{月价}',
    'product.price_per_period':pricing.productType==='lifetime'?total:`${total}/{SKU时长}`,
    'product.original_price':promotionFieldPreview('totalReferencePrice','{总价}',pricing),
    'product.label':promotionFieldPreview('productLabel','{商品标签}',pricing),
    'product.info':promotionFieldPreview('productInfo','{商品信息}',pricing),
    'product.savings':promotionFieldPreview('savings','节省{节省比例}%',pricing),
  };
}
