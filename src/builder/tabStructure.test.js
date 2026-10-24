import test from 'node:test';
import assert from 'node:assert/strict';
import { component, indexDocument, updateComponent } from './componentDocument.js';
import { createCatalogComponent } from './componentCatalog.js';
import { appendTab, removeEditorComponent, moveEditorComponent, copyFragment, pasteFragment, reconcileTabNavigation } from './componentOperations.js';

const fixture=()=>({version:3,templateId:'tabs',products:{sku:{name:'保护商品',price:'100'}},root:component('root','Screen','页面',{},[createCatalogComponent('Tabs','tabs'),createCatalogComponent('Tabs','other')])});
const node=(document,id)=>indexDocument(document).nodes.get(id);

test('adding a tab updates all owned selectors and creates new content without cloning another page body',()=>{
  let document=fixture();
  document=updateComponent(document,'tabs/tab-content-0',{props:{text:'第一页专属内容'}});
  document=updateComponent(document,'tabs/tab-content-1',{props:{text:'第二页专属内容'}});
  const next=appendTab(document,'tabs',createCatalogComponent('Tab','new-tab'));
  assert.equal(node(next,'tabs').children.length,3);
  for(const tab of node(next,'tabs').children) {
    const control=tab.children.find((child)=>child.type==='TabControl');
    assert.deepEqual(control.children.map((child)=>child.props.index),[0,1,2]);
    assert.ok(control.children.every((child)=>child.props.target==='tabs'));
  }
  assert.equal(node(next,'tabs/tab-content-0').props.text,'第一页专属内容');
  assert.equal(node(next,'tabs/tab-content-1').props.text,'第二页专属内容');
  assert.equal(node(next,'new-tab').children.at(-1).props.text,'文字');
  assert.deepEqual(node(next,'other'),node(document,'other'));
  assert.deepEqual(next.products,document.products);
  assert.equal(new Set(indexDocument(next).nodes.keys()).size,indexDocument(next).nodes.size);
});

test('nested tabs and different selectors retain their own destinations when adding to an outer Tabs',()=>{
  const document=fixture();
  const tab=node(document,'tabs/tab-0');
  const nested=createCatalogComponent('Tabs','nested');
  const source=updateComponent(document,tab.id,{children:[...tab.children,nested]});
  const next=appendTab(source,'tabs',createCatalogComponent('Tab','new-tab'));
  assert.deepEqual(node(next,'nested'),nested);
  assert.equal(node(next,'new-tab').children.filter((child)=>child.type==='Tabs').length,0);
  assert.deepEqual(node(next,'other'),node(source,'other'));
});

test('an empty Tabs gains one working selector; invalid parents and duplicate IDs are not mutated',()=>{
  const document={...fixture(),root:component('root','Screen','页面',{},[component('tabs','Tabs','标签页')])};
  const next=appendTab(document,'tabs',createCatalogComponent('Tab','new-tab'));
  const button=node(next,'new-tab').children[0].children[0];
  assert.equal(button.props.target,'tabs');assert.equal(button.props.index,0);
  assert.equal(appendTab(document,'root',createCatalogComponent('Tab','other-tab')),document);
  assert.equal(appendTab(next,'tabs',createCatalogComponent('Tab','new-tab')),next);
});

test('removing and reordering tabs preserve page identity, matching labels, defaults, nested tabs and SKU data',()=>{
  let document=appendTab(fixture(),'tabs',createCatalogComponent('Tab','third'));
  const first=node(document,'tabs/tab-0');
  document=updateComponent(document,first.id,{children:[...first.children,createCatalogComponent('Tabs','nested')]});
  document=updateComponent(document,'tabs',{props:{defaultIndex:1}});
  const targetButton=node(document,'tabs/tab-1').children[0].children[1];
  const moved=moveEditorComponent(document,'tabs/tab-1','tabs',0);
  assert.equal(node(moved,'tabs').props.defaultIndex,0);
  assert.equal(node(moved,targetButton.id).props.index,0);
  assert.equal(reconcileTabNavigation(document,moved,{tabs:1,untouched:'yes'}).tabs,0);
  for(const tab of node(moved,'tabs').children)assert.deepEqual(tab.children[0].children.map((button)=>button.props.index),[0,1,2]);
  const removed=removeEditorComponent(moved,'tabs/tab-0');
  for(const tab of node(removed,'tabs').children)assert.deepEqual(tab.children[0].children.map((button)=>button.props.index),[0,1]);
  assert.equal(node(removed,'tabs').props.defaultIndex,0);
  assert.deepEqual(node(moved,'nested'),node(document,'nested'));
  assert.deepEqual(node(removed,'other'),node(document,'other'));
  assert.deepEqual(removed.products,document.products);
});

test('duplicating a tab creates one matching selector on every page without changing the original body',()=>{
  let document=fixture();
  document=updateComponent(document,'tabs/tab-content-0',{props:{text:'只复制本页正文'}});
  const result=pasteFragment(document,'tabs',copyFragment(document,'tabs/tab-0'),1);
  assert.equal(result.ids.length,1);
  const tabs=node(result.document,'tabs');assert.equal(tabs.children.length,3);
  for(const tab of tabs.children)assert.deepEqual(tab.children[0].children.map((button)=>button.props.index),[0,1,2]);
  assert.equal(tabs.children[1].children.at(-1).props.text,'只复制本页正文');
  assert.deepEqual(node(result.document,'tabs/tab-content-0'),node(document,'tabs/tab-content-0'));
  assert.deepEqual(node(result.document,'other'),node(document,'other'));
  assert.equal(indexDocument(result.document).nodes.size,new Set(indexDocument(result.document).nodes.keys()).size);
});
