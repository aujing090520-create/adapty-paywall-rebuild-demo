import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument} from '../src/builder/componentDocument.js';
import {patchComponentProperties,copyFragment,pasteFragment} from '../src/builder/componentOperations.js';

const fixture=(type='Button')=>({version:3,products:{},root:component('page','Screen','页面',{pagePresentation:'fullscreen'},[
  component('hint',type,'按钮',{action:{action:'ShowTooltip',hintText:'每个套餐的权益以实际配置为准。'},background:'#167aff'},[
    component('hint/text','Text','文字',{text:'查看说明'})])])});
let server,Preview,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());

test('button inspector offers a text hint action, stores its copy and preserves other action settings',async()=>{
  let document=fixture('PurchaseButton'),renderer;
  const {nodes,parents}=indexDocument(document),selected=nodes.get('hint');let patch;
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Properties,{selected,p:selected.props,patch:value=>patch=value,document,nodes,parents,navigation:{},setNavigation(){}}));});
    const action=renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='点击动作')[0];
    assert.ok(action.findAllByType('option').some(option=>option.props.value==='ShowTooltip'&&option.children[0]==='显示文本提示'));
    const input=renderer.root.findAll(node=>node.type==='textarea'&&node.props['aria-label']==='提示文案')[0];
    await act(async()=>input.props.onChange({target:{value:'套餐说明'}}));
    document=patchComponentProperties(document,'hint',patch);
    assert.equal(document.root.children[0].type,'Button');
    assert.equal(document.root.children[0].props.action.hintText,'套餐说明');
    assert.equal(document.root.children[0].children[0].props.text,'查看说明');
    assert.equal(document.root.children[0].props.background,'#167aff');
    const changed=patchComponentProperties(document,'hint',{action:{...patch.action,action:'None'}});
    assert.equal(changed.root.children[0].props.action.hintText,'套餐说明');
  }finally{await act(async()=>renderer?.unmount());}
});

test('ordinary button hint retains content, toggles by mouse and keyboard and never navigates',async()=>{
  let renderer,navigations=0;const event={stopPropagation(){},preventDefault(){}};
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:fixture(),editing:false,onSelect(){},onStatus(){},onNavigate(){navigations++;}}));});
    const button=()=>renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='hint')[0];
    assert.equal(button().props.role,'button');assert.equal(button().props['aria-label'],undefined);
    assert.equal(button().findAll(node=>node.props['data-component-id']==='hint/text'&&node.type==='div')[0].children[0],'查看说明');
    await act(async()=>button().props.onClick(event));assert.equal(button().props['aria-expanded'],true);
    await act(async()=>button().props.onKeyDown({...event,key:'Enter'}));assert.equal(button().props['aria-expanded'],false);
    await act(async()=>button().props.onKeyDown({...event,key:' '}));assert.equal(button().props['aria-expanded'],true);
    assert.equal(navigations,0);
  }finally{await act(async()=>renderer?.unmount());}
});

test('disabled and empty hints do not open, editing only selects and copy/paste retains hint configuration',async()=>{
  let renderer,status,selected;let document=fixture();const button=()=>renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='hint')[0];
  const props={document,editing:false,onSelect:id=>selected=id,onStatus:value=>status=value};const event={stopPropagation(){},preventDefault(){}};
  try{
    document=patchComponentProperties(document,'hint',{action:{action:'ShowTooltip',hintText:'   '}});
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{...props,document}));});
    await act(async()=>button().props.onClick(event));assert.equal(status,'请填写提示文案');assert.equal(button().props['aria-expanded'],false);
    document=patchComponentProperties(fixture(),'hint',{disabled:true});
    await act(async()=>renderer.update(React.createElement(Preview,{...props,document})));
    await act(async()=>button().props.onKeyDown({...event,key:'Enter'}));assert.equal(button().props['aria-expanded'],false);
    await act(async()=>renderer.update(React.createElement(Preview,{...props,document:fixture(),editing:true})));
    await act(async()=>button().props.onClick(event));assert.equal(selected,'hint');assert.equal(button().props['aria-expanded'],false);
    const target={version:3,products:{},root:component('target','Screen','新页面')};
    const pasted=pasteFragment(target,'target',copyFragment(fixture(),'hint'));
    assert.equal(JSON.parse(JSON.stringify(pasted.document)).root.children[0].props.action.hintText,'每个套餐的权益以实际配置为准。');
  }finally{await act(async()=>renderer?.unmount());}
});
