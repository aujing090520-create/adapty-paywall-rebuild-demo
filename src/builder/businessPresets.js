import {component} from './componentDocument.js';

export function businessPreset(type,id) {
  const text=(suffix,value,props={})=>component(`${id}/${suffix}`,'Text','文字',{text:value,...props});
  if(type==='GiftEntry')return component(id,'Button','赠送入口',{action:{action:'OpenURL',actionUrl:'',openMethod:'external_browser'},axis:'horizontal',gap:8,paddingMode:'axis',paddingVertical:10,paddingHorizontal:12},[component(`${id}/icon`,'Icon','图标',{icon:'gift',widthMode:'fixed',heightMode:'fixed',width:24,height:24}),text('label','赠送会员给朋友')]);
  const gifts=type==='GiftList';
  const sheet=component(`${id}/sheet`,'BottomSheet','条目说明',{presentation:'sheet',background:'#ffffff',radius:20,paddingMode:'axis',paddingVertical:20,paddingHorizontal:20},[text('detail-title','{{ item.title }}',{fontSize:22,fontWeight:700}),text('detail-copy','{{ item.description }}'),component(`${id}/close`,'Button','返回',{action:{action:'CloseSheet'},background:'#167aff',paddingMode:'axis',paddingVertical:12,paddingHorizontal:16},[text('close-label','返回',{color:'#ffffff'})])]);
  return component(id,'Stack',gifts?'礼包组合':'福利组合',{dataSource:gifts?'gifts':'benefits',axis:gifts?'vertical':'horizontal',gap:8,collapsible:gifts,autoExpandDelay:1500,collapseLabel:'套餐赠送礼包',widthMode:'fill',heightMode:'fit',horizontalScroll:!gifts},[
    component(`${id}/item`,'Stack','条目布局',{axis:'horizontal',align:'center',gap:10,widthMode:gifts?'fill':'fixed',width:240,paddingMode:'axis',paddingVertical:10,paddingHorizontal:12,radius:8,borderWidth:1,borderColor:'#e4e4e7'},[
      component(`${id}/image`,'Image','图片',{src:'{{ item.image }}',widthMode:'fixed',heightMode:'fixed',width:48,height:48,objectFit:'contain'}),
      component(`${id}/copy`,'Stack','条目文案',{gap:4},[text('title','{{ item.title }}',{fontWeight:700}),text('description','{{ item.description }}',{fontSize:12,color:'#666666'})]),
      component(`${id}/details`,'Button','礼包说明',{action:{action:'OpenSheet',actionPage:`${id}/sheet`},widthMode:'fit'},[component(`${id}/info`,'Icon','图标',{icon:'help',widthMode:'fixed',heightMode:'fixed',width:22,height:22}),sheet]),
    ]),
  ]);
}
