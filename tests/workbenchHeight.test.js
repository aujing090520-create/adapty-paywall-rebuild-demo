import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useWorkbenchHeight, { workbenchHeight } from '../src/builder/useWorkbenchHeight.js';

test('workbench uses its actual page offset instead of a fixed header allowance',()=>{
  assert.equal(workbenchHeight(720,299),405);
  assert.equal(workbenchHeight(900,100),784);
  assert.equal(workbenchHeight(900,300),584);
});

test('workbench bounds remain usable during page scroll and on large displays',()=>{
  assert.equal(workbenchHeight(720,-100),692);
  assert.equal(workbenchHeight(720,700),240);
  assert.equal(workbenchHeight(1800,100),1000);
});

test('workbench remeasures on resize, page scroll and parent layout, then cleans up',()=>{
  const oldWindow=globalThis.window,oldObserver=globalThis.ResizeObserver;
  const listeners=new Map(),frames=new Map(),values=new Map();
  let top=299,sequence=0,observe,disconnected=false,cancelled=0,app;
  const element={parentElement:{},getBoundingClientRect:()=>({top}),style:{getPropertyValue:key=>values.get(key),setProperty:(key,value)=>values.set(key,value)}};
  globalThis.window={innerHeight:720,addEventListener:(name,callback)=>listeners.set(name,callback),removeEventListener:name=>listeners.delete(name),requestAnimationFrame:callback=>{frames.set(++sequence,callback);return sequence;},cancelAnimationFrame:id=>{frames.delete(id);cancelled++;}};
  globalThis.ResizeObserver=class{constructor(callback){observe=callback;}observe(parent){assert.equal(parent,element.parentElement);}disconnect(){disconnected=true;}};
  function Harness(){return React.createElement('div',{ref:useWorkbenchHeight()});}
  const flush=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback());};
  try{
    act(()=>{app=TestRenderer.create(React.createElement(Harness),{createNodeMock:()=>element});});
    assert.equal(values.get('--ne-workbench-height'),'405px');
    top=20;window.innerHeight=900;listeners.get('resize')();listeners.get('scroll')();
    assert.equal(frames.size,1,'batch layout measurements into a single animation frame');
    act(flush);assert.equal(values.get('--ne-workbench-height'),'864px');
    top=300;window.innerHeight=720;observe();act(flush);
    assert.equal(values.get('--ne-workbench-height'),'404px');
    listeners.get('scroll')();act(()=>app.unmount());app=null;
    assert.equal(listeners.size,0);assert.equal(frames.size,0);assert.equal(cancelled,1);assert.equal(disconnected,true);
  }finally{if(app)act(()=>app.unmount());globalThis.window=oldWindow;globalThis.ResizeObserver=oldObserver;}
});
