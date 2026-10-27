import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component as c,indexDocument,validDocument} from '../src/builder/componentDocument.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
const doc=children=>({version:3,templateId:'audit',products:{},root:c('root','Screen','页面',{},children)});
let server,Settings,Preview,Properties;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Settings=(await server.ssrLoadModule('/src/builder/WorkbenchSettings.jsx')).default;Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>server?.close());
async function settings(source,tab='logic'){
  let document=source,renderer;function Harness(){const [value,setValue]=React.useState(source);document=value;return React.createElement(Settings,{document:value,onChange:setValue,initialTab:tab,onClose(){},onPreview(){}});}
  await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});
  return {renderer,document:()=>document,fields:(name,type)=>renderer.root.findAll(node=>node.type===type&&node.props['aria-label']===name),close:()=>act(async()=>renderer.unmount())};
}
test('GA02: copying a component preserves owned translations, resources, business data and remapped rules',()=>{
  const source=doc([c('group','Stack','布局',{},[c('copy','Text','文字',{text:'中文 {{ business.show }}'}),c('image','Image','图片'),c('plan','Package','套餐',{dataKey:'year'})])]);
  source.products.year={skuId:'DEMO-BLUE-YEAR'};source.business={bySku:{'DEMO-BLUE-YEAR':{gifts:[{title:'礼物'}]}}};
  source.localization={defaultLocale:'zh-CN',translations:{en:{copy:{text:'English'}}},assets:[{id:'asset',target:'image',field:'src',src:'/retention.png'}]};
  source.logic={variables:[{id:'var',key:'show',type:'boolean',value:true}],rules:[{id:'rule',conditions:[{type:'variable',source:'show',value:true}],effects:[{target:'copy',kind:'hide'}]}]};
  const target=doc([]),result=pasteFragment(target,'root',copyFragment(source,'group')).document;
  const group=result.root.children[0],copy=group.children.find(node=>node.type==='Text'),image=group.children.find(node=>node.type==='Image');
  assert.equal(result.localization?.translations.en[copy.id]?.text,'English');
  assert.equal(result.localization.assets[0].target,image.id);assert.equal(result.logic.rules[0].effects[0].target,copy.id);
  assert.equal(result.business.bySku['DEMO-BLUE-YEAR'].gifts[0].title,'礼物');assert.ok(validDocument(result));
});
test('GA03: renaming a business variable preserves its configured condition reference',async()=>{
  const source=doc([c('copy','Text','文字',{text:'{{ business.show }}'})]);source.logic={variables:[{id:'v',key:'show',type:'boolean',value:true}],rules:[{id:'r',name:'规则',conditions:[{type:'variable',source:'show',value:true}],effects:[{target:'copy',kind:'hide'}]}]};
  const h=await settings(source);try{await act(async()=>h.fields('变量键','input')[0].props.onChange({target:{value:'visible'}}));
    const input=h.fields('变量键','input')[0];if(input.props.onBlur)await act(async()=>input.props.onBlur());
    assert.equal(h.document().logic.rules[0].conditions[0].source,'visible');assert.equal(indexDocument(h.document()).nodes.get('copy').props.text,'{{ business.visible }}');
  }finally{await h.close();}
});
test('GA04: resource fields follow the selected target rather than exposing no-effect combinations',async()=>{
  const source=doc([c('image','Image','图片')]);source.localization={assets:[{id:'a',target:'root',field:'backgroundImage',src:''}]};
  const h=await settings(source,'assets');try{const options=()=>h.fields('资源字段','select')[0].findAllByType('option').map(node=>node.props.value);
    assert.ok(!options().includes('src'));assert.ok(options().includes('backgroundImage'));
    await act(async()=>h.fields('资源节点','select')[0].props.onChange({target:{value:'image'}}));
    assert.deepEqual(options(),['src']);assert.equal(h.document().localization.assets[0].field,'src');
  }finally{await h.close();}
});
test('GA05: editing a legacy data row without id cannot overwrite or remove its siblings',async()=>{
  const source=doc([]);source.products.year={skuId:'DEMO-BLUE-YEAR'};source.business={bySku:{'DEMO-BLUE-YEAR':{gifts:[{title:'甲'},{title:'乙'}]}}};
  const h=await settings(source,'data');try{await act(async()=>h.fields('条目标题','input')[1].props.onChange({target:{value:'新乙'}}));
    assert.deepEqual(h.document().business.bySku['DEMO-BLUE-YEAR'].gifts.map(item=>item.title),['甲','新乙']);
    await act(async()=>h.fields('删除条目','button')[0].props.onClick());assert.equal(h.document().business.bySku['DEMO-BLUE-YEAR'].gifts.length,1);
  }finally{await h.close();}
});
test('GA06: PAG media keeps its configured overlay without requiring an unrelated image src',async()=>{
  let renderer;await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc([c('pag','Image','图片',{mediaType:'pag',fallbackSrc:'/ht-retention-gift.png',overlayEnabled:true,overlayColor:'#ff0000',overlayOpacity:40})]),editing:true,onSelect(){},onStatus(){}}));});
  try{const image=renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='pag')[0];assert.ok(image.findAll(node=>node.type==='span'&&node.props['aria-hidden']==='true').some(node=>node.props.style.background.includes('#ff0000')));}finally{await act(async()=>renderer.unmount());}
});
test('GA08: wallet checkout uses the same valid-product and required-agreement guard',async()=>{
  let status='',renderer;const source=doc([c('wallet','Wallet','钱包'),c('agree','Toggle','协议',{required:true})]);
  await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:source,editing:false,onSelect(){},onStatus:value=>{status=value;}}));});
  try{const wallet=renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='wallet')[0];await act(async()=>wallet.props.onClick({stopPropagation(){}}));assert.equal(status,'请先勾选同意协议');}finally{await act(async()=>renderer.unmount());}
});
test('GA09: corrupt optional workbench structures cannot pass document validation and crash the editor',()=>{
  for(const patch of [{logic:{rules:{}}},{logic:{rules:[{conditions:{},effects:[]}]}},{localization:{assets:{}}},{business:{benefits:{}}},{business:{bySku:{sku:{gifts:{}}}}}])assert.equal(validDocument({...doc([]),...patch}),false,JSON.stringify(patch));
});

