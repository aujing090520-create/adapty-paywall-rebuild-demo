import {rewriteBusinessTokens} from './workbenchModel.js';

export function captureFragmentConfiguration(document,roots){
  const nodes=[];const visit=node=>{nodes.push(node);node.children.forEach(visit);};roots.forEach(visit);
  const ids=new Set(nodes.map(node=>node.id));
  const rules=(document.logic?.rules??[]).map(rule=>({...structuredClone(rule),effects:rule.effects.filter(effect=>ids.has(effect.target))})).filter(rule=>rule.effects.length);
  const translations=Object.fromEntries(Object.entries(document.localization?.translations??{}).map(([locale,entries])=>[locale,Object.fromEntries(Object.entries(entries).filter(([id])=>ids.has(id)))]));
  const assets=(document.localization?.assets??[]).filter(asset=>ids.has(asset.target));
  const mentioned=new Set([...JSON.stringify({roots,rules,translations}).matchAll(/\{\{\s*business\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g)].map(match=>match[1]));
  for(const rule of rules)for(const condition of rule.conditions)if(condition.type==='variable')mentioned.add(condition.source);
  const variables=(document.logic?.variables??[]).filter(variable=>mentioned.has(variable.key));
  const skus=new Set(nodes.filter(node=>node.type==='Package').map(node=>document.products[node.props.dataKey??node.id]?.skuId).filter(Boolean));
  const bySku=Object.fromEntries(Object.entries(document.business?.bySku??{}).filter(([key])=>skus.has(key)));
  const timeIds=new Set(nodes.map(node=>node.props.timeSourceId).filter(Boolean));
  for(const rule of rules)for(const condition of rule.conditions)if(condition.type==='timeSource')timeIds.add(condition.source);
  const timeSources=(document.business?.timeSources??[]).filter(source=>timeIds.has(source.id));
  return structuredClone({rules,variables,translations,assets,defaultLocale:document.localization?.defaultLocale,bySku,...(timeSources.length?{timeSources}:{}),...(nodes.some(node=>node.props.dataSource==='benefits')?{benefits:document.business?.benefits}:{} )});
}

export function restoreFragmentConfiguration(document,configuration,ids){
  if(!configuration)return document;
  let next=document;
  const timeIds=new Map(),sources=[...document.business?.timeSources??[]];
  for(const source of configuration.timeSources??[]) {
    const existing=sources.find(item=>item.key===source.key&&item.scope===source.scope);
    if(existing){timeIds.set(source.id,existing.id);continue;}
    let key=source.key,index=2;while(sources.some(item=>item.key===key))key=`${source.key}_${index++}`;
    const id=crypto.randomUUID();timeIds.set(source.id,id);sources.push({...source,id,key});
  }
  const variables=[...document.logic?.variables??[]],renamed=new Map();
  for(const variable of configuration.variables??[]){
    const existing=variables.find(item=>item.key===variable.key);
    if(existing&&existing.type===variable.type&&JSON.stringify(existing.value)===JSON.stringify(variable.value))continue;
    let key=variable.key,index=2;while(variables.some(item=>item.key===key))key=`${variable.key}_${index++}`;
    if(key!==variable.key)renamed.set(variable.key,key);
    variables.push({...variable,id:crypto.randomUUID(),key});
  }
  const rules=(configuration.rules??[]).map(rule=>({...rewriteBusinessTokens(rule,renamed),id:crypto.randomUUID(),conditions:rule.conditions.map(condition=>({...condition,...(condition.type==='timeSource'&&timeIds.has(condition.source)?{source:timeIds.get(condition.source)}:{}),...(condition.type==='tab'&&ids.has(condition.source)?{source:ids.get(condition.source)}:{}),...(condition.type==='variable'&&renamed.has(condition.source)?{source:renamed.get(condition.source)}:{})})),effects:rule.effects.map(effect=>({...rewriteBusinessTokens(effect,renamed),target:ids.get(effect.target)}))}));
  if(rules.length||variables.length!==(document.logic?.variables??[]).length)next={...next,logic:{...document.logic,variables,rules:[...document.logic?.rules??[],...rules]}};
  const translations={...document.localization?.translations};
  for(const [locale,entries] of Object.entries(configuration.translations??{}))if(Object.keys(entries).length)translations[locale]={...translations[locale],...Object.fromEntries(Object.entries(entries).map(([id,value])=>[ids.get(id),rewriteBusinessTokens(value,renamed)]))};
  const assets=(configuration.assets??[]).map(asset=>({...asset,id:crypto.randomUUID(),target:ids.get(asset.target)}));
  if(Object.keys(translations).length||assets.length)next={...next,localization:{...document.localization,defaultLocale:document.localization?.defaultLocale??configuration.defaultLocale??'zh-CN',translations,assets:[...document.localization?.assets??[],...assets]}};
  if(Object.keys(configuration.bySku??{}).length||configuration.benefits!==undefined)next={...next,business:{...document.business,bySku:{...configuration.bySku,...document.business?.bySku},...(document.business?.benefits===undefined&&configuration.benefits!==undefined?{benefits:configuration.benefits}:{})}};
  if(renamed.size){const copiedIds=new Set(ids.values());const visit=node=>({...node,props:copiedIds.has(node.id)?rewriteBusinessTokens(node.props,renamed):node.props,children:node.children.map(visit)});next={...next,root:visit(next.root)};}
  if(timeIds.size){const copiedIds=new Set(ids.values());const visit=node=>({...node,props:copiedIds.has(node.id)&&timeIds.has(node.props.timeSourceId)?{...node.props,timeSourceId:timeIds.get(node.props.timeSourceId)}:node.props,children:node.children.map(visit)});next={...next,business:{...next.business,timeSources:sources},root:visit(next.root)};}
  return next;
}
