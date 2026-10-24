import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, {act} from 'react-test-renderer';
import {createServer} from 'vite';
import {iconLabel} from '../src/builder/iconLabels.js';

let server, Choices, Field;
const mounted=new Set(),previousDocument=globalThis.document;
before(async()=>{
  globalThis.document={getElementById(){return null;}};
  server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});
  Choices=(await server.ssrLoadModule('/src/builder/IconChoices.jsx')).default;
  Field=(await server.ssrLoadModule('/src/builder/IconField.jsx')).default;
});
after(async()=>{
  for(const renderer of mounted)await act(async()=>renderer.unmount());
  await server?.close();globalThis.document=previousDocument;
});
const options=renderer=>renderer.root.findAll(item=>item.type==='button'&&item.props.role==='option');

test('selected name and tooltip share Chinese aliases without changing icon identifiers',()=>{
  assert.equal(iconLabel('tabler:filled:lock'),'填充 · 锁');
  assert.equal(iconLabel('tabler:outline:check'),'线框 · 勾选');
  assert.equal(iconLabel('check',{check:'勾选'}),'勾选');
  assert.equal(iconLabel('tabler:outline:a-b-2'),'线框 · a-b-2');
});

test('icon grid has name-free glyph cells, accessible names, tooltips and exact selection',async()=>{
  let renderer,results,chosen;
  const onResults=items=>{results=items;};
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Choices,{query:'',value:'tabler:outline:abacus',activeIndex:0,listId:'grid',onResults,onChoose:id=>{chosen=id;}}));});mounted.add(renderer);
  assert.ok(results.length>5000);assert.equal(options(renderer).length,60);
  for(const option of options(renderer)){
    assert.ok(option.props.title);assert.equal(option.props['aria-label'],option.props.title);
    assert.equal(option.findAllByType('span').length,0);assert.equal(option.findAllByType('svg').length,1);
  }
  const selected=options(renderer).find(option=>option.props['data-icon-choice']==='tabler:outline:abacus');
  assert.equal(selected.props['aria-selected'],true);
  await act(async()=>selected.props.onClick());assert.equal(chosen,'tabler:outline:abacus');
  await act(async()=>renderer.update(React.createElement(Choices,{query:'锁 填充',value:chosen,activeIndex:0,listId:'grid',onResults,onChoose(){}})));
  assert.ok(options(renderer).length>0);assert.ok(options(renderer).every(option=>option.props['aria-label'].includes('填充')&&option.props['aria-label'].includes('锁')));
});

test('grid scrolling loads more glyphs and a new search resets the incremental limit',async()=>{
  let renderer;
  const props={query:'',value:'',activeIndex:0,listId:'scroll',onResults(){},onChoose(){}};
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Choices,props));});mounted.add(renderer);
  await act(async()=>renderer.root.findByProps({role:'listbox'}).props.onScroll({currentTarget:{scrollTop:100,clientHeight:300,scrollHeight:400}}));
  assert.equal(options(renderer).length,120);
  await act(async()=>renderer.update(React.createElement(Choices,{...props,query:'not-an-existing-icon-name'})));
  assert.equal(options(renderer).length,0);assert.equal(renderer.root.findByProps({className:'rc-icon-empty'}).children.join(''),'没有匹配图标');
  await act(async()=>renderer.update(React.createElement(Choices,props)));assert.equal(options(renderer).length,60);
});

test('combobox navigates grid rows, selects with Enter, shows the chosen name and cancels without changes',async()=>{
  let renderer,chosen=[];
  function Harness(){const [value,setValue]=React.useState('check');return React.createElement(Field,{value,legacyNames:{check:'勾选'},onChange:id=>{chosen.push(id);setValue(id);}});}
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Harness));});mounted.add(renderer);
  const input=()=>renderer.root.findByProps({role:'combobox'});
  assert.equal(input().props.value,'勾选');
  await act(async()=>input().props.onFocus());
  assert.equal(options(renderer).length,60);
  const key=async value=>act(async()=>input().props.onKeyDown({key:value,preventDefault(){}}));
  await key('ArrowDown');assert.ok(input().props['aria-activedescendant'].endsWith('-6'));
  await key('ArrowRight');assert.ok(input().props['aria-activedescendant'].endsWith('-7'));
  await key('ArrowUp');assert.ok(input().props['aria-activedescendant'].endsWith('-1'));
  const expected=options(renderer)[1].props['data-icon-choice'];
  await key('Enter');assert.deepEqual(chosen,[expected]);assert.equal(input().props['aria-expanded'],false);assert.ok(!input().props.value.startsWith('tabler:'));
  const display=input().props.value;
  await act(async()=>input().props.onFocus());await act(async()=>input().props.onChange({target:{value:'nothing-matches-this'}}));
  await key('Escape');assert.deepEqual(chosen,[expected]);assert.equal(input().props.value,display);assert.equal(input().props['aria-expanded'],false);
});
