export function selectedBusinessData(document, packageNode) {
  const row=document.products[packageNode?.props.dataKey??packageNode?.id]??{};
  const configured=document.business?.bySku?.[row.skuId];
  return {...row,...(configured?{gifts:configured.gifts??row.gifts}:{} )};
}

export function businessList(document, source, packageNode) {
  const list=source==='gifts'?selectedBusinessData(document,packageNode).gifts:source==='benefits'?document.business?.benefits:null;
  if(!Array.isArray(list))return [];
  const language=document.previewContentLocale??'zh-CN';
  const nonEmpty=value=>Object.fromEntries(Object.entries(value??{}).filter(([,value])=>value!==''&&value!==undefined));
  return list.filter(item=>item&&item.enabled!==false).map((item,index)=>({...item,...nonEmpty(item.translations?.[document.localization?.defaultLocale]),...nonEmpty(item.translations?.[language]),id:item.id??String(index)}));
}

export const ITEM_VARIABLES = [['item.title','条目标题'],['item.description','条目说明'],['item.image','条目图片'],['item.url','条目链接']];
export const interpolateItem = (value,item) => !item?value:String(value??'').replace(/\{\{\s*item\.(title|description|image|url)\s*\}\}/g,(_,key)=>item[key]??'');
