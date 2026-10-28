import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component as c,indexDocument,resolveComponentText,componentLayerLabel,validDocument,cloneComponent} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents,createCatalogComponent} from '../src/builder/componentCatalog.js';
import {PRODUCT_PARAMETERS,productParameterPreview,upgradeProductParameters,packagePriceMode} from '../src/products/productParameters.js';
import {fieldPreviewDocument} from '../src/products/fieldPreview.js';
import {patchComponentProperties,copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
const parameter=(id,key,props={})=>c(id,'ProductParameter','商品参数',{parameter:key,...props});
const documentFor=children=>({version:3,products:{},root:c('root','Screen','页面',{},children)});
let server,Preview;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>server?.close());
test('all parameter definitions are literal field references, state labels never reverse',()=>{
  const plan=createCatalogComponent('Package','plan');
  for(const key of Object.keys(PRODUCT_PARAMETERS))assert.ok(productParameterPreview(key,plan).includes('{'));
  assert.equal(productParameterPreview('productLabel',plan),'{商品标签}');assert.equal(productParameterPreview('productLabel',plan,true),'{选中商品标签}');
  assert.equal(componentLayerLabel(parameter('x','monthlyPrice')),'商品参数 · 月价');
});
test('legacy migration preserves IDs, styles, ordering, custom text, source data, and is idempotent',()=>{
  const original=documentFor([c('plan','Package','商品',{dataKey:'year',priceMode:'0'},[c('price','Text','售价',{binding:{key:'year',field:'price'},text:'¥488',fontSize:23,selectedColor:'#123456'}),c('copy','Text','文字',{text:'独立说明',runs:[{text:'独立说明',bold:true}]}),c('ref','Text','原价',{binding:{key:'year',field:'reference'},strike:true})]),c('life','Package','商品',{dataKey:'life'},[])]);
  original.products={year:{skuId:'DEMO-BLUE-YEAR'},life:{skuId:'DEMO-BLUE-LIFETIME'}};
  const before=structuredClone(original),next=upgradeCanonicalComponents(original),nodes=indexDocument(next).nodes;
  assert.deepEqual(original,before);assert.deepEqual(next.products,original.products);assert.equal(nodes.get('life').props.productType,'lifetime');assert.equal(nodes.get('plan').props.productType,'subscription');
  assert.deepEqual(nodes.get('plan').children.map(n=>n.id),['price','copy','ref']);assert.deepEqual(nodes.get('copy'),indexDocument(original).nodes.get('copy'));
  assert.equal(nodes.get('price').props.parameter,'monthlyPrice');assert.equal(nodes.get('price').props.binding,undefined);assert.equal(nodes.get('price').props.text,undefined);assert.equal(nodes.get('price').props.fontSize,23);assert.equal(nodes.get('price').props.selectedColor,'#123456');assert.equal(nodes.get('ref').props.parameter,'monthlyReferencePrice');
  assert.equal(upgradeCanonicalComponents(next),next);assert.ok(validDocument(next));
});
test('lifetime conversion changes monthly semantics without losing subscription fields or styles',()=>{
  const plan=c('plan','Package','商品',{productType:'subscription'},[parameter('monthly','monthlyPrice',{fontSize:23}),parameter('ref','monthlyReferencePrice',{strike:true}),parameter('save','savings'),parameter('info','productInfo'),parameter('tag','productLabel'),parameter('duration','skuDuration')]);
  const original=upgradeProductParameters(documentFor([plan]));
  const next=patchComponentProperties(original,'plan',{productType:'lifetime'}),life=indexDocument(next).nodes.get('plan');
  assert.deepEqual(life.children,plan.children);assert.equal(resolveComponentText(life.children[0],next,life),'¥{总价}');assert.equal(resolveComponentText(life.children[1],next,life),'{总价}');assert.equal(resolveComponentText(life.children[2],next,life),'');
  assert.equal(resolveComponentText(life.children[3],next,life),'{商品信息}');assert.equal(resolveComponentText(life.children[4],next,life,true),'{选中商品标签}');assert.equal(resolveComponentText(life.children[5],next,life),'{SKU时长}');
  const restored=patchComponentProperties(next,'plan',{productType:'subscription'});assert.deepEqual(restored.root,original.root);
  assert.equal(resolveComponentText(plan.children[0],restored,plan),'¥{月价}/月');
});
test('copy, library-style clone and JSON roundtrip retain parameter identities and type semantics',()=>{
  const plan=createCatalogComponent('Package','plan');plan.props.productType='lifetime';const source=upgradeProductParameters(documentFor([plan]));
  const fragment=copyFragment(source,'plan'),pasted=pasteFragment(source,'root',fragment).document;
  assert.ok(validDocument(JSON.parse(JSON.stringify(pasted))));assert.equal(pasted.root.children.length,2);assert.equal(pasted.root.children[1].props.productType,'lifetime');
  assert.equal(cloneComponent(plan).children[0].children[1].type,'ProductParameter');
});
test('lifetime does not duplicate a total price already present beside monthly price',()=>{
  const plan=c('plan','Package','商品',{productType:'lifetime'},[parameter('total','totalPrice'),parameter('monthly','monthlyPrice'),parameter('reference','totalReferencePrice'),parameter('monthlyReference','monthlyReferencePrice')]);
  assert.equal(productParameterPreview('monthlyPrice',plan),'');assert.equal(productParameterPreview('monthlyReferencePrice',plan),'');
  assert.equal(productParameterPreview('totalPrice',plan),'¥{总价}');
  plan.props.productType='subscription';assert.equal(productParameterPreview('monthlyPrice',plan),'¥{月价}/月');
});
test('price modes update the same price parameters, retain styles and leave other content and packages unchanged',()=>{
  const plan=createCatalogComponent('Package','plan'),other=createCatalogComponent('Package','other');
  plan.children[0].children.push(parameter('detail','monthlyPrice',{priceRole:'detail',fontSize:12}));
  plan.children[0].children.find(node=>node.id==='plan/price').props.selectedColor='#123456';
  const original=upgradeProductParameters(documentFor([plan,other]));
  const before=structuredClone(original);
  let next=original;
  for(const [mode,main,reference] of [['0','monthlyPrice','monthlyReferencePrice'],['3','totalPrice','monthlyReferencePrice'],['4','monthlyPrice','totalReferencePrice'],['1','totalPrice','totalReferencePrice']]){
    next=patchComponentProperties(next,'plan',{priceMode:mode});const nodes=indexDocument(next).nodes;
    assert.equal(packagePriceMode(nodes.get('plan')),mode);assert.equal(nodes.get('plan/price').props.parameter,main);assert.equal(nodes.get('plan/reference').props.parameter,reference);
    assert.equal(nodes.get('plan/price').props.selectedColor,'#123456');assert.deepEqual(nodes.get('detail'),indexDocument(original).nodes.get('detail'));
    assert.deepEqual(nodes.get('other'),other);assert.deepEqual(next.products,original.products);assert.equal(nodes.get('plan/label/text').props.parameter,'productLabel');
  }
  assert.deepEqual(original,before);assert.ok(validDocument(JSON.parse(JSON.stringify(next))));
});
test('individual price field changes synchronize the package mode and stale stored modes cannot override fields',()=>{
  let source=upgradeProductParameters(documentFor([createCatalogComponent('Package','plan')]));
  source=patchComponentProperties(source,'plan',{priceMode:'0'});
  source=patchComponentProperties(source,'plan/price',{parameter:'totalPrice'});
  assert.equal(packagePriceMode(indexDocument(source).nodes.get('plan')),'3');assert.equal(indexDocument(source).nodes.get('plan').props.priceMode,'3');
  source=patchComponentProperties(source,'plan/reference',{parameter:'totalReferencePrice'});
  assert.equal(packagePriceMode(indexDocument(source).nodes.get('plan')),'1');
  const stored=JSON.parse(JSON.stringify(source));stored.root.children[0].props.priceMode='0';
  assert.equal(packagePriceMode(stored.root.children[0]),'1');assert.equal(resolveComponentText(indexDocument(stored).nodes.get('plan/price'),stored,stored.root.children[0]),'¥{总价}');
});
test('rendered default, selected and interactive states agree; editing selected preview is exclusive',async()=>{
  const plan=id=>c(id,'Package','商品',{group:'group',productType:'subscription',defaultSelected:id==='b'},[parameter(`${id}/label`,'productLabel')]);
  const source=fieldPreviewDocument(upgradeProductParameters(documentFor([plan('a'),plan('b')])));let renderer;
  const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  const render=(editing,navigation={},selectedId='a')=>React.createElement(Preview,{document:source,editing,navigation,selectedId,onSelect(){},onStatus(){}});
  await act(async()=>{renderer=Renderer.create(render(true,{'package-style:a':'selected'}));});
  try{
    assert.equal(host('a/label').children[0],'{选中商品标签}');assert.equal(host('b/label').children[0],'{商品标签}');assert.equal(host('a').props['aria-pressed'],true);assert.equal(host('b').props['aria-pressed'],false);
    await act(async()=>renderer.update(render(true,{'package-style:a':'default'})));assert.equal(host('a/label').children[0],'{商品标签}');assert.equal(host('b/label').children[0],'{商品标签}');
    await act(async()=>renderer.update(render(false)));assert.equal(host('b/label').children[0],'{选中商品标签}');assert.equal(host('a/label').children[0],'{商品标签}');
    await act(async()=>host('a').props.onClick({stopPropagation(){}}));assert.equal(host('a/label').children[0],'{选中商品标签}');assert.equal(host('b/label').children[0],'{商品标签}');
  }finally{await act(async()=>renderer.unmount());}
});
test('lifetime rendered savings is absent and price text preserves style and strike',async()=>{
  const source=documentFor([c('plan','Package','商品',{productType:'lifetime',defaultSelected:true},[parameter('price','monthlyPrice',{fontSize:24,selectedColor:'#ff0000'}),parameter('ref','monthlyReferencePrice',{strike:true}),parameter('savings','savings')])]);let renderer;
  await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:source,editing:false,onSelect(){},onStatus(){}}));});
  try{const host=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];assert.equal(host('price').children[0],'¥{总价}');assert.equal(host('price').props.style.fontSize,24);assert.equal(host('price').props.style.color,'#ff0000');assert.equal(host('ref').props.style.textDecoration,'line-through');assert.equal(host('savings'),undefined);}finally{await act(async()=>renderer.unmount());}
});
