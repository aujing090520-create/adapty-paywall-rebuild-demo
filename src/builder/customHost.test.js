import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('bundle host serves encoded relative assets with isolated headers, never fetches missing or foreign files',async()=>{
  const handlers={},cacheData=new Map(),replies=[];
  const caches={keys:async()=>[...cacheData.keys()],async open(name){if(!cacheData.has(name))cacheData.set(name,new Map());const data=cacheData.get(name);return {put:async(key,response)=>data.set(String(key),response),match:async(key)=>data.get(String(key))?.clone()};},delete:async(name)=>cacheData.delete(name)};
  const self={location:{origin:'https://demo.test'},clients:{claim:async()=>{}},skipWaiting(){},addEventListener:(type,handler)=>{handlers[type]=handler;}};
  vm.runInNewContext(await readFile(new URL('../../public/custom-component/sw.js',import.meta.url),'utf8'),{self,caches,URL,Headers,Response});
  const id='a'.repeat(64),files={'index.html':new TextEncoder().encode('<h1>测试</h1>'),'assets/图#1.png':new Uint8Array([1,2,3])};let pending;
  handlers.message({data:{type:'install-bundle',id,files},source:{url:'https://demo.test/'},ports:[{postMessage:(value)=>replies.push(value)}],waitUntil:(promise)=>{pending=promise;}});await pending;assert.equal(replies[0].ok,true);
  const request=async(path)=>{let response;handlers.fetch({request:{url:`https://demo.test/custom-component/bundles/${id}/${path}`},respondWith:(promise)=>{response=promise;}});return response;};
  const html=await request('index.html');assert.equal(html.headers.get('access-control-allow-origin'),'*');assert.match(html.headers.get('content-security-policy'),/form-action 'none'/);assert.match(html.headers.get('content-security-policy'),/frame-src 'none'/);assert.ok(!html.headers.get('content-security-policy').includes("script-src 'unsafe-inline'"));assert.equal(await html.text(),'<h1>测试</h1>');
  const image=await request('assets/%E5%9B%BE%231.png');assert.equal(image.headers.get('content-type'),'image/png');assert.equal((await image.arrayBuffer()).byteLength,3);assert.equal((await request('missing.js')).status,404);
  handlers.message({data:{type:'install-bundle',id,files:{'index.html':new Uint8Array()}},source:{url:'https://demo.test/'},ports:[{postMessage:(value)=>replies.push(value)}],waitUntil:(promise)=>{pending=promise;}});await pending;
  assert.equal(replies.at(-1).ok,true);assert.equal(await (await request('index.html')).text(),'<h1>测试</h1>');
  let intercepted=false;handlers.fetch({request:{url:'https://other.test/custom-component/bundles/'+id+'/index.html'},respondWith(){intercepted=true;}});assert.equal(intercepted,false);
  const before=cacheData.size;handlers.message({data:{type:'install-bundle',id:'b'.repeat(64),files},source:{url:'https://demo.test/custom-component/bundles/a/index.html'},ports:[{postMessage(){}}],waitUntil(){throw new Error('不应接受 iframe 写入');}});assert.equal(cacheData.size,before);
});

test('custom bridge exposes only read-only context subscriptions and currency formatting, with source/id checks',async()=>{
  const handlers={},messages=[],parent={postMessage:(message)=>messages.push(message)},window={};
  const id='a'.repeat(64),document={body:{getBoundingClientRect:()=>({height:125})}};
  vm.runInNewContext(await readFile(new URL('../../public/custom-component/bridge.js',import.meta.url),'utf8'),{window,parent,document,location:{pathname:`/custom-component/bundles/${id}/index.html`},Intl,Promise,Set,ResizeObserver:class{observe(){}},addEventListener:(type,handler)=>{handlers[type]=handler;}});
  assert.equal(messages[0].type,'ready');assert.equal(window.RC.purchase,undefined);assert.equal(window.RC.selectPackage,undefined);assert.equal(Object.isFrozen(window.RC),true);
  let seen;const stop=window.RC.onContextChange((ctx)=>{seen=ctx;});const pending=window.RC.getContext(),context={package:{identifier:'annual'},device_meta:{locale:'zh-CN'}};
  handlers.message({source:{},data:{channel:'ht-custom-preview',id,type:'context',context}});assert.equal(seen,undefined);
  handlers.message({source:parent,data:{channel:'ht-custom-preview',id,type:'context',context}});assert.equal(await pending,context);assert.equal(seen,context);
  assert.equal(window.RC.utils.formatPrice({amount:488,currency:'CNY'},'zh-CN'),'¥488.00');assert.equal(window.RC.utils.formatPrice(null,'zh-CN'),'');
  stop();handlers.message({source:parent,data:{channel:'ht-custom-preview',id,type:'context',context:{package:null}}});assert.equal(seen,context);handlers.DOMContentLoaded();assert.equal(messages.at(-1).height,125);
});
