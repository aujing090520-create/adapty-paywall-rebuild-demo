const names={Screen:'页面',Header:'页头',Footer:'页脚',Stack:'布局容器',Text:'文字',Image:'图片',Icon:'图标',Button:'按钮',PurchaseButton:'购买按钮',Package:'商品套餐',ProductParameter:'商品参数'};
const n=(id,type,props={},children=[],name=names[type])=>({id,type,name,props,children});
const pad=(vertical,horizontal=vertical)=>({paddingMode:'axis',paddingVertical:vertical,paddingHorizontal:horizontal});
const box=(id,children,props={})=>n(id,'Stack',{gap:0,...props},children);
const glyph=(id,value,color='#111111',size=20)=>n(id,'Icon',{icon:`tabler:${value}`,color,widthMode:'fixed',width:size,heightMode:'fixed',height:size});
const image=(id,src,props={})=>n(id,'Image',{src,widthMode:'fill',objectFit:'contain',...props});
const parameter=(id,field,props={})=>n(id,'ProductParameter',{parameter:field,fontSize:14,textAlign:'center',color:'#999999',selectedColor:'#111111',...props});
export const STANDALONE_TEMPLATES={
  visitor:{templateId:'ht-standalone-visitor',title:'单独售卖-访客',accent:'#e40fb1',gradient:'linear-gradient(100deg, #ff7188 0%, #f85ed1 55%, #bf63fb 100%)',background:'linear-gradient(180deg, #ff9bdf 0%, #f9d8ed 19%, #f7f7f7 34%, #f7f7f7 100%)',weekly:true,time:'20:45'},
  languages:{templateId:'ht-standalone-languages',title:'单独售卖-学习语言',accent:'#eba342',gradient:'linear-gradient(100deg, #fa812f 0%, #f9d33c 100%)',background:'#f7f7f7',time:'14:30'},
  liveVoice:{templateId:'ht-standalone-live-voice',title:'单独售卖-直播语聊',accent:'#7c4dff',gradient:'linear-gradient(100deg, #cd5ef5 0%, #7c4dff 70%, #7c4dff 100%)',background:'linear-gradient(180deg, #ded1fb 0%, #eee6fb 24%, #f7f7f7 34%, #f7f7f7 100%)',weekly:true,time:'11:53'},
};

