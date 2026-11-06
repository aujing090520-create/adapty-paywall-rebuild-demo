import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {fieldPreviewDocument,productPreviewDocument,productFieldPlaceholders} from '../src/products/fieldPreview.js';
import {packageDisplayFields} from '../src/products/packageFields.js';
import {interpolateVariables,variableIssues} from '../src/builder/textVariables.js';
import {component as c,indexDocument,componentProps,resolveComponentText,captureNativeComponent,importComponentDocument} from '../src/builder/componentDocument.js';
import {createCatalogComponent,upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
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
  assert.equal(nodes.get('plan/price').type,'ProductParameter');assert.equal(nodes.get('plan/price').props.parameter,'totalPrice');assert.equal(nodes.get('plan/name').props.parameter,'skuDuration');assert.equal(captured.props.dataKey,undefined);
});
test('actual package properties retain price modes without requiring SKU binding',async()=>{
  const plan=createCatalogComponent('Package','plan'),source=fieldPreviewDocument(doc(plan));let renderer;
  await act(async()=>{renderer=Renderer.create(React.createElement(Properties,{selected:plan,p:componentProps(plan),document:source,...indexDocument(source),navigation:{},setNavigation(){},patch(){},findPackage(){},resolveText:resolveComponentText,changeProduct(){},fieldNames:{name:'SKU时长',price:'总价'},onStatus(){},setDefaultPackage(){}}));});
  try{assert.equal(renderer.root.findAllByProps({'aria-label':'商品 SKU'}).length,0);assert.equal(renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='价格显示')[0].props.value,'1');assert.equal(renderer.root.findAllByProps({'aria-label':'售卖价'}).length,0);assert.equal(renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='商品类型')[0].props.value,'subscription');}finally{await act(async()=>renderer.unmount());}
});
test('actual field switch restores labels and sets strikethrough for reference fields',async()=>{
  let renderer,latest;const plan=createCatalogComponent('Package','plan'),source=doc(plan),id='plan/label/text';
  function Harness(){const [value,setValue]=React.useState(source);latest=value;const selected=indexDocument(value).nodes.get(id);return React.createElement(Properties,{selected,p:componentProps(selected),document:fieldPreviewDocument(value),...indexDocument(value),navigation:{},setNavigation(){},patch:patch=>setValue(current=>patchComponentProperties(current,id,patch)),findPackage:()=>plan,resolveText:resolveComponentText,changeProduct(){},fieldNames:{name:'SKU时长',badgeText:'商品标签',reference:'划线价'},onStatus(){}});}
  await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});
  try{assert.equal(renderer.root.findAllByType('textarea').length,0);assert.equal(renderer.root.findAllByProps({'aria-label':'内容来源'}).length,0);for(const [parameter,value] of [['skuDuration','{SKU时长}'],['totalReferencePrice','{总价}'],['productLabel','{商品标签}']]){await act(async()=>renderer.root.findAll(node=>node.type==='select'&&node.props['aria-label']==='商品参数')[0].props.onChange({target:{value:parameter}}));const selected=indexDocument(latest).nodes.get(id);assert.equal(resolveComponentText(selected,fieldPreviewDocument(latest),plan),value);assert.equal(Boolean(selected.props.strike),parameter==='totalReferencePrice');}}finally{await act(async()=>renderer.unmount());}
});
test('interactive presentation can select and mock purchase a package with no SKU while requiring agreement',async()=>{
  const plan=createCatalogComponent('Package','plan'),source=doc(plan);source.root.children.push(c('agreement','Toggle','协议',{required:true,initial:false}),c('buy','PurchaseButton','购买',{action:{action:'Purchase'}},[c('label','Text','文字',{text:'购买'})]));let renderer,status='';
  await act(async()=>{renderer=Renderer.create(React.createElement(Presentation,{document:source,editing:false,onSelect(){},onStatus:value=>{status=value;}}));});
  const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  try{assert.equal(host('plan/name').children[0],'{SKU时长}');assert.equal(host('plan/reference').props.style.textDecoration,'line-through');await act(async()=>host('buy').props.onClick({stopPropagation(){}}));assert.equal(status,'请先勾选同意协议');await act(async()=>host('agreement').findByType('input').props.onChange({target:{checked:true}}));await act(async()=>host('buy').props.onClick({stopPropagation(){}}));assert.equal(status,'购买预览：未发起真实交易');}finally{await act(async()=>renderer.unmount());}
});

const memberDocument=()=>{
  const template=templates.find(item=>item.id==='ht-membership-plans');
  return upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id),template));
};
const memberCases=[['products/package-0','1个月','¥78'],['products/package-1','12个月','¥488'],['products/package-2','终身','¥998']];