test('GA07: autoplay does not advance a carousel while the pointer is held',async()=>{
  const carousel=createCatalogComponent('Carousel','carousel');carousel.props={...carousel.props,autoPlay:true,loop:true,autoPlayInterval:250};
  let renderer;await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc([carousel]),editing:false,onSelect(){},onStatus(){}}));});
  try{const rail=renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='carousel')[0];
    await act(async()=>rail.props.onPointerDown());await act(async()=>new Promise(resolve=>setTimeout(resolve,300)));
    const first=()=>renderer.root.findAll(node=>node.type==='div'&&node.props['data-carousel-page']===0)[0];assert.equal(first().props['aria-hidden'],false);
    await act(async()=>rail.props.onPointerUp());await act(async()=>new Promise(resolve=>setTimeout(resolve,300)));assert.equal(first().props['aria-hidden'],true);
  }finally{await act(async()=>renderer.unmount());}
});
test('GA10: state panel initializes once with an unstable callback and keeps owner-specific state',async()=>{
  const selected=c('plan','Package','商品套餐'),source=doc([selected]);let renderer,calls=0;
  function Harness(){const [navigation,setNavigation]=React.useState({});return React.createElement(Properties,{selected,p:componentPropsForTest(),document:source,...indexDocument(source),navigation,setNavigation:next=>{if(++calls>5)throw Error('repeated state updates');setNavigation(current=>({...current,...next}));},patch(){},findPackage(){},resolveText(){return '';},changeProduct(){},fieldNames:{},demoSkus:[],onStatus(){},setDefaultPackage(){}});}
  function componentPropsForTest(){return {widthMode:'fill',heightMode:'fit',fontSize:14,background:'transparent',shape:'rectangle',opacity:100};}
  try{await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});assert.equal(calls,1);}finally{if(renderer)await act(async()=>renderer.unmount());}
});
test('GA02: fragment paste remaps Flow initial screen and isolates colliding variable values',()=>{
  const source=doc([c('flow','Flow','流程',{initialStepId:'second'},[c('first','Screen','一'),c('second','Screen','二',{},[c('copy','Text','文字',{text:'{{ business.offer }}'})])])]);
  source.logic={variables:[{id:'v',key:'offer',type:'string',value:'新优惠'}],rules:[{conditions:[],effects:[{target:'copy',kind:'text',value:'{{ business.offer }}'}]}]};
  const target=doc([c('existing','Text','文字',{text:'{{ business.offer }}'})]);target.logic={variables:[{id:'old',key:'offer',type:'string',value:'旧优惠'}]};
  const result=pasteFragment(target,'root',copyFragment(source,'flow')).document,flow=result.root.children[1];
  assert.equal(flow.props.initialStepId,flow.children[1].id);assert.equal(flow.children[1].children[0].props.text,'{{ business.offer_2 }}');
  assert.equal(result.root.children[0].props.text,'{{ business.offer }}');assert.deepEqual(result.logic.variables.map(item=>item.value),['旧优惠','新优惠']);
  assert.equal(result.logic.rules[0].effects[0].value,'{{ business.offer_2 }}');assert.ok(validDocument(result));
});
test('GA03: duplicate or malformed variable keys remain uncommitted drafts',async()=>{
  const source=doc([]);source.logic={variables:[{id:'one',key:'first',type:'string',value:'甲'},{id:'two',key:'second',type:'string',value:'乙'}]};
  const h=await settings(source);try{for(const value of ['second','错误键']){
    await act(async()=>h.fields('变量键','input')[0].props.onChange({target:{value}}));assert.equal(h.fields('变量键','input')[0].props['aria-invalid'],true);
    await act(async()=>h.fields('变量键','input')[0].props.onBlur());assert.equal(h.document().logic.variables[0].key,'first');
  }}finally{await h.close();}
});
test('GA05: legacy rules and assets without ids can be edited individually',async()=>{
  const source=doc([]);source.logic={rules:[{name:'甲',conditions:[],effects:[]},{name:'乙',conditions:[],effects:[]}]};
  source.localization={assets:[{target:'root',src:'/a.png'},{target:'root',src:'/b.png'}]};
  const h=await settings(source);try{await act(async()=>h.fields('规则名称','input')[1].props.onChange({target:{value:'新乙'}}));assert.deepEqual(h.document().logic.rules.map(item=>item.name),['甲','新乙']);}finally{await h.close();}
  const a=await settings(source,'assets');try{await act(async()=>a.fields('变体素材地址','input')[1].props.onChange({target:{value:'/new.png'}}));assert.deepEqual(a.document().localization.assets.map(item=>item.src),['/a.png','/new.png']);}finally{await a.close();}
});
test('GA04: language resources expose PAG fields only for PAG and background fields for containers',async()=>{
  const source=doc([c('pag','Image','图片',{mediaType:'pag'}),c('group','Stack','布局')]);
  const h=await settings(source,'language');try{
    await act(async()=>h.fields('翻译节点','select')[0].props.onChange({target:{value:'pag'}}));
    assert.equal(h.fields('语言PAG地址','input').length,1);assert.equal(h.fields('语言图片/视频地址','input').length,0);
    await act(async()=>h.fields('翻译节点','select')[0].props.onChange({target:{value:'group'}}));
    assert.equal(h.fields('语言背景视频地址','input').length,1);assert.equal(h.fields('语言背景图片地址','input').length,1);
  }finally{await h.close();}
});
test('GA08: wallet blocks missing products and accepts an agreed valid SKU without a real transaction',async()=>{
  for(const valid of [false,true]){let renderer,status='';const source=doc([c('wallet','Wallet','钱包'),c('agree','Toggle','协议',{required:true,initial:true}),...(valid?[c('plan','Package','套餐',{dataKey:'year',defaultSelected:true})]:[])]);source.products={year:{skuId:'DEMO-BLUE-YEAR'}};
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:source,editing:false,onSelect(){},onStatus:value=>{status=value;}}));});
    try{await act(async()=>renderer.root.findAll(node=>node.type==='div'&&node.props['data-component-id']==='wallet')[0].props.onClick({stopPropagation(){}}));assert.equal(status,valid?'钱包结账预览：未发起真实交易':'请先选择有效的商品套餐');}finally{await act(async()=>renderer.unmount());}
  }
});
test('GA02: copying legacy Package-id commerce creates an independent bound product record',()=>{
  const source=doc([c('legacy','Package','套餐',{},[c('price','Text','文字',{binding:{key:'legacy',field:'price'}})])]);source.products.legacy={skuId:'DEMO-BLUE-YEAR'};
  const result=pasteFragment(doc([]),'root',copyFragment(source,'legacy')).document,plan=result.root.children[0];
  assert.notEqual(plan.props.dataKey,'legacy');assert.equal(result.products[plan.props.dataKey].skuId,'DEMO-BLUE-YEAR');assert.equal(plan.children[0].props.binding.key,plan.props.dataKey);
});
test('GA04: video ignores retained PAG properties after a media type change',async()=>{
  let renderer;await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc([c('video','Video','视频',{mediaType:'pag',pagSrc:'/old.pag',src:'/current.mp4'})]),editing:true,onSelect(){},onStatus(){}}));});
  try{assert.equal(renderer.root.findAllByType('video')[0].props.src,'/current.mp4');assert.equal(renderer.root.findAllByType('canvas').length,0);}finally{await act(async()=>renderer.unmount());}
});
