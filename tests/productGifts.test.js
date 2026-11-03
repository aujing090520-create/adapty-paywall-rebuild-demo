import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component,indexDocument,importComponentDocument,validDocument,cloneComponent} from '../src/builder/componentDocument.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {catalogFor,createCatalogComponent} from '../src/builder/componentCatalog.js';
import {createProductGifts,buildBlueProductGifts,giftPackages,giftPackage,setPackageGifts,visiblePackageGifts} from '../src/builder/productGifts.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';

const blue=()=>{const template=templates.find(item=>item.id==='ht-blue-privilege');return importComponentDocument(createBuilderNodes(template.id),template);};
test('dedicated component can be added to ordinary content and Blue default is after packages, outside Footer',()=>{
  const document=blue(),{nodes,parents}=indexDocument(document),gift=nodes.get('products/gifts');
  assert.ok(gift);assert.equal(gift.type,'ProductGifts');assert.equal(gift.children.length,0);assert.ok(validDocument(document));
  const owner=nodes.get(parents.get(gift.id));assert.equal(owner.type,'Screen');
  assert.equal(owner.children.findIndex(node=>node.id===gift.id),owner.children.findIndex(node=>node.id==='products')+1);
  assert.ok(catalogFor(owner).some(group=>group.items.some(([type])=>type==='ProductGifts')));
  assert.equal(createCatalogComponent('ProductGifts','new').type,'ProductGifts');
  assert.equal(buildBlueProductGifts(document,'blue-privilege'),document);
  assert.equal(buildBlueProductGifts(document,'membership-plans'),document);
});

test('scope and selection groups never read a package on another screen or modal',()=>{
  const packageNode=(id,group,selected)=>component(id,'Package','套餐',{group,defaultSelected:selected});
  const gift=createProductGifts('gift');gift.props.selectionGroup='group';
  const a=packageNode('a','group',true),b=packageNode('b','group',false),other=packageNode('other','other',true),foreign=packageNode('foreign','group',true);
  const document={root:component('root','Screen','',{},[a,b,other,gift,component('modal','BottomSheet','',{},[foreign])]),products:{}};
  const {nodes,parents}=indexDocument(document),scoped=giftPackages(document,gift,nodes,parents);
  assert.deepEqual(scoped.map(node=>node.id),['a','b']);
  assert.equal(giftPackage(scoped,{selectedPackage:'foreign'})?.id,'a');
  assert.equal(giftPackage(scoped,{'package:group':'b'})?.id,'b');
  assert.equal(giftPackage(scoped,{selectedPackage:'b'})?.id,'b');
});

test('per-package local gift config and existing SKU data share one owner, preserve prices, filter disabled and localize',()=>{
  const document=blue(),{nodes}=indexDocument(document),node=nodes.get('products/package-1'),original=structuredClone(document);
  const gifts=[{id:'a',title:'默认',translations:{en:{title:'Gift'} }},{id:'b',title:'隐藏',enabled:false}];
  const next=setPackageGifts(document,node,gifts);
  assert.equal(visiblePackageGifts({...next,previewContentLocale:'en'},node)[0].title,'Gift');
  assert.equal(visiblePackageGifts(next,node).length,1);
  const key=node.props.dataKey??node.id;assert.deepEqual({...next.products[key],gifts:undefined},{...document.products[key],gifts:undefined});assert.deepEqual(document,original);
  const sku=document.products[key].skuId,configured={...document,business:{bySku:{[sku]:{gifts:[]}}}};
  const updated=setPackageGifts(configured,node,gifts);assert.deepEqual(updated.business.bySku[sku].gifts,gifts);assert.deepEqual(updated.products,document.products);
  assert.deepEqual(visiblePackageGifts(document,null),[]);
});

test('screen copy preserves package gift data and remaps selection-group reference',()=>{
  const document=blue(),result=pasteFragment({version:3,templateId:'empty',products:{},root:component('target','Screen')},'target',copyFragment(document,'products',true));
  assert.ok(result.ids.length);
  const {nodes}=indexDocument(result.document),packages=[...nodes.values()].filter(node=>node.type==='Package');
  assert.ok(packages.every(node=>result.document.products[node.props.dataKey].gifts.length));
  const ids=new Map(),cloned=cloneComponent(document.root,ids),gift=indexDocument({root:cloned}).nodes.get(ids.get('products/gifts'));
  assert.equal(gift.props.selectionGroup,ids.get('products'));
});

let server,Preview,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());

test('real preview switches month/year/lifetime gifts, collapses, shows details, hides empty data and never changes purchase selection',async()=>{
  const document=blue();let renderer;
  const byLabel=label=>renderer.root.findAll(node=>node.type==='button'&&node.props['aria-label']===label)[0];
  const byId=id=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===id)[0];
  const event={stopPropagation(){},preventDefault(){}};
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document,editing:false,onSelect(){},onStatus(){}}));});
    assert.ok(byLabel('6大会员随心选'));assert.ok(byLabel('中秋铭牌'));
    await act(async()=>byLabel('收起商品礼包').props.onClick(event));assert.equal(byLabel('6大会员随心选'),undefined);
    await act(async()=>byLabel('展开商品礼包').props.onClick(event));assert.ok(byLabel('6大会员随心选'));
    await act(async()=>byLabel('6大会员随心选').props.onClick(event));assert.ok(byLabel('关闭礼包详情'));assert.equal(byId('products/package-1').props['aria-pressed'],true);
    await act(async()=>byId('products/package-0').props.onClick(event));assert.ok(byLabel('会员专属礼包'));assert.equal(byLabel('中秋铭牌'),undefined);assert.equal(byLabel('关闭礼包详情'),undefined);
    await act(async()=>byId('products/package-2').props.onClick(event));assert.ok(byLabel('终身会员铭牌'));
    const node=indexDocument(document).nodes.get('products/package-2'),empty=setPackageGifts(document,node,[]);
    await act(async()=>renderer.update(React.createElement(Preview,{document:empty,editing:false,onSelect(){},onStatus(){}})));assert.equal(byId('products/gifts'),undefined);
  }finally{await act(async()=>renderer?.unmount());}
});

test('inspector edits actual package data, previews configured package and exposes working style controls',async()=>{
  const document=blue(),{nodes,parents}=indexDocument(document),selected=nodes.get('products/gifts');let renderer,change,nav,patch;
  const field=label=>renderer.root.findAll(node=>['input','select','textarea'].includes(node.type)&&node.props['aria-label']===label)[0];
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Properties,{selected,p:{...selected.props},patch:value=>patch=value,document,nodes,parents,navigation:{},setNavigation:value=>nav=value,onPackageGiftsChange:(...value)=>change=value}));});
    await act(async()=>field('礼包名称').props.onChange({target:{value:'新礼包名称'}}));assert.equal(change[0],'products/package-1');assert.equal(change[1][0].title,'新礼包名称');
    await act(async()=>field('配置礼包的套餐').props.onChange({target:{value:'products/package-0'}}));assert.equal(nav.selectedPackage,'products/package-0');
    await act(async()=>field('卡片宽度').props.onChange({target:{value:'220'}}));assert.equal(patch.cardWidth,220);
  }finally{await act(async()=>renderer?.unmount());}
});
