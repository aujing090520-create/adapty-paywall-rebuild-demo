import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument,updateComponent,validDocument,saveComponentDocument,readComponentDocument} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {countdownRuntime} from '../src/builder/countdownState.js';
import {promotionRuntime,promotionPackages,promotionGroups,promotionWarnings} from '../src/builder/countdownPromotion.js';
import {productParameterPreview} from '../src/products/productParameters.js';
import {promotionVariableValues} from '../src/products/promotionFields.js';
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
function fixture() {
  const timer=createCatalogComponent('Countdown','timer');
  timer.props={...timer.props,timeSource:'manual',timingMode:'everyEntry',start:'00:00:05',promotion:{enabled:true}};
  return {version:3,templateId:'promotion-test',productFieldPreview:true,products:{},root:component('screen','Screen','页面',{},[
    pack('year'),pack('other','other'),timer,
    component('buy','PurchaseButton','购买按钮',{action:{action:'Purchase'}},[component('buy/text','Text','文字',{text:'继续'})])
  ])};
}
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
const runtime=(doc,clocks,time=now,options={},extra={})=>promotionRuntime(doc,countdownRuntime(doc,{$time:{now:time},...extra},clocks,options));
const timer=doc=>indexDocument(doc).nodes.get('timer');

test('opt-in preserves defaults and price modes; expiration and failure use normal fields without mutating configuration',()=>{
  const doc=fixture(),before=structuredClone(doc),clocks=new Map();
  const active=runtime(doc,clocks),ended=runtime(doc,clocks,now+5001);
  assert.equal(active.$pricing.year.phase,'discount');assert.equal(ended.$pricing.year.phase,'regular');
  assert.equal(productParameterPreview('monthlyPrice',pack('x'),false,active.$pricing.year),'¥{优惠月价}/月');
  assert.equal(productParameterPreview('monthlyPrice',pack('x'),false,ended.$pricing.year),'¥{月价}/月');
  for(const field of ['productLabel','savings','totalReferencePrice'])assert.equal(productParameterPreview(field,pack('x'),true,ended.$pricing.year),'');
  assert.deepEqual(doc,before);
  const disabled=updateComponent(doc,'timer',{props:{promotion:{enabled:false}}});
  assert.deepEqual(runtime(disabled,new Map()).$pricing,{});
  assert.equal(productParameterPreview('monthlyPrice',pack('x')),'¥{月价}/月');
  const broken=updateComponent(doc,'timer',{props:{start:'invalid'}});
  assert.equal(runtime(broken,new Map()).$pricing.year.phase,'regular');
  assert.equal(runtime(broken,new Map()).$pricing.year.state,'fallback');
});

test('all three timing modes keep expiration and reentry semantics; opening a modal never restarts the background clock',()=>{
  for(const mode of ['everyEntry','firstEntry','deadline']) {
    let doc=updateComponent(fixture(),'timer',{props:{timingMode:mode,deadline:new Date(now+5000).toISOString()}});
    doc.root.children.push(component('modal','BottomSheet','弹窗',{},[component('modal/text','Text','文字',{text:'详情'})]));
    const store=storage(),clocks=new Map(),options={storage:store};
    assert.equal(runtime(doc,clocks,now,options).$pricing.year.phase,'discount');
    assert.equal(runtime(doc,clocks,now+2000,options,{overlay:'modal'}).$countdowns.timer.seconds,3);
    assert.equal(runtime(doc,clocks,now+5001,options).$pricing.year.phase,'regular');
    const reopened=runtime(doc,new Map(),now+6000,options);
    assert.equal(reopened.$pricing.year.phase,mode==='everyEntry'?'discount':'regular');
  }
});

test('business time supports every scope, expiry, unavailable data and restoration; editor overrides never change actual purchase state',()=>{
  const doc=updateComponent(fixture(),'timer',{props:{timeSource:'business',timeSourceId:'sale'}});
  doc.business={timeSources:[{id:'sale',key:'time.sale',name:'活动',scope:'campaign'}]};
  const clocks=new Map();
  const value=(state,expiresAt=now+5000)=>({$time:{now,context:{values:{'time.sale':{status:state,expiresAt:new Date(expiresAt).toISOString()}}}}});
  for(const scope of ['campaign','userOffer','global']) {
    doc.business.timeSources[0].scope=scope;
    assert.equal(runtime(doc,clocks,now,{},value('active')).$pricing.year.phase,'discount');
  }
  assert.equal(runtime(doc,clocks,now,{},value('active',now-1)).$pricing.year.phase,'regular');
  assert.equal(runtime(doc,clocks,now,{},value('unavailable')).$pricing.year.state,'fallback');
  assert.equal(runtime(doc,clocks,now,{},value('active')).$pricing.year.phase,'discount');
  const editing=runtime(doc,clocks,now,{editing:true},{...value('ended'),timer:'active'});
  assert.equal(editing.$pricing.year.phase,'discount');
  assert.equal(runtime(doc,clocks,now,{editing:false},{...value('ended'),timer:'active'}).$pricing.year.phase,'regular');
});

