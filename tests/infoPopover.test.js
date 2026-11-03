import test, {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
let server,InfoPopover,position;
before(async()=>{server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});const module=await server.ssrLoadModule('/src/builder/InfoPopover.jsx');InfoPopover=module.default;position=module.popoverPosition;});
after(async()=>server?.close());
test('floating hint clamps horizontally and flips above the icon near the phone bottom',()=>{
  const result=position({left:360,top:760,bottom:784,width:20},{width:375,height:812},{width:260,height:90});
  assert.equal(result.left,107);assert.equal(result.top,662);assert.equal(result.side,'top');
  assert.ok(result.arrow<=result.width-10);
  const small=position({left:10,top:20,bottom:44,width:24},{width:200,height:150},{width:260,height:200});
  assert.equal(small.width,184);assert.equal(small.maxHeight,90);assert.equal(small.top,52);
});
test('hint toggles, resets when package changes, and editing clicks only select the parent component',async()=>{
  let renderer;const event={stopPropagation(){}};
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(InfoPopover,{label:'礼包说明',text:'说明',scope:'annual'}));});
    const button=()=>renderer.root.findByType('button');
    await act(async()=>button().props.onClick(event));assert.equal(button().props['aria-expanded'],true);
    await act(async()=>button().props.onClick(event));assert.equal(button().props['aria-expanded'],false);
    await act(async()=>button().props.onClick(event));
    await act(async()=>renderer.update(React.createElement(InfoPopover,{label:'礼包说明',text:'说明',scope:'monthly'})));assert.equal(button().props['aria-expanded'],false);
    await act(async()=>renderer.update(React.createElement(InfoPopover,{label:'礼包说明',text:'说明',scope:'monthly',editing:true})));
    await act(async()=>button().props.onClick(event));assert.equal(button().props['aria-expanded'],false);
  }finally{await act(async()=>renderer?.unmount());}
});
