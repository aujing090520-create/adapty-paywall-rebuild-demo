import test from 'node:test';
import assert from 'node:assert/strict';
import {component,indexDocument,validDocument,updateComponent,saveComponentDocument,readComponentDocument,importComponentDocument} from './componentDocument.js';
import {templates,createBuilderNodes} from '../templates/templateDefinitions.js';
import {upgradeCanonicalComponents} from './componentCatalog.js';
import {pageFrame,pagePresentation,upgradePagePresentation} from './pagePresentation.js';
import {addNavigationButton,findNavigationButton} from './buttonModals.js';
import {createNavigationRow} from './navigationRows.js';
import {addWorkflowStep,workflowContext} from './workflow.js';

for(const template of templates)test(`${template.id}: explicit presentation belongs to each screen, not layout children`,()=>{
  const raw=importComponentDocument(createBuilderNodes(template.id),template),before=structuredClone(raw),next=upgradeCanonicalComponents(raw),nodes=indexDocument(next).nodes;
  assert.ok(validDocument(next));
  for(const screen of [...nodes.values()].filter(n=>n.type==='Screen'&&!n.children.some(c=>c.type==='Flow')))assert.ok(['fullscreen','sheet','window'].includes(pagePresentation(screen.props)),screen.id);
  assert.deepEqual(raw,before);
  assert.deepEqual(upgradePagePresentation(next),next);
  const main=[...nodes.values()].find(n=>n.type==='Screen'&&!n.children.some(c=>c.type==='Flow'));
  let switched=updateComponent(next,main.id,{props:{pagePresentation:'window',windowHeight:500,windowInset:20}});
  switched=updateComponent(switched,main.id,{props:{pagePresentation:'fullscreen'}});
  switched=updateComponent(switched,main.id,{props:{pagePresentation:'window'}});
  assert.equal(indexDocument(switched).nodes.get(main.id).props.windowHeight,500);
  assert.equal(indexDocument(switched).nodes.get(main.id).props.windowInset,20);
  assert.deepEqual([...indexDocument(switched).nodes.keys()],[...nodes.keys()]);
  assert.deepEqual(switched.products,next.products);
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.ok(saveComponentDocument(storage,switched));assert.deepEqual(readComponentDocument(storage,switched.templateId),JSON.parse(JSON.stringify(switched)));
});

test('window caps its own height, fullscreen fills actual viewport and keeps remembered settings',()=>{
  assert.deepEqual(pageFrame({pagePresentation:'sheet',windowHeight:900,windowInset:20},600),{mode:'sheet',height:560,inset:20,radius:24});
  assert.deepEqual(pageFrame({pagePresentation:'fullscreen',windowHeight:500,windowInset:20,windowRadius:30},844),{mode:'fullscreen',height:844,inset:0,radius:0});
});

for(const id of ['ht-membership-plans','ht-payment-recovery','ht-sku-sheet'])test(`${id}: importing a legacy half-window as a new flow step preserves page presentation`,()=>{
  const source=importComponentDocument(createBuilderNodes(id),templates.find(t=>t.id===id));
  const document={version:3,products:{},root:component('main','Screen','初始页',{},[])};
  const result=addWorkflowStep(document,{source});assert.ok(result.id);assert.ok(validDocument(result.document));
  const screen=indexDocument(result.document).nodes.get(result.id);
  assert.equal(screen.props.pagePresentation,'sheet');assert.ok(screen.props.windowHeight>0);
  assert.equal(workflowContext(result.document).steps.length,2);
  assert.ok([...indexDocument(result.document).nodes.values()].some(n=>n.type==='Package'));
});

test('adding navigation locates nested existing template close without duplicating or losing its modal action',()=>{
  let doc=upgradeCanonicalComponents(importComponentDocument(createBuilderNodes('ht-membership-plans'),templates.find(t=>t.id==='ht-membership-plans')));
  const found=findNavigationButton(doc.root),added=addNavigationButton(doc,doc.root.id);
  assert.equal(found.id,'member/header/close');assert.equal(added.document,doc);assert.equal(added.id,found.id);
  doc=updateComponent(doc,found.id,{props:{action:{action:'OpenSheet',actionPage:'retention'}}});
  assert.equal(addNavigationButton(doc,doc.root.id).document,doc);
});

test('legacy extra default close is removed, differing custom close actions are retained',()=>{
  const basic=component('member/header/close','Button','关闭',{action:{action:'Dismiss'}},[component('icon','Icon','图标',{icon:'tabler:outline:x'})]);
  const extra=component('extra','Button','关闭',{action:{action:'Dismiss'}},[component('extra/icon','Icon','图标',{icon:'tabler:outline:x'})]);
  const document={version:3,products:{},root:component('root','Screen','页面',{pagePresentation:'sheet'},[component('content','Stack','内容',{},[basic]),createNavigationRow(extra,'nav')])};
  assert.equal(indexDocument(upgradePagePresentation(document)).nodes.has('extra'),false);
  const custom=updateComponent(document,'extra',{props:{action:{action:'OpenSheet',actionPage:'custom'}}});
  assert.equal(indexDocument(upgradePagePresentation(custom)).nodes.has('extra'),true);
});
