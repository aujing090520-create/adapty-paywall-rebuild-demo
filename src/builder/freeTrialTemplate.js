const purple='#7950ff',surface='#f8f8f8';
const n=(id,type,props={},children=[],name)=>({id,type,name:name??({Screen:'免费试用页',Header:'页头',Footer:'页脚',Stack:'布局容器',Image:'图片',Text:'文字',Icon:'图标',Button:'按钮',PurchaseButton:'购买按钮',Carousel:'轮播',Slide:'轮播页',PageControl:'分页控件',Indicators:'分页指示器',Package:'商品套餐',ProductParameter:'商品参数',BottomSheet:'挽留弹窗',Timeline:'时间线',TimelineItem:'时间节点'}[type]),props,children});
const text=(id,value,props={})=>n(id,'Text',{text:value,fontSize:14,lineHeight:1.3,color:'#171717',...props});
const pad=(v,h=v)=>({paddingMode:'axis',paddingVertical:v,paddingHorizontal:h});
const box=(id,children,props={})=>n(id,'Stack',{gap:8,...props},children);
const icon=(id,glyph,props={})=>n(id,'Icon',{icon:`tabler:filled:${glyph}`,widthMode:'fixed',heightMode:'fixed',width:22,height:22,color:purple,...props});
const action=(id,label,behavior,props={})=>n(id,'Button',{action:behavior,heightMode:'fixed',height:48,shape:'pill',background:purple,align:'center',justify:'center',gap:0,...props},[text(`${id}/text`,label,{fontSize:16,fontWeight:700,color:'#ffffff',textAlign:'center'})]);
const parameter=(id,key,props={})=>n(id,'ProductParameter',{parameter:key,fontSize:16,color:'#171717',selectedColor:purple,...props});
const pageCondition=(page,operator='equals')=>({type:'page',source:'trial/pages',operator,value:`trial/${page}`});
const rule=(id,conditions,effects)=>({id,name:id,enabled:true,conditions,effects});
const copyEffect=(target,value)=>({target,kind:'text',value});

