import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {readFileSync} from 'node:fs';
import {buildRenewalOfferTemplate} from '../src/builder/renewalOfferTemplate.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {COMPONENT_TYPES,component,indexDocument,validDocument,importComponentDocument,saveComponentDocument,readComponentDocument,cloneComponent,updateComponent} from '../src/builder/componentDocument.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {applyPackagePriceMode} from '../src/products/productParameters.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {workflowIssues} from '../src/builder/workflow.js';
import {PAYWALL_STYLE_TYPES,paywallMetadataError} from '../src/paywallMetadata.js';

test('renewal offer registers a native editable sheet built only from existing components',()=>{
  const template=templates.find(item=>item.id==='ht-renewal-offer'),doc=importComponentDocument(createBuilderNodes(template.id),template),{nodes,parents}=indexDocument(doc);
  assert.equal(template.title,'HelloTalk 续费折扣页');assert.equal(template.nativeDocument,true);assert.equal(template.productCount,1);
  assert.ok(PAYWALL_STYLE_TYPES.includes('续费折扣页'));assert.equal(paywallMetadataError({styleType:'续费折扣页',name:'续费测试',enabled:true}),'');
  assert.ok(validDocument(doc));assert.deepEqual(structureIssues(doc),[]);assert.deepEqual(workflowIssues(doc),[]);
  assert.ok([...nodes.values()].every(node=>COMPONENT_TYPES.includes(node.type)&&node.type!=='Custom'));
  assert.equal(doc.root.props.pagePresentation,'sheet');assert.equal(doc.root.props.windowHeight,440);
  for(const id of ['renewal/header','renewal/content','renewal/footer'])assert.equal(parents.get(id),doc.root.id);
  assert.equal(parents.get('renewal/package'),'renewal/content');assert.equal(parents.get('renewal/purchase'),'renewal/footer');
  assert.equal(nodes.get('renewal/close').props.action.action,'Dismiss');assert.equal(nodes.get('renewal/purchase').props.action.packageId,'renewal/package');
  assert.equal([...nodes.values()].filter(node=>node.props.action?.action==='Dismiss').length,1);
});

test('renewal prices and periods are parameters, countdown is one variable text and product linkage defaults off',()=>{
  const doc=buildRenewalOfferTemplate(),{nodes}=indexDocument(doc);
  assert.equal(doc.productFieldPreview,true);assert.deepEqual(doc.products,{'renewal/annual':{name:'12个月',billingMonths:12}});
  for(const [id,parameter] of [['price','totalPrice'],['reference','totalReferencePrice'],['period','skuDuration'],['product-label','productLabel']])assert.equal(nodes.get(`renewal/${id}`).props.parameter,parameter);
  const timer=nodes.get('renewal/countdown');assert.equal(timer.props.start,'00:05:00');assert.equal(timer.props.linkProducts,false);assert.equal(timer.props.timingMode,'everyEntry');
  assert.equal(timer.children[0].children.length,1);assert.match(timer.children[0].children[0].props.text,/count_seconds_with_zero/);
  assert.match(nodes.get('renewal/renewal-note').props.text,/product\.original_price/);
  assert.ok(!JSON.stringify(doc).includes('71.99'));assert.ok(!JSON.stringify(doc).includes('79.99'));
});

