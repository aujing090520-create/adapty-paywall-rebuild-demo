import {init,parse} from 'es-module-lexer/minimal';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
import {CUSTOM_CACHE_PREFIX} from './customStorage.js';

const types={html:'text/html',js:'text/javascript',mjs:'text/javascript',json:'application/json',css:'text/css',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',ogg:'audio/ogg'};
const text=new TextDecoder();
const dataUrl=(bytes,type)=>{
  if(typeof bytes==='string')bytes=new TextEncoder().encode(bytes);
  let binary='';for(let offset=0;offset<bytes.length;offset+=32768)binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));
  return `data:${type};base64,${btoa(binary)}`;
};

export async function createCustomPreviewDocument(files,{id,bridge,parseDocument=(source)=>new DOMParser().parseFromString(source,'text/html')}={}){
  await init();
  if(!files['index.html'])throw new Error('组件资源已丢失，请重新上传 ZIP');
  const origin='https://bundle.invalid',moduleId=(path)=>`@htzip/${id}/${path}`;
  const resolve=(reference,from)=>{
    const url=new URL(reference,new URL(from,origin));
    if(url.origin!==origin)throw new Error(`组件引用了未打包的外部资源：${reference}`);
    const path=decodeURIComponent(url.pathname.slice(1));
    if(!files[path])throw new Error(`ZIP 缺少资源：${path}`);
    return {path,hash:url.hash};
  };
  const cssCache=new Map();
  const assetUrl=(reference,from,ancestors=[])=>{
    if(!reference||reference.startsWith('#')||/^(data:|blob:)/i.test(reference))return reference;
    const {path,hash}=resolve(reference,from);
    if(path.endsWith('.css'))return cssUrl(path,ancestors)+hash;
    return dataUrl(files[path],types[path.split('.').pop().toLowerCase()]??'application/octet-stream')+hash;
  };
  const cssText=(source,path,ancestors=[])=>{
    const root=postcss.parse(source,{from:undefined});
    root.walkAtRules('import',(rule)=>{
      const value=valueParser(rule.params),entry=value.nodes.find((node)=>node.type!=='space'&&node.type!=='comment');
      if(!entry)return;
      const reference=entry.type==='function'&&entry.value==='url'?valueParser.stringify(entry.nodes).replace(/^(['"])(.*)\1$/,'$2'):entry.value;
      const url=assetUrl(reference,path,ancestors);
      if(entry.type==='function')entry.nodes=[{type:'string',quote:'"',value:url}];else {entry.type='string';entry.quote='"';entry.value=url;}
      rule.params=value.toString();
    });
    root.walkDecls((decl)=>{const value=valueParser(decl.value);value.walk((node)=>{if(node.type==='function'&&node.value==='url'){const reference=valueParser.stringify(node.nodes).replace(/^(['"])(.*)\1$/,'$2');node.nodes=[{type:'string',quote:'"',value:assetUrl(reference,path,ancestors)}];return false;}});decl.value=value.toString();});
    return root.toString();
  };
  const cssUrl=(path,ancestors=[])=>{
    if(cssCache.has(path))return cssCache.get(path);
    if(ancestors.includes(path))throw new Error(`CSS 循环引用：${path}`);
    const url=dataUrl(cssText(text.decode(files[path]),path,[...ancestors,path]),'text/css');cssCache.set(path,url);return url;
  };
  const requiredModules=new Set();
  const javascript=(source,path)=>{
    const edits=[];
    for(const item of parse(source)[0]){
      if(item.d===-2)throw new Error(`组件使用了未打包的 import.meta 资源路径：${path}`);
      if(!item.n)throw new Error(`组件包含动态生成的模块路径：${path}`);
      if(!item.n.startsWith('.')&&!item.n.startsWith('/'))throw new Error(`组件依赖未打包模块：${item.n}`);
      const target=resolve(item.n,path).path;
      if(!/\.(m?js|json)$/i.test(target))throw new Error(`模块类型暂不支持：${target}`);
      requiredModules.add(target);
      edits.push({start:item.s,end:item.e,value:item.d>=0?JSON.stringify(moduleId(target)):moduleId(target)});
    }
    for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);
    return source;
  };
  const imports={},moduleScripts=[];
  const document=parseDocument(text.decode(files['index.html']));
  document.querySelectorAll('base, link[rel="modulepreload"]').forEach((element)=>element.remove());
  const nonce=crypto.randomUUID().replaceAll('-','');
  for(const script of document.querySelectorAll('script')){
    const src=script.getAttribute('src');
    if(src==='/custom-component/bridge.js'){script.remove();continue;}
    if(script.type==='importmap')throw new Error('请将模块依赖打包进 ZIP，不使用额外 importmap');
    if(src){const path=resolve(src,'index.html').path;if(script.type==='module'){requiredModules.add(path);moduleScripts.push({script,path});}else script.src=dataUrl(javascript(text.decode(files[path]),path),'text/javascript');}
    else if(script.type==='module')script.textContent=javascript(script.textContent,'index.html');
    script.setAttribute('nonce',nonce);
  }
  for(const element of document.querySelectorAll('link[rel="stylesheet"][href]'))element.setAttribute('href',assetUrl(element.getAttribute('href'),'index.html'));
  for(const element of document.querySelectorAll('img[src],source[src],video[src],audio[src],track[src]'))element.setAttribute('src',assetUrl(element.getAttribute('src'),'index.html'));
  for(const element of document.querySelectorAll('[poster]'))element.setAttribute('poster',assetUrl(element.getAttribute('poster'),'index.html'));
  for(const element of document.querySelectorAll('[srcset]'))throw new Error(`请将 ${element.tagName.toLowerCase()} 的 srcset 资源打包为单一 src`);
  for(const element of document.querySelectorAll('style'))element.textContent=cssText(element.textContent,'index.html');
  for(const element of document.querySelectorAll('[style]'))element.setAttribute('style',cssText(`x{${element.getAttribute('style')}}`,'index.html').slice(2,-1));
  for(const path of requiredModules){imports[moduleId(path)]=dataUrl(path.endsWith('.json')?files[path]:javascript(text.decode(files[path]),path),path.endsWith('.json')?'application/json':'text/javascript');}
  for(const {script,path} of moduleScripts)script.src=imports[moduleId(path)];
  const policy=document.createElement('meta');policy.httpEquiv='Content-Security-Policy';policy.content=`default-src 'none'; script-src data: 'nonce-${nonce}'; style-src data: 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data:; connect-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const sdk=document.createElement('script');sdk.src=dataUrl(bridge,'text/javascript');sdk.setAttribute('data-bundle-id',id);sdk.setAttribute('nonce',nonce);
  const map=document.createElement('script');map.type='importmap';map.setAttribute('nonce',nonce);map.textContent=JSON.stringify({imports}).replaceAll('<','\\u003c');
  document.head.prepend(map);document.head.prepend(sdk);document.head.prepend(policy);
  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}

export async function loadCustomPreviewDocument(id,{signal}={}){
  if(!/^[a-f0-9]{64}$/.test(id))throw new Error('自定义组件记录无效，请重新上传 ZIP');
  const name=CUSTOM_CACHE_PREFIX+id;
  if(!(await caches.keys()).includes(name))throw new Error('组件资源已丢失，请重新上传 ZIP');
  const cache=await caches.open(name),files={},prefix=`/custom-component/bundles/${id}/`;
  for(const request of await cache.keys()){
    const url=new URL(request.url);if(!url.pathname.startsWith(prefix)||url.search)continue;
    const path=decodeURIComponent(url.pathname.slice(prefix.length));if(!path)continue;
    const response=await cache.match(request);files[path]=new Uint8Array(await response.arrayBuffer());
  }
  const response=await fetch('/custom-component/bridge.js',{signal,cache:'no-store'});
  if(!response.ok)throw new Error('组件通信脚本加载失败，请刷新重试');
  return createCustomPreviewDocument(files,{id,bridge:await response.text()});
}
