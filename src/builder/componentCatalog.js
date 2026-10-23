import { component, createNativeComponent, canContain } from './componentDocument.js';

// Public picker entries are building blocks or transparent Stack compositions.
// Structural children are offered only by their owning container.
export const COMPONENT_CATALOG = [
  { name: '基础', items: [ ['Text','文字'], ['Image','图片'], ['Video','视频'], ['Icon','图标'], ['Stack','布局容器'], ['Header','页头'], ['Footer','页脚'], ['Custom','自定义网页'] ] },
  { name: '付费墙', items: [ ['Package','商品'], ['BottomSheet','底部弹层'], ['PurchaseButton','购买按钮'], ['ExpressCheckout','快捷结账'] ] },
  { name: '交互', items: [ ['Tabs','标签页'], ['Switch','开关'], ['Button','按钮'], ['Carousel','轮播'] ] },
  { name: '内容', items: [ ['Countdown','倒计时'], ['Timeline','时间线'], ['SocialProof','口碑展示'], ['FeatureList','权益列表'], ['Award','奖项展示'] ] },
];
export const CATALOG_NODE_TYPE = { SocialProof: 'Stack', FeatureList: 'Stack', Award: 'Stack', BottomSheet: 'Button' };
export function catalogFor(parent) {
  const structural = { Tabs: [['Tab','标签页面']], TabControl: [['TabButton','标签按钮']], Carousel: [['Slide','轮播页']], Timeline: [['TimelineItem','时间节点']], Flow: [['Screen','页面']], ExpressCheckout: [['CheckoutState','状态内容']], Countdown: [['CountdownState','状态内容']] }[parent?.type];
  if (structural) return [{ name: '子层', items: structural.filter(([type])=>canContain(parent,{type})) }].filter((group)=>group.items.length);
  const groups = COMPONENT_CATALOG.map((group) => ({ ...group, items: group.items.filter(([type]) => canContain(parent, { type: CATALOG_NODE_TYPE[type] ?? type })) })).filter((group) => group.items.length);
  if(parent?.type==='Tab')groups.unshift({name:'标签控件',items:[['TabControl','标签按钮组']]});
  if(parent?.type==='Switch'&&parent.children.filter((child)=>child.type==='SwitchCase').length<2)groups.unshift({name:'开关内容',items:[['SwitchCase','状态内容']]});
  return groups;
}
const pad = (size) => ({ paddingTop:size, paddingRight:size, paddingBottom:size, paddingLeft:size });
const t = (id, text, props = {}) => component(id,'Text','文字',{text,...props});
const s = (id, name, children, props = {}) => component(id,'Stack',name,{gap:8,...props},children);
const button = (id, type, label, action = 'None') => component(id,type,type === 'PurchaseButton' ? '购买按钮' : '按钮',{action:{action},background:'#167aff',radius:8,...pad(12)},[t(`${id}/text`,label,{color:'#ffffff',textAlign:'center',fontWeight:600})]);
export function createCatalogComponent(type, id = crypto.randomUUID()) {
  if (type === 'Custom') return component(id,type,'自定义网页',{html:'<div style="padding:24px;text-align:center">自定义内容</div>',heightMode:'fixed',height:160});
  if (['Header','Footer'].includes(type)) return component(id,type,type === 'Header' ? '页头' : '页脚',{background:'#ffffff',gap:8,...pad(12)}, type === 'Header' ? [t(`${id}/title`,'标题',{fontWeight:700})] : [button(`${id}/purchase`,'PurchaseButton','继续','Purchase')]);
  if (type === 'PurchaseButton') return button(id,type,'继续','Purchase');
  if (type === 'Wallet') return component(id,type,'钱包按钮',{method:'apple',heightMode:'fixed',height:44,radius:6,background:'#111111',color:'#ffffff'});
  if (type === 'BottomSheet') { const launch = button(id,'Button','查看详情','OpenSheet'); launch.name = '打开底部弹层'; launch.props.action.actionPage = `${id}/sheet`; launch.children.push(component(`${id}/sheet`,type,'底部弹层',{presentation:'sheet',background:'#ffffff',radius:20,gap:16,...pad(20)},[t(`${id}/title`,'标题',{fontSize:22,fontWeight:700}),t(`${id}/content`,'内容'),button(`${id}/close`,'Button','返回','CloseSheet')])); return launch; }
  if (type === 'ExpressCheckout') return component(id,type,'快捷结账',{previewState:'available'},[
    component(`${id}/available`,'CheckoutState','可用状态',{state:'available'},[createCatalogComponent('Wallet',`${id}/wallet`)]),
    component(`${id}/unavailable`,'CheckoutState','不可用状态',{state:'unavailable'},[button(`${id}/fallback`,'PurchaseButton','继续','Purchase')]),
    component(`${id}/loading`,'CheckoutState','加载状态',{state:'loading'},[t(`${id}/loading-text`,'加载中…',{textAlign:'center'})]),
  ]);
  if (type === 'Switch') return component(id,type,'开关',{defaultIndex:0},[
    s(`${id}/control-row`,'开关栏',[t(`${id}/label`,'开启选项'),component(`${id}/control`,'Toggle','开关控件',{switchTarget:id})],{axis:'horizontal',align:'center'}),
    component(`${id}/off`,'SwitchCase','关闭内容',{index:0},[t(`${id}/off-text`,'关闭状态内容')]),
    component(`${id}/on`,'SwitchCase','开启内容',{index:1},[t(`${id}/on-text`,'开启状态内容')]),
  ]);
  if(type==='Tabs')return component(id,type,'标签页',{defaultIndex:0},[0,1].map((at)=>component(`${id}/tab-${at}`,'Tab',`标签 ${at+1}`,{gap:12},[
    component(`${id}/controls-${at}`,'TabControl','标签按钮组',{axis:'horizontal',gap:4},[0,1].map((index)=>component(`${id}/tab-button-${at}-${index}`,'TabButton',`标签 ${index+1}`,{target:id,index,background:'#f0eef7',selectedBackground:'#167aff',selectedColor:'#ffffff',...pad(10),radius:6},[t(`${id}/tab-label-${at}-${index}`,`标签 ${index+1}`,{textAlign:'center'})]))),t(`${id}/tab-content-${at}`,`标签 ${at+1} 的内容`),
  ])));
  if(type==='Carousel')return component(id,type,'轮播',{defaultIndex:0},[0,1].map((at)=>component(`${id}/slide-${at}`,'Slide',`第 ${at+1} 页`,{gap:12},[t(`${id}/slide-title-${at}`,`第 ${at+1} 页`,{fontSize:22,fontWeight:700,textAlign:'center'}),t(`${id}/slide-copy-${at}`,'内容',{textAlign:'center'})])));
  if (type === 'Countdown') return component(id,type,'倒计时',{start:'00:10:00',previewState:'auto'},[
    component(`${id}/active`,'CountdownState','计时内容',{state:'active',axis:'horizontal',justify:'center',gap:2},[
      t(`${id}/hours`,'',{timerField:'hours',fontSize:24,fontWeight:700}), t(`${id}/separator-1`,':',{fontSize:24}), t(`${id}/minutes`,'',{timerField:'minutes',fontSize:24,fontWeight:700}), t(`${id}/separator-2`,':',{fontSize:24}), t(`${id}/seconds`,'',{timerField:'seconds',fontSize:24,fontWeight:700}),
    ]),
    component(`${id}/ended`,'CountdownState','结束内容',{state:'ended'},[t(`${id}/ended-text`,'优惠已结束',{textAlign:'center'})]),
    component(`${id}/fallback`,'CountdownState','兜底内容',{state:'fallback'},[t(`${id}/fallback-text`,'限时优惠',{textAlign:'center'})]),
  ]);
  if (type === 'FeatureList') return s(id,'权益列表',[0,1,2].map((index)=>s(`${id}/item-${index}`,'权益项',[
    component(`${id}/icon-${index}`,'Icon','图标',{icon:'check',color:'#167aff',widthMode:'fixed',width:22}),
    s(`${id}/copy-${index}`,'文字',[t(`${id}/title-${index}`,`权益 ${index + 1}`,{fontWeight:600}),t(`${id}/description-${index}`,'权益说明',{fontSize:12,color:'#777777'})]),
  ],{axis:'horizontal',gap:10,align:'start'})),{gap:16});
  if (type === 'SocialProof') return s(id,'口碑展示',[t(`${id}/stars`,'★★★★★',{color:'#ffb400',fontSize:22,textAlign:'center'}),t(`${id}/quote`,'用户评价',{textAlign:'center'}),t(`${id}/author`,'用户名称',{fontSize:12,color:'#777777',textAlign:'center'})]);
  if (type === 'Award') return s(id,'奖项展示',[component(`${id}/icon`,'Icon','奖项图标',{icon:'star',color:'#ffb400',iconSize:28,alignSelf:'center'}),t(`${id}/title`,'奖项名称',{fontSize:20,fontWeight:700,textAlign:'center'}),t(`${id}/source`,'颁发机构',{fontSize:12,color:'#777777',textAlign:'center'})]);
  if (type === 'Package') return component(id,type,'商品',{dataKey:id,group:id,defaultSelected:true,gap:8,radius:8,borderWidth:2,borderColor:'#dddddd',selectedBorder:'#167aff',selectedBackground:'#ffffff',...pad(12)},[t(`${id}/name`,'',{binding:{key:id,field:'name'},fontWeight:600}),t(`${id}/price`,'',{binding:{key:id,field:'price'},fontSize:20,fontWeight:700})]);
  if (type === 'Timeline') return component(id,type,'时间线',{gap:16},[0,1,2].map((index)=>component(`${id}/item-${index}`,'TimelineItem',`节点 ${index + 1}`,{axis:'horizontal',gap:10},[component(`${id}/icon-${index}`,'Icon','图标',{icon:'check',widthMode:'fixed',width:22}),s(`${id}/copy-${index}`,'文字',[t(`${id}/title-${index}`,`标题 ${index + 1}`,{fontWeight:600}),t(`${id}/description-${index}`,'说明',{fontSize:12})])])));
  if (type === 'CheckoutState') return component(id,type,'状态内容',{state:'available'},[]);
  if (type === 'CountdownState') return component(id,type,'状态内容',{state:'active'},[]);
  if (type === 'SwitchCase') return component(id,type,'状态内容',{index:0},[]);
  if(type==='TimelineItem')return component(id,type,'时间节点',{axis:'horizontal',gap:10},[component(`${id}/icon`,'Icon','图标',{icon:'check',widthMode:'fixed',width:22}),s(`${id}/copy`,'文字',[t(`${id}/title`,'标题',{fontWeight:600}),t(`${id}/description`,'说明',{fontSize:12})])]);
  if(type==='TabControl')return component(id,type,'标签按钮组',{axis:'horizontal',gap:4},[0,1].map((index)=>component(`${id}/button-${index}`,'TabButton',`标签 ${index+1}`,{index,target:'',background:'#f0eef7',selectedBackground:'#167aff',selectedColor:'#ffffff',...pad(10)},[t(`${id}/label-${index}`,`标签 ${index+1}`,{textAlign:'center'})])));
  return createNativeComponent(type,id);
}

export function upgradeCanonicalComponents(document) {
  let changed=false;
  const visit=(node)=>{
    if(node.type==='Countdown'&&!node.children.length){
      changed=true;
      const native=createCatalogComponent('Countdown'),props=node.props,size=props.fontSize??24;
      const active=native.children[0]; active.props.gap=5;
      const digits=active.children.map((child)=>({...child,props:{...child.props,fontSize:size,color:props.color,...(child.props.timerField?{background:props.digitBackground??'transparent',radius:4,paddingLeft:3,paddingRight:3}:{})}}));
      active.children=[...(props.prefix?[t(`${native.id}/prefix`,props.prefix,{fontSize:size,color:props.prefixColor??props.color})]:[]),...digits,...(props.suffix?[t(`${native.id}/suffix`,props.suffix,{fontSize:size,color:props.color})]:[])];
      return {...node,props:{...props,previewState:'auto'},children:native.children};
    }
    const children=node.children.map(visit);
    return children.some((child,index)=>child!==node.children[index])?{...node,children}:node;
  };
  const root=visit(document.root);
  return changed?{...document,root}:document;
}
