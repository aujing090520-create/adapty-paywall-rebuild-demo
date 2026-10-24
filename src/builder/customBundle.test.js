import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {zipSync,strToU8} from 'fflate';
import {readCustomZip} from './customBundle.js';
import {clearCustomBundles} from './customStorage.js';
import {customContext,demoPrice} from './customContext.js';
import {component} from './componentDocument.js';

test('custom ZIP validates the published resource limits and keeps relative resources intact',async()=>{
  const bytes=zipSync({'index.html':strToU8('<html><script src="./app.js"></script></html>'),'app.js':strToU8('window.example=true;')});
  const result=await readCustomZip(bytes);assert.equal(result.count,2);assert.match(result.html,/\.\/app.js/);assert.ok(result.files['app.js']);
  await assert.rejects(readCustomZip(new Uint8Array(5*1024*1024+1)),/5 MiB/);
  await assert.rejects(readCustomZip(zipSync({'not-index.html':strToU8('x')})),/index.html/);
  await assert.rejects(readCustomZip(zipSync({'index.html':strToU8('x'),'../app.js':strToU8('x')})),/不安全/);
  for(const path of ['a/./app.js','a//app.js'])await assert.rejects(readCustomZip(zipSync({'index.html':strToU8('x'),[path]:strToU8('x')})),/不安全/);
  await assert.rejects(readCustomZip(zipSync({'index.html':strToU8('x'),'nested.zip':strToU8('x')})),/嵌套/);
  await assert.rejects(readCustomZip(zipSync({'index.html':new Uint8Array(100000)})),/压缩比/);
  const many=Object.fromEntries(Array.from({length:201},(_,i)=>[i?'file-'+i:'index.html',strToU8('x')]));await assert.rejects(readCustomZip(zipSync(many,{level:0})),/200/);
  const example=await readCustomZip(new Uint8Array(await readFile(new URL('../../public/custom-component/example.zip',import.meta.url))));assert.equal(example.count,2);
});
test('custom component context uses the same owning/selected package prices and never invents an Offering',()=>{
  const a=component('a','Package','月度',{dataKey:'a'}),b=component('b','Package','年度',{dataKey:'b'}),doc={products:{a:{skuId:'DEMO-BLUE-MONTH'},b:{skuId:'DEMO-BLUE-YEAR'}}};
  const outside=customContext(doc,[a,b],null,b);assert.equal(outside.package.identifier,'b');assert.deepEqual(outside.package.products[0].price,{amount:488,currency:'CNY'});assert.equal(outside.package.products[0].period,'P1Y');assert.equal(outside.offering,null);
  const inside=customContext(doc,[a,b],a,b);assert.equal(inside.package.identifier,'a');assert.equal(inside.selected_package.identifier,'b');assert.equal(inside.package.products[0].period,'P1M');
  assert.equal(customContext({products:{}},[],null,null).package,null);assert.equal(demoPrice('未配置'),null);assert.equal(demoPrice('9.99'),null);
  assert.deepEqual(doc.products,{a:{skuId:'DEMO-BLUE-MONTH'},b:{skuId:'DEMO-BLUE-YEAR'}});
});
test('reset removes only this Demo custom bundle caches, not other origin resources',async()=>{
  const original=globalThis.caches,removed=[];globalThis.caches={keys:async()=>['other-app','ht-paywall-custom-v1-demo','ht-paywall-custom-v1-second'],delete:async(key)=>{removed.push(key);return true;}};
  try{await clearCustomBundles();assert.deepEqual(removed,['ht-paywall-custom-v1-demo','ht-paywall-custom-v1-second']);}finally{globalThis.caches=original;}
});
