const gradient='linear-gradient(105deg, #fa872c 0%, #f9ce42 100%)';
const names={Screen:'续费折扣页',Header:'页头',Footer:'页脚',Stack:'布局容器',Text:'文字',Image:'图片',Icon:'图标',Button:'按钮',PurchaseButton:'购买按钮',Package:'商品套餐',ProductParameter:'商品参数',Countdown:'倒计时',CountdownState:'倒计时状态内容'};
const n=(id,type,props={},children=[],name=names[type])=>({id,type,name,props,children});
const pad=(vertical,horizontal=vertical)=>({paddingMode:'axis',paddingVertical:vertical,paddingHorizontal:horizontal});
const box=(id,children,props={})=>n(id,'Stack',{gap:0,...props},children);
const text=(id,value,props={})=>n(id,'Text',{text:value,fontSize:14,lineHeight:1.3,color:'#171717',...props});
const parameter=(id,field,props={})=>n(id,'ProductParameter',{parameter:field,fontSize:14,color:'#ffffff',selectedColor:'#ffffff',widthMode:'fit',...props});

// A composition of existing components; no renewal-specific renderer or pricing rule.
export function buildRenewalOfferTemplate(){
  const timer=n('renewal/countdown','Countdown',{timeSource:'manual',timingMode:'everyEntry',start:'00:05:00',countFrom:'hours',previewState:'auto',fallbackEnabled:false,linkProducts:false,heightMode:'fit'},[
    n('renewal/countdown/active','CountdownState',{state:'active',gap:0},[text('renewal/countdown/text','限时优惠 {{ count_hours_with_zero }}:{{ count_minutes_with_zero }}:{{ count_seconds_with_zero }}',{fontSize:16,color:'#ffffff',widthMode:'fit'})],'计时中'),
    n('renewal/countdown/ended','CountdownState',{state:'ended',gap:0},[text('renewal/countdown/ended-text','优惠已结束',{fontSize:16,color:'#ffffff'})],'已结束'),
    n('renewal/countdown/fallback','CountdownState',{state:'fallback',gap:0},[],'数据不可用'),
  ]);
  const close=n('renewal/close','Button',{action:{action:'Dismiss'},widthMode:'fixed',width:28,heightMode:'fixed',height:28,background:'transparent',align:'center',justify:'center'},[n('renewal/close/icon','Icon',{icon:'tabler:outline:x',color:'#111111',widthMode:'fixed',width:23,heightMode:'fixed',height:23})],'关闭');
  const header=n('renewal/header','Header',{overlapContent:false,background:'#ffffff',gap:5,...pad(0),paddingMode:'individual',paddingTop:17,paddingRight:20,paddingBottom:20,paddingLeft:20},[
    box('renewal/title-row',[text('renewal/title','限时 VIP 优惠',{fontSize:20,fontWeight:800}),close],{axis:'horizontal',align:'center',gap:8}),
    text('renewal/subtitle','重新订阅即可继续使用 VIP 权益，并享受限时优惠',{fontSize:13,color:'#999999'}),
  ]);
  const card=n('renewal/package','Package',{dataKey:'renewal/annual',group:'renewal/packages',productType:'subscription',priceMode:'1',defaultSelected:true,productLabelEnabled:true,axis:'vertical',heightMode:'fixed',height:150,widthMode:'fill',fillType:'image',backgroundImage:'/renewal-template/card-artwork.png',backgroundFit:'fill',background:'#ffffff',selectedBackground:'#ffffff',borderWidth:0,radius:20,gap:0},[
    box('renewal/card-content',[
      parameter('renewal/product-label','productLabel',{fontSize:14}),
      box('renewal/price-row',[parameter('renewal/price','totalPrice',{priceRole:'primary',fontSize:36,fontWeight:700}),text('renewal/price-separator','/',{fontSize:16,color:'#ffffff',widthMode:'fit'}),parameter('renewal/period','skuDuration',{fontSize:13})],{axis:'horizontal',widthMode:'fixed',width:231,align:'center',gap:2,heightMode:'fixed',height:45}),
      parameter('renewal/reference','totalReferencePrice',{priceRole:'reference',strike:true,fontSize:14,color:'#ffffffa6',selectedColor:'#ffffffa6'}),
      timer,
    ],{widthMode:'fill',heightMode:'fill',gap:4,...pad(13,16)}),
  ]);
  const content=box('renewal/content',[
    card,
    text('renewal/renewal-note','首年 {{ product.price }}，次年系统会以 {{ product.original_price }} 自动续订，可随时取消。',{fontSize:12,color:'#999999'}),
  ],{gap:8,...pad(0,20)});
  const buy=n('renewal/purchase','PurchaseButton',{action:{action:'Purchase',packageId:card.id},heightMode:'fixed',height:56,widthMode:'fill',background:gradient,shape:'pill',align:'center',justify:'center'},[text('renewal/purchase/text','领取专属优惠',{fontSize:20,fontWeight:700,color:'#ffffff',textAlign:'center'})]);
  const legal=text('renewal/legal','如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的账户收取。可随时前往账户设置管理订阅。有关详细信息，请访问我们的',{fontSize:9.5,color:'#999999',lineHeight:1.35});
  const links=box('renewal/links',[
    ...[['Terms','服务条款','https://www.hellotalk.com/terms-of-service'],['Privacy','隐私政策','https://www.hellotalk.com/privacy-policy']].map(([kind,label,url])=>n(`renewal/${kind}`,'Button',{action:{action:`Open${kind}`,actionUrl:url,openMethod:'in_app_browser'},widthMode:'fit',heightMode:'fit',background:'transparent'},[text(`renewal/${kind}/text`,label,{fontSize:9.5,color:'#222222',fontWeight:600})])),
  ],{axis:'horizontal',gap:5});
  const footer=n('renewal/footer','Footer',{background:'#ffffff',shadowOpacity:0,gap:13,...pad(0),paddingMode:'individual',paddingTop:14,paddingRight:20,paddingBottom:8,paddingLeft:20},[
    buy,box('renewal/legal-copy',[legal,links],{gap:0}),
    box('renewal/home',[box('renewal/home/bar',[],{widthMode:'fixed',width:134,heightMode:'fixed',height:5,background:'#111111',shape:'pill'})],{heightMode:'fixed',height:16,align:'center',justify:'end'}),
  ]);
  return {version:3,templateId:'ht-renewal-offer',productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},products:{'renewal/annual':{name:'12个月',billingMonths:12}},root:n('renewal/screen','Screen',{pagePresentation:'sheet',windowHeight:440,windowRadius:24,windowInset:0,windowBackdrop:'#8f8f8f',background:'#ffffff',heightMode:'fill',gap:0},[header,content,footer])};
}
