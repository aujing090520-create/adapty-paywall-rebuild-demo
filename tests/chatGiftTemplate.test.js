import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,importComponentDocument,indexDocument,validDocument,updateComponent} from '../src/builder/componentDocument.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {pageFrame} from '../src/builder/pagePresentation.js';
import {workflowContext} from '../src/builder/workflow.js';
import {PAYWALL_STYLE_TYPES} from '../src/paywallMetadata.js';
import {patchComponentProperties} from '../src/builder/componentOperations.js';
import {packagePriceMode,productParameterPreview} from '../src/products/productParameters.js';

const template=templates.find(item=>item.id==='ht-chat-gift');
const make=()=>importComponentDocument(createBuilderNodes(template.id),template);
test('chat gift template uses ordinary screens, tab controls and packages inside independent embedded regions',()=>{
  const doc=make(),{nodes}=indexDocument(doc);assert.ok(validDocument(doc));assert.equal(template.title,'聊天中送礼');assert.ok(PAYWALL_STYLE_TYPES.includes(template.title));
  assert.equal([...nodes.values()].filter(node=>node.type==='Package').length,6);assert.equal(workflowContext(doc).parallel,true);
  for(const key of ['vip','plus']){
    const screen=nodes.get(`chat-gift/${key}`),frame=pageFrame(screen.props);
    assert.equal(frame.mode,'embedded');assert.equal(frame.top,530);assert.equal(frame.width,390);assert.equal(frame.height,314);
    assert.equal(screen.children.at(-1).type,'Footer');assert.equal(screen.props.embedPreviewContext,'chat-gifts');
  }
  assert.equal([...nodes.values()].some(node=>node.id.includes('host')),false,'external host must not become editable content');
});
test('embedded region is generic, clamps geometry and retains settings across presentation changes',()=>{
  const props={pagePresentation:'embedded',embedWidth:240,embedHeight:180,embedLeft:30,embedTop:80};
  assert.deepEqual(pageFrame(props,600),{mode:'embedded',width:240,height:180,left:30,top:80,inset:0,radius:0});
  const bounded=pageFrame({...props,embedWidth:999,embedHeight:999,embedLeft:999,embedTop:999},600);
  assert.deepEqual(bounded,{mode:'embedded',width:390,height:600,left:0,top:0,inset:0,radius:0});
  let doc={version:3,products:{},root:component('custom','Screen','任意场景',props)};
  doc=updateComponent(doc,'custom',{props:{pagePresentation:'fullscreen'}});doc=updateComponent(doc,'custom',{props:{pagePresentation:'embedded'}});
  assert.deepEqual(pageFrame(JSON.parse(JSON.stringify(doc)).root.props,600),pageFrame(props,600));
});
test('every gift package exposes the same standard fields and four price modes, preserving lifetime adaptation and embedded bounds',()=>{
  const document=make(),original=structuredClone(document),packages=[...indexDocument(document).nodes.values()].filter(node=>node.type==='Package');
  for(const plan of packages){
    const parameters=[...indexDocument({root:plan}).nodes.values()].filter(node=>node.type==='ProductParameter');
    assert.deepEqual(parameters.map(node=>node.props.parameter),['productLabel','skuDuration','totalReferencePrice','totalPrice','productInfo']);
    let next=document;
    for(const [mode,primary,reference] of [['0','monthlyPrice','monthlyReferencePrice'],['3','totalPrice','monthlyReferencePrice'],['4','monthlyPrice','totalReferencePrice'],['1','totalPrice','totalReferencePrice']]){
      next=patchComponentProperties(next,plan.id,{priceMode:mode});const {nodes}=indexDocument(next),current=nodes.get(plan.id);
      assert.equal(packagePriceMode(current),mode);assert.equal(nodes.get(`${plan.id}/price`).props.parameter,primary);assert.equal(nodes.get(`${plan.id}/reference`).props.parameter,reference);assert.equal(nodes.get(`${plan.id}/reference`).props.strike,true);
      if(plan.props.productType==='lifetime')assert.equal(productParameterPreview(primary,current),'¥{总价}');
      assert.equal(current.props.height,104);assert.deepEqual(nodes.get('chat-gift/vip').props,original.root.children[0].children[0].props);
    }
    assert.deepEqual(next.products,document.products);
  }
  assert.deepEqual(document,original);
});
let server,Preview;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>server?.close());
test('real preview switches VIP and PLUS, isolates package selection, simulates purchase and bounds the editable surface',async()=>{
  let renderer,status;const event={stopPropagation(){},preventDefault(){}};
  const node=id=>renderer.root.findAll(entry=>typeof entry.type==='string'&&entry.props['data-component-id']===id)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:make(),editing:false,onSelect(){},onStatus:value=>status=value}));});
    assert.equal(node('chat-gift/vip').props.style.height,314);assert.equal(node('chat-gift/vip').props.style.top,530);
    assert.equal(node('chat-gift/vip/package-2').props['aria-pressed'],true);
    await act(async()=>node('chat-gift/vip/tab-1').props.onClick(event));assert.ok(node('chat-gift/plus'));assert.equal(node('chat-gift/vip'),undefined);
    await act(async()=>node('chat-gift/plus/package-0').props.onClick(event));assert.equal(node('chat-gift/plus/package-0').props['aria-pressed'],true);
    await act(async()=>node('chat-gift/plus/purchase').props.onClick(event));assert.match(status,/未发起|模拟|演示/);
    await act(async()=>node('chat-gift/plus/tab-0').props.onClick(event));assert.equal(node('chat-gift/vip/package-2').props['aria-pressed'],true);
    await act(async()=>node('chat-gift/vip/tab-1').props.onClick(event));assert.equal(node('chat-gift/plus/package-0').props['aria-pressed'],true);
  }finally{await act(async()=>renderer?.unmount());}
});
