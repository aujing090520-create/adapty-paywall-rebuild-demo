import { component, createNativeComponent, canContain, indexDocument } from './componentDocument.js';
import { repairBlueProductPlacement } from './htTemplateFooters.js';
import { businessPreset } from './businessPresets.js';
import { upgradeProductParameters } from '../products/productParameters.js';
import { billingMonths } from '../productPricing.js';
import {normalizeHtLabelSlots} from './layoutContainers.js';
import {buildBlueVipColumn} from './htVipColumn.js';
import {upgradeTimerTextVariables,consolidateCountdownText} from './textVariableTokens.js';
import {upgradePagePresentation} from './pagePresentation.js';
import {upgradeTrialButtonText} from './buttonText.js';
import {consolidateTrialPurchase} from './purchaseSelection.js';

// Public picker entries are building blocks or transparent Stack compositions.
// Structural children are offered only by their owning container.
export const COMPONENT_CATALOG = [
  { name: '基础', items: [ ['Text','文字'], ['Image','图片'], ['Video','视频'], ['Icon','图标'], ['Stack','布局容器'], ['Header','页头'], ['Footer','页脚'], ['Custom','自定义组件'] ] },
  { name: '付费墙', items: [ ['Package','商品套餐'], ['ProductParameter','商品参数'], ['BottomSheet','按钮打开的弹窗'], ['PurchaseButton','购买按钮'], ['ExpressCheckout','快捷结账'] ] },
  { name: '交互', items: [ ['Tabs','标签页'], ['Switch','开关'], ['Button','按钮'], ['CloseButton','关闭按钮'], ['BackButton','返回按钮'], ['Carousel','轮播'] ] },
  { name: '内容', items: [ ['Countdown','倒计时'], ['Timeline','时间线'], ['SocialProof','口碑展示'], ['FeatureList','权益列表'], ['Award','奖项展示'] ] },
  { name: '业务组合', items: [['GiftList','礼包组合'],['BenefitsStrip','福利组合'],['GiftEntry','赠送入口']] },
];
export const CATALOG_NODE_TYPE = { GiftList:'Stack',BenefitsStrip:'Stack',GiftEntry:'Button',SocialProof: 'Stack', FeatureList: 'Stack', Award: 'Stack', BottomSheet: 'Button', CloseButton: 'Button', BackButton: 'Button' };
export function catalogFor(parent) {
  if (parent?.type === 'Switch' && (!parent.children.length || parent.children.some((child) => child.type === 'SwitchCase'))) {
    return canContain(parent, { type: 'SwitchCase' }) ? [{ name: '开关内容', items: [['SwitchCase', '状态内容']] }] : [];
  }
  const structural = { Tabs: [['Tab','标签页面']], TabControl: [], Carousel: [['Slide','轮播页'],['PageControl','分页控件']], PageControl: [['Indicators','分页指示器']], Timeline: [['TimelineItem','时间节点']], Flow: [['Screen','页面']], ExpressCheckout: [['CheckoutState','状态内容']], Countdown: [['CountdownState','状态内容']] }[parent?.type];
  if (structural) return [{ name: '子层', items: structural.filter(([type])=>canContain(parent,{type})) }].filter((group)=>group.items.length);
  const groups = COMPONENT_CATALOG.map((group) => ({ ...group, items: group.items.filter(([type]) => canContain(parent, { type: CATALOG_NODE_TYPE[type] ?? type })) })).filter((group) => group.items.length);
  if (parent?.type === 'CheckoutState' && parent.props.state === 'available' && !parent.children.some((child) => child.type === 'Wallet')) groups.unshift({ name: '结账控件', items: [['Wallet', '钱包按钮']] });
  if (parent?.type === 'SwitchCase' && ![...indexDocument({ root: parent }).nodes.values()].some((child) => child.type === 'Toggle' && child.props.switchControl)) groups.unshift({ name: '开关控件', items: [['Toggle', '开关控件']] });
  if(parent?.type==='Tab')groups.unshift({name:'标签控件',items:[['TabControl','标签按钮组']]});
  if(parent?.type==='Switch'&&parent.children.filter((child)=>child.type==='SwitchCase').length<2)groups.unshift({name:'开关内容',items:[['SwitchCase','状态内容']]});
  return groups;
}
const pad = (size) => ({ paddingTop:size, paddingRight:size, paddingBottom:size, paddingLeft:size });
const t = (id, text, props = {}) => component(id,'Text','文字',{text,...props});
const s = (id, name, children, props = {}) => component(id,'Stack',name,{gap:8,...props},children);
const button = (id, type, label, action = 'None') => component(id,type,type === 'PurchaseButton' ? '购买按钮' : '按钮',{action:{action},background:'#167aff',radius:8,...pad(12)},[t(`${id}/text`,label,{color:'#ffffff',textAlign:'center',fontWeight:600})]);
export function createTabSelectorButton(id,target,index,label='文字',textId=`${id}/text`) {
  return component(id,'TabButton',`标签 ${index+1}`,{target,index,axis:'horizontal',align:'center',justify:'center',gap:0,widthMode:'fit',heightMode:'fixed',height:24,paddingHorizontal:16,paddingLeft:16,paddingRight:16,radius:7,color:'#000000',selectedBackground:'#ffffff',selectedColor:'#000000',selectedShadowX:0,selectedShadowY:3,selectedShadowBlur:8,selectedShadowColor:'#000000',selectedShadowOpacity:10},[t(textId,label,{widthMode:'fit',fontSize:14})]);
}
export function createTabSelector(id,target,count=2) {
  return component(id,'TabControl','标签按钮组',{axis:'horizontal',align:'center',justify:'center',gap:0,widthMode:'fit',radius:9,background:'#f2f2f3',...pad(2),marginBottom:16},Array.from({length:count},(_,index)=>createTabSelectorButton(`${id}/button-${index}`,target,index)));
}
export function createPageControl(id) {
  return component(id,'PageControl','分页控件',{gap:8,...pad(8),marginTop:8,appearanceEnabled:false},[createCatalogComponent('Indicators',`${id}/indicators`)]);
}
export function createCatalogComponent(type, id = crypto.randomUUID(), context = {}) {
  if(['GiftList','BenefitsStrip','GiftEntry'].includes(type))return businessPreset(type,id);
  if (type === 'Toggle' && context.switchTarget) return component(id, type, '开关控件', { switchTarget: context.switchTarget, switchControl: true, thumbColor: '#ffffff', trackColor: context.index ? '#34c759' : '#e5e5ea' });
  if (['CloseButton','BackButton'].includes(type)) return component(id,'Button',type==='BackButton'?'返回按钮':'关闭按钮',{action:{action:type==='BackButton'?'NavigateBack':'Dismiss'},widthMode:'fixed',width:32,heightMode:'fixed',height:32,axis:'horizontal',align:'center',justify:'center',gap:0,background:'transparent',radius:16},[component(`${id}/icon`,'Icon','图标',{icon:`tabler:outline:${type==='BackButton'?'arrow-left':'x'}`,widthMode:'fixed',width:20,heightMode:'fixed',height:20,color:'#62626e'})]);
  if(type==='Text')return t(id,'文字',{widthMode:'fit',heightMode:'fit',fontSize:14,fontWeight:400,color:'#000000'});
  if(type==='ProductParameter')return component(id,type,'商品参数',{parameter:'totalPrice',widthMode:'fit',heightMode:'fit',fontSize:14,fontWeight:400,color:'#000000'});
  if(type==='Icon')return component(id,type,'图标',{icon:'tabler:outline:icons',widthMode:'fixed',heightMode:'fixed',width:26,height:26,color:'#000000'});
  if(type==='Indicators')return component(id,type,'分页指示器',{widthMode:'fixed',width:5,heightMode:'fixed',height:5,background:'#000000',backgroundOpacity:30,selectedBackground:'#000000',selectedBackgroundOpacity:53,borderColor:'#000000'});
  if(type==='PageControl')return createPageControl(id);
  if(type==='Slide')return component(id,type,'轮播页',{axis:'horizontal',align:'center',justify:'center',gap:0,heightMode:'fixed',height:160,radius:16,background:'linear-gradient(180deg, rgba(234,237,251,0.18) 0%, #eaedfb 100%)',borderWidth:1,borderColor:'#cccccc'},[t(`${id}/text`,'文字',{widthMode:'fit'})]);
  if (type === 'Tab') return component(id,type,'标签页面',{align:'center',justify:'center',gap:0},[t(`${id}/content`,'文字')]);
  if (type === 'TabButton') return createTabSelectorButton(id,'',0);
  if (type === 'Button') return component(id,type,'按钮',{action:{action:'NavigateTo'},widthMode:'fit',axis:'vertical',align:'start',gap:0},[t(`${id}/text`,'文字',{widthMode:'fit',fontSize:14})]);
  if (type === 'Video') return component(id,type,'视频',{src:'',objectFit:'contain',heightMode:'fit',loop:true,muted:true,autoPlay:true,controls:false});
  if (type === 'Custom') return component(id,type,'自定义组件',{heightMode:'fit',loadingHeight:300});
  if (['Header','Footer'].includes(type)) return component(id,type,type === 'Header' ? '页头' : '页脚',{background:'#ffffff',gap:0,align:'start',shadowX:0,shadowY:type==='Header'?4:-4,shadowBlur:16,shadowColor:'#000000',shadowOpacity:20},[]);
  if (type === 'PurchaseButton') return component(id,type,'购买按钮',{action:{action:'Purchase'},background:'#000000',shape:'pill',align:'center',gap:0,...pad(8),marginLeft:12,marginRight:12},[t(`${id}/text`,'文字',{color:'#ffffff',widthMode:'fit',fontSize:14})]);
  if (type === 'Wallet') return component(id,type,'钱包按钮',{method:'apple',heightMode:'fixed',height:44,radius:6,background:'#111111',color:'#ffffff'});
  if (type === 'BottomSheet') { const launch = button(id,'Button','查看详情','OpenSheet'); launch.name = '打开底部弹层'; launch.props.action.actionPage = `${id}/sheet`; launch.children.push(component(`${id}/sheet`,type,'底部弹层',{presentation:'sheet',background:'#ffffff',radius:20,gap:16,...pad(20)},[t(`${id}/title`,'标题',{fontSize:22,fontWeight:700}),t(`${id}/content`,'内容'),button(`${id}/close`,'Button','返回','CloseSheet')])); return launch; }
  if (type === 'ExpressCheckout') return component(id,type,'快捷结账',{previewState:'available'},[
    component(`${id}/available`,'CheckoutState','可用状态',{state:'available'},[createCatalogComponent('Wallet',`${id}/wallet`)]),
    component(`${id}/unavailable`,'CheckoutState','不可用状态',{state:'unavailable'},[button(`${id}/fallback`,'PurchaseButton','继续','Purchase')]),
    component(`${id}/loading`,'CheckoutState','加载状态',{state:'loading'},[t(`${id}/loading-text`,'加载中…',{textAlign:'center'})]),
  ]);
  if (type === 'Switch') return component(id,type,'开关',{defaultIndex:0},[0,1].map((index)=>component(`${id}/${index?'on':'off'}`,'SwitchCase',index?'开启内容':'关闭内容',{index,axis:'vertical',align:'center',justify:'center',gap:0},[component(`${id}/control-${index}`,'Toggle','开关控件',{switchTarget:id,switchControl:true,thumbColor:'#ffffff',trackColor:index?'#34c759':'#e5e5ea'}),t(`${id}/${index?'on':'off'}-text`,'文字')])));
  if(type==='Tabs')return component(id,type,'标签页',{defaultIndex:0},[0,1].map((at)=>component(`${id}/tab-${at}`,'Tab',`标签 ${at+1}`,{gap:0,align:'center',justify:'center'},[
    {...createTabSelector(`${id}/controls-${at}`,id,0),children:[0,1].map((index)=>createTabSelectorButton(`${id}/tab-button-${at}-${index}`,id,index,'文字',`${id}/tab-label-${at}-${index}`))},t(`${id}/tab-content-${at}`,'文字'),
  ])));
  if(type==='Carousel')return component(id,type,'轮播',{defaultIndex:0,pageAlignment:'top',pageSpacing:16,pagePeek:16,loop:false,autoPlay:false,autoPlayInterval:2500,transitionTime:500,transitionAnimation:'slide',pageControlVersion:1,appearanceEnabled:false,gap:0,marginTop:8},[...[0,1,2].map((at)=>({...createCatalogComponent('Slide',`${id}/slide-${at}`),name:`第 ${at+1} 页`})),createPageControl(`${id}/page-control`)]);
  if (type === 'Countdown') return component(id,type,'倒计时',{deadline:new Date(Date.now()+3*86400000).toISOString(),countFrom:'days',fallbackEnabled:false,previewState:'auto'},[
    component(`${id}/active`,'CountdownState','计时内容',{state:'active',axis:'vertical',align:'center',justify:'center',gap:0},[t(`${id}/countdown-text`,'{{ count_days_with_zero }} : {{ count_hours_with_zero }} : {{ count_minutes_with_zero }} : {{ count_seconds_with_zero }}',{widthMode:'fit',fontSize:32,fontWeight:700,textAlign:'center'})]),
    component(`${id}/ended`,'CountdownState','结束内容',{state:'ended',align:'center',justify:'center',gap:0},[t(`${id}/ended-text`,'时间到！',{widthMode:'fit',fontSize:32,fontWeight:700,textAlign:'center'})]),
    component(`${id}/fallback`,'CountdownState','兜底内容',{state:'fallback'},[]),
  ]);
  if (type === 'FeatureList') return s(id,'权益列表',[0,1,2].map((index)=>s(`${id}/item-${index}`,'权益项',[
    component(`${id}/icon-${index}`,'Icon','图标',{icon:'check',color:'#167aff',widthMode:'fixed',width:22}),
    s(`${id}/copy-${index}`,'文字',[t(`${id}/title-${index}`,`权益 ${index + 1}`,{fontWeight:600}),t(`${id}/description-${index}`,'权益说明',{fontSize:12,color:'#777777'})]),
  ],{axis:'horizontal',gap:10,align:'start'})),{gap:16});
  if (type === 'SocialProof') return s(id,'口碑展示',[t(`${id}/stars`,'★★★★★',{color:'#ffb400',fontSize:22,textAlign:'center'}),t(`${id}/quote`,'用户评价',{textAlign:'center'}),t(`${id}/author`,'用户名称',{fontSize:12,color:'#777777',textAlign:'center'})]);
  if (type === 'Award') return s(id,'奖项展示',[component(`${id}/icon`,'Icon','奖项图标',{icon:'star',color:'#ffb400',iconSize:28,alignSelf:'center'}),t(`${id}/title`,'奖项名称',{fontSize:20,fontWeight:700,textAlign:'center'}),t(`${id}/source`,'颁发机构',{fontSize:12,color:'#777777',textAlign:'center'})]);
  if (type === 'Package') return upgradeProductParameters({products:{},root:component(id,type,'商品套餐',{productType:'subscription',dataKey:id,group:id,defaultSelected:true,productLabelEnabled:true,gap:0,align:'start',radius:8,borderWidth:1,borderColor:'#cccccc',...pad(8),marginTop:8,marginRight:8,marginBottom:8,marginLeft:8},[
    s(`${id}/content`,'布局容器',[
      s(`${id}/label`,'布局容器',[t(`${id}/label/text`,'',{binding:{key:id,field:'badgeText'},fontSize:12,color:'#403060',widthMode:'fit'})],{productField:'badgeText',widthMode:'fit',background:'#f0ecff',radius:4,...pad(4)}),
      t(`${id}/name`,'',{binding:{key:id,field:'name'},fontSize:14,widthMode:'fit'}),
      t(`${id}/reference`,'',{binding:{key:id,field:'reference'},fontSize:12,color:'#999999',strike:true,widthMode:'fit'}),
      t(`${id}/price`,'',{binding:{key:id,field:'price'},fontSize:17,fontWeight:700,widthMode:'fit'}),
      t(`${id}/info`,'',{binding:{key:id,field:'productInfo'},fontSize:12,color:'#26715e',widthMode:'fit'}),
    ],{gap:6,align:'start'}),
  ])}).root;
  if (type === 'Timeline') return component(id,type,'时间线',{itemSpacing:24,textSpacing:4,columnGutter:16,iconAlignment:'title'},[0,1,2].map((index)=>({...createCatalogComponent('TimelineItem',`${id}/item-${index}`),name:`节点 ${index+1}`})));
  if (type === 'CheckoutState') return component(id,type,'状态内容',{state:'available'},[]);
  if (type === 'CountdownState') return component(id,type,'状态内容',{state:'active'},[]);
  if (type === 'SwitchCase') return component(id,type,'状态内容',{index:0},[]);
  if(type==='TimelineItem')return component(id,type,'时间节点',{connectorEnabled:true,connectorWidth:8,connectorColor:'#bcc4f1'},[component(`${id}/icon`,'Icon','图标',{icon:'check',widthMode:'fixed',heightMode:'fixed',width:26,height:26}),t(`${id}/title`,'标题',{fontWeight:600}),t(`${id}/description`,'说明',{fontSize:12})]);
  if(type==='TabControl')return createTabSelector(id,'');
  return createNativeComponent(type,id);
}

