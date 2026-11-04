import {interpolateVariables} from './textVariables.js';

export function safeImageSource(value){
  if(typeof value!=='string')return '';
  const url=value.trim();
  if(/^\/(?!\/)/.test(url)||/^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml)[;,]/i.test(url))return url;
  try{const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password?url:'';}catch{return '';}
}

export function imageSources(props,document,packageNode,timer,runtime){
  const resolve=value=>safeImageSource(interpolateVariables(value,document,packageNode,timer,runtime));
  const fallback=resolve(props.src);
  return props.imageSource==='variable'?{src:resolve(props.imageVariable)||fallback,fallback}:{src:fallback,fallback:''};
}

export function imageVariableOptions(document){
  return (document.logic?.variables??[]).filter(item=>item.key&&(!item.type||item.type==='string')).map(item=>[`{{ business.${item.key} }}`,item.label?`${item.label}（${item.key}）`:item.key]);
}
