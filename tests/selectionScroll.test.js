import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionScrollController} from '../src/builder/selectionScroll.js';

function fixture() {
  let top = 180, height = 800;
  const listeners = new Map();
  const view = {getComputedStyle: () => ({overflowY:'auto',paddingBottom:'12px'})};
  const area = {style:{paddingBottom:'12px',overflowAnchor:''},clientHeight:620,isConnected:true,
    ownerDocument:{defaultView:view},classList:{contains:()=>false},
    get scrollHeight(){return height+parseFloat(this.style.paddingBottom)-12;},
    get scrollTop(){return Math.min(top,Math.max(0,this.scrollHeight-this.clientHeight));},
    set scrollTop(value){top=value;},
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  const target={ownerDocument:{defaultView:view},parentElement:area};
  return {area,target,shrink:()=>{height=650;},grow:()=>{height=800;},scroll:position=>{top=position;listeners.get('scroll')?.();}};
}

test('removing dependent gifts preserves the selected package position and consumes reserve on upward scroll',()=>{
  const {area,target,shrink,scroll}=fixture(),controller=selectionScrollController();
  controller.capture(target);shrink();assert.equal(area.scrollTop,30);
  controller.restore();assert.equal(area.scrollTop,180);assert.equal(area.style.paddingBottom,'162px');
  scroll(90);assert.equal(area.scrollTop,90);assert.equal(area.style.paddingBottom,'72px');
  scroll(20);assert.equal(area.scrollTop,20);assert.equal(area.style.paddingBottom,'12px');assert.equal(area.style.overflowAnchor,'');
});
test('switching back removes reserve, repeated choices do not accumulate it and navigation cleans up',()=>{
  const {area,target,shrink,grow}=fixture(),controller=selectionScrollController();
  controller.capture(target);shrink();controller.restore();
  controller.capture(target);controller.restore();assert.equal(area.style.paddingBottom,'162px');
  controller.capture(target);grow();controller.restore();assert.equal(area.style.paddingBottom,'12px');assert.equal(area.scrollTop,180);
  controller.capture(target);shrink();controller.restore();controller.clear();assert.equal(area.style.paddingBottom,'12px');
});
test('non-scrolled and non-DOM previews are unaffected',()=>{
  const controller=selectionScrollController(),{area,target,shrink}=fixture();
  controller.capture(undefined);controller.restore();area.scrollTop=0;
  controller.capture(target);shrink();controller.restore();assert.equal(area.style.paddingBottom,'12px');assert.equal(area.scrollTop,0);
});
