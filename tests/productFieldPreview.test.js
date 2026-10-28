import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {fieldPreviewDocument,productFieldPlaceholders} from '../src/products/fieldPreview.js';
import {packageDisplayFields} from '../src/products/packageFields.js';
import {interpolateVariables,variableIssues} from '../src/builder/textVariables.js';
import {component as c,indexDocument,componentProps,resolveComponentText,captureNativeComponent} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {patchComponentProperties} from '../src/builder/componentOperations.js';
let server,Properties,Presentation;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;Presentation=(await server.ssrLoadModule('/src/builder/PaywallPresentation.jsx')).default;});
after(async()=>server?.close());
const doc=plan=>({version:3,templateId:'field-test',products:{},root:c('root','Screen','页面',{},[plan])});
test('field preview renders all business fields with no SKU or price record and preserves the saved document',()=>{
  const plan=createCatalogComponent('Package','plan'),source=doc(plan),original=structuredClone(source),preview=fieldPreviewDocument(source);
  const fields=packageDisplayFields(preview,plan);
  assert.equal(fields.name,'{SKU时长}');assert.equal(fields.price,'¥{总价}');assert.equal(fields.reference,'{总价}');assert.equal(fields.monthlyPrice,'¥{月价}/月');assert.equal(fields.badgeText,'{商品标签}');assert.equal(fields.savingCopy,'节省{节省比例}%');
  assert.equal(fieldPreviewDocument(source),preview);assert.deepEqual(source,original);assert.equal(source.productFieldPreview,undefined);
});
test('price modes use total/monthly field names independently for selling and struck prices',()=>{
  for(const [mode,price,reference] of [['1','¥{总价}','{总价}'],['0','¥{月价}/月','{月价}/月'],['3','¥{总价}','{月价}/月'],['4','¥{月价}/月','{总价}']]){
    const fields=productFieldPlaceholders({props:{priceMode:mode}});assert.equal(fields.price,price);assert.equal(fields.reference,reference);
  }
});
test('SKU presence, unknown SKU and real amounts cannot change placeholder content',()=>{
  const plan=createCatalogComponent('Package','plan');for(const row of [{},{skuId:'DEMO-BLUE-YEAR'},{skuId:'UNKNOWN',price:'¥99999'}]){
    const source=doc(plan);source.products.plan=row;assert.equal(packageDisplayFields(fieldPreviewDocument(source),plan).price,'¥{总价}');
  }
  assert.equal(productFieldPlaceholders({props:{productLabelEnabled:false}}).badgeText,'');assert.equal(productFieldPlaceholders(plan,true).badgeText,'{选中商品标签}');
});
test('embedded product variables share the same field vocabulary without missing-data warnings',()=>{
  const source=fieldPreviewDocument(doc(createCatalogComponent('Package','plan'))),value='{{ product.price }} / {{ product.period }} / {{ product.price_per_month }} / {{ product.label }}';
  assert.equal(interpolateVariables(value,source,null),'¥{总价} / {SKU时长} / ¥{月价} / {商品标签}');assert.deepEqual(variableIssues(value,source,null),[]);
});
test('captured library content cannot freeze a real amount into its preview text',()=>{
  const plan=createCatalogComponent('Package','plan'),source=doc(plan);source.products.plan={skuId:'DEMO-BLUE-YEAR'};
  const captured=captureNativeComponent(fieldPreviewDocument(source),plan),nodes=indexDocument({root:captured}).nodes;
  assert.equal(nodes.get('plan/price').props.text,'¥{总价}');assert.equal(nodes.get('plan/name').props.text,'{SKU时长}');assert.equal(captured.props.dataKey,undefined);
});
test('actual package properties require no SKU and expose readonly field definitions',async()=>{
  const plan=createCatalogComponent('Package','plan'),source=fieldPreviewDocument(doc(plan));let renderer;
  await act(async()=>{renderer=Renderer.create(React.createElement(Properties,{selected:plan,p:componentProps(plan),document:source,...indexDocument(source),navigation:{},setNavigation(){},patch(){},findPackage(){},resolveText:resolveComponentText,changeProduct(){},fieldNames:{name:'SKU时长',price:'总价'},onStatus(){},setDefaultPackage(){}}));});
  try{assert.equal(renderer.root.findAllByProps({'aria-label':'商品 SKU'}).length,0);const price=renderer.root.findAll(node=>node.type==='input'&&node.props['aria-label']==='售卖价')[0];assert.equal(price.props.value,'¥{总价}');assert.equal(price.props.readOnly,true);}finally{await act(async()=>renderer.unmount());}
});
test('actual field switch restores labels and sets strikethrough for reference fields',async()=>{
  let renderer,latest;const plan=createCatalogComponent('Package','plan'),source=doc(plan),id='plan/label/text';
  function Harness(){const [value,setValue]=React.useState(source);latest=value;const selected=indexDocument(value).nodes.get(id);return React.createElement(Properties,{selected,p:componentProps(selected),document:fieldPreviewDocument(value),...indexDocument(value),navigation:{},setNavigation(){},patch:patch=>setValue(current=>patchComponentProperties(current,id,patch)),findPackage:()=>plan,resolveText:resolveComponentText,changeProduct(){},fieldNames:{name:'SKU时长',badgeText:'商品标签',reference:'划线价'},onStatus(){}});}
  await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});
  try{for(const field of ['name','reference','badgeText']){await act(async()=>renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='商品字段')[0].props.onChange({target:{value:field}}));const selected=indexDocument(latest).nodes.get(id);assert.equal(resolveComponentText(selected,fieldPreviewDocument(latest),plan),productFieldPlaceholders(plan)[field]);assert.equal(Boolean(selected.props.strike),field==='reference');}}finally{await act(async()=>renderer.unmount());}
});
test('interactive presentation can select and mock purchase a package with no SKU while requiring agreement',async()=>{
  const plan=createCatalogComponent('Package','plan'),source=doc(plan);source.root.children.push(c('agreement','Toggle','协议',{required:true,initial:false}),c('buy','PurchaseButton','购买',{action:{action:'Purchase'}},[c('label','Text','文字',{text:'购买'})]));let renderer,status='';
  await act(async()=>{renderer=Renderer.create(React.createElement(Presentation,{document:source,editing:false,onSelect(){},onStatus:value=>{status=value;}}));});
  const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  try{assert.equal(host('plan/name').children[0],'{SKU时长}');assert.equal(host('plan/reference').props.style.textDecoration,'line-through');await act(async()=>host('buy').props.onClick({stopPropagation(){}}));assert.equal(status,'请先勾选同意协议');await act(async()=>host('agreement').findByType('input').props.onChange({target:{checked:true}}));await act(async()=>host('buy').props.onClick({stopPropagation(){}}));assert.equal(status,'购买预览：未发起真实交易');}finally{await act(async()=>renderer.unmount());}
});
