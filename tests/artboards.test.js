import test from 'node:test';
import assert from 'node:assert/strict';
import { component } from '../src/builder/componentDocument.js';
import { documentArtboards } from '../src/builder/artboards.js';

test('configured screens and their sheets are peer boards without changing the document or runtime defaults', () => {
  const sheet=component('sheet','BottomSheet','优惠',{presentation:'overlay'},[component('copy','Text','正文',{text:'原优惠'})]);
  const first=component('first','Screen','首页',{},[sheet]);
  const second=component('second','Screen','第二页',{},[component('title','Text','标题',{text:'第二页正文'})]);
  const doc={version:3,products:{sku:{name:'原商品'}},root:component('root','Screen','根',{},[component('flow','Flow','流程',{defaultIndex:1},[first,second])])};
  const original=structuredClone(doc),boards=documentArtboards(doc);
  assert.deepEqual(boards.map(board=>board.node.id),['first','sheet','second']);
  assert.deepEqual(boards.map(board=>board.navigation.flow),[0,0,1]);
  assert.equal(boards[0].navigation.overlay,null);assert.equal(boards[1].navigation.overlay,'sheet');
  assert.equal(new Set(boards.map(board=>board.key)).size,3);assert.deepEqual(doc,original);
});

test('an independent exit document contributes one peer popup board, not a nested editor or duplicated implicit screen',()=>{
  const sheet=component('offer','BottomSheet','挽留弹窗',{presentation:'overlay'},[]);
  const doc={version:3,products:{sku:{name:'原商品'}},settings:{presentationSurfaceId:'offer'},root:component('root','Screen','优惠页面',{},[sheet])};
  const boards=documentArtboards(doc,'exit-1');
  assert.equal(boards.length,1);assert.equal(boards[0].owner,'exit-1');assert.equal(boards[0].document,doc);
  assert.equal(boards[0].kind,'退出优惠');assert.equal(boards[0].navigation.overlay,'offer');
});
