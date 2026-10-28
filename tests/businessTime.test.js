import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {resolveBusinessTime,clockAnchor,clockNow,createBusinessTimeContext,removeTimeSource,sourceKeyError} from '../src/builder/businessTime.js';
import {component,componentProps,indexDocument,saveComponentDocument,readComponentDocument,updateComponent} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {logicMatches} from '../src/builder/paywallLogic.js';
import {validWorkbenchConfiguration} from '../src/builder/workbenchModel.js';

let server,Preview,Settings,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Settings=(await server.ssrLoadModule('/src/builder/WorkbenchSettings.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());
const instant=Date.parse('2030-01-01T00:00:00Z');
const definition=(id='sale',scope='campaign')=>({id,key:`time.${id}`,name:id,scope,sample:{status:'active',expiresAt:new Date(instant+60000).toISOString()}});
function fixture() {
  const timer=id=>{const node=createCatalogComponent('Countdown',id);node.props={...node.props,timeSource:'business',timeSourceId:'sale',countFrom:'hours',fallbackEnabled:true};return node;};
  return {version:3,templateId:'time-test',products:{},business:{timeSources:[definition(),definition('personal','userOffer')]},root:component('screen','Screen','页面',{},[timer('first'),timer('second'),component('entry','Text','入口',{text:'活动入口'}),component('buy','Button','购买',{action:{action:'RestorePurchases'}},[component('buy/text','Text','文字',{text:'立即购买'})])]),logic:{rules:[{id:'expired',conditions:[{type:'timeSource',source:'sale',operator:'notEquals',value:'active'}],effects:[{target:'entry',kind:'hide'},{target:'buy',kind:'disable'}]}]}};
}
const frame=(now=instant,context)=>({$time:{now,context}});

test('activity, user-offer and global scopes consume the same normalized contract',()=>{
  const document=fixture();
  for(const scope of ['campaign','userOffer','global']){document.business.timeSources[0].scope=scope;assert.equal(resolveBusinessTime(document,'sale',frame()).seconds,60);}
  const first={values:{'time.personal':{status:'active',expiresAt:new Date(instant+10000).toISOString()}}};
  const second={values:{'time.personal':{status:'active',expiresAt:new Date(instant+20000).toISOString()}}};
  assert.equal(resolveBusinessTime(document,'personal',frame(instant,first)).seconds,10);
  assert.equal(resolveBusinessTime(document,'personal',frame(instant,second)).seconds,20);
  assert.equal(resolveBusinessTime(document,'sale',frame(instant,first)).status,'unavailable');
});

test('failure, early termination and deadline expiry are distinct and never fabricate active data',()=>{
  const document=fixture(),before=structuredClone(document);
  assert.equal(resolveBusinessTime(document,'sale',frame(instant+60000)).status,'ended');
  for(const value of [undefined,{status:'unavailable'},{status:'active',expiresAt:'invalid'},{status:'active',expiresAt:'2030-01-01T00:00:00'}])assert.equal(resolveBusinessTime(document,'sale',frame(instant,{values:{'time.sale':value}})).state,'fallback');
  assert.equal(resolveBusinessTime(document,'sale',frame(instant,{values:{'time.sale':{status:'ended'}}})).state,'ended');
  assert.equal(resolveBusinessTime(document,'missing',frame()).status,'unavailable');
  assert.equal(resolveBusinessTime(document,'sale',frame(NaN)).status,'unavailable');
  assert.deepEqual(document,before);
});

test('server clock survives client clock changes, remounts and shared responses without restarting',()=>{
  const context=createBusinessTimeContext({serverTime:new Date(instant).toISOString(),values:{}},100);
  const first=clockAnchor(context,instant+999999,300);
  assert.equal(clockNow(first,1100),instant+1000);
  assert.equal(clockAnchor(context,instant-999999,2000),first);
  assert.equal(clockNow(clockAnchor(context),5100),instant+5000);
  const invalid=clockAnchor({serverTime:'invalid'},instant,0);assert.ok(Number.isNaN(clockNow(invalid,1)));
  const local=clockAnchor({values:{},receivedAt:0},instant,1000);assert.equal(clockNow(local,1000),instant);
});

test('source references prevent deletion and storage keeps definitions but not runtime user responses',()=>{
  const document=fixture();assert.equal(removeTimeSource(document,'sale'),document);
  assert.equal(removeTimeSource(document,'personal').business.timeSources.length,1);
  assert.equal(sourceKeyError(document.business.timeSources,'personal','time.sale'),'数据键已存在');
  assert.ok(validWorkbenchConfiguration(document));
  const invalid=structuredClone(document);invalid.business.timeSources.push(definition());assert.equal(validWorkbenchConfiguration(invalid),false);
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  assert.ok(saveComponentDocument(storage,document));assert.deepEqual(readComponentDocument(storage,'time-test').business,document.business);
});

test('copying a bound timer or business-rule target preserves sources and remaps collisions',()=>{
  const original=fixture(),empty={version:3,templateId:'target',products:{},root:component('target','Screen')};
  const copied=pasteFragment(empty,'target',copyFragment(original,'first'));
  const nodes=indexDocument(copied.document).nodes,source=copied.document.business.timeSources[0];
  assert.equal(nodes.get(copied.ids[0]).props.timeSourceId,source.id);assert.equal(source.key,'time.sale');
  const same=pasteFragment(original,'screen',copyFragment(original,'first'));
  assert.equal(same.document.business.timeSources.length,2);assert.equal(indexDocument(same.document).nodes.get(same.ids[0]).props.timeSourceId,'sale');
  const collision={...empty,business:{timeSources:[{...definition(),scope:'global'}]}};
  const separate=pasteFragment(collision,'target',copyFragment(original,'first'));
  assert.equal(separate.document.business.timeSources[1].key,'time.sale_2');
  const rule=pasteFragment(empty,'target',copyFragment(original,'entry'));
  assert.equal(rule.document.logic.rules[0].conditions[0].source,rule.document.business.timeSources[0].id);
});

test('business conditions work independently of timer visibility',()=>{
  let document=fixture();document=updateComponent(document,'first',{props:{hidden:true}});document=updateComponent(document,'second',{props:{hidden:true}});
  assert.equal(logicMatches(document.logic.rules[0],document,frame(instant+60001)),true);
  assert.equal(logicMatches(document.logic.rules[0],document,frame(instant)),false);
  assert.equal(logicMatches({conditions:[{type:'timeSource',source:'',operator:'equals',value:'unavailable'}]},document,frame()),false);
});

test('real preview shares expiry, disables mouse and keyboard, refreshes per-user data and distinguishes fallback',async()=>{
  const document=fixture();let status='',renderer;
  const render=businessTime=>React.createElement(Preview,{document,businessTime,editing:false,onSelect(){},onStatus:value=>status=value});
  const context=(serverTime,status='active',seconds=60)=>createBusinessTimeContext({serverTime:new Date(serverTime).toISOString(),values:{'time.sale':{status,expiresAt:new Date(instant+seconds*1000).toISOString()}}});
  const node=id=>renderer.root.findAll(node=>node.props['data-component-id']===id&&typeof node.type==='string')[0];
  try{
    await act(async()=>{renderer=Renderer.create(render(context(instant)));});
    assert.deepEqual(node('first/countdown-text').children,node('second/countdown-text').children);
    assert.equal(node('buy').props['aria-disabled'],undefined);
    await act(async()=>renderer.update(render(context(instant+61000))));
    assert.ok(node('first/ended'));assert.ok(node('second/ended'));assert.equal(node('entry'),undefined);assert.equal(node('buy').props['aria-disabled'],true);
    const event={stopPropagation(){},preventDefault(){},key:'Enter'};
    await act(async()=>{node('buy').props.onClick(event);node('buy').props.onKeyDown(event);});assert.equal(status,'');
    await act(async()=>renderer.update(render(context(instant,'unavailable'))));
    assert.ok(node('first/fallback'));assert.equal(node('first/ended'),undefined);
    await act(async()=>renderer.update(render(context(instant,'active',120))));
    assert.ok(node('first/active'));assert.equal(node('buy').props['aria-disabled'],undefined);assert.ok(node('entry'));
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});

test('time-source settings creates both scopes, edits samples and protects referenced definitions',async()=>{
  let document=fixture(),renderer;
  const render=()=>React.createElement(Settings,{document,initialTab:'timeSources',onChange:next=>{document=next;renderer.update(render());},onClose(){},onPreview(){}});
  try{
    await act(async()=>{renderer=Renderer.create(render());});
    const select=renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='适用范围')[1];
    await act(async()=>select.props.onChange({target:{value:'global'}}));assert.equal(document.business.timeSources[1].scope,'global');
    const deleteButtons=renderer.root.findAll(node=>node.type==='button'&&node.props['aria-label']==='删除时间源');assert.equal(deleteButtons[0].props.disabled,true);assert.equal(deleteButtons[1].props.disabled,false);
    const state=renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='样例业务状态')[0];
    await act(async()=>state.props.onChange({target:{value:'ended'}}));assert.equal(resolveBusinessTime(document,'sale').status,'ended');
    const date=renderer.root.findAll(node=>node.type==='input'&&node.props['aria-label']==='样例到期时间（UTC）')[0];
    await act(async()=>date.props.onChange({target:{value:'2032-02-03T04:05:06'}}));
    assert.equal(document.business.timeSources[0].sample.expiresAt,'2032-02-03T04:05:06Z');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('without any countdown rendered, natural expiry still updates linked controls',async()=>{
  const document=fixture();document.root.children=document.root.children.filter(node=>node.type!=='Countdown');
  const businessTime=createBusinessTimeContext({serverTime:new Date(instant).toISOString(),values:{'time.sale':{status:'active',expiresAt:new Date(instant+200).toISOString()}}});
  let renderer;const node=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document,businessTime,editing:false,onSelect(){},onStatus(){}}));});
    assert.ok(node('entry'));assert.equal(node('buy').props['aria-disabled'],undefined);
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1150));});
    assert.equal(node('entry'),undefined);assert.equal(node('buy').props['aria-disabled'],true);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('property panel switches sources without losing manual settings or overwriting field ownership',async()=>{
  let document=fixture(),renderer;
  document=updateComponent(document,'first',{props:{timeSource:'manual',deadline:'2031-02-03T04:05:06Z'}});
  const render=()=>{const {nodes,parents}=indexDocument(document),selected=nodes.get('first');return React.createElement(Properties,{selected,p:componentProps(selected),document,nodes,parents,patch:values=>{document=updateComponent(document,'first',{props:values});renderer.update(render());},setNavigation(){},onStatus(){}});};
  const control=(type,name)=>renderer.root.findAll(node=>node.type===type&&node.props['aria-label']===name)[0];
  try{
    await act(async()=>{renderer=Renderer.create(render());});
    await act(async()=>control('select','时间来源').props.onChange({target:{value:'business'}}));
    assert.equal(control('input','目标时间（UTC）'),undefined);assert.equal(control('input','绑定接口数据键').props.readOnly,true);
    assert.equal(control('input','时间字段').props.value,'expiresAt（到期时间）');
    await act(async()=>control('select','时间来源').props.onChange({target:{value:'manual'}}));
    assert.equal(control('input','目标时间（UTC）').props.value,'2031-02-03T04:05:06');
    assert.equal(indexDocument(document).nodes.get('first').props.timeSourceId,'sale');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