test('scope and selection-group ownership prevent crossing screens, modals and unrelated packages; collisions fail closed',()=>{
  let doc=fixture();
  doc=updateComponent(doc,'timer',{props:{promotion:{enabled:true,group:'products'}}});
  doc.root.children.push(component('modal','BottomSheet','弹窗',{},[pack('modal-package')]));
  assert.deepEqual(promotionGroups(doc,timer(doc)),[{key:'products',count:1},{key:'other',count:1}]);
  const result=runtime(doc,new Map());
  assert.equal(result.$pricing.year.phase,'discount');assert.equal(result.$pricing.other,undefined);assert.equal(result.$pricing['modal-package'],undefined);
  const clone=createCatalogComponent('Countdown','second');clone.props={...timer(doc).props};doc.root.children.push(clone);
  assert.equal(runtime(doc,new Map()).$pricing.year.phase,'regular');
  assert.match(promotionWarnings(doc,timer(doc))[0],/多个优惠倒计时/);
  const separate=component('screen2','Screen','页面2',{},[pack('third')]);
  const flow={...doc,root:component('flow','Flow','流程',{},[doc.root,separate])};
  assert.ok(!promotionPackages(flow,timer(flow)).some(node=>node.id==='third'));
  const missing=updateComponent(fixture(),'timer',{props:{promotion:{enabled:true,group:'deleted'}}});
  assert.deepEqual(runtime(missing,new Map()).$pricing,{});assert.match(promotionWarnings(missing,timer(missing))[0],/未关联/);
});

test('lifetime fields, optional decorations and ordinary variables share price source; reverting restores original field definitions',()=>{
  const doc=fixture(),active=runtime(doc,new Map()).$pricing.year;
  const ended={...active,phase:'regular'},life=pack('life','products','lifetime');
  assert.equal(productParameterPreview('monthlyPrice',life,false,active),'¥{优惠总价}');
  assert.equal(productParameterPreview('monthlyPrice',life,false,ended),'¥{总价}');
  assert.equal(productParameterPreview('savings',life,false,active),'');
  assert.equal(productParameterPreview('productLabel',life,true,{...ended,hideLabel:false}),'{选中商品标签}');
  assert.equal(promotionVariableValues({},active)['product.price'],'¥{优惠总价}');
  assert.equal(promotionVariableValues({},ended)['product.price'],'¥{总价}');
  assert.equal(promotionVariableValues({},{...active,productType:'lifetime'})['product.price_per_month'],'¥{优惠总价}');
});

test('save/read and cross-screen copies preserve configuration, remap local group and countdown-condition references',()=>{
  let doc=fixture();doc=updateComponent(doc,'year',{props:{group:'year'}});
  doc=updateComponent(doc,'timer',{props:{promotion:{enabled:true,group:'year',hideSavings:false}}});
  doc.logic={rules:[{id:'rule',conditions:[{type:'countdown',source:'timer',operator:'equals',value:'ended'}],effects:[{target:'buy',kind:'text',value:'继续'}]}]};
  const store=storage();assert.ok(validDocument(doc));assert.ok(saveComponentDocument(store,doc));
  assert.deepEqual(timer(readComponentDocument(store,doc.templateId)).props.promotion,timer(doc).props.promotion);
  const destination={...fixture(),root:component('target','Screen','目标')};
  const pasted=pasteFragment(destination,'target',copyFragment(doc,'screen',true));
  const items=[...indexDocument(pasted.document).nodes.values()],copiedTimer=items.find(node=>node.type==='Countdown');
  const copiedPackage=items.find(node=>node.id.endsWith('/year')||node.type==='Package'&&node.props.group===node.id);
  assert.ok(copiedTimer);assert.ok(copiedPackage);assert.equal(copiedTimer.props.promotion.group,copiedPackage.id);
  assert.equal(pasted.document.logic.rules[0].conditions[0].source,copiedTimer.id);
  assert.equal(logicMatches(doc.logic.rules[0],doc,runtime(doc,new Map(),now+6000)),false);
  const clocks=new Map();runtime(doc,clocks);assert.equal(logicMatches(doc.logic.rules[0],doc,runtime(doc,clocks,now+6000)),true);
  for(const promotion of [null,[],{enabled:'yes'},{group:10},{hideSavings:1}])assert.equal(validDocument(updateComponent(doc,'timer',{props:{promotion}})),false);
});

