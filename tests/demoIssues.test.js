import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument,updateComponent,saveComponentDocument,readComponentDocument} from '../src/builder/componentDocument.js';
import {previewCommerceContexts} from '../src/builder/propertyModel.js';
import {interpolateVariables,PRODUCT_TEXT_VARIABLES,variableIssues} from '../src/builder/textVariables.js';
import {localizedDocument} from '../src/builder/contentLocalization.js';
import {logicMatches,logicNode} from '../src/builder/paywallLogic.js';
import {businessList} from '../src/builder/businessData.js';
import {businessPreset} from '../src/builder/businessPresets.js';
import {demoIssuesFixture} from './demoIssuesFixture.js';
import {buildBlueVipColumn} from '../src/builder/htVipColumn.js';

let server,Preview,Settings;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Settings=(await server.ssrLoadModule('/src/builder/WorkbenchSettings.jsx')).default;});
after(async()=>server?.close());
const c=component,clickEvent={stopPropagation(){},preventDefault(){}};
async function mount(document,navigation={}) {
  let renderer,status='';
  await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document,editing:false,navigation,onSelect(){},onStatus:value=>{status=value;}}));});
  const node=id=>renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']===id)[0];
  return {renderer,node,status:()=>status,click:async id=>act(async()=>node(id).props.onClick(clickEvent)),update:async next=>act(async()=>renderer.update(React.createElement(Preview,{document,editing:false,navigation:next,onSelect(){},onStatus:value=>{status=value;}}))),close:async()=>act(async()=>renderer.unmount())};
}
const documentWith=(children,products={})=>({version:3,templateId:'issues',settings:{buttonModalVersion:1},products,root:c('screen','Screen','页面',{},children)});

test('03: opening informational and commerce sheets preserves independent page selection and purchase context',async()=>{
  const copy=id=>c(id,'Text','文字',{text:'{{ product.price }}'});
  const plan=(id,key,selected=false)=>c(id,'Package','套餐',{dataKey:key,group:id,defaultSelected:selected});
  const sheet=c('sheet','BottomSheet','弹窗',{presentation:'sheet'},[copy('sheet-price'),c('close','Button','返回',{action:{action:'CloseSheet'}})]);
  const source=documentWith([plan('month','month',true),plan('year','year'),copy('background-price'),c('open','Button','详情',{action:{action:'OpenSheet',actionPage:'sheet'}},[sheet]),c('buy','PurchaseButton','购买',{action:{action:'Purchase'}})],{month:{skuId:'DEMO-BLUE-MONTH'},year:{skuId:'DEMO-BLUE-YEAR'}});
  const h=await mount(source);
  try{assert.deepEqual(h.node('background-price').children,['¥78']);await h.click('open');assert.deepEqual(h.node('background-price').children,['¥78']);assert.deepEqual(h.node('sheet-price').children,['¥78']);await h.click('close');await h.click('year');await h.click('open');assert.deepEqual(h.node('background-price').children,['¥488']);assert.deepEqual(h.node('sheet-price').children,['¥488']);await h.click('close');assert.equal(h.node('buy').props['data-purchase-sku'],'DEMO-BLUE-YEAR');await h.click('buy');assert.match(h.status(),/未发起真实交易/);}finally{await h.close();}
  const modal=updateComponent(source,'sheet',{children:[plan('offer','offer',true),copy('sheet-price')]});modal.products={...modal.products,offer:{skuId:'DEMO-SKU-YEAR'}};
  const scopes=previewCommerceContexts(modal,{overlay:'sheet'});assert.equal(scopes.background.selectedPackage.id,'month');assert.equal(scopes.floating.selectedPackage.id,'offer');
  const g=await mount(modal,{overlay:'sheet'});try{assert.deepEqual(g.node('background-price').children,['¥78']);assert.deepEqual(g.node('sheet-price').children,['¥338']);}finally{await g.close();}
});

test('05: checkout without a valid visible package is blocked instead of reporting a purchase',async()=>{
  const h=await mount(documentWith([c('buy','PurchaseButton','购买',{action:{action:'Purchase'}})]));try{await h.click('buy');assert.equal(h.status(),'请先选择有效的商品套餐');}finally{await h.close();}
});

