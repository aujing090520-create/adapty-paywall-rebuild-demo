import { initialPrivilegeRows } from '../templates/templateDefinitions.js';

const component = (id,type,name,props={},children=[]) => ({id,type,name,props,children});

export function createMemberComparisonButton(label) {
  const id = 'member/compare', sheetId = `${id}/sheet`;
  const text = (key, value, props = {}) => component(`${id}/${key}`, 'Text', value, {text:value,fontSize:14,...props});
  const icon = (key, name, color = '#8f8f8f') => component(`${id}/${key}`, 'Icon', '图标', {icon:name,color,widthMode:'fixed',width:20,heightMode:'fixed',height:20});
  const stack = (key, children, props = {}) => component(`${id}/${key}`, 'Stack', '布局容器', {gap:0,...props}, children);
  const rows = initialPrivilegeRows.slice(0,5);
  const columns = ['特权名称','非会员','VIP'].map((title,column) => stack(`column-${column}`, [
    text(`heading-${column}`,title,{fontWeight:700,heightMode:'fixed',height:40,textAlign:column?'center':'left',color:column===2?'#ffb400':'#171717'}),
    ...rows.map((row,index) => {
      const side=column===1?'standard':'vip';
      const value=column===0?text(`row-${index}/name`,row.name):row[`${side}Mode`]==='icon'?icon(`row-${index}/${side}`,row[`${side}Icon`],column===2?'#ffb400':'#aaaaaa'):text(`row-${index}/${side}`,row[side],{color:column===2?'#ffb400':'#8f8f8f',textAlign:'center'});
      return stack(`cell-${column}-${index}`,[value],{heightMode:'fixed',height:44,justify:'center',align:column?'center':'stretch'});
    }),
  ],{axis:'vertical',widthMode:'fill',flexGrow:column===0?1.8:.9,background:column===2?'#fff7df':'transparent'}));
  const close = component(`${id}/close`,'Button','关闭特权对比',{action:{action:'CloseSheet'},widthMode:'fixed',width:32,heightMode:'fixed',height:32,align:'center',justify:'center'},[icon('close/icon','tabler:outline:x')]);
  const sheet = component(sheetId,'BottomSheet','特权对比',{presentation:'sheet',background:'#ffffff',radiusMode:'individual',radiusTopLeft:24,radiusTopRight:24,paddingHorizontal:20,paddingVertical:20,gap:12},[
    stack('header',[text('title','特权对比',{fontSize:20,fontWeight:700}),close],{axis:'horizontal',align:'center',justify:'between'}),
    stack('table',columns,{axis:'horizontal',align:'start'}),
    component(`${id}/done`,'Button','返回套餐选择',{action:{action:'CloseSheet'},background:'#2e89ff',color:'#ffffff',radius:24,paddingVertical:12,align:'center'},[text('done/label','返回套餐选择',{fontWeight:700})]),
  ]);
  return component(`${id}/button`,'Button','特权对比',{action:{action:'OpenSheet',actionPage:sheetId},axis:'horizontal',widthMode:'fit',align:'center',gap:2},[
    {...label,props:{...label.props,widthMode:'fit',fontSize:12}},icon('chevron','tabler:outline:chevron-right'),sheet,
  ]);
}