test('presentation, price mode and copied package remain ordinary reusable configuration without mutating defaults',()=>{
  const doc=buildRenewalOfferTemplate(),before=structuredClone(doc);
  const fullscreen=updateComponent(doc,doc.root.id,{props:{pagePresentation:'fullscreen'}});assert.equal(fullscreen.root.props.pagePresentation,'fullscreen');
  const card=indexDocument(doc).nodes.get('renewal/package'),monthly=applyPackagePriceMode(card,'0');
  assert.equal(indexDocument({root:monthly}).nodes.get('renewal/price').props.parameter,'monthlyPrice');
  const copy=pasteFragment({version:3,templateId:'target',products:{},root:component('target','Screen')},'target',copyFragment(doc,card.id));
  assert.equal(copy.ids.length,1);assert.ok(validDocument(copy.document));assert.equal([...indexDocument(copy.document).nodes.values()].find(node=>node.type==='Countdown').props.linkProducts,false);
  const store=new Map(),storage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};
  assert.ok(saveComponentDocument(storage,doc));assert.deepEqual(readComponentDocument(storage,doc.templateId),doc);
  const cloned=cloneComponent(doc.root),clonedNodes=indexDocument({root:cloned}).nodes;
  const purchase=[...clonedNodes.values()].find(node=>node.type==='PurchaseButton');assert.ok(clonedNodes.has(purchase.props.action.packageId));
  assert.deepEqual(doc,before);assert.deepEqual(buildRenewalOfferTemplate(),before);
});

test('renewal static decoration is one replaceable package background, not multiple editable fragments',()=>{
  const bytes=readFileSync(new URL('../public/renewal-template/card-artwork.png',import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.ok(bytes.readUInt32BE(16)>=700);
  assert.ok(Math.abs(bytes.readUInt32BE(16)/bytes.readUInt32BE(20)-350/150)<0.02);
  const {nodes}=indexDocument(buildRenewalOfferTemplate()),card=nodes.get('renewal/package');
  assert.equal(card.props.fillType,'image');assert.equal(card.props.backgroundImage,'/renewal-template/card-artwork.png');assert.equal(card.props.backgroundFit,'fill');
  assert.equal(card.children.length,1);assert.equal(card.children[0].id,'renewal/card-content');
  assert.equal(nodes.has('renewal/card-cutout'),false);assert.equal(nodes.has('renewal/mascot'),false);
  assert.equal([...nodes.values()].filter(node=>node.type==='Image').length,0);
  const updated=updateComponent(buildRenewalOfferTemplate(),card.id,{props:{backgroundImage:'/replacement.png'}});
  assert.equal(indexDocument(updated).nodes.get(card.id).props.backgroundImage,'/replacement.png');
  for(const id of ['renewal/price','renewal/reference','renewal/countdown'])assert.deepEqual(indexDocument(updated).nodes.get(id),nodes.get(id));
});

let server,Preview;
const previousObserver=globalThis.ResizeObserver;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>{await server?.close();globalThis.ResizeObserver=previousObserver;});
test('real preview selects the annual package, keeps header/footer fixed, previews a purchase and closes',async()=>{
  const doc=buildRenewalOfferTemplate();let renderer,status='',dismissed=0;
  const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===id)[0];
  const click=async id=>act(async()=>node(id).props.onClick({stopPropagation(){},preventDefault(){}}));
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus:value=>status=value,onDismiss(){dismissed++;}}));});
    assert.equal(node('renewal/screen').props.style.height,440);assert.equal(node('renewal/header').props.style.gridRow,1);assert.equal(node('renewal/footer').props.style.gridRow,3);
    assert.equal(node('renewal/package').props['aria-pressed'],true);assert.equal(node('renewal/reference').props.style.textDecoration,'line-through');
    assert.match(node('renewal/package').props.style.backgroundImage,/card-artwork\.png/);assert.equal(node('renewal/package').props.style.backgroundSize,'100% 100%');
    await click('renewal/purchase');assert.equal(status,'购买预览：未发起真实交易');
    await click('renewal/close');assert.equal(dismissed,1);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
test('expired display-only renewal timer retains product fields and the normal mock purchase action',async()=>{
  const doc=updateComponent(buildRenewalOfferTemplate(),'renewal/countdown',{props:{timingMode:'deadline',deadline:'2000-01-01T00:00:00Z'}});let renderer,status='';
  const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===id)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus:value=>status=value}));});
    assert.equal(node('renewal/countdown/ended-text').children.join(''),'优惠已结束');assert.ok(node('renewal/product-label'));assert.ok(node('renewal/reference'));assert.ok(node('renewal/price'));
    await act(async()=>node('renewal/purchase').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(status,'购买预览：未发起真实交易');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
