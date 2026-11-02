import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {buildIntroPriceTemplate,upgradeIntroCountdown} from '../src/builder/introPriceTemplate.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {COMPONENT_TYPES,component,indexDocument,validDocument,importComponentDocument,saveComponentDocument,readComponentDocument,updateComponent} from '../src/builder/componentDocument.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {applyPackagePriceMode} from '../src/products/productParameters.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {workflowIssues} from '../src/builder/workflow.js';
import {PAYWALL_STYLE_TYPES} from '../src/paywallMetadata.js';
import iconCatalog from '../src/builder/tablerCatalog.json' with {type:'json'};

test('intro price is registered, valid and composed exclusively of existing editable components',()=>{
  const template=templates.find(item=>item.id==='ht-intro-price'),doc=importComponentDocument(createBuilderNodes(template.id),template),{nodes,parents}=indexDocument(doc);
  assert.equal(template.title,'HelloTalk 入门价格页');assert.equal(template.nativeDocument,true);assert.equal(template.productCount,1);assert.ok(PAYWALL_STYLE_TYPES.includes('入门价格页'));
  assert.ok(validDocument(doc));assert.deepEqual(structureIssues(doc),[]);assert.deepEqual(workflowIssues(doc),[]);
  assert.ok([...nodes.values()].every(node=>COMPONENT_TYPES.includes(node.type)&&node.type!=='Custom'));
  assert.equal(doc.root.props.pagePresentation,'fullscreen');
  for(const id of ['intro/header','intro/content','intro/footer'])assert.equal(parents.get(id),doc.root.id);
  assert.equal(parents.get('intro/package'),'intro/content');assert.equal(parents.get('intro/purchase'),'intro/footer');assert.equal(parents.get('intro/close'),'intro/header');
  assert.equal([...nodes.values()].filter(node=>node.props.action?.action==='Dismiss').length,1);
  assert.equal(nodes.get('intro/purchase').props.action.packageId,'intro/package');
});
test('intro prices stay parameter-owned and footer uses the configurable countdown',()=>{
  const doc=buildIntroPriceTemplate(),{nodes}=indexDocument(doc);
  assert.equal(doc.productFieldPreview,true);assert.equal(nodes.get('intro/package').props.priceMode,'0');
  assert.equal(nodes.get('intro/price').props.parameter,'monthlyPrice');assert.equal(nodes.get('intro/reference').props.parameter,'monthlyReferencePrice');assert.equal(nodes.get('intro/reference').props.strike,true);
  assert.equal(nodes.get('intro/headline').props.text,'首月额外20%优惠！');
  const timer=nodes.get('intro/cutoff');assert.equal(timer.type,'Countdown');assert.equal(timer.props.start,'00:23:59');assert.equal(timer.props.countFrom,'minutes');assert.equal(timer.props.linkProducts,false);assert.equal(timer.props.timingMode,'everyEntry');
  assert.equal(timer.children[0].children.length,1);assert.match(nodes.get('intro/cutoff/text').props.text,/count_minutes_with_zero.*count_seconds_with_zero/);
  assert.equal(nodes.get('intro/benefits').children.length,3);assert.ok(![...nodes.values()].some(node=>['Image','Custom'].includes(node.type)));
  assert.ok(iconCatalog.icons.some(([name,styles])=>name==='crown'&&(styles&2)));assert.ok(!JSON.stringify(doc).includes('¥28'));assert.ok(!JSON.stringify(doc).includes('¥58'));
});
test('old static cutoff upgrades narrowly, preserves style and identity and never restores deletions or overwrites custom copy',()=>{
  const doc=buildIntroPriceTemplate(),footer=doc.root.children.find(node=>node.type==='Footer');
  footer.children[0]=component('intro/cutoff','Text','文字',{text:'优惠截止时间 23:59',fontSize:19,color:'#123456',marginTop:3});
  const before=structuredClone(doc),fixed=upgradeCanonicalComponents(doc),{nodes,parents}=indexDocument(fixed),timer=nodes.get('intro/cutoff');
  assert.deepEqual(doc,before);assert.equal(timer.type,'Countdown');assert.equal(parents.get(timer.id),'intro/footer');assert.equal(timer.props.marginTop,3);assert.equal(nodes.get('intro/cutoff/text').props.fontSize,19);assert.equal(nodes.get('intro/cutoff/text').props.color,'#123456');
  assert.deepEqual(fixed.root.children.slice(0,2),before.root.children.slice(0,2));assert.deepEqual(fixed.products,before.products);assert.deepEqual(structureIssues(fixed),[]);assert.equal(upgradeIntroCountdown(fixed),fixed);
  const edited=structuredClone(before);edited.root.children.find(node=>node.type==='Footer').children[0].props.text='我的截止说明';assert.equal(upgradeIntroCountdown(edited),edited);
  const deleted=structuredClone(before);deleted.root.children.find(node=>node.type==='Footer').children.shift();assert.equal(upgradeIntroCountdown(deleted),deleted);
  assert.equal(upgradeIntroCountdown({...before,templateId:'custom'}).templateId,'custom');
});
test('intro retains generic price modes, presentation, persistence and cross-screen copying without mutating defaults',()=>{
  const doc=buildIntroPriceTemplate(),before=structuredClone(doc),card=indexDocument(doc).nodes.get('intro/package');
  const total=applyPackagePriceMode(card,'1'),totalNodes=indexDocument({root:total}).nodes;
  assert.equal(totalNodes.get('intro/price').props.parameter,'totalPrice');assert.equal(totalNodes.get('intro/reference').props.parameter,'totalReferencePrice');
  assert.equal(indexDocument({root:applyPackagePriceMode(total,'0')}).nodes.get('intro/price').props.parameter,'monthlyPrice');
  const changed=updateComponent(doc,doc.root.id,{props:{pagePresentation:'sheet',windowHeight:600}});assert.equal(changed.root.props.windowHeight,600);
  const pasted=pasteFragment({version:3,templateId:'target',products:{},root:component('target','Screen')},'target',copyFragment(doc,card.id));assert.ok(validDocument(pasted.document));
  const store=new Map(),storage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};assert.ok(saveComponentDocument(storage,doc));assert.deepEqual(readComponentDocument(storage,doc.templateId),doc);
  assert.deepEqual(doc,before);assert.deepEqual(buildIntroPriceTemplate(),before);
});
let server,Preview;
const previousObserver=globalThis.ResizeObserver;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>{await server?.close();globalThis.ResizeObserver=previousObserver;});
test('real intro preview keeps fixed chrome, selected package, crossed reference price and mock purchase/close',async()=>{
  let renderer,status='',dismissed=0;const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===id)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:buildIntroPriceTemplate(),editing:false,onSelect(){},onStatus:value=>status=value,onDismiss(){dismissed++;}}));});
    assert.equal(node('intro/header').props.style.gridRow,1);assert.equal(node('intro/footer').props.style.gridRow,3);assert.equal(node('intro/package').props['aria-pressed'],true);assert.equal(node('intro/reference').props.style.textDecoration,'line-through');
    assert.equal(node('intro/cutoff/text').children.join(''),'优惠截止时间 23:59');
    await act(async()=>node('intro/purchase').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(status,'购买预览：未发起真实交易');
    await act(async()=>node('intro/close').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(dismissed,1);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
test('ended intro countdown shows ended copy while keeping price fields and normal purchase',async()=>{
  const doc=updateComponent(buildIntroPriceTemplate(),'intro/cutoff',{props:{timingMode:'deadline',deadline:'2000-01-01T00:00:00Z'}});let renderer,status='';
  const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===id)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus:value=>status=value}));});
    assert.equal(node('intro/cutoff/ended-text').children.join(''),'优惠已结束');assert.equal(node('intro/cutoff/text'),undefined);assert.ok(node('intro/price'));
    await act(async()=>node('intro/purchase').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(status,'购买预览：未发起真实交易');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
