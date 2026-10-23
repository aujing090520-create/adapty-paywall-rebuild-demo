import test from 'node:test';
import assert from 'node:assert/strict';
import { component } from './componentDocument.js';
import { treeChildren, compositionSummary, initialCollapsed, pageContext, isUnconfiguredDetailPage } from './componentTree.js';
import { createCatalogComponent, upgradeCanonicalComponents } from './componentCatalog.js';

test('page navigation exposes only the active real screen without rewriting its modules',()=>{
  const hero=component('hero','Stack','主视觉',{},[component('image','Image','图片'),component('title','Text','标题')]);
  const main=component('main','Screen','特权首页',{},[hero,createCatalogComponent('Package','product')]);
  const detail=component('detail','Screen','权益详情',{},[component('detail-title','Text','详情标题')]);
  const flow=component('flow','Flow','页面流程',{},[main,detail]);
  assert.deepEqual(treeChildren(flow),[main]);
  assert.deepEqual(treeChildren(flow,{flow:1}),[detail]);
  assert.deepEqual(treeChildren(main),main.children);
  assert.deepEqual(treeChildren(flow,{flow:99}),[main]);
  assert.equal(flow.children.length,2);
  assert.equal(compositionSummary(hero),'图片 · 文字');
  assert.equal(compositionSummary(component('texts','Stack','内容',{},[component('a','Text','a'),component('b','Text','b')])),'文字 × 2');
  const root=component('root','Screen','页面',{},[flow]);
  const collapsed=initialCollapsed(root);
  assert.ok(collapsed.has('hero'));
  assert.ok(collapsed.has('product'));
  assert.ok(!collapsed.has('main'));
  assert.ok(!collapsed.has('flow'));
});

test('new and previously saved split countdowns do not distribute text across full-width slots',()=>{
  const countdown=createCatalogComponent('Countdown','timer');
  assert.ok(countdown.children[0].children.every((child)=>child.props.widthMode==='fit'));
  const old=structuredClone(countdown);
  old.children[0].children.forEach((child)=>delete child.props.widthMode);
  old.children[0].children[0].props.widthMode='fixed';
  old.children[0].children[0].props.width=42;
  const doc={version:3,products:{},root:component('root','Screen','页面',{},[old])};
  const upgraded=upgradeCanonicalComponents(doc);
  assert.equal(upgraded.root.children[0].children[0].children[0].props.width,42);
  assert.equal(upgraded.root.children[0].children[0].children[1].props.widthMode,'fit');
  assert.equal(upgradeCanonicalComponents(upgraded),upgraded);
});

test('page management removes document and flow wrappers from the component tree without losing shared nodes',()=>{
  const main=component('main','Screen','首页',{},[component('hero','Stack','主视觉')]);
  const detail=component('details/detail-screen-0','Screen','详情');
  const flow=component('flow','Flow','流程',{},[main,detail]);
  const shared=component('shared','Text','已有共享文字',{text:'保留'});
  const doc={root:component('root','Screen','外壳',{},[flow,shared])};
  assert.equal(pageContext(doc).active,main);
  assert.equal(pageContext(doc,{flow:1}).active,detail);
  assert.deepEqual(pageContext(doc).shared,[shared]);
  assert.deepEqual(pageContext(doc).pages,[main,detail]);
  assert.equal(doc.root.children[0],flow);
  assert.equal(pageContext({root:main}).active,main);
});

test('only generated detail shells are gated, and real configured content makes them navigable',()=>{
  const id='benefits/detail-screen-0';
  const page=component(id,'Screen','详情',{},[
    component(`${id}/back`,'Button','返回',{},[component(`${id}/back-text`,'Text','文字',{text:'返回'})]),
    component(`${id}/title`,'Text','标题',{text:'权益名称'}),
    component(`${id}/description`,'Text','说明',{text:'',localizationKey:'missing'}),
  ]);
  assert.ok(isUnconfiguredDetailPage(page));
  page.children[2].props.text='真实说明内容';
  assert.ok(!isUnconfiguredDetailPage(page));
  page.children[2].props.hidden=true;
  assert.ok(isUnconfiguredDetailPage(page));
  page.children.push(component('media','Image','详情图片',{src:'/actual.png'}));
  assert.ok(!isUnconfiguredDetailPage(page));
  assert.ok(!isUnconfiguredDetailPage(component('user-created','Screen','用户空页面')));
  assert.ok(!isUnconfiguredDetailPage(undefined));
});