export function upgradeCanonicalComponents(document) {
  document=consolidateTrialPurchase(upgradeTrialButtonText(document));
  let changed=false;
  const ids = new Set(indexDocument(document).nodes.keys());
  const visit=(node)=>{
    if (document.templateId?.startsWith('rc-source-') && node.type === 'Button' && node.props.action?.action === 'Purchase') {
      changed = true;
      return { ...node, type: 'PurchaseButton', children: node.children.map(visit) };
    }
    if (node.type === 'BottomSheet' && node.children.some((child) => child.id === `${node.id}/gift`) && node.children.some((child) => child.id === `${node.id}/timer`) && node.children.some((child) => child.id === `${node.id}/cancel` && child.type === 'Text')) {
      changed = true;
      return { ...node, children: node.children.map((child) => child.id === `${node.id}/cancel` && child.type === 'Text' ? component(child.id, 'Button', child.name, { action: { action: 'Dismiss' }, background: 'transparent', ...pad(0) }, [{ ...child, id: `${child.id}/label` }]) : visit(child)) };
    }
    if(node.type==='Stack' && ['overlay','sheet'].includes(node.props.presentation)){
      changed=true;
      return {...node,type:'BottomSheet',children:node.children.map(visit)};
    }
    if(node.type==='Carousel' && !node.props.pageControlVersion){
      changed=true;
      const children=node.children.map(visit);
      if(!children.some((child)=>child.type==='PageControl') && children.filter((child)=>child.type==='Slide').length>1){
        let id=`${node.id}/page-control`,index=1;while(ids.has(id)||ids.has(`${id}/indicators`))id=`${node.id}/page-control-${index++}`;
        ids.add(id);ids.add(`${id}/indicators`);
        const control=createPageControl(id);
        control.children[0].props={...control.children[0].props,background:node.props.dotColor??'#6d47e8',backgroundOpacity:55,selectedBackground:node.props.activeDotColor??node.props.dotColor??'#6d47e8',selectedBackgroundOpacity:100,width:7,height:7};
        children.push(control);
      }
      return {...node,props:{...node.props,pageControlVersion:1},children};
    }
    if(node.type==='Icon' && (node.props.widthMode==='fill' || node.props.heightMode==='fill')){
      changed=true;
      let id=`${node.id}/layout`,index=1;while(ids.has(id))id=`${node.id}/layout-${index++}`;ids.add(id);
      const {icon,number,iconSize,fontSize,color,iconBackground,iconRadius,...layout}=node.props;
      const size=iconSize??fontSize??14;
      const glyph=Object.fromEntries(Object.entries({icon,number,fontSize,color,widthMode:'fixed',width:size,heightMode:'fixed',height:size,radius:0,iconBackground:'transparent'}).filter(([,value])=>value!==undefined));
      return component(id,'Stack','图标单元格',{...layout,axis:'vertical',gap:0,align:'center',justify:'center',background:iconBackground&&iconBackground!=='transparent'?iconBackground:layout.background??'transparent'},[{...node,props:glyph,children:[]}]);
    }
    if(node.type==='Countdown'&&!node.children.length){
      changed=true;
      const native=createCatalogComponent('Countdown',node.id),props=node.props,size=props.fontSize??24;
      const active=native.children[0]; active.props.gap=5;
      const digits=['hours','separator-1','minutes','separator-2','seconds'].map((key)=>t(`${native.id}/${key}`,key.startsWith('separator')?':':'',{...(key.startsWith('separator')?{}:{timerField:key,fontWeight:700,background:props.digitBackground??'transparent',radius:4,paddingLeft:3,paddingRight:3}),widthMode:'fit',fontSize:size,color:props.color}));
      active.props.align='center';active.props.axis='horizontal';
      const parts=[...(props.prefix?[t(`${native.id}/prefix`,props.prefix,{widthMode:'fit',fontSize:size,color:props.prefixColor??props.color})]:[]),...digits,...(props.suffix?[t(`${native.id}/suffix`,props.suffix,{widthMode:'fit',fontSize:size,color:props.color})]:[])];
      active.children=parts;
      native.children[1]=component(`${native.id}/ended`,'CountdownState','结束内容',{state:'ended'},[t(`${native.id}/ended-text`,'优惠已结束',{textAlign:'center'})]);
      native.children[2]=component(`${native.id}/fallback`,'CountdownState','兜底内容',{state:'fallback'},[t(`${native.id}/fallback-text`,'限时优惠',{textAlign:'center'})]);
      return {...node,props:{...props,fallbackEnabled:props.fallbackEnabled??false,previewState:'auto'},children:native.children};
    }
    if(node.type==='CountdownState'&&node.props.state==='active'){
      const children=node.children.map((child)=>child.type==='Text'&&child.props.widthMode===undefined?{...child,props:{...child.props,widthMode:'fit'}}:visit(child));
      if(children.some((child,index)=>child!==node.children[index])){changed=true;return {...node,children};}
    }
    const children=node.children.map(visit);
    return children.some((child,index)=>child!==node.children[index])?{...node,children}:node;
  };
  const root=visit(document.root);
  return upgradePagePresentation(upgradeProductParameters(consolidateCountdownText(upgradeTimerTextVariables(normalizeHtLabelSlots(buildBlueVipColumn(repairBlueProductPlacement(changed?{...document,root}:document))))), row => billingMonths(row) === 0 ? 'lifetime' : 'subscription'));
}
