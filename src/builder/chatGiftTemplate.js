const purple='#7b49f4';
const names={Screen:'页面',Flow:'多页面流程',Header:'页头',Footer:'页脚',Stack:'布局容器',Text:'文字',Icon:'图标',TabControl:'标签按钮组',TabButton:'标签按钮',Package:'商品套餐',ProductParameter:'商品参数',PurchaseButton:'购买按钮'};
const n=(id,type,props={},children=[],name=names[type])=>({id,type,name,props,children});
const box=(id,children,props={})=>n(id,'Stack',{gap:0,...props},children);
const text=(id,value,props={})=>n(id,'Text',{text:value,fontSize:13,lineHeight:1.25,color:'#171717',...props});
const param=(id,field,props={})=>n(id,'ProductParameter',{parameter:field,fontSize:14,textAlign:'center',...props});
const pad=(v,h=v)=>({paddingMode:'axis',paddingVertical:v,paddingHorizontal:h});

export function buildChatGiftTemplate(){
  const products={};
  const page=plus=>{
    const key=plus?'plus':'vip',id=`chat-gift/${key}`,group=`${id}/packages`;
    const tabs=n(`${id}/tabs`,'TabControl',{axis:'horizontal',gap:0,widthMode:'fixed',width:164,heightMode:'fixed',height:28,borderWidth:1,borderColor:'#e7defa',shape:'pill'},[false,true].map((value,index)=>n(`${id}/tab-${index}`,'TabButton',{target:'chat-gift/flow',pageId:`chat-gift/${value?'plus':'vip'}`,index,widthMode:'fill',heightMode:'fill',shape:'pill',align:'center',justify:'center',background:'transparent',selectedBackground:purple},[text(`${id}/tab-${index}/text`,value?'PLUS':'VIP',{color:purple,selectedColor:'#ffffff',fontWeight:600,textAlign:'center'})])));
    const header=n(`${id}/header`,'Header',{overlapContent:false,background:'#ffffff',gap:16,...pad(8,12)},[
      box(`${id}/handle`,[],{widthMode:'fixed',width:36,heightMode:'fixed',height:4,background:'#dddddd',shape:'pill',marginMode:'individual',marginLeft:164}),
      box(`${id}/recipient`,[
        n(`${id}/recipient/icon`,'Icon',{icon:'tabler:outline:gift',widthMode:'fixed',width:18,heightMode:'fixed',height:18,color:'#141414'}),
        text(`${id}/recipient/text`,plus?'赠送 PLUS 会员给 Maze':'赠送{{ product.period }}会员给 Maze',{color:'#6f42cb',fontSize:13,widthMode:'fit'}),
        box(`${id}/recipient/avatar`,[],{widthMode:'fixed',width:22,heightMode:'fixed',height:22,shape:'pill',background:'linear-gradient(25deg,#456b38 0%,#456b38 50%,#b6d7dc 50%,#b6d7dc 100%)'}),
      ],{axis:'horizontal',align:'center',gap:5,heightMode:'fixed',height:24}),tabs,
    ]);
    const periods=plus?[1,3,12]:[3,12,null];
    const cards=periods.map((months,index)=>{
      const cardId=`${id}/package-${index}`,hasLabel=plus?index===1:index>0;products[cardId]={name:months===null?'终身':`${months}个月`,billingMonths:months};
      return n(cardId,'Package',{dataKey:cardId,group,productType:months===null?'lifetime':'subscription',defaultSelected:index===(plus?1:2),priceMode:'1',productLabelEnabled:hasLabel,widthMode:'fill',heightMode:'fixed',height:104,background:'#f7f7f7',selectedBackground:'#f7f7f7',borderWidth:1.5,borderColor:'transparent',selectedBorderColor:purple,radius:13,gap:0},[
        box(`${cardId}/label`,[param(`${cardId}/label/text`,'productLabel',{fontSize:10,color:'#ffffff',selectedColor:'#ffffff'})],{hidden:!hasLabel,heightMode:'fixed',height:23,background:purple,align:'center',justify:'center',radiusMode:'individual',radiusTopLeft:11,radiusTopRight:11,radiusBottomLeft:0,radiusBottomRight:0}),
        box(`${cardId}/body`,[
          param(`${cardId}/duration`,'skuDuration',{fontSize:13,lineHeight:1.2,color:'#111111',selectedColor:'#111111'}),
          param(`${cardId}/reference`,'totalReferencePrice',{priceRole:'reference',strike:true,fontSize:11,lineHeight:1.15,color:'#999999',selectedColor:'#999999'}),
          param(`${cardId}/price`,'totalPrice',{priceRole:'primary',fontSize:16,lineHeight:1.2,fontWeight:700,color:purple,selectedColor:purple}),
          param(`${cardId}/info`,'productInfo',{fontSize:11,lineHeight:1.15,color:purple,selectedColor:purple}),
        ],{gap:2,align:'center',justify:'center',heightMode:'fill',...pad(4,2)}),
      ]);
    });
    const footer=n(`${id}/footer`,'Footer',{background:'#ffffff',align:'end',gap:0,...pad(12,14),paddingMode:'individual',paddingTop:12,paddingRight:14,paddingBottom:24,paddingLeft:14},[
      n(`${id}/purchase`,'PurchaseButton',{action:{action:'Purchase'},widthMode:'fixed',width:108,heightMode:'fixed',height:40,background:purple,shape:'pill',align:'center',justify:'center'},[text(`${id}/purchase/text`,'立即支付',{fontSize:16,fontWeight:700,color:'#ffffff',textAlign:'center'})]),
    ]);
    return n(id,'Screen',{pagePresentation:'embedded',embedWidth:390,embedHeight:314,embedLeft:0,embedTop:530,embedPreviewContext:'chat-gifts',heightMode:'fill',background:'#ffffff',gap:0},[
      header,box(group,cards,{axis:'horizontal',gap:0,heightMode:'fit',marginMode:'axis',marginHorizontal:10,marginVertical:2}),footer,
    ],plus?'PLUS':'VIP');
  };
  return {version:3,templateId:'ht-chat-gift',productFieldPreview:true,productParameterVersion:1,settings:{buttonModalVersion:1},products,root:n('chat-gift/root','Screen',{heightMode:'fill',gap:0,background:'#ffffff'},[n('chat-gift/flow','Flow',{navigationMode:'tabs',initialStepId:'chat-gift/vip',defaultIndex:0,gap:0},[page(false),page(true)],'会员切页')],'聊天中送礼')};
}
