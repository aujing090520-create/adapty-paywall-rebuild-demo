import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {createTemplateRecord,changeTemplateRecord,readTemplateLibrary,writeTemplateLibrary,templateDescriptor,templatesInTab,TEMPLATE_LIBRARY_KEY} from '../src/templateLibrary.js';
import {buildRenewalOfferTemplate} from '../src/builder/renewalOfferTemplate.js';
import {buildChatGiftTemplate} from '../src/builder/chatGiftTemplate.js';
import {importComponentDocument,indexDocument,updateComponent} from '../src/builder/componentDocument.js';
import {clearLocalDemoSettings,beginLocalDemoReset} from '../src/templateStorage.js';
import {templates} from '../src/templates/templateDefinitions.js';
const store=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i]??null,get length(){return data.size;}};};

test('custom template is an independent complete snapshot, imported by generic document path',()=>{
  const source=buildChatGiftTemplate(),before=structuredClone(source);
  source.fonts=[{id:'ht-font-test',family:'Example',faces:[]}];
  const record=createTemplateRecord(source,{title:' 我的套餐 ',styleType:'聊天中送礼'}),descriptor=templateDescriptor(record),copy=importComponentDocument([],descriptor);
  assert.equal(record.title,'我的套餐');assert.equal(record.shared,false);assert.equal(descriptor.productCount,6);
  assert.deepEqual(copy,record.document);assert.notEqual(copy,record.document);assert.equal(copy.templateId,record.id);assert.deepEqual(copy.fonts,source.fonts);
  assert.deepEqual(source.root,before.root);assert.deepEqual(source.products,before.products);
  const changed=updateComponent(copy,'chat-gift/vip/package-0/price',{props:{fontSize:99}});
  assert.notEqual(indexDocument(changed).nodes.get('chat-gift/vip/package-0/price').props.fontSize,indexDocument(record.document).nodes.get('chat-gift/vip/package-0/price').props.fontSize);
  assert.deepEqual(source.root,before.root);
});

test('custom/shared/trash membership, unsharing, rename and reversible deletion have one owner',()=>{
  const record=createTemplateRecord(buildRenewalOfferTemplate(),{title:'续费自定义'});
  let rows=[record];
  assert.equal(templatesInTab(rows,'custom').length,1);assert.equal(templatesInTab(rows,'shared').length,0);
  rows=changeTemplateRecord(rows,record.id,'share');assert.equal(templatesInTab(rows,'shared').length,1);assert.equal(templatesInTab(rows,'custom').length,1);assert.equal(record.shared,false);
  rows=changeTemplateRecord(rows,record.id,'rename','续费共享');assert.equal(rows[0].title,'续费共享');assert.equal(rows[0].shared,true);
  rows=changeTemplateRecord(rows,record.id,'unshare');assert.equal(templatesInTab(rows,'shared').length,0);
  rows=changeTemplateRecord(changeTemplateRecord(rows,record.id,'share'),record.id,'archive');assert.equal(templatesInTab(rows,'custom').length,0);assert.equal(templatesInTab(rows,'shared').length,0);assert.equal(templatesInTab(rows,'trash').length,1);
  rows=changeTemplateRecord(rows,record.id,'restore');assert.equal(templatesInTab(rows,'custom').length,1);assert.equal(rows[0].shared,false);assert.deepEqual(rows[0].document,record.document);
  assert.throws(()=>changeTemplateRecord(rows,'official','share'),/不存在/);
});

