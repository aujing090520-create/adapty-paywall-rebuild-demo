import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import Properties from '../src/builder/RevenueCatProperties.jsx';
import Preview from '../src/builder/ComponentPreview.jsx';
import {COMPONENT_TYPES,COMPONENT_NAMES,component as c,indexDocument,componentProps,resolveComponentText,updateComponent} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {patchComponentProperties,togglePageControl,copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {defaultPackagePatch} from '../src/builder/propertyModel.js';
import {createButtonModal} from '../src/builder/buttonModals.js';
import {DEMO_SKUS} from '../src/productPricing.js';
import '../src/styles.css';
import '../src/builder/componentEditor.css';

function fixture(type){
  const groups={Tab:'Tabs',TabControl:'Tabs',TabButton:'Tabs',Slide:'Carousel',PageControl:'Carousel',Indicators:'Carousel',CountdownState:'Countdown',SwitchCase:'Switch',CheckoutState:'ExpressCheckout',Wallet:'ExpressCheckout',TimelineItem:'Timeline'};
  let body=createCatalogComponent(groups[type]??type,'sample');
  if(type==='Flow')body=c('sample','Flow','多页面流程',{initialStepId:'two',defaultIndex:0},[c('one','Screen','第一步',{},[c('one/text','Text','文字',{text:'第一步'})]),c('two','Screen','第二步',{},[c('two/text','Text','文字',{text:'第二步'})])]);
  const selected=[...indexDocument({root:body}).nodes.values()].find(node=>node.type===type);
  if(['Text','ProductParameter'].includes(type)){
    if(type==='Text')selected.props={text:'套餐价格',fontSize:16,fontWeight:400,color:'#112233',runs:[{text:'套餐',fontSize:16,color:'#112233'},{text:'价格',fontSize:18,fontWeight:700}]};
    body=c('plan','Package','商品套餐',{dataKey:'annual',group:'plan',defaultSelected:false,borderWidth:1,borderColor:'#777777',paddingVertical:16,paddingHorizontal:16},[selected]);
  }
  if(type==='Image')selected.props.src='/ht-retention-gift.png';
  if(type==='Icon'){
    selected.props={...selected.props,icon:'heart',color:'#112233',selectedColor:'#abcdef'};
    body=c('icon-plan','Package','商品套餐',{defaultSelected:false},[selected]);
  }
  if(type==='Stack'){
    selected.props={...selected.props,axis:'horizontal',widthMode:'fixed',width:220};
    selected.children=[c('wide-a','Text','文字',{text:'第一个条目',widthMode:'fixed',width:200}),c('wide-b','Text','文字',{text:'第二个条目',widthMode:'fixed',width:200})];
  }
  if(type==='Custom')selected.props={...selected.props,heightMode:'fit',html:'<p style="font:18px sans-serif;color:#20664f">自定义内容</p>'};
  if(['Header','Footer','Screen','Stack','CheckoutState','SwitchCase','CountdownState'].includes(type)&&!selected.children.length)selected.children.push(c(`${selected.id}/copy`,'Text','文字',{text:'示例内容',fontSize:20}));
  const plan=c('purchase-plan','Package','商品套餐',{dataKey:'annual',defaultSelected:true},[c('plan-label','Text','文字',{binding:{key:'annual',field:'name'}})]);
  const children=[body,...(['Wallet','PurchaseButton','ExpressCheckout'].includes(type)?[plan,c('agreement','Toggle','协议',{required:true,initial:false})]:[])];
  return {document:{version:3,templateId:'configuration-audit',products:{sample:{skuId:'DEMO-BLUE-YEAR'},annual:{skuId:'DEMO-BLUE-YEAR'}},root:type==='Screen'?body:c('root','Screen','页面',{},children)},selectedId:selected.id,navigation:type==='BottomSheet'?{overlay:selected.id}:{}};
}
function Case({type}){
  const initial=fixture(type),[document,setDocument]=useState(initial.document),[selectedId,setSelectedId]=useState(initial.selectedId),[navigation,setNavigation]=useState(initial.navigation),[editing,setEditing]=useState(true),[width,setWidth]=useState(260),[status,setStatus]=useState('');
  const {nodes,parents}=indexDocument(document),selected=nodes.get(selectedId)??document.root;
  const patch=props=>setDocument(current=>patchComponentProperties(current,selected.id,props));
  const findPackage=id=>{let node=nodes.get(id);while(node&&node.type!=='Package')node=nodes.get(parents.get(node.id));return node;};
  const mergeNavigation=next=>setNavigation(current=>({...current,...next}));
  return <>
    <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:12}}><label>编辑预览<input aria-label="编辑预览" type="checkbox" checked={editing} onChange={event=>setEditing(event.target.checked)}/></label><label>预览宽度<select aria-label="预览宽度" value={width} onChange={event=>setWidth(Number(event.target.value))}>{[260,320,390].map(value=><option key={value}>{value}</option>)}</select></label><button type="button" onClick={()=>{const parent=parents.get(selected.id);if(!parent)return;const result=pasteFragment(document,parent,copyFragment(document,selected.id));setDocument(result.document);if(result.ids[0])setSelectedId(result.ids[0]);}}>复制当前组件</button><output aria-label="操作结果">{status}</output></div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(300px,1fr) 360px',gap:24,alignItems:'start'}}>
      <section aria-label="配置预览" style={{width,maxWidth:'100%',margin:'auto'}}><Preview document={document} selectedId={selected.id} editing={editing} navigation={navigation} onNavigate={mergeNavigation} onSelect={setSelectedId} onStatus={setStatus}/></section>
      <aside className="ne-properties" style={{height:'calc(100dvh - 120px)',overflow:'auto'}}><h2 style={{fontSize:16}}>{COMPONENT_NAMES[selected.type]}</h2><Properties key={selected.id} selected={selected} p={componentProps(selected)} patch={patch} document={document} nodes={nodes} parents={parents} navigation={navigation} setNavigation={mergeNavigation} onStatus={setStatus} findPackage={findPackage} resolveText={resolveComponentText} demoSkus={DEMO_SKUS} fieldNames={{name:'商品周期',price:'价格',reference:'原价',productInfo:'商品信息',badgeText:'商品标签'}} changeProduct={(key,value)=>setDocument(current=>({...current,products:{...current.products,[selected.props.dataKey??selected.id]:{...current.products[selected.props.dataKey??selected.id],[key]:value}}}))} setDefaultPackage={enabled=>setDocument(current=>defaultPackagePatch(current,selected.id,enabled))} onMediaType={type=>setDocument(current=>updateComponent(current,selected.id,{type}))} onPageControl={enabled=>setDocument(current=>togglePageControl(current,selected.id,enabled))} onFontsChange={fonts=>setDocument(current=>({...current,fonts}))} onModalCreate={blank=>{const result=createButtonModal(document,selected.id,blank);setDocument(result.document);if(result.id){setSelectedId(result.id);mergeNavigation({overlay:result.id});}}} onModalEdit={id=>{setSelectedId(id);mergeNavigation({overlay:id});}}/></aside>
    </div>
  </>;
}
function Audit(){const [type,setType]=useState('Text');return <main style={{padding:20,maxWidth:1100,margin:'auto'}}><label>检查组件<select aria-label="检查组件" value={type} onChange={event=>setType(event.target.value)}>{COMPONENT_TYPES.map(type=><option key={type} value={type}>{COMPONENT_NAMES[type]}</option>)}</select></label><Case key={type} type={type}/></main>;}
createRoot(document.getElementById('root')).render(<Audit/>);
