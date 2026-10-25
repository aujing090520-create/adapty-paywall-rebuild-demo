import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument,validDocument,updateComponent} from '../src/builder/componentDocument.js';
import {workflowContext,workflowEdges,workflowIssues,stepDestination,addWorkflowStep,setInitialStep,moveWorkflowStep,duplicateWorkflowStep,removeWorkflowStep} from '../src/builder/workflow.js';
const c=component;
const screen=(id,children=[])=>c(id,'Screen',id,{},children);
const button=(id,action,target)=>c(id,'Button',id,{action:{action,actionPage:target}},[c(id+'/text','Text','文字',{text:id})]);
const document=(pages)=>({version:3,templateId:'audit',products:{},root:c('root','Screen','付费墙',{},[c('flow','Flow','流程',{gap:0},pages)])});

test('adding steps promotes a single screen without changing original ids, content, products or styles',()=>{
  const source={version:3,products:{plan:{skuId:'original'}},root:c('paywall','Screen','原购买屏幕',{paddingHorizontal:18,background:'#ffffff'},[c('title','Text','标题',{text:'原文',fontSize:26})])};
  const before=structuredClone(source),result=addWorkflowStep(source);
  assert.ok(validDocument(result.document));assert.deepEqual(source,before);
  const context=workflowContext(result.document);assert.equal(context.steps.length,2);assert.equal(context.initial.id,result.id);assert.equal(context.final.id,'paywall');
  assert.deepEqual(indexDocument(result.document).nodes.get('paywall'),source.root);assert.deepEqual(result.document.products,source.products);
});

test('initial step and existing destination identity survive reordering; deletion leaves a repairable missing target',()=>{
  let doc=document([screen('a',[button('continue','NextScreen')]),screen('b'),screen('c')]);
  doc=setInitialStep(doc,'b');const moved=moveWorkflowStep(doc,'b',1);
  assert.equal(workflowContext(moved).initial.id,'b');assert.equal(stepDestination(moved,indexDocument(moved).nodes.get('continue')).id,'b');
  const removed=removeWorkflowStep(moved,'b');assert.equal(stepDestination(removed,indexDocument(removed).nodes.get('continue')),null);
  assert.ok(workflowIssues(removed).some(message=>message.includes('有效的目标步骤')));assert.notEqual(workflowContext(removed).initial.id,'b');
});

test('step copies use independent product records and ids, including packages that used their own id as a data key',()=>{
  const doc=document([screen('a',[c('plan','Package','商品',{},[c('price','Text','文字',{text:'原价格'})])])]);
  doc.products.plan={skuId:'sku-original',price:'¥78'};
  const result=duplicateWorkflowStep(doc,'a'),nodes=indexDocument(result.document).nodes,copy=nodes.get(result.id),plan=copy.children[0];
  assert.deepEqual(workflowContext(result.document).steps.map(page=>page.id),['a',result.id]);assert.equal(workflowContext(result.document).initial.id,'a');
  assert.notEqual(plan.id,'plan');assert.notEqual(plan.props.dataKey,'plan');assert.deepEqual(result.document.products[plan.props.dataKey],doc.products.plan);
  result.document.products[plan.props.dataKey].price='¥99';assert.equal(doc.products.plan.price,'¥78');assert.ok(validDocument(result.document));
});

test('up to ten real steps are allowed and HT auxiliary details remain separate preserved destinations',()=>{
  let doc=document([screen('main'),...Array.from({length:16},(_,i)=>screen('ht/detail-screen-'+i))]);
  for(let count=1;count<10;count++)doc=addWorkflowStep(doc).document;
  assert.equal(workflowContext(doc).steps.length,10);const blocked=addWorkflowStep(doc);assert.equal(blocked.document,doc);assert.match(blocked.error,/10/);
  assert.equal([...indexDocument(doc).nodes.values()].filter(node=>node.id.startsWith('ht/detail-screen-')).length,16);
});

test('edges come from button actions rather than board order; rename changes only the visible title',()=>{
  const doc=document([screen('a',[button('continue','NextScreen','c')]),screen('b'),screen('c')]);
  const edges=workflowEdges(updateComponent(doc,'c',{name:'新屏幕名'}));assert.deepEqual(edges.map(edge=>[edge.source,edge.target,edge.label]),[['a','c','continue']]);
});
test('detail links and external links never appear as funnel-step edges or rewrite their original actions',()=>{
  const doc=document([screen('main',[button('权益行','OpenPage','detail'),button('external','OpenURL','https://example.com'),button('next','NextScreen','final')]),screen('final'),c('detail','Screen','详情',{auxiliary:true},[button('return','OpenPage','main')])]);
  const before=structuredClone(doc);
  assert.deepEqual(workflowEdges(doc).map(edge=>edge.id),['next']); assert.deepEqual(doc,before);
});
test('explicitly clearing a target does not silently fall back to the next array element',()=>{
  const doc=document([screen('a',[button('unbound','NextScreen',null)]),screen('b')]);
  assert.equal(stepDestination(doc,indexDocument(doc).nodes.get('unbound')),null);assert.equal(workflowEdges(doc).length,0);
  assert.ok(workflowIssues(doc).some(message=>message.includes('有效的目标步骤')));
});

