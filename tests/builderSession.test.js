import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component, saveComponentDocument, DOCUMENT_PREFIX } from '../src/builder/componentDocument.js';
import { beginLocalDemoReset, clearLocalDemoSettings, writeTemplateNodes } from '../src/templateStorage.js';
import { savePaywall, readSavedPaywall, listSavedPaywalls, removeSavedPaywall, PAYWALL_SAVE_PREFIX } from '../src/paywallStorage.js';
import { modalBindings } from '../src/builder/buttonModals.js';
import { indexDocument } from '../src/builder/componentDocument.js';

let server, App;
before(async()=>{
  server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});
  App=(await server.ssrLoadModule('/src/App.jsx')).default;
});
after(async()=>server?.close());
const storage=()=>{const values=new Map();return {get length(){return values.size;},key:index=>[...values.keys()][index]??null,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const sample=(templateId='blank')=>({version:3,templateId,products:{sku:{name:'原商品'}},root:component('root','Screen','原页面',{},[])});

test('saved documents belong to paywalls, are validated, and do not share mutable template state',()=>{
  const store=storage(),doc=sample();
  assert.ok(savePaywall(store,{id:'a',name:'A',state:'Draft'},doc));
  doc.root.name='未保存修改';
  assert.equal(readSavedPaywall(store,'a').document.root.name,'原页面');assert.equal(readSavedPaywall(store,'b'),null);
  store.setItem(PAYWALL_SAVE_PREFIX+'bad','{}');assert.equal(listSavedPaywalls(store).length,1);
  assert.equal(savePaywall(store,{id:'b',name:'B',state:'Draft'},{...doc,root:{...doc.root,type:'Invalid'}}),false);
  const original=store.getItem(PAYWALL_SAVE_PREFIX+'a');const denied={getItem:store.getItem,setItem(){throw new Error('quota');}};
  assert.equal(savePaywall(denied,{id:'a',name:'A',state:'Draft'},doc),false);assert.equal(store.getItem(PAYWALL_SAVE_PREFIX+'a'),original);
  assert.ok(removeSavedPaywall(store,'a'));assert.equal(readSavedPaywall(store,'a'),null);
});

test('reset prevents pending legacy autosaves and explicit saves from repopulating cleared settings',()=>{
  const store=storage(),doc=sample('ht-blue-privilege');
  saveComponentDocument(store,doc);writeTemplateNodes(store,doc.templateId,[]);savePaywall(store,{id:'a',name:'A',state:'Draft'},doc);
  store.setItem('another-app','keep');beginLocalDemoReset(store);
  assert.equal(saveComponentDocument(store,doc),false);assert.equal(clearLocalDemoSettings(store),true);
  assert.equal(writeTemplateNodes(store,doc.templateId,[]),false);assert.equal(saveComponentDocument(store,doc),false);assert.equal(savePaywall(store,{id:'a',name:'A',state:'Draft'},doc),false);
  assert.equal(store.length,1);assert.equal(store.getItem('another-app'),'keep');
});

test('actual App reapplies pristine templates, saves by paywall, discards edits and does not flush unsaved changes',async()=>{
  const previous=Object.fromEntries(['window','document','localStorage','MutationObserver','ResizeObserver','IntersectionObserver'].map(key=>[key,globalThis[key]]));
  const store=storage(),timers=new Set();let app,reloads=0;
  globalThis.localStorage=store;
  globalThis.document={querySelector(){return null;},documentElement:{lang:'zh-CN',style:{}},body:{style:{}}};
  globalThis.MutationObserver=class{observe(){}disconnect(){}};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.IntersectionObserver=class{observe(){}disconnect(){}};
  globalThis.window={localStorage:store,addEventListener(){},removeEventListener(){},location:{reload(){reloads++;}},setTimeout(fn,ms){const timer=setTimeout(fn,ms);timers.add(timer);return timer;},clearTimeout};
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  const button=name=>app.root.findAll(item=>item.type==='button'&&(text(item).trim()===name||item.props['aria-label']===name||item.findAllByType('strong').some(child=>text(child)===name)))[0];
  const click=async name=>{const target=button(name);assert.ok(target,`button ${name}`);await act(async()=>target.props.onClick({stopPropagation(){},preventDefault(){}}));};
  const rootName=()=>app.root.findAll(item=>item.type==='label'&&item.props.className==='ne-field'&&item.children.some(child=>typeof child==='object'&&text(child)==='页面名称'))[0].findByType('input');
  const rename=async value=>act(async()=>rootName().props.onChange({target:{value}}));
  const applyBlue=async()=>{
    await click('更换模板');
    const card=app.root.findAll(item=>item.type==='div'&&item.props.role==='button'&&item.findAllByType('strong').some(title=>text(title)==='蓝色特权页'))[0];assert.ok(card);
    await act(async()=>card.props.onClick());await click('Open in Builder');
    if(app.root.findAll(item=>item.props.role==='dialog'&&item.props['aria-label']==='替换当前画布？').length)await click('替换画布');
  };
  const open=async id=>{
    const row=app.root.findAll(item=>item.type==='tr'&&item.findAllByType('strong').some(label=>text(label)===id))[0];assert.ok(row);
    await act(async()=>row.props.onClick());await click('Open Builder');
  };
  try {
    const old=sample('ht-blue-privilege');old.root.name='旧缓存污染';saveComponentDocument(store,old);
    await act(async()=>{app=TestRenderer.create(React.createElement(App));});
    await open('test 2');await applyBlue();assert.equal(rootName().props.value,'特权首页');
    await rename('未保存内容');await applyBlue();assert.equal(rootName().props.value,'特权首页');
    await rename('已保存内容');await click('保存');assert.equal(readSavedPaywall(store,'test-2').document.root.children.find(node=>node.type==='Flow').children[0].name,'已保存内容');
    await rename('第二次未保存');await click('放弃修改');assert.equal(rootName().props.value,'已保存内容');
    await rename('离开前未保存');await click('Paywalls');assert.ok(app.root.findByProps({'aria-label':'有尚未保存的修改'}));await click('放弃并继续');await open('test 2');assert.equal(rootName().props.value,'已保存内容');
    await click('Paywalls');await open('test');assert.equal(rootName().props.value,'付费墙页面');
    await click('Paywalls');if(app.root.findAll(item=>item.props['aria-label']==='有尚未保存的修改').length)await click('放弃并继续');await click('Create paywall');await click('Build no-code paywall');await applyBlue();assert.equal(rootName().props.value,'特权首页');
    await rename('新建也不能污染模板');
    assert.equal(JSON.parse(store.getItem(DOCUMENT_PREFIX+'ht-blue-privilege')).root.name,'旧缓存污染');
    assert.equal(listSavedPaywalls(store).length,1);assert.equal(reloads,0);
    await click('保存');assert.equal(listSavedPaywalls(store).length,2);assert.ok(listSavedPaywalls(store).some(record=>record.paywall.id.startsWith('local-')&&record.document.root.children.find(node=>node.type==='Flow').children[0].name==='新建也不能污染模板'));
    await click('重置');await click('确认重置');assert.equal(reloads,1);
    await act(async()=>app.unmount());app=null;assert.equal(store.getItem(DOCUMENT_PREFIX+'ht-blue-privilege'),null);assert.equal(listSavedPaywalls(store).length,0);
  } finally {
    if(app)await act(async()=>app.unmount());for(const timer of timers)clearTimeout(timer);for(const [key,value] of Object.entries(previous))globalThis[key]=value;
  }
});

test('actual App links, edits and saves an existing canvas popup without copying it or creating another paywall record', async()=>{
  const keys=['window','document','localStorage','MutationObserver','ResizeObserver','IntersectionObserver'];
  const previous=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));const store=storage(),timers=new Set();let app;
  globalThis.localStorage=store;
  globalThis.document={querySelector(){return null;},documentElement:{lang:'zh-CN',style:{}},body:{style:{}}};
  globalThis.MutationObserver=class{observe(){}disconnect(){}};globalThis.ResizeObserver=class{observe(){}disconnect(){}};globalThis.IntersectionObserver=class{observe(){}disconnect(){}};
  globalThis.window={localStorage:store,addEventListener(){},removeEventListener(){},setInterval,clearInterval,location:{reload(){}},setTimeout(fn,ms){const timer=setTimeout(fn,ms);timers.add(timer);return timer;},clearTimeout};
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  const click=async name=>{const target=app.root.findAll(item=>item.type==='button'&&(text(item).trim()===name||item.props['aria-label']===name))[0];assert.ok(target,`button ${name}`);await act(async()=>target.props.onClick({stopPropagation(){},preventDefault(){}}));};
  const editor=()=>app.root.findAll(item=>typeof item.type==='function'&&item.type.name==='ComponentEditor'&&!item.props.isExitOffer)[0];
  const nameField=()=>app.root.findAll(item=>item.type==='label'&&item.props.className==='ne-field'&&item.children.some(child=>typeof child==='object'&&['页面名称','弹窗名称'].includes(text(child))))[0].findByType('input');
  const widthField=()=>app.root.findAll(item=>item.type==='input'&&item.props['aria-label']==='固定宽度')[0];
  const fixedWidth=async()=>{const field=app.root.findAll(item=>item.type==='label'&&item.props.className==='rc-field'&&item.children.some(child=>typeof child==='object'&&text(child)==='宽度'))[0];await act(async()=>field.findAll(item=>item.type==='button'&&item.props['aria-label']==='固定')[0].props.onClick());};
  const open=async()=>{const row=app.root.findAll(item=>item.type==='tr'&&item.findAllByType('strong').some(label=>text(label)==='test 2'))[0];await act(async()=>row.props.onClick());await click('Open Builder');};
  try{
    await act(async()=>{app=TestRenderer.create(React.createElement(App));});await open();await click('更换模板');
    const card=app.root.findAll(item=>item.type==='div'&&item.props.role==='button'&&item.findAllByType('strong').some(title=>text(title)==='蓝色特权页'))[0];await act(async()=>card.props.onClick());await click('Open in Builder');
    const doc=editor().props.initialDocument;
    const visit=node=>[node,...node.children.flatMap(visit)];
    const surface=visit(doc.root).find(node=>node.name==='挽留弹窗');assert.ok(surface);
    assert.equal(editor().props.initialDocument.settings.buttonModalVersion,1);
    assert.equal(app.root.findAll(item=>item.type==='section'&&item.props['aria-label']==='弹窗').length,0);
    await click('添加关闭按钮');
    await act(async()=>app.root.findByProps({'aria-label':'点击动作'}).props.onChange({target:{value:'OpenSheet'}}));
    const beforeBinding=structuredClone(editor().props.initialDocument.products);
    await act(async()=>app.root.findByProps({'aria-label':'目标弹窗'}).props.onChange({target:{value:surface.id}}));
    assert.deepEqual(editor().props.initialDocument.products,beforeBinding);
    await click('编辑弹窗');
    assert.equal(text(app.root).includes('返回主付费墙'),false);assert.equal(listSavedPaywalls(store).length,0);
    assert.equal(app.root.findAll(item=>item.type==='div'&&item.props['aria-label']==='多画板画布').length,1);
    assert.ok(app.root.findAll(item=>item.type==='section'&&item.props.className?.startsWith('ne-artboard')).length>=2);
    const beforeZoom=structuredClone(editor().props.initialDocument);
    await act(async()=>app.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='画布缩放')[0].props.onChange({target:{value:'0.75'}}));
    assert.deepEqual(editor().props.initialDocument,beforeZoom,'workspace zoom never writes component parameters');
    await fixedWidth();await act(async()=>widthField().props.onChange({target:{value:'280'}}));
    assert.equal(app.root.findAll(item=>item.type==='input'&&item.props['aria-label']==='重命名图层').length,0);
    await click('选择画板：特权首页');
    assert.equal(nameField().props.value,'特权首页','selecting main board restores the main property owner');
    const main=editor().props.initialDocument,binding=modalBindings(main).find(({modal})=>modal.id===surface.id),offerId=binding?.modal.id;
    assert.equal(offerId,surface.id);assert.equal(visit(main.root).filter(node=>node.id===surface.id).length,1);
    assert.equal(indexDocument(main).parents.get(offerId),binding.button.id);
    assert.equal(listSavedPaywalls(store).length,0,'conversion and editing are not autosaved');
    await click('保存');assert.equal(listSavedPaywalls(store).length,1);
    assert.ok(modalBindings(readSavedPaywall(store,'test-2').document).some(({button,modal})=>button.id===binding.button.id&&modal.id===offerId));
    assert.equal(indexDocument(readSavedPaywall(store,'test-2').document).nodes.get(offerId).props.width,280);
    await click('选择画板：挽留弹窗');await act(async()=>widthField().props.onChange({target:{value:'320'}}));
    await click('放弃修改');await click('选择画板：挽留弹窗');assert.equal(widthField().props.value,'280');
    await click('选择画板：特权首页');await click('Paywalls');await open();
    assert.ok(modalBindings(editor().props.initialDocument).some(({modal})=>modal.id===offerId));
    await click('选择画板：挽留弹窗');assert.equal(widthField().props.value,'280');
    const existingIds=modalBindings(editor().props.initialDocument).map(({modal})=>modal.id);
    await click('选择画板：特权首页');await click('添加返回按钮');
    await act(async()=>app.root.findByProps({'aria-label':'点击动作'}).props.onChange({target:{value:'OpenSheet'}}));
    await click('新建空白弹窗');
    const bindings=modalBindings(editor().props.initialDocument),ids=bindings.map(({modal})=>modal.id);
    assert.ok(ids.includes(offerId));assert.equal(ids.length,new Set(ids).size);
    assert.equal(ids.length,existingIds.length+1);assert.ok(existingIds.every(id=>ids.includes(id)));
    const addedBinding=bindings.find(({modal})=>!existingIds.includes(modal.id));
    assert.equal(addedBinding.modal.children.length,0);
    assert.equal(addedBinding.button.name,'返回按钮');
    await click('保存');
    const reopened=readSavedPaywall(store,'test-2').document;
    assert.deepEqual(modalBindings(reopened).map(({modal})=>modal.id),ids);
    for(const {button,modal} of modalBindings(reopened))assert.equal(indexDocument(reopened).parents.get(modal.id),button.id);
    assert.equal(listSavedPaywalls(store).length,1,'all button-owned modals persist in the same paywall record');
    await click('选择画板：特权首页');await click('Paywalls');await open();
    assert.deepEqual(modalBindings(editor().props.initialDocument).map(({modal})=>modal.id),ids);
  }finally{if(app)await act(async()=>app.unmount());for(const timer of timers)clearTimeout(timer);for(const[key,value]of Object.entries(previous))globalThis[key]=value;}
});