// A template factory only: every visible region remains an ordinary editable component.
export function buildFreeTrialTemplate(){
  const benefits=[['language','翻译','随聊随翻，提高你的词汇量'],['world','多语言','150种语言随时添加和切换'],['bolt','更多曝光','专属身份特权，让更多人看到你'],['ad','无广告','更沉浸专心的学语言']];
  const featureRows=benefits.map(([glyph,title,caption],index)=>box(`trial/feature-${index}`,[box(`trial/feature-${index}/marker`,[icon(`trial/feature-${index}/icon`,glyph,glyph==='language'?{icon:'tabler:outline:language'}:{})],{widthMode:'fixed',width:36,heightMode:'fixed',height:36,background:'#f0eaff',radius:10,align:'center',justify:'center'}),box(`trial/feature-${index}/copy`,[text(`trial/feature-${index}/title`,title,{fontSize:15,fontWeight:600}),text(`trial/feature-${index}/caption`,caption,{fontSize:12,color:'#999999'})],{gap:4})],{axis:'horizontal',gap:12,align:'center'}));
  const schedule=[['crown','今天','成为HelloTalk VIP，享受学习与交流的乐趣'],['bell','体验结束前一天','收到体验即将结束的消息通知'],['clock','第{{ business.trial_days }}天','24小时前取消则无需支付任何费用，否则当日扣费']];
  const timeline=n('trial/timeline','Timeline',{itemSpacing:22,textSpacing:4,columnGutter:12,iconAlignment:'content'},schedule.map(([glyph,title,caption],index)=>n(`trial/milestone-${index}`,'TimelineItem',{connectorEnabled:false},[icon(`trial/milestone-${index}/icon`,glyph,{width:36,height:36,paddingMode:'axis',paddingHorizontal:8,paddingVertical:8,background:'#f0eaff',radius:10}),text(`trial/milestone-${index}/title`,title,{fontSize:15,fontWeight:600,color:'#555555'}),text(`trial/milestone-${index}/caption`,caption,{fontSize:12,color:'#999999'})])));
  const packageCard=(id,trial)=>n(id,'Package',{dataKey:id,group:'trial/packages',defaultSelected:trial,productType:'subscription',priceMode:trial?'4':'0',productLabelEnabled:true,background:'#efefef',selectedBackground:'#f0eaff',selectedBorderColor:purple,borderColor:'transparent',borderWidth:1.5,radius:14,...pad(14),gap:6},[
    box(`${id}/content`,[box(`${id}/left`,[parameter(`${id}/period`,'skuDuration',{fontWeight:700,fontSize:18}),...(trial?[parameter(`${id}/reference`,'totalReferencePrice',{fontSize:14,strike:true})]:[])],{gap:6}),box(`${id}/right`,[parameter(`${id}/price`,'monthlyPrice',{fontSize:18,fontWeight:700,textAlign:'right'}),...(trial?[parameter(`${id}/saving`,'productInfo',{fontSize:11,textAlign:'center',background:purple,color:'#ffffff',selectedColor:'#ffffff',radius:6,...pad(3,6),widthMode:'fit',alignSelf:'end'})]:[])],{widthMode:'fit',gap:6,align:'end'})],{axis:'horizontal',justify:'between',align:'center'}),
  ]);
  const annual=packageCard('trial/annual',true),monthly=packageCard('trial/monthly',false);
  annual.props.badgeEnabled=true;annual.props.badge={text:'免费试用',position:'top-left',positionStyle:'nested',fontSize:10,fontWeight:600,color:'#ffffff',background:purple,shape:'rectangle',radius:3,paddingMode:'axis',paddingVertical:1,paddingHorizontal:9};
  monthly.props.badgeEnabled=true;monthly.props.badge={...annual.props.badge,text:'直接购买'};
  const slide=(id,title,children)=>n(`trial/${id}`,'Slide',{heightMode:'fill',widthMode:'fill',background:surface,align:'stretch',gap:20,...pad(12,14)},[text(`trial/${id}/title`,title,{fontSize:20,fontWeight:700}),...children],title);
  const pages=n('trial/pages','Carousel',{heightMode:'fill',widthMode:'fill',flexGrow:1,minHeight:300,defaultIndex:0,loop:false,autoPlay:false,pageSpacing:0,pagePeek:0,pageAlignment:'top',transitionTime:300,pageControlVersion:1},[
    slide('benefits','免费体验HelloTalk会员',[box('trial/features',featureRows,{gap:22})]),
    slide('reminder','到期前提醒',[timeline]),
    slide('plans','准备好成为HelloTalk会员了吗？',[box('trial/packages',[annual,monthly],{gap:10})]),
    n('trial/pagination','PageControl',{gap:3,...pad(4),justify:'center'},[n('trial/pagination/indicator','Indicators',{widthMode:'fixed',width:22,heightMode:'fixed',height:3,background:'#d8d8d8',backgroundOpacity:100,selectedBackground:'#151515',selectedBackgroundOpacity:100,shape:'pill'})]),
  ]);
  const retention=n('trial/retention','BottomSheet',{presentation:'sheet',background:'#ffffff',radiusMode:'individual',radiusTopLeft:24,radiusTopRight:24,radiusBottomLeft:0,radiusBottomRight:0,...pad(22,20),gap:14,align:'center'},[
    n('trial/retention/art','Image',{src:'/trial-template/retention.png',altText:'免费试用挽留插画',heightMode:'fixed',height:140,widthMode:'fixed',width:160,alignSelf:'center',objectFit:'contain'}),
    text('trial/retention/title','你确定要放弃免费试用VIP的机会吗？',{fontSize:17,fontWeight:700,textAlign:'center'}),
    text('trial/retention/caption','关闭后无法再打开此页面',{fontSize:13,color:'#999999',textAlign:'center'}),
    action('trial/retention/keep','不，我不放弃',{action:'CloseSheet'},{widthMode:'fill'}),
    action('trial/retention/leave','是，暂时不用',{action:'Dismiss'},{height:34,background:'transparent'}),
  ]);
  retention.children.at(-1).children[0].props={...retention.children.at(-1).children[0].props,color:'#999999',fontSize:14};
  const close=n('trial/close','Button',{action:{action:'OpenSheet',actionPage:retention.id},widthMode:'fixed',width:32,heightMode:'fixed',height:32,background:'transparent',align:'center',justify:'center',marginMode:'individual',marginTop:50,marginLeft:12,marginRight:0,marginBottom:0},[icon('trial/close/icon','x',{color:'#ffffff',icon:'tabler:outline:x',width:22,height:22}),retention],'关闭');
  const hero=box('trial/hero',[
    n('trial/hero/art','Image',{src:'/trial-template/hero.png',heightMode:'fixed',height:234,objectFit:'cover',altText:'免费试用页主视觉'}),
    box('trial/status',[text('trial/status/time','12:12',{fontSize:15,fontWeight:600,widthMode:'fit'}),box('trial/status/signals',[icon('trial/status/cell','antenna-bars-5',{icon:'tabler:outline:antenna-bars-5',color:'#151515',width:18,height:18}),icon('trial/status/wifi','wifi',{icon:'tabler:outline:wifi',color:'#151515',width:18,height:18}),icon('trial/status/battery','battery-4',{color:'#151515',width:24,height:18})],{axis:'horizontal',widthMode:'fit',gap:4})],{axis:'horizontal',justify:'between',align:'center',...pad(0,30),heightMode:'fixed',height:44}),
    box('trial/hero/copy',[text('trial/hero/title','专享福利\n更快学好外语',{fontSize:21,fontWeight:700,color:'#ffffff',widthMode:'fit'})],{...pad(0),paddingMode:'individual',paddingTop:102,paddingLeft:30,paddingRight:0,paddingBottom:0,align:'start'}),
    close,
  ],{axis:'overlay',heightMode:'fixed',height:234,background:purple,gap:0});
  const header=n('trial/header','Header',{overlapContent:false,background:surface,gap:0,shadowOpacity:0},[hero]);
  const purchase={...action('trial/purchase','0元领取{{ business.trial_days }}天VIP体验',{action:'Purchase',packageId:annual.id,pagePackages:{source:pages.id,pages:[{pageId:'trial/plans',packageId:null}]}}),type:'PurchaseButton'};
  purchase.props.buttonText={mode:'package',target:'trial/purchase/text',group:'trial/packages',default:{text:'0元领取{{ business.trial_days }}天VIP体验',runs:null},variants:[{packageId:monthly.id,text:'继续',runs:null}]};
  const footer=n('trial/footer','Footer',{background:surface,gap:10,...pad(0,14),paddingMode:'individual',paddingTop:4,paddingRight:14,paddingBottom:20,paddingLeft:14,shadowOpacity:0},[
    text('trial/cancel-note','订阅可随时取消，无需支付任何费用',{fontSize:12,color:'#999999',textAlign:'center'}),purchase,
    text('trial/legal','免费{{ business.trial_days }}天试用后，系统会以{{ business.renewal_price }}自动续订，可随时取消。费用将从你的账户收取。',{fontSize:9,color:'#b7b7b7'}),
    box('trial/links',[...['Terms','Privacy'].map((kind,index)=>{const link=action(`trial/${kind.toLowerCase()}`,index?'隐私政策':'服务条款',{action:`Open${kind}`,actionUrl:index?'https://www.hellotalk.com/privacy-policy':'https://www.hellotalk.com/terms-of-service',openMethod:'in_app_browser'},{heightMode:'fit',widthMode:'fit',background:'transparent'});link.children[0].props={...link.children[0].props,fontSize:9,color:'#999999'};return link;})],{axis:'horizontal',gap:6}),
    box('trial/home',[box('trial/home/bar',[],{widthMode:'fixed',width:134,heightMode:'fixed',height:5,background:'#151515',shape:'pill'})],{heightMode:'fixed',height:16,align:'center',justify:'end',gap:0}),
  ]);
  return {version:3,templateId:'ht-free-trial',productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},products:{'trial/annual':{name:'12个月',billingMonths:12},'trial/monthly':{name:'1个月',billingMonths:1}},logic:{variables:[{id:'trial-days',key:'trial_days',type:'number',value:3},{id:'trial-renewal-price',key:'renewal_price',type:'string',value:'¥{总价}'}],rules:[
    rule('确认套餐页提示',[pageCondition('plans')],[copyEffect('trial/cancel-note','可随时在App Store取消')]),
    rule('月度续订提示',[{type:'package',value:monthly.id}],[copyEffect('trial/legal','如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的账户收取。可随时在账户设置管理订阅。')]),
  ]},root:n('trial/screen','Screen',{pagePresentation:'fullscreen',background:surface,gap:0,heightMode:'fill'},[header,pages,footer])};
}
