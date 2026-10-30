import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFreeTrialTemplate} from '../src/builder/freeTrialTemplate.js';
import {component,indexDocument,saveComponentDocument,readComponentDocument,removeComponent,updateComponent} from '../src/builder/componentDocument.js';
import {logicMatches} from '../src/builder/paywallLogic.js';
import {purchaseTarget,purchaseTargets} from '../src/builder/purchaseTarget.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';

test('trial template uses only existing components with owned navigation, footer, packages and modal',()=>{
  const doc=buildFreeTrialTemplate(),{nodes,parents}=indexDocument(doc);
  assert.deepEqual(structureIssues(doc),[]);
  assert.equal(nodes.get('trial/pages').children.filter(node=>node.type==='Slide').length,3);
  assert.equal(parents.get('trial/header'),'trial/screen');assert.equal(parents.get('trial/footer'),'trial/screen');
  assert.equal(parents.get('trial/retention'),'trial/close');assert.equal(nodes.get('trial/close').props.action.actionPage,'trial/retention');
  assert.equal(nodes.get('trial/confirm').props.action.packageId,'trial/annual');assert.equal(nodes.get('trial/purchase').props.action.packageId,undefined);
  assert.equal(nodes.get('trial/pages').props.autoPlay,false);
  assert.equal(nodes.get('trial/annual/price').type,'ProductParameter');assert.equal(nodes.get('trial/annual/price').props.parameter,'monthlyPrice');
});
test('component page conditions use identities, preserve older tab conditions and reject stale targets',()=>{
  const doc=buildFreeTrialTemplate(),condition={enabled:true,conditions:[{type:'page',source:'trial/pages',value:'trial/plans'}]};
  assert.equal(logicMatches(condition,doc,{'trial/pages':2}),true);assert.equal(logicMatches(condition,doc,{}),false);
  assert.equal(logicMatches({...condition,conditions:[{type:'page',source:'gone',value:'trial/plans'}]},doc,{}),false);
  assert.equal(logicMatches({conditions:[{type:'package',value:'trial/monthly'}]},doc,{},indexDocument(doc).nodes.get('trial/monthly')),true);
});
test('explicit package purchase cannot bind a deleted package or a different screen or modal scope',()=>{
  const doc=buildFreeTrialTemplate(),{nodes}=indexDocument(doc),button=nodes.get('trial/confirm');
  assert.equal(purchaseTarget(doc,button,null)?.id,'trial/annual');assert.equal(purchaseTargets(doc,button).length,2);
  assert.equal(purchaseTarget(removeComponent(doc,'trial/annual'),button,nodes.get('trial/monthly')),null);
  assert.equal(purchaseTarget(updateComponent(doc,'trial/packages',{props:{hidden:true}}),button,null),null);
  const hidden={...doc,logic:{...doc.logic,rules:[{conditions:[{type:'variable',source:'hide',value:true}],effects:[{target:'trial/packages',kind:'hide'}]}],variables:[{key:'hide',value:true}]}};
  assert.equal(purchaseTarget(hidden,button,null),null);assert.equal(purchaseTarget(hidden,button,null,{'business:hide':false})?.id,'trial/annual');
  const other=component('other','Screen','其他页面',{},[component('foreign','Package','商品',{dataKey:'foreign'})]);
  const split={...doc,products:{...doc.products,foreign:{}},root:component('root','Screen','页面',{},[component('flow','Flow','流程',{},[doc.root,other])])};
  assert.equal(purchaseTarget(split,{...button,props:{...button.props,action:{action:'Purchase',packageId:'foreign'}}},null),null);
  const {nodes:next}=indexDocument(doc),modal=next.get('trial/retention');modal.children.push(component('in-modal','Package','商品',{dataKey:'foreign'}));doc.products.foreign={};
  assert.equal(purchaseTarget(doc,{...button,props:{...button.props,action:{action:'Purchase',packageId:'in-modal'}}},null),null);
});
test('trial configuration roundtrips and copied subtrees remap package targets and page/package conditions',()=>{
  const doc=buildFreeTrialTemplate(),values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  assert.ok(saveComponentDocument(storage,doc));assert.deepEqual(readComponentDocument(storage,doc.templateId),doc);
  const target={version:3,templateId:'copy',products:{},root:component('target','Screen','页面',{},[component('flow','Flow','流程')])};
  const result=pasteFragment(target,'flow',copyFragment(doc,doc.root.id)).document,{nodes}=indexDocument(result);
  const button=[...nodes.values()].find(node=>node.props.action?.packageId);
  assert.ok(button);assert.notEqual(button.props.action.packageId,'trial/annual');assert.equal(nodes.get(button.props.action.packageId)?.type,'Package');
  assert.equal(nodes.get(button.props.action.packageId).props.defaultSelected,true);
  assert.ok(nodes.has(nodes.get(button.props.action.packageId).props.group));
  for(const rule of result.logic.rules)for(const condition of rule.conditions){if(condition.type==='page')assert.equal(nodes.get(condition.source)?.type,'Carousel');assert.ok(nodes.has(condition.value));}
  assert.deepEqual(structureIssues(result),[]);
});
