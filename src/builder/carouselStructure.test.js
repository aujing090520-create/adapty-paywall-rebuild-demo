import test from 'node:test';
import assert from 'node:assert/strict';
import {component,canContain,indexDocument,validDocument} from './componentDocument.js';
import {createCatalogComponent,upgradeCanonicalComponents,catalogFor} from './componentCatalog.js';
import {togglePageControl} from './componentOperations.js';
import {sequencePages,activeComponents} from './propertyModel.js';

const fixture=(carousel)=>({version:3,templateId:'carousel',products:{sku:{price:'原始数据'}},root:component('root','Screen','页面',{},[carousel])});
test('carousel has three pages plus unique PageControl and Indicators, never a fourth sequence page',()=>{
  const node=createCatalogComponent('Carousel','carousel'),control=node.children.at(-1);
  assert.equal(sequencePages(node).length,3);assert.equal(control.type,'PageControl');assert.equal(control.children[0].type,'Indicators');
  assert.ok(validDocument(fixture(node)));assert.equal(canContain(node,createCatalogComponent('PageControl','other')),false);
  assert.equal(canContain(control,createCatalogComponent('Indicators','other')),false);
  assert.equal(canContain(component('stack','Stack'),control),false);
  const active=activeComponents(fixture(node),{carousel:2}).map((entry)=>entry.id);
  assert.ok(active.includes('carousel/slide-2'));assert.ok(active.includes(control.id));assert.ok(!active.includes('carousel/slide-0'));
  assert.deepEqual(catalogFor(node).flatMap((group)=>group.items).map(([type])=>type),['Slide']);
});
test('removing pagination is persistent and enabling creates the actual editable child exactly once',()=>{
  const source=fixture(createCatalogComponent('Carousel','carousel')),removed=togglePageControl(source,'carousel',false);
  assert.equal(indexDocument(removed).nodes.get('carousel').children.length,3);
  assert.equal(upgradeCanonicalComponents(removed),removed);
  const enabled=togglePageControl(removed,'carousel',true);
  assert.equal(togglePageControl(enabled,'carousel',true),enabled);
  assert.equal(indexDocument(enabled).nodes.get('carousel').children.length,4);
  assert.deepEqual(sequencePages(indexDocument(enabled).nodes.get('carousel')),sequencePages(indexDocument(source).nodes.get('carousel')));
  assert.deepEqual(enabled.products,source.products);
});
test('legacy pagination migrates existing colors without rewriting slides, content or products',()=>{
  const source=fixture(component('carousel','Carousel','旧轮播',{dotColor:'#112233',activeDotColor:'#445566'},[component('a','Slide','第一页',{},[component('copy','Text','文字',{text:'保持不变'})]),component('b','Slide','第二页')]));
  const upgraded=upgradeCanonicalComponents(source),carousel=indexDocument(upgraded).nodes.get('carousel'),indicator=carousel.children.at(-1).children[0];
  assert.deepEqual(sequencePages(carousel),source.root.children[0].children);assert.deepEqual(upgraded.products,source.products);
  assert.equal(indicator.props.background,'#112233');assert.equal(indicator.props.selectedBackground,'#445566');assert.equal(upgradeCanonicalComponents(upgraded),upgraded);
});
