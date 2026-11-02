import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
import {createServer} from 'vite';
import {component as c,indexDocument,validDocument} from '../src/builder/componentDocument.js';

let server,Editor;
before(async()=>{server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Editor=(await server.ssrLoadModule('/src/builder/ComponentEditor.jsx')).default;});
after(async()=>server?.close());

async function mount(){
  const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true});
  dom.window.HTMLElement.prototype.scrollTo=function(options){this.scrollTop=options?.top??0;this.scrollLeft=options?.left??0;};
  const previous=Object.fromEntries(['window','document','localStorage','ResizeObserver','IS_REACT_ACT_ENVIRONMENT'].map(key=>[key,globalThis[key]]));
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,ResizeObserver:class{observe(){}disconnect(){}},IS_REACT_ACT_ENVIRONMENT:true});
  const source={version:3,templateId:'clipboard-audit',products:{annual:{name:'年套餐',price:'¥100'}},root:c('root','Screen','工作区',{},[c('flow','Flow','流程',{initialStepId:'one'},[
    c('one','Screen','屏幕1',{},[c('group','Stack','组合',{gap:12,paddingVertical:8,background:'#abcdef'},[
      c('plan','Package','套餐',{group:'group',dataKey:'annual',defaultSelected:true},[c('price','ProductParameter','价格',{parameter:'totalPrice'})]),
      c('cta','Button','按钮',{action:{action:'Purchase',packageId:'plan'},buttonText:{mode:'package',target:'copy',group:'group',default:{text:'购买'},variants:[{packageId:'plan',text:'立即领取'}]}},[c('copy','Text','文字',{text:'购买',fontSize:19})]),
    ])]),c('two','Screen','屏幕2',{},[c('existing','Stack','目标容器',{},[c('existing-copy','Text','文字',{text:'原内容'})])]),
  ])])};
  let latest;const root=createRoot(document.getElementById('root'));
  assert.ok(validDocument(source));
  await act(async()=>root.render(React.createElement(Editor,{template:{id:source.templateId},initialNodes:[],initialDocument:source,persistence:'session',onDocumentChange:value=>{latest=value;}})));
  const row=id=>document.querySelector(`.ne-tree-row[data-layer-id="${id}"]`);
  const click=async element=>{assert.ok(element);await act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true})));};
  const menu=async(id,label)=>{
    await click(row(id).querySelector('[data-layer-menu-trigger]'));
    const item=[...document.querySelectorAll('[role="menuitem"]')].find(node=>node.textContent===label);assert.ok(item,`${id}: ${label}`);assert.equal(item.disabled,false);
    await click(item);
  };
  const select=async id=>click(row(id).querySelector('.ne-tree-select'));
  const key=async(id,key,mod='metaKey')=>{const event=new window.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key,[mod]:true});await act(async()=>row(id).querySelector('.ne-tree-select').dispatchEvent(event));return event;};
  return {row,menu,select,key,click,latest:()=>latest,close:async()=>{await act(async()=>root.unmount());dom.window.close();Object.assign(globalThis,previous);}};
}

test('screen menu pastes a real independent component tree across screens, retaining styles and internal references',async()=>{
  const h=await mount();try{
    const before=structuredClone(indexDocument(h.latest()).nodes.get('one'));
    await h.menu('group','复制图层');await h.menu('two','粘贴图层');
    const document=h.latest(),index=indexDocument(document),pasted=index.nodes.get('two').children.at(-1);
    assert.equal(index.nodes.get('two').children[0].id,'existing');assert.equal(pasted.type,'Stack');assert.notEqual(pasted.id,'group');assert.equal(pasted.props.background,'#abcdef');assert.equal(pasted.props.gap,12);
    const [plan,button]=pasted.children;assert.equal(plan.props.group,pasted.id);assert.equal(document.products[plan.props.dataKey].name,'年套餐');
    assert.equal(button.props.action.packageId,plan.id);assert.equal(button.props.buttonText.target,button.children[0].id);assert.equal(button.props.buttonText.group,pasted.id);assert.equal(button.props.buttonText.variants[0].packageId,plan.id);
    assert.deepEqual(index.nodes.get('one'),before);assert.ok(validDocument(document));assert.ok(h.row(pasted.id).classList.contains('selected'));
    assert.ok([...window.document.querySelectorAll('[data-component-id]')].some(node=>node.dataset.componentId===pasted.id));
    await h.menu('one','复制页面内容');await h.menu('two','粘贴图层');
    assert.equal(indexDocument(h.latest()).nodes.get('two').children.length,3);assert.ok(indexDocument(h.latest()).nodes.get('two').children.every(node=>node.type!=='Screen'));
  }finally{await h.close();}
});

test('Cmd/Ctrl copy and paste work between screens and containers without intercepting text fields',async()=>{
  const h=await mount();try{
    await h.select('group');assert.equal((await h.key('group','c')).defaultPrevented,true);
    await h.select('two');assert.equal((await h.key('two','v')).defaultPrevented,true);
    assert.equal(indexDocument(h.latest()).nodes.get('two').children.length,2);
    await h.select('one');await h.select('group');await h.key('group','c','ctrlKey');await h.select('two');await h.select('existing');await h.key('existing','v','ctrlKey');
    assert.equal(indexDocument(h.latest()).nodes.get('existing').children.length,2);
    const before=h.latest(),input=window.document.querySelector('input');assert.ok(input);
    for(const key of ['c','v']){const event=new window.KeyboardEvent('keydown',{bubbles:true,cancelable:true,key,metaKey:true});await act(async()=>input.dispatchEvent(event));assert.equal(event.defaultPrevented,false);}
    assert.equal(h.latest(),before);
  }finally{await h.close();}
});
