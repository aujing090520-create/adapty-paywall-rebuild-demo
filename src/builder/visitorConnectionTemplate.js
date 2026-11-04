const accent='#ce1ca3',muted='#827a85';
const names={Screen:'孙铭阳定制模版1',Header:'页头',Footer:'页脚',Stack:'布局容器',Text:'文字',Icon:'图标',Image:'图片',Button:'按钮',PurchaseButton:'购买按钮',Package:'商品套餐',ProductParameter:'商品参数'};
const n=(id,type,props={},children=[])=>({id:`visitor-connection/${id}`,type,name:names[type],props,children});
const box=(id,children,props={})=>n(id,'Stack',{gap:0,...props},children);
const text=(id,value,props={})=>n(id,'Text',{text:value,fontSize:13,lineHeight:1.35,color:'#171717',...props});
const glyph=(id,icon,size,color)=>n(id,'Icon',{icon:`tabler:${icon}`,widthMode:'fixed',width:size,heightMode:'fixed',height:size,color});
const pad=(v,h=v)=>({paddingMode:'axis',paddingVertical:v,paddingHorizontal:h});
const parameter=(id,field,props={})=>n(id,'ProductParameter',{parameter:field,fontSize:14,textAlign:'center',color:'#171717',selectedColor:'#171717',...props});
const defaults=[['Mina','一起练过日语'],['Luca','聊过意大利文化'],['Sofia','互相纠正表达']];

