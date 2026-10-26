import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useCanvasWheel, { panCanvasWheel } from '../src/builder/useCanvasWheel.js';

const canvas = () => ({ clientWidth:400, scrollWidth:1800, scrollLeft:600, clientHeight:500, scrollHeight:1300, scrollTop:100 });
const wheel = (props={}) => ({ deltaX:120, deltaY:0, deltaMode:0, cancelable:true, defaultPrevented:false, preventDefault(){this.defaultPrevented=true;}, ...props });

test('horizontal packets pan in design-independent CSS pixels in both directions',()=>{
  const element=canvas(),forward=wheel({deltaX:128.5,deltaY:4});
  assert.equal(panCanvasWheel(element,forward),true);
  assert.equal(element.scrollLeft,728.5);assert.equal(element.scrollTop,104);assert.equal(forward.defaultPrevented,true);
  const backward=wheel({deltaX:-210.25});panCanvasWheel(element,backward);
  assert.equal(element.scrollLeft,518.25);assert.equal(backward.defaultPrevented,true);
});

test('both horizontal edges and a non-overflowing canvas still consume history gestures',()=>{
  for(const [start,delta,end] of [[0,-120,0],[1390,120,1400],[1400,120,1400],[10,-120,0]]){
    const element={...canvas(),scrollLeft:start},event=wheel({deltaX:delta});
    assert.equal(panCanvasWheel(element,event),true);assert.equal(element.scrollLeft,end);assert.equal(event.defaultPrevented,true);
  }
  const element={...canvas(),scrollWidth:400,scrollLeft:0},event=wheel({deltaX:-200});
  assert.equal(panCanvasWheel(element,event),true);assert.equal(element.scrollLeft,0);assert.equal(event.defaultPrevented,true);
});

test('vertical gestures, pinch/command zoom and child-owned events remain native',()=>{
  for(const patch of [{deltaX:0,deltaY:100},{deltaX:2,deltaY:100},{ctrlKey:true},{metaKey:true},{cancelable:false},{defaultPrevented:true}]){
    const element=canvas(),event=wheel(patch);
    assert.equal(panCanvasWheel(element,event),false);assert.equal(element.scrollLeft,600);assert.equal(element.scrollTop,100);
    assert.equal(event.defaultPrevented,patch.defaultPrevented??false);
  }
});

test('shift wheel and line/page packets preserve horizontal intent',()=>{
  let element=canvas();panCanvasWheel(element,wheel({deltaX:0,deltaY:-80,shiftKey:true}));
  assert.equal(element.scrollLeft,520);assert.equal(element.scrollTop,100);
  element=canvas();panCanvasWheel(element,wheel({deltaX:3,deltaMode:1}));assert.equal(element.scrollLeft,648);
  element=canvas();panCanvasWheel(element,wheel({deltaX:1,deltaY:.5,deltaMode:2}));
  assert.equal(element.scrollLeft,1000);assert.equal(element.scrollTop,350);
});

test('listener is non-passive, local to the edit canvas, and removed in preview/unmount',()=>{
  const events=new Map(),options=[];
  const element={...canvas(),addEventListener:(name,callback,config)=>{events.set(name,callback);options.push(config);},removeEventListener:(name,callback)=>{assert.equal(events.get(name),callback);events.delete(name);}};
  const ref={current:element};
  function Harness({editing}){useCanvasWheel(ref,editing);return null;}
  let app;
  try{
    act(()=>{app=TestRenderer.create(React.createElement(Harness,{editing:true}));});
    assert.deepEqual(options,[{passive:false}]);assert.equal(events.size,1);
    const event=wheel({deltaX:-100});events.get('wheel')(event);assert.equal(element.scrollLeft,500);assert.equal(event.defaultPrevented,true);
    act(()=>app.update(React.createElement(Harness,{editing:false})));assert.equal(events.size,0);
    act(()=>app.update(React.createElement(Harness,{editing:true})));assert.equal(events.size,1);
    act(()=>app.unmount());app=null;assert.equal(events.size,0);
  }finally{if(app)act(()=>app.unmount());}
});
