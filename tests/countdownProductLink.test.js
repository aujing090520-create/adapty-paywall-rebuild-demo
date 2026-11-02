import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument,updateComponent,validDocument,saveComponentDocument,readComponentDocument} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {countdownRuntime} from '../src/builder/countdownState.js';
import {productLinkRuntime,countdownPackages,countdownLinksProducts} from '../src/builder/countdownProductLink.js';
import {createBusinessTimeContext} from '../src/builder/businessTime.js';
import {logicMatches} from '../src/builder/paywallLogic.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';

const now=Date.parse('2030-01-01T00:00:00Z');
const leaf=(id,parameter)=>component(id,'ProductParameter','商品参数',{parameter});
const pack=(id,group='products',productType='subscription')=>component(id,'Package','商品套餐',{group,productType,defaultSelected:true},[
  component(`${id}/label-box`,'Stack','标签',{},[leaf(`${id}/label`,'productLabel')]),
  leaf(`${id}/price`,'monthlyPrice'),leaf(`${id}/reference`,'totalReferencePrice'),leaf(`${id}/savings`,'savings'),leaf(`${id}/info`,'productInfo'),
  component(`${id}/variable`,'Text','变量',{text:'{{ product.price }}'})
]);
function fixture(linkProducts=true) {
  const timer=createCatalogComponent('Countdown','timer');
  timer.props={...timer.props,timeSource:'manual',timingMode:'everyEntry',start:'00:00:05',linkProducts};
  return {version:3,templateId:'product-link-test',productFieldPreview:true,products:{},root:component('screen','Screen','页面',{},[
    pack('year'),pack('other','other'),timer,
    component('buy','PurchaseButton','购买按钮',{action:{action:'Purchase'}},[component('buy/text','Text','文字',{text:'继续'})])
  ])};
}
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
const runtime=(doc,clocks,time=now,options={},extra={})=>productLinkRuntime(doc,countdownRuntime(doc,{$time:{now:time},...extra},clocks,options));
const timer=doc=>indexDocument(doc).nodes.get('timer');
const links=value=>value.$productLinks.events;

test('one flag defaults off, reads legacy enablement only, and ignores retired price and targeting settings',()=>{
  assert.equal(countdownLinksProducts({}),false);
  assert.equal(countdownLinksProducts({promotion:{enabled:true}}),true);
  assert.equal(countdownLinksProducts({linkProducts:false,promotion:{enabled:true}}),false);
  const doc=fixture(),before=structuredClone(doc),clocks=new Map();
  assert.equal(links(runtime(doc,clocks))[0].state,'active');
  assert.equal(links(runtime(doc,clocks,now+6000))[0].state,'ended');
  assert.deepEqual(doc,before);
  const legacy=updateComponent(doc,'timer',{props:{linkProducts:undefined,promotion:{enabled:true,group:'deleted',hideLabel:true,hideReference:true}}});
  assert.deepEqual(links(runtime(legacy,new Map()))[0].packageIds,['year','other']);
});

test('display-only countdown reaches its ended view without changing the active product context',()=>{
  const doc=fixture(false),clocks=new Map();runtime(doc,clocks);
  const expired=runtime(doc,clocks,now+6000);
  assert.equal(expired.$countdowns.timer.state,'ended');
  assert.deepEqual(links(expired)[0],{countdownId:'timer',linked:false,state:'active',expiresAt:null,packageIds:['year','other']});
  const broken=updateComponent(doc,'timer',{props:{start:'invalid'}});
  assert.equal(runtime(broken,new Map()).$countdowns.timer.state,'fallback');
  assert.equal(links(runtime(broken,new Map()))[0].state,'active');
});

test('all three timing modes retain reentry semantics and opening a modal does not restart a background timer',()=>{
  for(const mode of ['everyEntry','firstEntry','deadline']) {
    const doc=updateComponent(fixture(),'timer',{props:{timingMode:mode,deadline:new Date(now+5000).toISOString()}});
    doc.root.children.push(component('modal','BottomSheet','弹窗',{},[component('modal/text','Text','文字',{text:'详情'})]));
    const store=storage(),clocks=new Map(),options={storage:store};
    assert.equal(links(runtime(doc,clocks,now,options))[0].state,'active');
    assert.equal(runtime(doc,clocks,now+2000,options,{overlay:'modal'}).$countdowns.timer.seconds,3);
    assert.equal(links(runtime(doc,clocks,now+5001,options))[0].state,'ended');
    assert.equal(links(runtime(doc,new Map(),now+6000,options))[0].state,mode==='everyEntry'?'active':'ended');
  }
});

