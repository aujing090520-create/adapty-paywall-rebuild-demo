import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {buildVipTierTemplate} from '../src/builder/vipTierTemplate.js';
import {COMPONENT_TYPES,indexDocument,validDocument,cloneComponent,saveComponentDocument,readComponentDocument,updateComponent} from '../src/builder/componentDocument.js';
import {tabButtonTarget} from '../src/builder/componentPages.js';
import {workflowContext,workflowIssues,moveWorkflowStep} from '../src/builder/workflow.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {documentArtboards} from '../src/builder/artboards.js';
import {previewCommerceContexts} from '../src/builder/propertyModel.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {importComponentDocument} from '../src/builder/componentDocument.js';
import {PAYWALL_STYLE_TYPES} from '../src/paywallMetadata.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('VIP tier headers use the unchanged supplied full-width transparent originals without duplicate copy',()=>{
  const doc=buildVipTierTemplate(),nodes=indexDocument(doc).nodes;
  for(const [key,file,hash] of [['vip','vip-header.png','bc14ac77c97688ba5873dd32219bb571a8ca43c177a5708f1753e69f7f713fb5'],['plus','vip-plus-header.png','e1fcad09bdea4c3f424e01bef4c70d6794f1edefbb97bca2f818d61074c04545']]){
    const hero=nodes.get(`tiers/${key}/hero`),art=hero.children[0],bytes=readFileSync(new URL(`../public/vip-tiers/${file}`,import.meta.url));
    assert.equal(hero.children.length,1);assert.equal(art.type,'Image');assert.equal(art.props.src,`/vip-tiers/${file}`);
    assert.equal(art.props.widthMode,'fill');assert.equal(art.props.heightMode,'fit');assert.equal(art.props.objectFit,'contain');
    assert.equal(bytes.readUInt32BE(16),1170);assert.equal(bytes.readUInt32BE(20),384);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
    assert.equal(nodes.has(`tiers/${key}/hero/copy`),false);
  }
});

test('VIP tier template registers two complete editable screen scenes, five parameter-only packages and fixed footers',()=>{
  const template=templates.find(item=>item.id==='ht-vip-tiers'),doc=importComponentDocument(createBuilderNodes(template.id),template),{nodes,parents}=indexDocument(doc);
  assert.equal(template.title,'VIP分级页面');assert.ok(PAYWALL_STYLE_TYPES.includes(template.title));assert.ok(validDocument(doc));assert.deepEqual(structureIssues(doc),[]);assert.deepEqual(workflowIssues(doc),[]);
  assert.deepEqual(documentArtboards(doc).map(board=>board.label),['VIP','VIP+']);
  assert.equal(workflowContext(doc).parallel,true);assert.equal(Object.keys(doc.products).length,5);
  assert.ok([...nodes.values()].every(node=>COMPONENT_TYPES.includes(node.type)&&node.type!=='Custom'));
  for(const key of ['vip','plus']){
    const id=`tiers/${key}`;assert.equal(parents.get(`${id}/header`),id);assert.equal(parents.get(`${id}/footer`),id);assert.equal(parents.get(`${id}/packages`),id);
    assert.equal(nodes.get(`${id}/back`).props.action.action,'Dismiss');assert.equal(nodes.get(`${id}/comparison`).children.length,3);
    assert.equal(nodes.get(`${id}/comparison/features`).children.length,7);assert.equal(nodes.get(`${id}/tabs`).children.length,2);
  }
  assert.equal(nodes.get('tiers/vip/packages').children.length,3);assert.equal(nodes.get('tiers/plus/packages').children.length,2);
  assert.equal(nodes.get('tiers/vip/lifetime').props.productType,'lifetime');assert.equal(nodes.get('tiers/vip/lifetime/price').props.parameter,'totalPrice');
  const before=structuredClone(doc),copy=buildVipTierTemplate();copy.root.children[0].children[0].props.background='#123456';assert.deepEqual(doc,before);
});