test('04: SKU, Tab, gift and custom conditions compose without changing source or SKU records',async()=>{
  const pack=c('year','Package','套餐',{dataKey:'year',defaultSelected:true});
  const title=c('copy','Text','文字',{text:'原文'}),tabs=c('tiers','Tabs','等级',{defaultIndex:0},[c('basic','Tab'),c('vip','Tab')]);
  const source=documentWith([pack,title,tabs],{year:{skuId:'DEMO-BLUE-YEAR'}});
  source.business={bySku:{'DEMO-BLUE-YEAR':{gifts:[{id:'x',title:'礼物'}]}}};source.logic={variables:[{key:'enabled',value:true}],rules:[{id:'rule',conditions:[{type:'sku',value:'DEMO-BLUE-YEAR'},{type:'tab',source:'tiers',value:'1'},{type:'hasGift',value:true},{type:'variable',source:'enabled',value:true}],effects:[{target:'copy',kind:'text',value:'联动内容'}]}]};
  const before=structuredClone(source),rule=source.logic.rules[0];assert.equal(logicMatches(rule,source,{},pack),false);assert.equal(logicMatches(rule,source,{tiers:1},pack),true);assert.equal(logicMatches(rule,source,{tiers:1,'business:enabled':false},pack),false);
  assert.equal(logicNode(title,source,{tiers:1},pack).props.text,'联动内容');assert.deepEqual(source,before);
  const h=await mount(source,{tiers:1});try{assert.deepEqual(h.node('copy').children,['联动内容']);await h.update({tiers:0});assert.deepEqual(h.node('copy').children,['原文']);}finally{await h.close();}
  const values=new Map(),store={setItem:(key,value)=>values.set(key,value),getItem:key=>values.get(key)};assert.ok(saveComponentDocument(store,source));assert.deepEqual(readComponentDocument(store,'issues').logic,source.logic);
});

test('06: Blue VIP background is one editable ordinary container, and row actions remain independent',()=>{
  const {document}=demoIssuesFixture(),{nodes,parents}=indexDocument(document);
  assert.equal(nodes.get('benefits').props.axis,'overlay');assert.equal(nodes.get('benefits/vip-background').type,'Stack');assert.equal(nodes.get('benefits/vip-background').props.background,'#ffffff');assert.equal(parents.get('benefits/row-1'),'benefits/rows');assert.equal(nodes.get('benefits/row-1').props.action.action,'OpenPage');
  assert.deepEqual(buildBlueVipColumn(document),document);
});

test('07: every menu variable parses; period and unknown/missing variables never leak placeholders',()=>{
  const pack=c('p','Package','套餐',{dataKey:'p',defaultSelected:true}),source=documentWith([pack],{p:{skuId:'DEMO-SKU-YEAR'}});
  assert.equal(interpolateVariables('{{ product.period }}',source,pack),'12个月');
  source.logic={variables:[{key:'show',value:true}]};
  assert.equal(interpolateVariables('{{ business.show }}',source,pack,null,{'business:show':false}),'false');
  assert.deepEqual(variableIssues('{{ business.show }}',source,pack),[]);
  assert.equal(logicMatches({conditions:[{type:'sku',value:''}]},source,{},null),false);
  for(const [key] of PRODUCT_TEXT_VARIABLES)assert.ok(!interpolateVariables(`{{ ${key} }}`,source,pack).includes('{{'));
  assert.equal(interpolateVariables('未知{{ product.does_not_exist }}',source,pack),'未知');assert.equal(interpolateVariables('价格{{ product.price }}',source,null),'价格');
  assert.deepEqual(variableIssues('{{ product.does_not_exist }} {{ product.price }}',source,null).map(item=>item.reason),['未知变量','暂无数据']);
  assert.equal(interpolateVariables('{{ product.period }}',localizedDocument(source,{contentLocale:'en'}),pack),'12 months');
});

