import test from 'node:test';
import assert from 'node:assert/strict';
import { component } from './componentDocument.js';
import { treeChildren, compositionSummary, initialCollapsed, pageContext, isUnconfiguredDetailPage, surfaceContext } from './componentTree.js';
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
  assert.equal(collapsed.size,0);
  assert.ok(!collapsed.has('main'));
  assert.ok(!collapsed.has('flow'));
});

test('new and previously saved split countdowns do not distribute text across full-width slots',()=>{
  const countdown=createCatalogComponent('Countdown','timer');
  assert.ok(countdown.children[0].children.every((child)=>child.props.widthMode==='fit'));
  const old=structuredClone(countdown);
  old.children[0].children=['hours','minutes','seconds'].map((timerField)=>component(`timer/${timerField}`,'Text','数字',{timerField}));
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

test('surface roots stay owned by their real parent but are scoped to the current screen',()=>{
  const sheet=component('sheet','BottomSheet','挽留', {presentation:'overlay'},[component('offer','Text','优惠',{text:'保留文案'})]);
  const button=component('launch','Button','查看优惠',{action:{action:'OpenSheet',actionPage:'sheet'}},[sheet]);
  const main=component('main','Screen','主页面',{},[button]);
  const second=component('second','Screen','第二页',{},[component('second-sheet','BottomSheet','另一弹层',{presentation:'sheet'})]);
  const doc={version:3,products:{},root:component('root','Screen','外壳',{},[component('flow','Flow','流程',{},[main,second])])};
  const before=structuredClone(doc),context=surfaceContext(doc,{},'offer');
  assert.deepEqual(context.surfaces,[sheet]);assert.equal(context.surface,sheet);assert.deepEqual(context.triggers,[button]);
  assert.deepEqual(surfaceContext(doc,{flow:1},'second').surfaces.map(node=>node.id),['second-sheet']);
  assert.equal(surfaceContext(doc,{},'main').surface,undefined);assert.deepEqual(doc,before);
});

test('legacy retention becomes a sheet once, preserving every id, property, child and product',()=>{
  const old=component('retention','Stack','挽留弹窗',{presentation:'overlay',paddingTop:31,width:345,fontSize:13,background:'#fafafa'},[component('gift','Image','礼物',{src:'/original.png',height:150}),component('copy','Text','正文',{text:'我的文案',fontSize:21})]);
  const doc={version:3,templateId:'ht',products:{original:{skuId:'my-sku'}},root:component('root','Screen','主页面',{},[old])};
  const before=structuredClone(doc),next=upgradeCanonicalComponents(doc);
  assert.equal(next.root.children[0].type,'BottomSheet');assert.deepEqual({...next.root.children[0],type:'Stack'},old);
  assert.deepEqual(next.products,doc.products);assert.deepEqual(doc,before);assert.equal(upgradeCanonicalComponents(next),next);
});
