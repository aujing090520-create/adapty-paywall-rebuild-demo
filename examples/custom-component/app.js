(()=>{
  const name=document.getElementById('name'),price=document.getElementById('price'),button=document.getElementById('toggle'),details=document.getElementById('details');
  button.addEventListener('click',()=>{details.hidden=!details.hidden;button.textContent=details.hidden?'展开详情':'收起详情';button.setAttribute('aria-expanded',String(!details.hidden));});
  if(window.RC)window.RC.onContextChange((context)=>{const product=context.package?.products.find((item)=>item.price);name.textContent=product?.display_name??'商品';price.textContent=product?window.RC.utils.formatPrice(product.price,context.device_meta.locale):'请选择商品';});
})();
