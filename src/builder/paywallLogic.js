import {selectedBusinessData,businessList} from './businessData.js';
import {resolveBusinessTime} from './businessTime.js';
const comparable = value => String(value ?? '');
export const LOGIC_TARGET_TYPES = new Set(['Stack','Text','Image','Video','Icon','Button','PurchaseButton','Countdown','Carousel']);

export function businessValues(document, runtime = {}) {
  return Object.fromEntries((document.logic?.variables??[]).map(item=>[item.key,runtime[`business:${item.key}`]??item.value]));
}

export function logicMatches(rule, document, runtime, selectedPackage) {
  if(rule.enabled===false || !rule.conditions?.length)return false;
  const row=selectedBusinessData(document,selectedPackage);
  const variables=businessValues(document,runtime);
  return rule.conditions.every(condition=>{
    if(condition.value===undefined || condition.value===null || condition.value==='')return false;
    if(['tab','variable','timeSource'].includes(condition.type)&&!condition.source)return false;
    let actual;
    if(condition.type==='sku') { if(!row?.skuId)return false; actual=row.skuId; }
    else if(condition.type==='tab') {
      const find=node=>node.id===condition.source?node:node.children.map(find).find(Boolean);
      const tab=find(document.root);
      if(tab?.type!=='Tabs')return false;
      actual=runtime[tab.id]??tab.props.defaultIndex??0;
    } else if(condition.type==='hasGift')actual=businessList(document,'gifts',selectedPackage).length>0;
    else if(condition.type==='variable')actual=variables[condition.source];
    else if(condition.type==='timeSource')actual=resolveBusinessTime(document,condition.source,runtime).status;
    else return false;
    if(actual===undefined)return false;
    const equal=comparable(actual)===comparable(condition.value);
    return condition.operator==='notEquals'?!equal:equal;
  });
}

export function logicNode(node, document, runtime, selectedPackage) {
  if(!LOGIC_TARGET_TYPES.has(node.type))return node;
  let props=node.props;
  for(const rule of document.logic?.rules??[])if(logicMatches(rule,document,runtime,selectedPackage))for(const effect of rule.effects??[])if(effect.target===node.id) {
    if(effect.kind==='show'||effect.kind==='hide')props={...props,hidden:effect.kind==='hide'};
    if(effect.kind==='text'&&node.type==='Text')props={...props,text:String(effect.value??''),runs:null,binding:null};
    if(['Button','PurchaseButton'].includes(node.type)&&['disable','enable'].includes(effect.kind))props={...props,disabled:effect.kind==='disable'};
  }
  return props===node.props?node:{...node,props};
}