// One reusable composition; all output nodes remain editable standard components.
export function buildStandaloneTemplate(kind){
  const config=STANDALONE_TEMPLATES[kind];
  if(!config)throw new Error(`Unknown standalone template: ${kind}`);
  const id=`standalone/${kind}`,products={},translations={en:{},'zh-CN':{}};
  const text=(key,zh,en=zh,props={})=>{
    if(en!==zh)translations.en[key]={text:en};
    return n(key,'Text',{text:zh,fontSize:14,lineHeight:1.25,color:'#111111',...props});
  };
  const status=box(`${id}/status`,[text(`${id}/time`,config.time,config.time,{fontSize:17,fontWeight:700,widthMode:'fit'}),box(`${id}/status/icons`,[glyph(`${id}/signal`,'outline:antenna-bars-5','#111111',20),glyph(`${id}/wifi`,'outline:wifi','#111111',20),glyph(`${id}/battery`,'outline:battery-3','#111111',25)],{axis:'horizontal',widthMode:'fit',gap:5,align:'center'})],{axis:'horizontal',justify:'between',align:'center',heightMode:'fixed',height:42,...pad(0,24)});
  const close=n(`${id}/close`,'Button',{action:{action:'Dismiss'},widthMode:'fixed',width:36,heightMode:'fixed',height:36,background:'#ffffff',shape:'pill',align:'center',justify:'center'},[glyph(`${id}/close/icon`,kind==='languages'?'outline:x':'outline:chevron-left','#111111',25)],kind==='languages'?'关闭':'返回');
  const header=n(`${id}/header`,'Header',{overlapContent:true,background:'transparent',shadowOpacity:0,gap:9,...pad(0,16),paddingMode:'individual',paddingTop:2,paddingRight:16,paddingBottom:8,paddingLeft:16},[status,close]);
  let hero;
  if(kind==='visitor'){
    const portrait=box(`${id}/portrait`,[
      image(`${id}/portrait/image`,'/standalone-template/visitor.png',{altText:'访客特权示意人物',widthMode:'fixed',width:106,heightMode:'fixed',height:141,objectFit:'cover',radius:16,borderWidth:3,borderColor:'#ffffff'}),
      box(`${id}/portrait/eye`,[glyph(`${id}/portrait/eye/icon`,'outline:eye','#ffffff',23)],{widthMode:'fixed',width:34,heightMode:'fixed',height:34,shape:'pill',background:config.accent,align:'center',justify:'center',borderWidth:2,borderColor:'#ffffff'}),
    ],{axis:'overlay',overlayAlignment:'bottom-right',widthMode:'fixed',width:110,heightMode:'fixed',height:147});
    hero=box(`${id}/hero`,[box(`${id}/hero/row`,[box(`${id}/hero/copy`,[text(`${id}/title`,'开通访客特权','Unlock visitor privileges',{fontSize:22,fontWeight:750}),text(`${id}/subtitle`,'解锁对你感兴趣的人，快速和对方联系，不错过每一次相遇','Discover people interested in you. Connect quickly and never miss a chance to meet.',{fontSize:14,lineHeight:1.35})],{gap:10,widthMode:'fill',justify:'end'}),portrait],{axis:'horizontal',gap:8,align:'end'})],{heightMode:'fixed',height:270,justify:'end',...pad(16,24)});
  }else if(kind==='languages'){
    hero=box(`${id}/hero`,[image(`${id}/hero/image`,'/standalone-template/languages.png',{altText:'多语言问候与学习书本',heightMode:'fixed',height:241,objectFit:'cover'}),box(`${id}/hero/copy`,[text(`${id}/title`,'解锁更多学习语言','Unlock more learning\nlanguages',{fontSize:26,fontWeight:750}),text(`${id}/subtitle`,'增加1门学习语言，同时学习2门语言','Add 1 learning language and learn 2 at once',{fontSize:16})],{gap:5,...pad(0,20)})],{gap:6,marginMode:'individual',marginBottom:18});
  }else{
    hero=box(`${id}/hero`,[box(`${id}/hero/row`,[box(`${id}/hero/copy`,[text(`${id}/title`,'直播语聊\n无限时长','Unlimited Live\n& Voiceroom',{fontSize:24,fontWeight:750}),text(`${id}/subtitle`,'解锁无限时长，与朋友畅聊不停','Unlock unlimited time to keep chatting with friends',{fontSize:17,lineHeight:1.3})],{widthMode:'fill',gap:10}),image(`${id}/hero/image`,'/standalone-template/live-voice.png',{altText:'直播语聊麦克风与伙伴',widthMode:'fixed',width:170,heightMode:'fixed',height:180})],{axis:'horizontal',gap:0,align:'center'})],{heightMode:'fixed',height:284,justify:'end',...pad(14,20)});
  }
  const periods=config.weekly?[['1周',1/4],['1个月',1],['3个月',3]]:[['1个月',1],['3个月',3],['12个月',12]];
  const groupId=`${id}/packages`;
  const packages=periods.map(([name,months],index)=>{
    const key=`${id}/package-${index}`;products[key]={name,billingMonths:months};
    const topPrice=config.weekly?'weeklyPrice':'totalPrice',bottomPrice=config.weekly?'totalPrice':'monthlyPrice';
    return n(key,'Package',{dataKey:key,group:groupId,defaultSelected:index===1,productType:'subscription',priceMode:'1',productLabelEnabled:true,widthMode:'fill',heightMode:'fixed',height:150,radius:17,borderWidth:2,borderColor:'transparent',selectedBorderColor:kind==='languages'?config.gradient:config.accent,background:'#ffffff',selectedBackground:'#ffffff',gap:0},[
      box(`${key}/label`,[parameter(`${key}/label/text`,'productLabel',{fontSize:11,fontWeight:700,color:'#999999',selectedColor:'#ffffff',hidden:index===0})],{heightMode:'fixed',height:26,background:'transparent',selectedBackground:kind==='languages'?config.gradient:config.accent,align:'center',justify:'center',radiusMode:'individual',radiusTopLeft:15,radiusTopRight:15,radiusBottomLeft:0,radiusBottomRight:0}),
      box(`${key}/body`,[
        box(`${key}/summary`,[parameter(`${key}/duration`,'skuDuration',{fontSize:14}),parameter(`${key}/top-price`,topPrice,{fontSize:config.weekly?13:18,fontWeight:config.weekly?400:700,priceRole:config.weekly?'detail':'primary'})],{gap:3}),
        parameter(`${key}/savings`,'savings',{fontSize:13,color:config.accent,selectedColor:config.accent,hidden:index===0}),
        parameter(`${key}/bottom-price`,bottomPrice,{fontSize:config.weekly?18:14,fontWeight:config.weekly?700:400,priceRole:config.weekly?'primary':'detail'}),
      ],{heightMode:'fill',justify:'between',...pad(10,3)}),
    ]);
  });
  const packageGroup=box(groupId,packages,{axis:'horizontal',gap:kind==='languages'?0:8,heightMode:'fixed',height:150,background:kind==='languages'?'#ffffff':'transparent',radius:18,marginMode:'individual',marginTop:10,marginRight:16,marginBottom:16,marginLeft:16});
  const avatars=key=>box(key,['#d4bcc9','#cac3c1','#b6d4cd'].map((color,index)=>box(`${key}/${index}`,[glyph(`${key}/${index}/icon`,'filled:user','#ffffffaa',16)],{widthMode:'fixed',width:23,heightMode:'fixed',height:29,shape:'pill',background:color,borderWidth:1,borderColor:'#ffffff',align:'center',justify:'center'})),{axis:'horizontal',gap:0,widthMode:'fixed',width:69,align:'center'});
  const benefitRows=kind==='visitor'?[
    ['最近有 {访客人数} 人打开了你的对话框想要联系你','Recently, {visitor count} people opened your chat to contact you'],
    ['有 {附近人数} 个离你很近的语伴想和你线下认识','{Nearby count} nearby partners would like to meet you'],
    ['有 {连续访问人数} 人连续3天一直查看你的主页，但还没和你打招呼','{Repeat visitor count} people viewed your profile for 3 days but have not said hello'],
  ]:kind==='languages'?[
    ['学习2门目标语言，安排更灵活','Study 2 target languages with a more flexible plan','outline:world'],
    ['跨语言结识语伴，获得更多练习机会','Connect with partners across languages for more practice','outline:users'],
    ['保留2门学习语言，获得更匹配的语伴','Keep 2 learning languages for better matches','filled:settings'],
  ]:[
    ['在你喜爱的直播或语聊中畅聊不限时','Unlimited time in your favorite Live/Voiceroom','outline:clock'],
    ['在母语者的交流中自然学习语言','Learn naturally from how native speakers talk','outline:message-circle'],
    ['与来自世界各地的朋友建立联系','Connect with friends from around the world','outline:world'],
  ];
  const benefits=box(`${id}/benefits`,[
    ...(kind==='languages'?[]:[text(`${id}/benefits/title`,kind==='visitor'?'你可能错过的访客':'尽情享受直播与语聊',kind==='visitor'?'Visitors you may have missed':'Enjoy Live/Voiceroom to the fullest',{fontSize:17,fontWeight:600})]),
    box(`${id}/benefits/list`,benefitRows.map(([zh,en,icon],index)=>box(`${id}/benefit-${index}`,[kind==='visitor'?avatars(`${id}/benefit-${index}/avatars`):glyph(`${id}/benefit-${index}/icon`,icon,config.accent,23),text(`${id}/benefit-${index}/text`,zh,en,{fontSize:15,widthMode:'fill',lineHeight:1.25})],{axis:'horizontal',align:'center',gap:12,heightMode:'fit',minHeight:kind==='visitor'?57:48,...pad(9,14),background:'#ffffff',...(kind==='visitor'?{radius:14}:{radiusMode:'individual',radiusTopLeft:index===0?18:0,radiusTopRight:index===0?18:0,radiusBottomLeft:index===2?18:0,radiusBottomRight:index===2?18:0}),...(kind!=='visitor'&&index<2?{borderWidth:1,borderColor:'#f7f7f7'}:{})})),{gap:kind==='visitor'?10:0,background:kind==='visitor'?'transparent':'#ffffff',radius:18}),
  ],{gap:12,...pad(0,16),marginMode:'individual',marginBottom:14});
  const scope=kind==='visitor'?['仅解锁访客特权，不包含VIP其他特权','Visitor privileges only. Other VIP benefits are not included.']:kind==='languages'?['仅解锁2门学习语言，不包含VIP其他特权','Unlocks only 2 learning languages. No other VIP Benefits.']:['仅解锁直播语聊无限时长，不包含VIP其他特权','Unlimited Live & Voiceroom only. Other VIP services are not included.'];
  const cta=kind==='visitor'?['继续','Continue']:kind==='languages'?['立即解锁','Unlock Now']:['开启无限畅聊','Go unlimited'];
  const purchase=n(`${id}/purchase`,'PurchaseButton',{action:{action:'Purchase'},widthMode:'fill',heightMode:'fixed',height:54,background:config.gradient,shape:'pill',align:'center',justify:'center'},[text(`${id}/purchase/text`,...cta,{fontSize:20,fontWeight:700,color:'#ffffff',textAlign:'center'})]);
  const scopeCopy=text(`${id}/scope`,...scope,{fontSize:12,color:'#999999',textAlign:'center',lineHeight:1.25});
  const footer=n(`${id}/footer`,'Footer',{background:'#f7f7f7',shadowOpacity:0,gap:10,...pad(8,16),paddingMode:'individual',paddingTop:8,paddingRight:16,paddingBottom:8,paddingLeft:16},[
    ...(kind==='languages'?[purchase,scopeCopy]:[scopeCopy,purchase]),
    box(`${id}/home`,[box(`${id}/home/bar`,[],{widthMode:'fixed',width:134,heightMode:'fixed',height:5,background:'#111111',shape:'pill'})],{heightMode:'fixed',height:25,align:'center',justify:'end'}),
  ]);
  return {version:3,templateId:config.templateId,productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},localization:{defaultLocale:'zh-CN',translations},products,root:n(`${id}/screen`,'Screen',{pagePresentation:'fullscreen',heightMode:'fill',background:config.background,gap:0},[header,hero,packageGroup,benefits,footer],config.title)};
}