let server,Preview,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());
const event={stopPropagation(){},preventDefault(){}};
test('real preview changes fields and empty decorations together, keeps purchasing and rechecks expiry between display ticks',async()=>{
  const doc=updateComponent(fixture(),'timer',{props:{timeSource:'business',timeSourceId:'sale'}});
  doc.business={timeSources:[{id:'sale',key:'time.sale',name:'活动',scope:'campaign'}]};
  let renderer,status='',payload;
  const context=(status='active',duration=60000)=>createBusinessTimeContext({serverTime:new Date(now).toISOString(),values:{'time.sale':{status,expiresAt:new Date(now+duration).toISOString()}}});
  const render=businessTime=>React.createElement(Preview,{document:doc,businessTime,editing:false,onSelect(){},onStatus:value=>status=value,onPurchasePreview:value=>payload=value});
  const node=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  const text=node=>typeof node==='string'?node:node.children.map(text).join('');
  try {
    await act(async()=>{renderer=Renderer.create(render(context()));});
    assert.equal(text(node('year/price')),'¥{优惠月价}/月');assert.equal(text(node('year/variable')),'¥{优惠总价}');
    await act(async()=>node('buy').props.onClick(event));assert.equal(payload.priceSource,'discount');assert.match(status,/未发起真实交易/);
    for(const state of ['ended','unavailable']) {
      await act(async()=>renderer.update(render(context(state))));
      assert.equal(text(node('year/price')),'¥{月价}/月');assert.equal(node('year/label-box'),undefined);assert.equal(node('year/reference'),undefined);
      await act(async()=>node('buy').props.onClick(event));assert.equal(payload.priceSource,'regular');assert.equal(payload.simulated,true);
    }
    await act(async()=>renderer.update(render(context('active',100))));
    assert.equal(node('year').props['data-price-source'],'discount');
    await new Promise(resolve=>setTimeout(resolve,160));
    await act(async()=>node('buy').props.onClick(event));assert.equal(payload.priceSource,'regular');assert.match(status,/正常价格/);
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});

test('real properties exposes opt-in, target options, reversible flags and session-only state preview',async()=>{
  let doc=updateComponent(fixture(),'timer',{props:{promotion:{enabled:false}}}),navigation={},renderer;
  const render=()=>{const {nodes,parents}=indexDocument(doc),selected=nodes.get('timer');return React.createElement(Properties,{selected,p:selected.props,document:doc,nodes,parents,navigation,patch:props=>{doc=updateComponent(doc,'timer',{props});renderer.update(render());},setNavigation:patch=>{navigation={...navigation,...patch};renderer.update(render());},onStatus(){},demoSkus:[],fieldNames:{},findPackage(){return null;},resolveText(){return '';}});};
  const select=label=>renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']===label)[0];
  try {
    await act(async()=>{renderer=Renderer.create(render());});
    const section=renderer.root.findAll(node=>node.type==='section'&&node.findAll(child=>child.type==='strong'&&child.children.includes('优惠联动')).length)[0];
    assert.ok(section);
    const add=section.findAll(node=>node.type==='button'&&node.props['aria-label']==='添加配置')[0];
    await act(async()=>add.props.onClick());
    assert.equal(timer(doc).props.promotion.enabled,true);assert.ok(select('影响套餐'));
    await act(async()=>select('影响套餐').props.onChange({target:{value:'products'}}));
    assert.equal(timer(doc).props.promotion.group,'products');
    const before=structuredClone(doc);
    const ended=renderer.root.findAll(node=>node.type==='button'&&node.props['aria-label']==='预览优惠已结束')[0];
    await act(async()=>ended.props.onClick());assert.equal(navigation.timer,'ended');assert.deepEqual(doc,before);
    assert.equal(renderer.root.findAll(node=>node.type==='button'&&node.props['aria-label']==='预览优惠已结束')[0].props['aria-pressed'],true);
  } finally {if(renderer)await act(async()=>renderer.unmount());}
});
