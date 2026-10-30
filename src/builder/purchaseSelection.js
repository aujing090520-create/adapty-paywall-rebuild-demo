import {componentPages,findComponent} from './componentPages.js';

export function purchasePageSequences(document,button){
  const scopes=new Map(),sequences=[];
  const visit=(node,screen,modal)=>{if(node.type==='Screen')screen=node.id;if(node.type==='BottomSheet')modal=node.id;scopes.set(node.id,{screen,modal});if(['Carousel','Tabs'].includes(node.type))sequences.push(node);node.children.forEach(child=>visit(child,screen,modal));};
  visit(document.root);const scope=scopes.get(button.id);
  return sequences.filter(node=>scope&&scopes.get(node.id).screen===scope.screen&&scopes.get(node.id).modal===scope.modal);
}
export function purchaseSelection(button,document,runtime={}){
  const action=button.props.action??{},config=action.pagePackages?.enabled===false?null:action.pagePackages;
  let packageId=action.packageId;
  if(config){
    const sequence=purchasePageSequences(document,button).find(node=>node.id===config.source);
    const page=componentPages(sequence)[runtime[sequence?.id]??sequence?.props.defaultIndex??0];
    if(!page)return {invalid:true,fixed:true,packageId:null};
    const mapping=(config.pages??[]).find(item=>item.pageId===page.id);
    if(mapping)packageId=mapping.packageId;
  }
  return {fixed:Boolean(packageId),packageId:packageId||null};
}
export function remapPurchasePages(config,ids){
  return {...config,source:ids.get(config.source)??config.source,pages:(config.pages??[]).map(item=>({...item,pageId:ids.get(item.pageId)??item.pageId,packageId:ids.get(item.packageId)??item.packageId}))};
}

// Collapse only the known two-button trial setup; custom divergent actions or copy are left intact.
export function consolidateTrialPurchase(document){
  if(document.templateId!=='ht-free-trial')return document;
  const start=findComponent(document.root,'trial/confirm'),button=findComponent(document.root,'trial/purchase'),sequence=findComponent(document.root,'trial/pages');
  if(start?.type!=='PurchaseButton'||button?.type!=='PurchaseButton'||start.props.action?.action!=='Purchase'||button.props.action?.action!=='Purchase'||button.props.action.packageId||button.props.action.pagePackages||!componentPages(sequence).some(page=>page.id==='trial/plans'))return document;
  const first=start.children.find(node=>node.type==='Text'),label=button.props.buttonText?.default??button.children.find(node=>node.type==='Text')?.props;
  const style=props=>Object.fromEntries(Object.entries(props).filter(([key])=>!['hidden','action','buttonText'].includes(key)));
  if(!first||!label||findComponent(document.root,start.props.action.packageId)?.type!=='Package'||start.children.length!==1||first.props.text!==label.text||JSON.stringify(style(start.props))!==JSON.stringify(style(button.props)))return document;
  const action={...button.props.action,packageId:start.props.action.packageId,pagePackages:{source:sequence.id,pages:[{pageId:'trial/plans',packageId:null}]}};
  const visit=node=>({...node,props:node.id===button.id?{...node.props,hidden:false,action}:node.props,children:node.children.filter(child=>child.id!==start.id).map(visit)});
  const rules=(document.logic?.rules??[]).map(rule=>({...rule,effects:rule.effects.filter(effect=>!([start.id,button.id].includes(effect.target)&&['show','hide'].includes(effect.kind)))})).filter(rule=>rule.effects.length);
  return {...document,root:visit(document.root),logic:{...document.logic,rules}};
}
