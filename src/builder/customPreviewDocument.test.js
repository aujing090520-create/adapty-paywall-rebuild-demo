import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DOMParser} from 'linkedom';
import {readCustomZip} from './customBundle.js';
import {createCustomPreviewDocument,loadCustomPreviewDocument} from './customPreviewDocument.js';

const encode=(value)=>new TextEncoder().encode(value);
const decode=(url)=>Buffer.from(url.split(',')[1].split('#')[0],'base64').toString();
const options={id:'a'.repeat(64),bridge:'window.bridgeLoaded=true;',parseDocument:(source)=>new DOMParser().parseFromString(source,'text/html')};
const fixture=(files)=>Object.fromEntries(Object.entries(files).map(([path,value])=>[path,typeof value==='string'?encode(value):value]));

test('the existing uploaded example becomes a self-contained sandbox document without another upload or SW-controlled frame',async()=>{
  const {files}=await readCustomZip(new Uint8Array(await readFile(new URL('../../public/custom-component/example.zip',import.meta.url))));
  const html=await createCustomPreviewDocument(files,options),document=options.parseDocument(html);
  assert.equal(document.querySelector('h2').textContent,'商品');assert.equal(document.querySelector('button').textContent,'展开详情');
  assert.ok(document.querySelector('meta[http-equiv="Content-Security-Policy"]'));assert.match(document.querySelector('meta').content,/connect-src 'none'/);
  assert.match(document.querySelector('meta').content,/frame-src 'none'/);assert.match(document.querySelector('meta').content,/base-uri 'none'/);
  const sdk=document.querySelector('script[data-bundle-id]');assert.equal(sdk.dataset.bundleId,options.id);assert.equal(decode(sdk.src),options.bridge);
  const app=[...document.querySelectorAll('script[src]')].find((script)=>script!==sdk);assert.match(decode(app.src),/onContextChange/);assert.match(decode(app.src),/details.hidden/);
  assert.equal(document.querySelector('script[src="./app.js"]'),null);
});

test('nested CSS imports, images, fonts and inline styles resolve against their own ZIP paths',async()=>{
  const files=fixture({'index.html':'<html><head><link rel="stylesheet" href="styles/main.css"></head><body><img src="img/icon.svg#shape"><div style="background:url(img/icon.svg)"></div></body></html>','styles/main.css':'@import "./theme.css" screen; .hero{background:url(../img/icon.svg)}','styles/theme.css':'@font-face{font-family:demo;src:url(../font/demo.woff2)}','img/icon.svg':'<svg/>','font/demo.woff2':new Uint8Array([1,2,3])});
  const document=options.parseDocument(await createCustomPreviewDocument(files,options)),css=decode(document.querySelector('link').href);
  assert.match(css,/@import "data:text\/css;base64,/);assert.match(css,/screen/);assert.match(css,/data:image\/svg\+xml;base64,/);
  assert.match(document.querySelector('img').src,/^data:image\/svg\+xml;base64,.*#shape$/);assert.match(document.querySelector('div').getAttribute('style'),/data:image\/svg\+xml/);
});

test('static and literal dynamic ES imports use an import map, including cyclic modules, without touching unused source files',async()=>{
  const files=fixture({'index.html':'<html><head></head><body><script type="module" src="./js/main.js"></script></body></html>','js/main.js':`import {a} from './a.js'; import('./b.js').then(console.log); console.log(a);`,'js/a.js':`export {b as a} from './b.js';`,'js/b.js':`import './a.js'; export const b=1;`,'unused.js':`import React from 'not-bundled';`});
  const document=options.parseDocument(await createCustomPreviewDocument(files,options)),map=JSON.parse(document.querySelector('script[type=importmap]').textContent).imports;
  assert.equal(Object.keys(map).length,3);const main=decode(map[`@htzip/${options.id}/js/main.js`]);
  assert.match(main,new RegExp(`from '@htzip/${options.id}/js/a.js'`));assert.match(main,new RegExp(`import\\("@htzip/${options.id}/js/b.js"\\)`));
  assert.equal(document.querySelector('script[type=module]').src,map[`@htzip/${options.id}/js/main.js`]);
});

test('missing, external, cyclic CSS and unsupported dynamic resource paths fail explicitly rather than leave a white preview',async()=>{
  for(const [files,error] of [
    [{'index.html':'<html><head></head><body><script src="missing.js"></script></body></html>'},/缺少资源/],
    [{'index.html':'<html><head></head><body><img src="https://elsewhere.test/a.png"></body></html>'},/外部资源/],
    [{'index.html':'<html><head><link rel="stylesheet" href="a.css"></head><body></body></html>','a.css':'@import "b.css";','b.css':'@import "a.css";'},/CSS 循环/],
    [{'index.html':'<html><head></head><body><script type="module">import(variable)</script></body></html>'},/动态生成/],
  ])await assert.rejects(createCustomPreviewDocument(fixture(files),options),error);
});

test('loading a lost bundle reports a recoverable error before constructing an iframe',async()=>{
  const previous=globalThis.caches;globalThis.caches={keys:async()=>[]};
  try{await assert.rejects(loadCustomPreviewDocument(options.id),/资源已丢失/);await assert.rejects(loadCustomPreviewDocument('invalid'),/记录无效/);}finally{globalThis.caches=previous;}
});
