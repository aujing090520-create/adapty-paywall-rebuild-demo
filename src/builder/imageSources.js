import {interpolateVariables} from './textVariables.js';

export function imageVariableName(value){
  return String(value??'').trim().replace(/^\{+\s*|\s*\}+$/g,'').trim().replace(/^business\./,'');
}
export function imageVariableToken(value){
  const key=imageVariableName(value);return key?`{{ business.${key} }}`:'';
}

export function safeImageSource(value){
  if(typeof value!=='string')return '';
  const url=value.trim();
  if(/^\/(?!\/)/.test(url)||/^data:image\/(png|jpeg|jpg|gif|webp|avif|svg\+xml)[;,]/i.test(url))return url;
  try{const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password?url:'';}catch{return '';}
}

export function imageSources(props,document,packageNode,timer,runtime){
  const resolve=value=>safeImageSource(interpolateVariables(value,document,packageNode,timer,runtime));
  const fallback=resolve(props.src);
  if(props.imageSource!=='variable')return {src:fallback,fallback:''};
  const key=imageVariableName(props.imageVariable);
  if(runtime?.$parameterPreview)return {src:'',fallback:'',parameter:key?`{${key}}`:'{图片参数}'};
  const src=runtime&&Object.hasOwn(runtime,`business:${key}`)?safeImageSource(runtime[`business:${key}`]):resolve(imageVariableToken(key));
  return {src:src||fallback,fallback};
}