for(const template of ['ht-blue-privilege','ht-membership-plans'])test(`08: ${template} gift repetition, empty collapse, details and SKU switch work with native editable nodes`,async()=>{
  let {document,year}=demoIssuesFixture(template);document=updateComponent(document,'audit-gifts',{props:{autoExpandDelay:0}});
  const yearPack=[...indexDocument(document).nodes.values()].find(node=>document.products[node.props.dataKey]?.skuId===year),monthPack=[...indexDocument(document).nodes.values()].find(node=>document.products[node.props.dataKey]?.skuId?.endsWith('MONTH'));
  assert.equal(indexDocument(document).parents.get('audit-gifts/sheet'),'audit-gifts/details');
  assert.equal(businessList(document,'gifts',yearPack).length,2);assert.equal(businessList(document,'gifts',monthPack).length,0);assert.equal(businessPreset('GiftList','g').props.autoExpandDelay,1500);
  const h=await mount(document);try{await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});assert.ok(h.node('audit-gifts'));assert.deepEqual(h.node('audit-gifts/title').children,['身份铭牌']);assert.ok(h.node('audit-gifts/title::voucher'));await h.click('audit-gifts/details::voucher');assert.deepEqual(h.node('audit-gifts/detail-title').children,['福利券']);await h.click('audit-gifts/close');await h.click(monthPack.id);assert.equal(h.node('audit-gifts'),undefined);await h.click(yearPack.id);await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10));});assert.ok(h.node('audit-gifts'));assert.equal(h.node('audit-benefits').props.style.overflowX,'auto');}finally{await h.close();}
});

test('09: content language, RTL and platform/theme resource fallback are independent from interface language',async()=>{
  const {document}=demoIssuesFixture();document.localization.assets=[{id:'fallback',target:'audit-image',language:'zh-CN',src:'/default.png'},{id:'arabic',target:'audit-image',language:'ar',theme:'dark',platform:'android',src:'/arabic.png'}];
  const ar=localizedDocument(document,{contentLocale:'ar',contentTheme:'dark',contentPlatform:'android'}),fallback=localizedDocument(document,{contentLocale:'ar',contentTheme:'light',contentPlatform:'ios'});
  assert.equal(indexDocument(ar).nodes.get('audit-title').props.text,'مزايا العضوية');assert.equal(indexDocument(ar).nodes.get('audit-title').props.textAlign,'right');assert.equal(indexDocument(ar).nodes.get('audit-image').props.src,'/arabic.png');assert.equal(indexDocument(fallback).nodes.get('audit-image').props.src,'/default.png');
  assert.equal(indexDocument(localizedDocument(document,{contentLocale:'en'})).nodes.get('audit-title').props.text,'Member benefits');assert.equal(indexDocument(document).nodes.get('audit-title').props.text,'会员专属权益');
  const h=await mount(document,{contentLocale:'ar'});try{assert.equal(h.renderer.root.findAll(node=>node.type==='div'&&node.props.className==='nc-design')[0].props.dir,'rtl');assert.deepEqual(h.node('audit-title').children,['مزايا العضوية']);}finally{await h.close();}
  const fallbackSource=structuredClone(document);fallbackSource.localization.defaultLocale='en';fallbackSource.localization.translations.ar['audit-title']={text:''};
  fallbackSource.localization.assets.push({id:'pag',target:'audit-image',language:'ar',field:'pagSrc',src:'/arabic.pag'},{id:'poster',target:'audit-image',language:'ar',field:'fallbackSrc',src:'/poster.png'});
  const readback=indexDocument(localizedDocument(fallbackSource,{contentLocale:'ar',contentTheme:'dark',contentPlatform:'android'})).nodes;
  assert.equal(readback.get('audit-title').props.text,'Member benefits');assert.equal(readback.get('audit-image').props.pagSrc,'/arabic.pag');assert.equal(readback.get('audit-image').props.fallbackSrc,'/poster.png');assert.equal(readback.get('audit-image').props.src,'/arabic.png');
  fallbackSource.previewContentLocale='ar';fallbackSource.business.benefits[0].translations.ar={};
  assert.equal(businessList(fallbackSource,'benefits',null)[0].title,'Profile badge');
});

test('workbench settings edits actual document rules, data and translations without a JSON console',async()=>{
  let source=demoIssuesFixture().document,renderer;
  function Harness(){const [document,setDocument]=React.useState(source);source=document;return React.createElement(Settings,{document,onChange:setDocument,onClose(){},onPreview(){}});}
  await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  const click=async value=>act(async()=>renderer.root.findAll(node=>node.type==='button'&&text(node)===value)[0].props.onClick());
  try{await click('添加规则');assert.equal(source.logic.rules.length,3);await click('业务数据');await click('内容语言');const select=renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='编辑内容语言')[0];await act(async()=>select.props.onChange({target:{value:'en'}}));assert.equal(renderer.root.findAll(node=>node.type==='textarea'&&node.props['aria-label']==='内容译文')[0].props.value,'Member benefits');}finally{await act(async()=>renderer.unmount());}
});