test('business source states are forwarded, not converted into frontend price or label policies',()=>{
  const doc=updateComponent(fixture(),'timer',{props:{timeSource:'business',timeSourceId:'sale'}});
  doc.business={timeSources:[{id:'sale',key:'time.sale',name:'活动',scope:'campaign'}]};
  const clocks=new Map();
  const value=(status,expiresAt=now+5000)=>({$time:{now,context:{values:{'time.sale':{status,expiresAt:new Date(expiresAt).toISOString()}}}}});
  for(const scope of ['campaign','userOffer','global']) {
    doc.business.timeSources[0].scope=scope;
    assert.equal(links(runtime(doc,clocks,now,{},value('active')))[0].state,'active');
  }
  assert.equal(links(runtime(doc,clocks,now,{},value('active',now-1)))[0].state,'ended');
  assert.equal(links(runtime(doc,clocks,now,{},value('unavailable')))[0].state,'unavailable');
  assert.equal(links(runtime(doc,clocks,now,{},value('active')))[0].state,'active');
});

test('automatic ownership does not cross screens or popups and keeps independent timer contexts',()=>{
  const doc=fixture();doc.root.children.push(component('modal','BottomSheet','弹窗',{},[pack('modal-package')]));
  assert.deepEqual(countdownPackages(doc,timer(doc)).map(node=>node.id),['year','other']);
  const clone=createCatalogComponent('Countdown','second');clone.props={...timer(doc).props};doc.root.children.push(clone);
  assert.equal(runtime(doc,new Map()).$productLinks.byPackage.year.length,2);
  const separate=component('screen2','Screen','页面2',{},[pack('third')]);
  const flow={...doc,root:component('flow','Flow','流程',{},[doc.root,separate])};
  assert.ok(!countdownPackages(flow,timer(flow)).some(node=>node.id==='third'));
  assert.equal(runtime(flow,new Map()).$productLinks.byPackage.third,undefined);
});

test('save/read and cross-screen copy retain the flag and remap countdown rule references without price configuration',()=>{
  const doc=fixture();
  doc.logic={rules:[{id:'rule',conditions:[{type:'countdown',source:'timer',operator:'equals',value:'ended'}],effects:[{target:'buy',kind:'text',value:'继续'}]}]};
  const store=storage();assert.ok(validDocument(doc));assert.ok(saveComponentDocument(store,doc));
  assert.equal(timer(readComponentDocument(store,doc.templateId)).props.linkProducts,true);
  const destination={...fixture(),root:component('target','Screen','目标')};
  const pasted=pasteFragment(destination,'target',copyFragment(doc,'screen',true));
  const copiedTimer=[...indexDocument(pasted.document).nodes.values()].find(node=>node.type==='Countdown');
  assert.equal(copiedTimer.props.linkProducts,true);
  assert.equal(pasted.document.logic.rules[0].conditions[0].source,copiedTimer.id);
  const clocks=new Map();runtime(doc,clocks);assert.equal(logicMatches(doc.logic.rules[0],doc,runtime(doc,clocks,now+6000)),true);
  for(const linkProducts of [null,'yes',1,{}])assert.equal(validDocument(updateComponent(doc,'timer',{props:{linkProducts}})),false);
});

