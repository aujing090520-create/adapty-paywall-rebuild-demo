import test from 'node:test';
import assert from 'node:assert/strict';
import {component as c,indexDocument,validDocument,updateComponent} from '../src/builder/componentDocument.js';
import {normalizeHtLabelSlots,pruneGeneratedEmptyLayouts,layoutContainerReasons} from '../src/builder/layoutContainers.js';
import {templates} from '../src/templates/templateDefinitions.js';
import {templateDocument} from '../scripts/lib/component-structure-contract.mjs';
const fixture=()=>({version:3,templateId:'ht-blue-privilege',products:{data:{name:'原商品'}},root:c('root','Screen','页面',{},[c('products/package-header-0','Stack','布局容器',{heightMode:'fixed',height:50,gap:8},[c('products/badge-space-0','Stack','布局容器',{heightMode:'fixed',height:26},[c('products/package-0/product-label','Stack','布局容器',{heightMode:'fixed',height:26,radius:14,background:'linear-gradient(90deg,red,green)',productField:'badgeText'},[c('param','ProductParameter','商品参数',{parameter:'productLabel'})])]),c('term','ProductParameter','商品参数',{parameter:'skuDuration'})])])});
test('duplicate HT label spacer merges without changing actual label styles, parameters or ordering',()=>{
  const source=fixture(),before=structuredClone(source),next=normalizeHtLabelSlots(source),nodes=indexDocument(next).nodes;
  assert.equal(nodes.has('products/badge-space-0'),false);assert.deepEqual(nodes.get('products/package-0/product-label'),indexDocument(source).nodes.get('products/package-0/product-label'));
  assert.deepEqual(nodes.get('products/package-header-0').children.map(n=>n.id),['products/package-0/product-label','term']);
  assert.deepEqual(next.products,source.products);assert.deepEqual(source,before);assert.ok(validDocument(next));assert.equal(normalizeHtLabelSlots(next),next);
});
test('saved custom geometry, state visibility, extra children and references protect their container',()=>{
  const target='products/badge-space-0';
  for(const props of [{height:40},{paddingTop:3},{hidden:true},{axis:'horizontal'}]){
    const source=updateComponent(fixture(),target,{props});assert.ok(indexDocument(normalizeHtLabelSlots(source)).nodes.has(target));
  }
  const referenced=fixture();referenced.logic={rules:[{target}]};assert.ok(indexDocument(normalizeHtLabelSlots(referenced)).nodes.has(target));
  const customized=fixture();indexDocument(customized).nodes.get(target).children.push(c('extra','Text','文字',{text:'保留'}));assert.ok(indexDocument(normalizeHtLabelSlots(customized)).nodes.has(target));
  const other={...fixture(),templateId:'custom'};assert.equal(normalizeHtLabelSlots(other),other);
});
test('only known empty generated shells are pruned; fixed spacers, surfaces, data and semantic containers stay',()=>{
  const source={version:3,products:{},root:c('root','Screen','页面',{},[
    c('footer','Stack','空分组',{axis:'vertical',gap:8}),c('generated/detail-0','Stack','空说明',{gap:2,textAlign:'center'}),
    c('custom-empty','Stack','用户空容器',{}),c('products','Stack','商品组',{selectionGroup:true}),
    c('spacer','Stack','固定占位',{heightMode:'fixed',height:26}),c('surface','Stack','背景',{background:'#fff'}),
    c('features','Stack','有联动的空分组',{}),c('list-2','Stack','数据列表',{dataSource:'gifts'}),
  ])};source.logic={rules:[{target:'features'}]};
  const next=pruneGeneratedEmptyLayouts(source),nodes=indexDocument(next).nodes;
  assert.equal(nodes.has('footer'),false);assert.equal(nodes.has('generated/detail-0'),false);
  for(const id of ['custom-empty','products','spacer','surface','features','list-2'])assert.ok(nodes.has(id),id);
  assert.equal(source.root.children.length,8);
});
test('all template layout containers receive a responsibility assessment and remaining empty generated shells are referenced',()=>{
  let count=0;
  for(const template of templates){const document=templateDocument(template),{nodes,parents}=indexDocument(document);assert.ok(validDocument(document),template.id);for(const node of nodes.values())if(node.type==='Stack'){count++;assert.ok(layoutContainerReasons(node,nodes.get(parents.get(node.id))).length);}}
  assert.ok(count>1000);
});
