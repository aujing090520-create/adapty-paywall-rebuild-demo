(()=>{
  'use strict';
  const id=/\/bundles\/([a-f0-9]{64})\//.exec(location.pathname)?.[1];
  if(!id)return;
  let context=null;const listeners=new Set(),waiting=[];
  const send=(type,payload)=>parent.postMessage({channel:'ht-custom-preview',id,type,...payload},'*');
  const api={onContextChange(listener){if(typeof listener!=='function')return()=>{};listeners.add(listener);if(context)listener(context);return()=>listeners.delete(listener);},getContext(){return context?Promise.resolve(context):new Promise((resolve)=>waiting.push(resolve));},utils:{formatPrice(price,locale){if(!price||!Number.isFinite(price.amount)||!price.currency)return '';try{return new Intl.NumberFormat(locale??'zh-CN',{style:'currency',currency:price.currency}).format(price.amount);}catch{return '';}}}};
  Object.defineProperty(window,'RC',{value:Object.freeze(api),writable:false,configurable:false});
  addEventListener('message',(event)=>{
    const data=event.data;if(event.source!==parent||data?.channel!=='ht-custom-preview'||data.id!==id||data.type!=='context')return;
    context=data.context;for(const resolve of waiting.splice(0))resolve(context);for(const listener of listeners)try{listener(context);}catch{}
  });
  const size=()=>send('height',{height:Math.ceil(document.body?.getBoundingClientRect().height??0)});
  addEventListener('DOMContentLoaded',()=>{new ResizeObserver(size).observe(document.body);size();});
  send('ready',{});
})();
