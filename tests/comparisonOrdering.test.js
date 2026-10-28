import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer, {act} from 'react-test-renderer';
import {createServer} from 'vite';
import {templates, createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {importComponentDocument, indexDocument, updateComponent, componentProps, cloneComponent, saveComponentDocument, readComponentDocument} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {orderedComparisonCells, COMPARISON_ORDER_RULES} from '../src/builder/comparisonOrdering.js';

let server, Preview, Properties;
before(async()=>{
  globalThis.ResizeObserver=class{observe(){}disconnect(){}};
  server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});
  Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;
  Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;
});
after(async()=>server?.close());
const fixture=()=>upgradeCanonicalComponents(importComponentDocument(createBuilderNodes('ht-blue-privilege'),templates.find(t=>t.id==='ht-blue-privilege')));
const tableOf=document=>indexDocument(document).nodes.get('benefits');
const configure=(document,props={})=>updateComponent(document,'benefits',{props:{comparisonOrderMode:'rule',comparisonOrderRule:'social-first',...props}});
const keys=(column,table,context)=>orderedComparisonCells(column,table,context).map(cell=>cell.props.comparisonItemKey);
const expected=(table,order)=>['header',...order,...table.children[0].children.map(cell=>cell.props.comparisonItemKey).filter(key=>key!=='header'&&!order.includes(key))];

test('default order is unchanged; rules permute all columns identically without changing source nodes',()=>{
  const original=fixture(),snapshot=structuredClone(original),table=tableOf(original);
  for(const column of table.children)assert.equal(orderedComparisonCells(column,table),column.children);
  const configured=tableOf(configure(original));
  for(const rule of COMPARISON_ORDER_RULES){
    configured.props.comparisonOrderRule=rule.key;
    for(const column of configured.children)assert.deepEqual(keys(column,configured),expected(configured,rule.order));
  }
  assert.deepEqual(original,snapshot);
});

test('missing, unknown or malformed response falls back and partial responses append omitted rows',()=>{
  const table=tableOf(configure(fixture())),column=table.children[0];
  for(const response of [null,{}, {values:{}}, {values:{'social-first':{order:'bad'}}}, {values:{'social-first':{order:['unknown',null]}}}])assert.equal(orderedComparisonCells(column,table,response),column.children);
  const response={values:{'social-first':{order:['exposure','exposure','unknown','visitors']}}};
  for(const column of table.children)assert.deepEqual(keys(column,table,response),expected(table,['exposure','visitors']));
  assert.equal(orderedComparisonCells(column,{...table,props:{...table.props,comparisonOrderRule:'missing'}}),column.children);
});

test('whole-table copies keep semantic identity; mismatched custom columns do not reorder',()=>{
  const table=cloneComponent(tableOf(configure(fixture())));
  for(const column of table.children)assert.deepEqual(keys(column,table),expected(table,COMPARISON_ORDER_RULES[0].order));
  table.children[1].children.pop();
  for(const column of table.children)assert.equal(orderedComparisonCells(column,table),column.children);
});

test('stored rule survives reopen and upgrading old column documents adds identities idempotently',()=>{
  const document=configure(fixture()),old=structuredClone(document);
  for(const col of tableOf(old).children)for(const cell of col.children)delete cell.props.comparisonItemKey;
  assert.deepEqual(upgradeCanonicalComponents(old),document);
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  assert.ok(saveComponentDocument(storage,document));
  assert.equal(tableOf(readComponentDocument(storage,'ht-blue-privilege')).props.comparisonOrderRule,'social-first');
});

test('only table owner exposes ordering, and mode switches retain the selected rule',async()=>{
  let document=fixture(),selectedId='benefits',renderer;
  const render=()=>{const {nodes,parents}=indexDocument(document),selected=nodes.get(selectedId);return React.createElement(Properties,{selected,p:componentProps(selected),document,nodes,parents,patch:props=>{document=updateComponent(document,selectedId,{props});renderer.update(render());},setNavigation(){},onStatus(){}});};
  const control=name=>renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']===name)[0];
  try{
    await act(async()=>{renderer=Renderer.create(render());});
    assert.equal(control('展示顺序').props.value,'canvas');assert.equal(control('排序规则'),undefined);
    await act(async()=>control('展示顺序').props.onChange({target:{value:'rule'}}));
    await act(async()=>control('排序规则').props.onChange({target:{value:'social-first'}}));
    await act(async()=>control('展示顺序').props.onChange({target:{value:'canvas'}}));
    assert.equal(tableOf(document).props.comparisonOrderRule,'social-first');
    await act(async()=>control('展示顺序').props.onChange({target:{value:'rule'}}));
    assert.equal(control('排序规则').props.value,'social-first');
    selectedId='benefits/feature-column';await act(async()=>renderer.update(render()));assert.equal(control('展示顺序'),undefined);
    selectedId='benefits/row-0';await act(async()=>renderer.update(render()));assert.equal(control('展示顺序'),undefined);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('real renderer keeps header, cell identities, row actions and runtime order aligned in edit and preview',async()=>{
  const original=fixture(),table=tableOf(original);
  const document={...configure(original),root:{...original.root,children:[tableOf(configure(original))]}};
  let renderer,status='';
  const render=(editing,businessOrdering)=>React.createElement(Preview,{document,editing,businessOrdering,onSelect(){},onStatus:value=>status=value});
  const column=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  const order=id=>column(id).children.filter(child=>typeof child==='object'&&child.type.name==='NativeComponent').map(child=>child.props.node.props.comparisonItemKey);
  try{
    await act(async()=>{renderer=Renderer.create(render(true));});
    for(const col of table.children)assert.deepEqual(order(col.id),expected(table,COMPARISON_ORDER_RULES[0].order));
    await act(async()=>renderer.update(render(false,{values:{'social-first':{order:['partners','nearby']}}})));
    for(const col of table.children)assert.deepEqual(order(col.id),expected(table,['partners','nearby']));
    await act(async()=>renderer.update(render(false,{})));
    for(const col of table.children)assert.deepEqual(order(col.id),col.children.map(cell=>cell.props.comparisonItemKey));
    assert.equal(status,'');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