let server,Preview,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());
const event={stopPropagation(){},preventDefault(){}};
test('real preview forwards linked states and rechecks clicks but never rewrites or hides product fields',async()=>{
  const source=updateComponent(fixture(),'timer',{props:{timeSource:'business',timeSourceId:'sale'}});
  source.business={timeSources:[{id:'sale',key:'time.sale',name:'活动',scope:'campaign'}]};
  let renderer,status='',payload,events=[];
  const context=(status='active',duration=60000)=>createBusinessTimeContext({serverTime:new Date(now).toISOString(),values:{'time.sale':{status,expiresAt:new Date(now+duration).toISOString()}}});
  const onProductLinkChange=value=>events.push(value);
  const render=(businessTime,doc=source)=>React.createElement(Preview,{document:doc,businessTime,editing:false,onSelect(){},onStatus:value=>status=value,onPurchasePreview:value=>payload=value,onProductLinkChange});
  const node=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  const text=node=>typeof node==='string'?node:node.children.map(text).join('');
  try {
    await act(async()=>{renderer=Renderer.create(render(context()));});
    const initial=['year/price','year/variable','year/label','year/reference','year/savings'].map(id=>text(node(id)));
    assert.equal(text(node('year/price')),'¥{月价}/月');assert.equal(text(node('year/variable')),'¥{总价}');
    for(const state of ['ended','unavailable','active']) {
      await act(async()=>renderer.update(render(context(state))));
      assert.deepEqual(['year/price','year/variable','year/label','year/reference','year/savings'].map(id=>text(node(id))),initial);
      assert.equal(events.at(-1)[0].state,state);
      await act(async()=>node('buy').props.onClick(event));assert.equal(payload.linkProducts,true);assert.equal(payload.countdowns[0].state,state);
      assert.equal('priceSource' in payload,false);assert.match(status,/跟随商品逻辑/);
    }
    const off=updateComponent(source,'timer',{props:{linkProducts:false}});
    await act(async()=>renderer.update(render(context('ended'),off)));
    assert.equal(events.at(-1)[0].state,'active');assert.equal(events.at(-1)[0].linked,false);
    await act(async()=>node('buy').props.onClick(event));assert.equal(payload.linkProducts,false);assert.equal(payload.countdowns[0].state,'active');
    assert.deepEqual(['year/price','year/variable','year/label','year/reference','year/savings'].map(id=>text(node(id))),initial);
    await act(async()=>renderer.update(render(context('active',100))));
    assert.equal(node('year').props['data-product-link-state'],'active');
    await new Promise(resolve=>setTimeout(resolve,160));
    await act(async()=>node('buy').props.onClick(event));assert.equal(payload.countdowns[0].state,'ended');
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});

test('product notification is state-driven and cannot loop when a host recreates its callback',async()=>{
  const doc=fixture(false);let renderer,calls=0;
  const render=()=>React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus(){},onProductLinkChange:()=>{calls++;}});
  try {
    await act(async()=>{renderer=Renderer.create(render());});assert.equal(calls,1);
    await act(async()=>renderer.update(render()));assert.equal(calls,1);
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,1050));});assert.equal(calls,1);
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});

test('existing product data remains the sole source of actual legacy product values',async()=>{
  const doc=fixture();delete doc.productFieldPreview;
  doc.products={year:{price:'¥100',name:'1个月'}};
  const price=component('legacy-price','Text','价格',{binding:{key:'year',field:'price'}});
  doc.root.children[0].props.dataKey='year';doc.root.children[0].children.push(price);
  let renderer;
  const render=document=>React.createElement(Preview,{document,editing:false,onSelect(){},onStatus(){}});
  const text=()=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']==='legacy-price')[0].children.join('');
  try {
    await act(async()=>{renderer=Renderer.create(render(doc));});assert.equal(text(),'¥100');
    const external={...doc,products:{year:{price:'¥180',name:'1个月'}}};
    await act(async()=>renderer.update(render(external)));assert.equal(text(),'¥180');
    assert.equal(external.products.year.price,'¥180');
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});

test('real properties has exactly one product-link toggle and no retired promotion controls',async()=>{
  let doc=fixture(false),renderer;
  const render=()=>{const {nodes,parents}=indexDocument(doc),selected=nodes.get('timer');return React.createElement(Properties,{selected,p:selected.props,document:doc,nodes,parents,navigation:{},patch:props=>{doc=updateComponent(doc,'timer',{props});renderer.update(render());},setNavigation(){},onStatus(){},demoSkus:[],fieldNames:{},findPackage(){return null;},resolveText(){return '';}});};
  const toggle=()=>renderer.root.findAll(node=>node.type==='input'&&node.props['aria-label']==='联动商品')[0];
  try {
    await act(async()=>{renderer=Renderer.create(render());});
    const section=renderer.root.findAll(node=>node.type==='section'&&node.findAll(child=>child.type==='strong'&&child.children.includes('商品联动')).length)[0];
    assert.equal(section.findAll(node=>node.type==='input').length,1);assert.equal(section.findAll(node=>node.type==='select'||node.type==='button').length,0);
    assert.equal(toggle().props.checked,false);
    await act(async()=>toggle().props.onChange({target:{checked:true}}));assert.equal(timer(doc).props.linkProducts,true);
    await act(async()=>toggle().props.onChange({target:{checked:false}}));assert.equal(timer(doc).props.linkProducts,false);
    assert.equal(timer(doc).props.start,'00:00:05');
    const labels=renderer.root.findAll(node=>typeof node.type==='string').map(node=>node.props['aria-label']);
    for(const old of ['影响套餐','预览优惠计时中','恢复正常价格时隐藏商品标签'])assert.ok(!labels.includes(old));
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});