export function buildVisitorConnectionTemplate(){
  const header=n('header','Header',{gap:8,background:'transparent',...pad(9,18)},[
    box('status',[text('time','9:41',{fontSize:15,fontWeight:700,widthMode:'fit'}),box('signals',[glyph('signal','outline:antenna-bars-5',16,'#171717'),glyph('wifi','outline:wifi',16,'#171717'),glyph('battery','outline:battery-4',22,'#171717')],{axis:'horizontal',gap:4,widthMode:'fit',align:'center'})],{axis:'horizontal',justify:'between',align:'center',heightMode:'fixed',height:22}),
    box('navigation',[
      n('back','Button',{action:{action:'NavigateBack'},background:'#ffffff',shape:'pill',widthMode:'fixed',width:32,heightMode:'fixed',height:32,align:'center',justify:'center'},[glyph('back/icon','outline:chevron-left',25,'#29232c')]),
      box('brand',[glyph('crown','filled:crown',19,'#e021ac'),text('vip','VIP',{fontSize:18,fontWeight:800,widthMode:'fit'})],{axis:'horizontal',align:'center',gap:5,widthMode:'fit'}),
      n('restore','Button',{action:{action:'RestorePurchases'},widthMode:'fit'},[text('restore/text','恢复购买',{fontSize:11,color:'#625b67'})]),
    ],{axis:'horizontal',justify:'between',align:'center'}),
  ]);
  const people=box('people',defaults.map((_,index)=>{
    const at=index+1;
    return box(`person-${at}`,[
      n(`avatar-${at}`,'Image',{imageSource:'variable',imageVariable:`{{ business.visitor_${at}_avatar }}`,src:'',altText:`第${at}位语伴头像`,mask:'circle',maskEnabled:true,objectFit:'cover',widthMode:'fixed',width:54,heightMode:'fixed',height:54,borderWidth:3,borderColor:'linear-gradient(135deg,#e024ba,#c86ce8)',shadowColor:'#c02f9e',shadowOpacity:14,shadowBlur:9}),
      text(`nickname-${at}`,`{{ business.visitor_${at}_nickname }}`,{fontSize:13,fontWeight:750,textAlign:'center'}),
      text(`description-${at}`,`{{ business.visitor_${at}_description }}`,{fontSize:10.5,color:muted,textAlign:'center'}),
    ],{align:'center',gap:3});
  }),{axis:'horizontal',gap:8});
  const connection=box('connection',[
    box('origin',[box('eye',[glyph('eye/icon','outline:eye',20,accent)],{background:'#f9d9ef',shape:'pill',widthMode:'fixed',width:29,heightMode:'fixed',height:29,align:'center',justify:'center'}),box('origin/copy',[text('origin/title','相识起点',{fontSize:10.5,color:'#a54d8b',fontWeight:650}),text('origin/detail','我的访问 · 访客列表',{fontSize:12,color:'#ad1c87',fontWeight:700})],{gap:0})],{axis:'horizontal',align:'center',gap:9,background:'#fff3fb',borderWidth:1,borderColor:'#edc4e5',radius:10,...pad(7,10)}),
    people,text('connection/note','从一次访问，开始真正的语言交流',{fontSize:10.5,color:'#79717c',textAlign:'center'}),
  ],{background:'#ffffff',borderWidth:1,borderColor:'#edc7e5',radius:18,gap:10,...pad(12,13),shadowBlur:14,shadowColor:'#b75b9b',shadowOpacity:7});
  const feature=(id,value)=>box(id,[box(`${id}/marker`,[glyph(`${id}/check`,'outline:check',13,accent)],{background:'#f6dbef',shape:'pill',widthMode:'fixed',width:17,heightMode:'fixed',height:17,align:'center',justify:'center'}),text(`${id}/copy`,value,{fontSize:12.5})],{axis:'horizontal',gap:7,align:'center'});
  const benefits=box('benefits',[
    box('benefits/title',[text('benefits/title/text','发现更多值得认识的人',{fontSize:17,fontWeight:750,widthMode:'fit'}),glyph('benefits/sparkle','filled:sparkles',15,accent)],{axis:'horizontal',gap:7,align:'center'}),
    text('benefits/description','开通 VIP，查看完整访客列表，找到与你有共同学习目标的语伴。',{fontSize:12,color:'#78747c'}),
    box('benefits/list',[feature('benefit-1','查看完整访客资料与访问记录'),feature('benefit-2','更多语言交流工具与会员权益')],{gap:5}),
  ],{gap:8});
  const packages=box('packages',[true,false].map((selected,index)=>n(`package-${index+1}`,'Package',{
    dataKey:`visitor-connection/${index+1}`,group:'visitor-connection/packages',productType:'subscription',priceMode:'1',defaultSelected:selected,
    widthMode:'fill',heightMode:'fixed',height:90,align:'center',justify:'center',gap:1,background:'#ffffff',selectedBackground:'#fffaff',borderWidth:1.5,borderColor:'#e5e1e7',selectedBorderWidth:2,selectedBorder:accent,selectedBorderColor:accent,radius:12,
    ...(selected?{badgeEnabled:true,badge:{text:'更划算',position:'top-left',positionStyle:'overlay',background:'linear-gradient(90deg,#ef4ab1,#c85ce8)',color:'#ffffff',fontSize:10,fontWeight:700,shape:'pill',paddingVertical:3,paddingHorizontal:9}}:{}),
  },[
    parameter(`package-${index+1}/duration`,'skuDuration',{fontSize:13,fontWeight:650}),
    parameter(`package-${index+1}/price`,'totalPrice',{priceRole:'primary',fontSize:22,fontWeight:800}),
    parameter(`package-${index+1}/monthly`,'monthlyPrice',{priceRole:'detail',fontSize:10.5,color:'#928b95',selectedColor:'#928b95'}),
  ])),{axis:'horizontal',gap:10});
  const content=box('content',[
    box('intro',[text('eyebrow','从我的访问开始',{fontSize:12,fontWeight:700,color:'#be218d'}),text('headline','还记得你在访客列表\n认识的这些语伴吗？',{fontSize:23,fontWeight:800,lineHeight:1.27,runs:[{text:'还记得你在'},{text:'访客列表',color:accent},{text:'认识的这些语伴吗？',breakBefore:true}]}),text('intro/description','你从这里认识了这些语伴，后来开始了交流。',{fontSize:12.5,color:'#5d535f'})],{gap:9}),
    connection,benefits,box('package-section',[text('package-heading','选择 VIP 套餐',{fontSize:13,fontWeight:750}),packages],{gap:11}),
  ],{gap:16,...pad(10,18)});
  const footer=n('footer','Footer',{background:'#f7f7f8',shadowOpacity:0,gap:7,...pad(10,18)},[
    n('purchase','PurchaseButton',{action:{action:'Purchase'},widthMode:'fill',heightMode:'fixed',height:48,shape:'pill',background:'linear-gradient(90deg,#ff688d,#ed4bbb,#bc55ec)',align:'center',justify:'center'},[text('purchase/text','开通 VIP，解锁完整访客',{fontSize:15,fontWeight:750,color:'#ffffff',textAlign:'center'})]),
    text('renewal','自动续费，可随时在 App Store 取消',{fontSize:9.5,color:'#98939d',textAlign:'center'}),
    box('legal',[
      n('terms','Button',{action:{action:'OpenTerms',actionUrl:'https://www.hellotalk.com/terms-of-service'},widthMode:'fit'},[text('terms/text','服务条款',{fontSize:9.5,color:muted,underline:true,textAlign:'center'})]),
      text('legal/dot','·',{fontSize:9.5,color:muted,widthMode:'fit'}),
      n('privacy','Button',{action:{action:'OpenPrivacy',actionUrl:'https://www.hellotalk.com/privacy-policy'},widthMode:'fit'},[text('privacy/text','隐私政策',{fontSize:9.5,color:muted,underline:true,textAlign:'center'})]),
    ],{axis:'horizontal',justify:'center',gap:5,widthMode:'fit',alignSelf:'center'}),
    box('home',[],{background:'#1d1d1f',widthMode:'fixed',width:132,heightMode:'fixed',height:4,shape:'pill',alignSelf:'center',marginMode:'individual',marginTop:5}),
  ]);
  return {version:3,templateId:'ht-visitor-connection',productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},
    logic:{variables:defaults.flatMap(([nickname,description],index)=>{const at=index+1;return [['avatar',`/visitor-connection-template/avatar-${at}.jpg`,'头像'],['nickname',nickname,'昵称'],['description',description,'说明文案']].map(([field,value,label])=>({id:`visitor-connection/variable-${at}-${field}`,key:`visitor_${at}_${field}`,type:'string',label:`第${at}位语伴${label}`,value}));}),rules:[]},
    products:{'visitor-connection/1':{name:'12个月',billingMonths:12},'visitor-connection/2':{name:'1个月',billingMonths:1}},
    root:n('screen','Screen',{pagePresentation:'fullscreen',background:'linear-gradient(180deg,#f7b7e9 0%,#fce2f1 29%,#f7f7f8 56%,#f7f7f8 100%)',heightMode:'fill',gap:0},[header,content,footer])};
}
