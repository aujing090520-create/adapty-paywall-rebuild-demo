const record=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const optionalArray=(value,predicate)=>value===undefined||Array.isArray(value)&&value.every(predicate);
const text=value=>typeof value==='string';

export function validWorkbenchConfiguration(document){
  const {logic,localization,business}=document;
  const items=value=>optionalArray(value,item=>record(item)&&['id','title','description','image','url'].every(key=>item[key]===undefined||text(item[key]))&&(item.translations===undefined||record(item.translations)&&Object.values(item.translations).every(record)));
  if(logic!==undefined&&(!record(logic)||!optionalArray(logic.variables,item=>record(item)&&text(item.key))||!optionalArray(logic.rules,item=>record(item)&&Array.isArray(item.conditions)&&item.conditions.every(record)&&Array.isArray(item.effects)&&item.effects.every(record))))return false;
  if(localization!==undefined&&(!record(localization)||localization.defaultLocale!==undefined&&!text(localization.defaultLocale)||!optionalArray(localization.assets,item=>record(item)&&text(item.target)&&text(item.src))||localization.translations!==undefined&&(!record(localization.translations)||!Object.values(localization.translations).every(locale=>record(locale)&&Object.values(locale).every(record)))))return false;
  if(business!==undefined&&(!record(business)||!items(business.benefits)||business.bySku!==undefined&&(!record(business.bySku)||!Object.values(business.bySku).every(row=>record(row)&&items(row.gifts)))))return false;
  return true;
}

export function variableKeyError(variables,id,key){
  if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))return '使用英文字母或下划线开头，后接字母、数字或下划线';
  if(variables.some(item=>item.id!==id&&item.key===key))return '变量键已存在';
  return '';
}
export function rewriteBusinessTokens(value,keys){
  if(typeof value==='string')return value.replace(/\{\{\s*business\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g,(token,key)=>keys.has(key)?`{{ business.${keys.get(key)} }}`:token);
  if(Array.isArray(value))return value.map(item=>rewriteBusinessTokens(item,keys));
  if(record(value))return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewriteBusinessTokens(item,keys)]));
  return value;
}
export function renameBusinessVariable(document,id,key){
  const variable=document.logic?.variables?.find((item,index)=>(item.id??`legacy-variable-${index}`)===id);
  if(!variable||variable.key===key||variableKeyError(document.logic.variables,id,key))return document;
  const result=rewriteBusinessTokens(document,new Map([[variable.key,key]]));
  return {...result,logic:{...result.logic,variables:result.logic.variables.map((item,index)=>(item.id??`legacy-variable-${index}`)===id?{...item,id,key}:item),rules:(result.logic.rules??[]).map(rule=>({...rule,conditions:rule.conditions.map(condition=>condition.type==='variable'&&condition.source===variable.key?{...condition,source:key}:condition)}))}};
}