test('names, storage failures, malformed data and reset never silently destroy existing records',()=>{
  const storage=store(),otherBrowser=store(),record=createTemplateRecord(buildRenewalOfferTemplate(),{title:'套餐'});
  writeTemplateLibrary(storage,[record]);assert.deepEqual(readTemplateLibrary(storage),[record]);assert.deepEqual(readTemplateLibrary(otherBrowser),[]);
  assert.throws(()=>createTemplateRecord(buildRenewalOfferTemplate(),{title:'套餐'},[record]),/同名/);
  assert.throws(()=>createTemplateRecord(buildRenewalOfferTemplate(),{title:' '}),/名称/);
  assert.throws(()=>createTemplateRecord(buildRenewalOfferTemplate(),{title:'长'.repeat(61)}),/名称/);
  const old=storage.getItem(TEMPLATE_LIBRARY_KEY),full={...storage,setItem(){throw new Error('quota');}};
  assert.throws(()=>writeTemplateLibrary(full,[]),/空间不足/);assert.equal(storage.getItem(TEMPLATE_LIBRARY_KEY),old);
  storage.setItem(TEMPLATE_LIBRARY_KEY,'broken');assert.throws(()=>writeTemplateLibrary(storage,[]));assert.equal(storage.getItem(TEMPLATE_LIBRARY_KEY),'broken');
  storage.setItem(TEMPLATE_LIBRARY_KEY,old);beginLocalDemoReset(storage);assert.throws(()=>writeTemplateLibrary(storage,[]),/重置/);
  storage.setItem('other-app','keep');assert.equal(clearLocalDemoSettings(storage),true);assert.equal(storage.getItem('other-app'),'keep');assert.deepEqual(readTemplateLibrary(storage),[]);
});

test('template creation rejects missing active legacy popup dependencies rather than saving a broken link',()=>{
  const source=buildRenewalOfferTemplate();delete source.settings.buttonModalVersion;
  source.settings.exitOfferOfferingId='missing';
  assert.throws(()=>createTemplateRecord(source,{title:'缺失弹窗'}),/关联弹窗不可用/);
});

let server,TemplatesModal,SaveTemplateDialog;
const previousObserver=globalThis.IntersectionObserver;
const previousDocument=globalThis.document;
before(async()=>{globalThis.document={documentElement:{style:{}},body:{style:{}}};globalThis.IntersectionObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});({TemplatesModal}=await server.ssrLoadModule('/src/App.jsx'));({SaveTemplateDialog}=await server.ssrLoadModule('/src/TemplateLibraryDialogs.jsx'));});
after(async()=>{await server?.close();globalThis.IntersectionObserver=previousObserver;globalThis.document=previousDocument;});

test('library has exactly three tabs, switches selection safely and exposes reversible own-template actions',async()=>{
  const record=createTemplateRecord(buildRenewalOfferTemplate(),{title:'自定义验收'}),catalog=[...templates,templateDescriptor(record)];
  let renderer,opened=null,action=[];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(TemplatesModal,{selected:null,templateCatalog:catalog,libraryItems:[record],onClose(){},onOpenBuilder:i=>opened=i,onLibraryAction:(...args)=>{action=args;return '';}}));});
    const tabs=()=>renderer.root.findAll(n=>n.props.role==='tab');assert.equal(tabs().length,3);
    await act(async()=>tabs()[1].props.onClick());
    const card=renderer.root.findAll(n=>n.props.role==='button'&&n.props.className?.includes('template-custom'))[0];assert.ok(card);
    await act(async()=>card.props.onClick());
    const open=renderer.root.findAll(n=>n.type==='button'&&n.children.includes('Open in Builder'))[0];assert.equal(open.props.disabled,false);
    await act(async()=>open.props.onClick());assert.equal(catalog[opened].id,record.id);
    await act(async()=>renderer.root.findByProps({'aria-label':'共享 自定义验收'}).props.onClick());assert.deepEqual(action,[record.id,'share',undefined]);
    await act(async()=>tabs()[2].props.onClick());assert.equal(renderer.root.findAll(n=>n.props.role==='button'&&n.props.className?.includes('template-custom')).length,0);
    const openAfter=renderer.root.findAll(n=>n.type==='button'&&n.children.includes('Open in Builder'))[0];assert.equal(openAfter.props.disabled,true);
    assert.ok(JSON.stringify(renderer.toJSON()).includes('共享为模拟状态'));
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('save-template dialog reports storage/validation error and keeps user input for retry',async()=>{
  let renderer,name='';
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(SaveTemplateDialog,{defaultName:'新模板',onClose(){},onSave:value=>{name=value;throw new Error('保存失败');}}));});
    await act(async()=>renderer.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(name,'新模板');assert.ok(renderer.root.findByProps({role:'alert'}));assert.equal(renderer.root.findByType('input').props.value,'新模板');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