test('parallel screen selection survives reorder and cloning, rejects deleted targets, and preserves ordinary checkout steps',()=>{
  const doc=buildVipTierTemplate(),moved=moveWorkflowStep(doc,'tiers/plus',-1),nodes=indexDocument(moved).nodes;
  assert.equal(tabButtonTarget(nodes.get('tiers/vip/tab-1').props,nodes).page.id,'tiers/plus');assert.equal(tabButtonTarget(nodes.get('tiers/vip/tab-1').props,nodes).index,0);
  const clone=cloneComponent(doc.root),index=indexDocument({root:clone});
  for(const node of index.nodes.values())if(node.type==='TabButton'){assert.ok(index.nodes.has(node.props.target));assert.ok(index.nodes.has(node.props.pageId));assert.equal(tabButtonTarget(node.props,index.nodes).page.id,node.props.pageId);}
  assert.equal(tabButtonTarget({target:'tiers/flow',pageId:'missing'},indexDocument(doc).nodes),null);
  const sequential=updateComponent(doc,'tiers/flow',{props:{navigationMode:'steps'}});assert.ok(workflowIssues(sequential).some(issue=>issue.includes('最终步骤')));assert.equal(tabButtonTarget(nodes.get('tiers/vip/tab-1').props,indexDocument(sequential).nodes),null);
  const values=new Map(),store={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};assert.ok(saveComponentDocument(store,doc));assert.deepEqual(readComponentDocument(store,doc.templateId),doc);
});

let server,Preview;
const previousWindow=globalThis.window,previousObserver=globalThis.ResizeObserver;
before(async()=>{globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>{await server?.close();globalThis.window=previousWindow;globalThis.ResizeObserver=previousObserver;});
test('real preview switches complete tier scenes, preserves independent choices, purchases either tier and closes directly',async()=>{
  const doc=buildVipTierTemplate(),statuses=[];let renderer,dismissals=0;
  const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===id)[0];
  const click=async id=>{assert.ok(node(id),id);await act(async()=>node(id).props.onClick({stopPropagation(){},preventDefault(){}}));};
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus:value=>statuses.push(value),onDismiss(){dismissals++;}}));});
    assert.ok(node('tiers/vip'));assert.equal(node('tiers/plus'),undefined);
    await click('tiers/vip/purchase');assert.equal(statuses.at(-1),'购买预览：未发起真实交易');
    await click('tiers/vip/month');assert.equal(node('tiers/vip/month').props.style.background,'#ffffff');
    await click('tiers/vip/tab-1');assert.ok(node('tiers/plus'));assert.equal(node('tiers/vip'),undefined);assert.equal(node('tiers/plus/tab-1').props.style.background,'#342369');
    assert.equal(node('tiers/plus/year').props.style.background,'#050505');await click('tiers/plus/purchase');assert.equal(statuses.at(-1),'购买预览：未发起真实交易');
    await click('tiers/plus/month');await click('tiers/plus/tab-0');assert.ok(node('tiers/vip'));assert.equal(node('tiers/vip/month').props.style.background,'#ffffff');
    await click('tiers/vip/tab-1');assert.equal(node('tiers/plus/month').props.style.background,'#050505');await click('tiers/plus/back');assert.equal(dismissals,1);
    assert.equal(previewCommerceContexts(doc,{'tiers/flow':1}).background.packages.length,2);
    assert.equal(statuses.some(value=>value.includes('只能在最终步骤')),false);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('flow tab selection in editing mode only selects the component and never swaps its artboard',async()=>{
  let renderer,selected;try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:buildVipTierTemplate(),editing:true,onSelect:id=>{selected=id;},onStatus(){}}));});
    const tab=renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']==='tiers/vip/tab-1')[0];await act(async()=>tab.props.onClick({stopPropagation(){}}));
    assert.equal(selected,'tiers/vip/tab-1');assert.ok(renderer.root.findAll(n=>n.props['data-component-id']==='tiers/vip').length);assert.equal(renderer.root.findAll(n=>n.props['data-component-id']==='tiers/plus').length,0);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