test('membership sample data reuses saved per-package SKUs without changing configuration or library variables',()=>{
  const source=memberDocument(),before=structuredClone(source),preview=productPreviewDocument(source),{nodes}=indexDocument(source);
  assert.equal(productPreviewDocument(source),preview);assert.equal(productPreviewDocument(preview),preview);
  assert.equal(preview.products,source.products);assert.equal(preview.root,source.root);
  for(const [id,duration,price] of memberCases){
    const plan=nodes.get(id);
    assert.equal(packageDisplayFields(preview,plan).name,duration);
    assert.equal(resolveComponentText(nodes.get(`${id}-price`),preview,plan),price);
    assert.equal(resolveComponentText(nodes.get(`${id}-name`),fieldPreviewDocument(source),plan),'{SKU时长}');
    assert.equal(interpolateVariables('{{ product.price }} / {{ product.name }}',preview,plan),`${price} / ${duration}`);
    const captured=captureNativeComponent(preview,plan);
    assert.equal(indexDocument({root:captured}).nodes.get(`${id}-price`).props.parameter,'totalPrice');
  }
  assert.deepEqual(source,before);assert.equal(source.productSamplePreview,undefined);
  assert.equal(productPreviewDocument(doc(createCatalogComponent('Package','plan'))).productSamplePreview,undefined);
});

test('membership canvas and interactive flow render identical readable package data and identify it as an example',async()=>{
  const source=memberDocument(),before=structuredClone(source),snapshots=[];
  for(const editing of [true,false]){
    let renderer;
    await act(async()=>{renderer=Renderer.create(React.createElement(Presentation,{document:source,editing,onSelect(){},onStatus(){}}));});
    try{
      const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
      snapshots.push(memberCases.map(([id,duration,price])=>{
        assert.equal(host(`${id}-name`).children[0],duration);assert.equal(host(`${id}-price`).children[0],price);
        return [host(`${id}-name`).children[0],host(`${id}-price`).children[0]];
      }));
      assert.equal(host('products/monthly-1').children[0],'¥40.67/月');
      assert.equal(host('products/package-2-saveCopy').children[0],'永久会员权益');
      assert.doesNotMatch(JSON.stringify(renderer.toJSON()),/\{SKU时长\}|\{总价\}|\{月价\}/);
      if(!editing)assert.match(JSON.stringify(renderer.toJSON()),/示例商品数据 · 非实际报价/);
    }finally{await act(async()=>renderer.unmount());}
  }
  assert.deepEqual(snapshots[0],snapshots[1]);assert.deepEqual(source,before);
});

test('switching membership packages updates selected price variables, parameter fields and billing copy in both directions',async()=>{
  const source=memberDocument();
  source.root.children.push(c('selected-quote','Text','当前报价',{text:'{{ product.name }} / {{ product.price }}'}),c('selected-price','ProductParameter','当前总价',{parameter:'totalPrice'}));
  const before=structuredClone(source);let renderer;
  await act(async()=>{renderer=Renderer.create(React.createElement(Presentation,{document:source,editing:false,onSelect(){},onStatus(){}}));});
  try{
    const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
    assert.equal(host('selected-quote').children.join(''),'12个月 / ¥488');
    for(const [id,duration,price] of [...memberCases,memberCases[0]]){
      await act(async()=>host(id).props.onClick({stopPropagation(){}}));
      assert.equal(host(id).props['aria-pressed'],true);
      for(const [other] of memberCases)if(other!==id)assert.equal(host(other).props['aria-pressed'],false);
      assert.equal(host('selected-quote').children.join(''),`${duration} / ${price}`);
      assert.equal(host('selected-price').children[0],price);
      assert.equal(host('member/cancel-note').children.join(''),duration==='终身'?'一次性付费，永久权益':'可随时取消');
    }
  }finally{await act(async()=>renderer.unmount());}
  assert.deepEqual(source,before);
});

test('membership sample prices follow changed SKU bindings and price modes while retaining parameter identities and styling',()=>{
  const source=memberDocument(),before=structuredClone(source),{nodes}=indexDocument(source),plan=nodes.get('products/package-1'),price=nodes.get('products/package-1-price');
  const changed={...source,products:{...source.products,[plan.props.dataKey]:{...source.products[plan.props.dataKey],skuId:'DEMO-MEMBER-MONTH'}}};
  assert.equal(resolveComponentText(price,productPreviewDocument(changed),plan),'¥78');
  assert.equal(resolveComponentText(nodes.get('products/package-1-name'),productPreviewDocument(changed),plan),'1个月');
  const monthly=patchComponentProperties(source,plan.id,{priceMode:'0'}),monthlyNodes=indexDocument(monthly).nodes;
  assert.equal(resolveComponentText(monthlyNodes.get(price.id),productPreviewDocument(monthly),monthlyNodes.get(plan.id)),'¥40.67/月');
  assert.equal(monthlyNodes.get(price.id).props.fontSize,price.props.fontSize);
  assert.deepEqual(source,before);
});
