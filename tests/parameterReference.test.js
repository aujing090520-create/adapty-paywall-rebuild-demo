import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,componentProps,COMPONENT_TYPES,indexDocument} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {definitions,parameterRows} from '../scripts/parameterReference.mjs';
import {DEMO_SKUS} from '../src/productPricing.js';

let server,Properties;
before(async()=>{server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());
const fields={name:'商品名称',price:'主价格',reference:'参考价',supportingCopy:'辅助文案',savingCopy:'优惠说明',saveCopy:'SAVE 文案',badgeText:'标签文字'};
const noOp=()=>{};
const full={widthMode:'fill',heightMode:'fill',minWidth:1,maxWidth:600,minHeight:1,maxHeight:900,paddingMode:'individual',marginMode:'individual',radiusMode:'individual',borderEnabled:true,borderWidth:1,shadowEnabled:true,shadowBlur:6,fillEnabled:true,appearanceEnabled:true,maskEnabled:true,overlayEnabled:true,overlayColor:'#112233',iconBackgroundEnabled:true,iconBackground:'#ffffff',connectorEnabled:true,connectorMarginMode:'individual',autoPlay:true,badgeEnabled:true,badge:{text:'徽标',shape:'rectangle',radiusMode:'individual',paddingMode:'individual',marginMode:'individual',borderEnabled:true,borderWidth:1,shadowEnabled:true,shadowBlur:6}};
const variants=[{},full,{...full,paddingMode:'axis',marginMode:'axis',radiusMode:'all',badge:{...full.badge,radiusMode:'all',paddingMode:'axis',marginMode:'axis'}},{...full,fillType:'image',backgroundImage:'/test.png'},{...full,fillType:'video',backgroundVideo:'/test.mp4'},{heightMode:'fixed',widthMode:'fixed',width:300,height:300,wrap:true,axis:'horizontal',opacity:80,align:'stretch'},{heightMode:'fit',start:'00:10:00',deadline:'',html:'<p>旧内容</p>',timerField:'hours',binding:{key:'sample',field:'price'}},{...full,switchControl:true,thumbColor:'#ffffff',trackColor:'#167aff'},{...full,mediaType:'pag',pagSrc:'/test.pag',fallbackSrc:'/test.png',pagLoop:false,pagAutoPlay:false},{...full,dataSource:'gifts'},{...full,dataSource:'benefits'},{timeSource:'business',timeSourceId:'sale'}];

test('reference covers every component and every rendered scalar field across default, optional and conditional panels',async()=>{
  const missing=new Set();let count=0;
  for(const type of COMPONENT_TYPES)for(const props of [...variants,...(type==='Screen'?[{pagePresentation:'sheet'},{pagePresentation:'window'}]:[])]){
    const root=createCatalogComponent(type,'sample'),base=[...indexDocument({root}).nodes.values()].find(node=>node.type===type),selected={...base,props:{...base.props,...props}};
    const document={version:3,templateId:'reference',business:{timeSources:[{id:'sale',name:'活动',key:'campaign.sale',scope:'campaign',sample:{status:'active',expiresAt:'2030-01-01T00:00:00Z'}}]},products:{sample:{name:'示例商品',price:'¥100'}},root:component('page','Screen','页面',{},[selected])};
    const {nodes,parents}=indexDocument(document);let renderer;
    await act(async()=>{renderer=TestRenderer.create(React.createElement(Properties,{selected,p:componentProps(selected),patch:noOp,document,nodes,parents,findPackage:noOp,resolveText:()=>'',changeProduct:noOp,fieldNames:fields,demoSkus:DEMO_SKUS,setNavigation:noOp,onStatus:noOp,setDefaultPackage:noOp,onMediaType:noOp,onPageControl:noOp,onFontsChange:noOp,onCountdownContentChange:noOp,onSelectComponent:noOp}));});
    try{
      const labels=renderer.root.findAll(item=>item.type==='label'&&['rc-field','rc-checkbox-field'].includes(item.props.className)).map(item=>item.children.find(child=>typeof child==='object'&&child.type==='span')?.children.join('')).filter(Boolean);
      for(const label of labels){count++;if(!definitions.some(definition=>definition.types.includes(type)&&(definition.label===label||definition.label.replace(/^徽标/,'')===label)))missing.add(`${type}: ${label}`);}
    }finally{await act(async()=>renderer.unmount());}
  }
  assert.ok(count>2000);assert.deepEqual([...missing],[]);
});

test('action branches and bound text fields have explicit reference rows rather than generic placeholder descriptions',async()=>{
  const missing=new Set();
  for(const type of ['Button','PurchaseButton'])for(const action of ['None','NavigateTo','OpenPrivacy','OpenTerms','OpenURL','OpenPage','NextScreen','OpenSheet','CustomCheckout','WebCheckout','WebPaywall']){
    const selected={...createCatalogComponent(type,'sample'),props:{action:{action}}};
    const document={version:3,products:{},root:component('flow','Flow','流程',{},[component('screen','Screen','页面',{},[selected,component('sheet','BottomSheet','弹层')]),component('screen2','Screen','第二页')])};
    const {nodes,parents}=indexDocument(document);let renderer;
    await act(async()=>{renderer=TestRenderer.create(React.createElement(Properties,{selected,p:componentProps(selected),patch:noOp,document,nodes,parents,findPackage:noOp,resolveText:()=>'',changeProduct:noOp,fieldNames:fields,demoSkus:DEMO_SKUS,setNavigation:noOp,onStatus:noOp,setDefaultPackage:noOp}));});
    try{for(const label of renderer.root.findAll(item=>item.type==='label'&&['rc-field','rc-checkbox-field'].includes(item.props.className)).map(item=>item.children.find(child=>typeof child==='object'&&child.type==='span')?.children.join('')).filter(Boolean)){if(!definitions.some(definition=>definition.types.includes(type)&&(definition.label===label||definition.label.replace(/^徽标/,'')===label)))missing.add(`${type}/${action}: ${label}`);}}finally{await act(async()=>renderer.unmount());}
  }
  assert.deepEqual([...missing],[]);
  const rows=parameterRows();assert.equal(new Set(rows.map(row=>row.component)).size,COMPONENT_TYPES.length);
  assert.equal(rows.filter(row=>row.component==='Stack'&&row.label==='分布').length,6);
  assert.ok(rows.every(row=>row.meaning&&row.condition&&row.key));
  assert.ok(rows.some(row=>row.label==='徽标链接'));assert.ok(rows.some(row=>row.key==='action.attachEnvironment'));
});
