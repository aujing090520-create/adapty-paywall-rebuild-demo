const accent='#ffb441';
const names={Screen:'入门价格页',Header:'页头',Footer:'页脚',Stack:'布局容器',Text:'文字',Icon:'图标',Button:'按钮',PurchaseButton:'购买按钮',Package:'商品套餐',ProductParameter:'商品参数'};
const n=(id,type,props={},children=[],name=names[type])=>({id,type,name,props,children});
const box=(id,children,props={})=>n(id,'Stack',{gap:0,...props},children);
const text=(id,value,props={})=>n(id,'Text',{text:value,fontSize:20,lineHeight:1.35,color:'#282828',...props});
const icon=(id,value,size,color)=>n(id,'Icon',{icon:`tabler:${value}`,color,widthMode:'fixed',width:size,heightMode:'fixed',height:size});
const parameter=(id,field,props={})=>n(id,'ProductParameter',{parameter:field,fontSize:20,widthMode:'fit',color:'#282828',selectedColor:'#282828',...props});
const pad=(vertical,horizontal=vertical)=>({paddingMode:'axis',paddingVertical:vertical,paddingHorizontal:horizontal});

export function buildIntroPriceTemplate(){
  const header=n('intro/header','Header',{background:'#ffffff',overlapContent:false,...pad(8,14)},[
    n('intro/close','Button',{action:{action:'Dismiss'},widthMode:'fixed',width:26,heightMode:'fixed',height:26,background:'#e5e5e5',shape:'pill',align:'center',justify:'center'},[icon('intro/close/icon','outline:x',17,'#ffffff')],'关闭'),
  ]);
  const card=n('intro/package','Package',{dataKey:'intro/month',group:'intro/packages',productType:'subscription',priceMode:'0',defaultSelected:true,background:'transparent',selectedBackground:'transparent',borderWidth:0,gap:4,widthMode:'fill',heightMode:'fit'},[
    box('intro/reference-row',[text('intro/reference-label','原价',{fontSize:20,widthMode:'fit'}),parameter('intro/reference','monthlyReferencePrice',{priceRole:'reference',strike:true})],{axis:'horizontal',align:'center',gap:5}),
    box('intro/price-row',[text('intro/price-label','折扣价',{fontSize:22,color:'#ecae4e',widthMode:'fit'}),parameter('intro/price','monthlyPrice',{priceRole:'primary',fontSize:28,fontWeight:600,color:'#ecae4e',selectedColor:'#ecae4e'})],{axis:'horizontal',align:'center',gap:12}),
  ]);
  const benefits=box('intro/benefits',['无限翻译次数','学习多门语言','搜索全世界的语伴'].map((value,index)=>box(`intro/benefit-${index}`,[icon(`intro/benefit-${index}/icon`,'outline:check',25,'#eead47'),text(`intro/benefit-${index}/text`,value,{fontSize:20,fontWeight:600})],{axis:'horizontal',align:'center',gap:11})),{gap:26,marginMode:'axis',marginVertical:32,marginHorizontal:0});
  const content=box('intro/content',[
    box('intro/brand',[text('intro/brand/text','HelloTalk VIP',{fontSize:30,fontWeight:750,widthMode:'fit'}),icon('intro/brand/crown','filled:crown',30,accent)],{axis:'horizontal',align:'center',gap:4,marginMode:'individual',marginBottom:30}),
    box('intro/offer',[text('intro/headline','首月额外20%优惠！',{fontSize:28,fontWeight:700}),text('intro/today','仅限今日',{fontSize:28,fontWeight:700,color:'#eead47'})],{gap:8,marginMode:'individual',marginBottom:30}),
    card,benefits,
  ],{...pad(20,18)});
  const footer=n('intro/footer','Footer',{background:'#ffffff',shadowOpacity:0,gap:16,...pad(14,18)},[
    text('intro/cutoff','优惠截止时间 23:59',{fontSize:17,textAlign:'center'}),
    n('intro/purchase','PurchaseButton',{action:{action:'Purchase',packageId:card.id},widthMode:'fill',heightMode:'fixed',height:50,background:accent,shape:'pill',align:'center',justify:'center'},[text('intro/purchase/text','继续',{fontSize:18,fontWeight:700,color:'#ffffff',textAlign:'center'})]),
    text('intro/cancel-note','随时取消',{fontSize:15,color:'#bdbdbd',textAlign:'center'}),
  ]);
  return {version:3,templateId:'ht-intro-price',productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},products:{'intro/month':{name:'1个月',billingMonths:1}},root:n('intro/screen','Screen',{pagePresentation:'fullscreen',background:'#ffffff',heightMode:'fill',gap:0},[header,content,footer])};
}