let server,Preview,Picker,oldObserver;
before(async()=>{oldObserver=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Picker=(await server.ssrLoadModule('/src/builder/StepPicker.jsx')).default;});
after(async()=>{await server?.close();globalThis.ResizeObserver=oldObserver;});
test('the step template picker reads the selected real template and offers its three actual screens',async()=>{
  let renderer,chosen;
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Picker,{offerings:[],onBack(){},onAdd(document,id){chosen={document,id};}}));});
  try{
    await act(async()=>renderer.root.findAll(item=>item.type==='button'&&text(item)==='Multi-step Paywall')[0].props.onClick());
    assert.ok(renderer.root.findAll(item=>item.type==='button'&&text(item)==='权益介绍').length);
    await act(async()=>renderer.root.findAll(item=>item.type==='button'&&text(item)==='权益介绍')[0].props.onClick());
    assert.equal(workflowContext(chosen.document).steps.length,3);assert.ok(indexDocument(chosen.document).nodes.get(chosen.id).children.length);
  }finally{await act(async()=>renderer.unmount());}
});
test('exit creation shares sources but selection and cancellation never create until confirmation',async()=>{
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  let renderer,created=[];
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Picker,{purpose:'exit',offerings:[],triggerSource:{name:'购买页'},onBack(){},onAdd(source,id){created.push({source,id});}}));});
  const click=async label=>act(async()=>renderer.root.findAll(item=>item.type==='button'&&text(item).trim()===label)[0].props.onClick());
  try{
    assert.ok(text(renderer.root).includes('关闭「购买页」'));
    assert.equal(renderer.root.findAll(item=>item.type==='button'&&text(item)==='创建退出优惠')[0].props.disabled,true);
    await click('蓝色特权页');
    await click('挽留弹窗弹窗');assert.equal(created.length,0);
    await click('创建退出优惠');assert.equal(created.length,1);assert.equal(indexDocument(created[0].source).nodes.get(created[0].id).type,'BottomSheet');
    await click('空白弹窗');assert.equal(created.length,1);await click('创建退出优惠');assert.equal(created.length,2);assert.equal(created[1].source,undefined);
  }finally{await act(async()=>renderer.unmount());}
});
test('saved popup sources use their presentation root and current content uses the explicit promotion command',async()=>{
  const text=node=>typeof node==='string'?node:node.children?.map(text).join('')??'';
  const sheet=c('saved-sheet','BottomSheet','已存挽留',{},[]),source={version:3,products:{},settings:{presentationSurfaceId:sheet.id},root:screen('saved-root',[sheet])};
  let renderer,chosen,promoted;
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Picker,{purpose:'exit',offerings:[{id:'saved',name:'已保存方案',document:source}],currentDocument:source,surfaces:[sheet],onBack(){},onUseSurface(id){promoted=id;},onAdd(document,id){chosen={document,id};}}));});
  const click=async label=>act(async()=>renderer.root.findAll(item=>item.type==='button'&&text(item).trim()===label)[0].props.onClick());
  try{
    await click('已有内容');await click('已保存方案');await click('已存挽留弹窗');assert.equal(chosen,undefined);await click('创建退出优惠');assert.equal(chosen.id,sheet.id);assert.equal(chosen.document,source);
    await click('已有内容');await click('已存挽留');assert.equal(promoted,undefined);await click('创建退出优惠');assert.equal(promoted,sheet.id);
  }finally{await act(async()=>renderer.unmount());}
});
test('preview starts from the configured initial screen and Back follows actual branch history, not screen array order',async()=>{
  const doc=setInitialStep(document([screen('a',[button('go-c','NextScreen','c')]),screen('b'),screen('c',[button('back','NavigateBack')])]),'a');
  const events=[],status=[];let renderer;
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Preview,{document:doc,editing:false,navigation:{},onSelect(){},onNavigate(next){events.push(next);},onStatus(value){status.push(value);}}));});
  const node=id=>renderer.root.findAll(item=>item.type==='div'&&item.props['data-component-id']===id)[0];
  try{
    assert.ok(node('a'));assert.equal(node('b'),undefined);
    await act(async()=>node('go-c').props.onClick({stopPropagation(){}}));assert.ok(node('c'));
    await act(async()=>node('back').props.onClick({stopPropagation(){}}));assert.ok(node('a'));assert.equal(node('b'),undefined);
    const changed=setInitialStep(doc,'b');await act(async()=>renderer.update(React.createElement(Preview,{document:changed,editing:false,navigation:{},onSelect(){},onStatus(value){status.push(value);}})));assert.ok(node('b'));
    assert.deepEqual(events[0]['history:flow'],['a']);assert.equal(status.length,0);
  }finally{await act(async()=>renderer.unmount());}
});
test('checkout is blocked before the final step but remains a mock purchase on the final screen',async()=>{
  const purchase=id=>c(id,'PurchaseButton',id,{action:{action:'Purchase'}},[]);
  const doc=document([screen('a',[purchase('early'),button('next','NextScreen','b')]),screen('b',[purchase('final')])]);
  let renderer,status='';await act(async()=>{renderer=TestRenderer.create(React.createElement(Preview,{document:doc,editing:false,navigation:{},onSelect(){},onStatus(value){status=value;}}));});
  const node=id=>renderer.root.findAll(item=>item.type==='div'&&item.props['data-component-id']===id)[0];
  try{
    await act(async()=>node('early').props.onClick({stopPropagation(){}}));assert.match(status,/最终步骤/);
    await act(async()=>node('next').props.onClick({stopPropagation(){}}));await act(async()=>node('final').props.onClick({stopPropagation(){}}));assert.equal(status,'购买预览：未发起真实交易');
  }finally{await act(async()=>renderer.unmount());}
});
