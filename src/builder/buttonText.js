const buttonTypes=new Set(['Button','PurchaseButton']);
function tree(document){
  const nodes=new Map(),parents=new Map();
  const visit=(node,parent)=>{nodes.set(node.id,node);if(parent)parents.set(node.id,parent.id);node.children.forEach(child=>visit(child,node));};
  visit(document.root);return {nodes,parents};
}
function owner(id,type,{nodes,parents}){let node=nodes.get(id);while(node&&node.type!==type)node=nodes.get(parents.get(node.id));return node?.id;}
export function buttonLabelTexts(button){
  const texts=[];
  const visit=node=>{if(node.type==='BottomSheet'||buttonTypes.has(node.type))return;if(node.type==='Text')texts.push(node);else node.children.forEach(visit);};
  button.children.forEach(visit);return texts;
}
export function buttonPackages(document,button,index=tree(document)){
  return [...index.nodes.values()].filter(node=>node.type==='Package'&&owner(node.id,'Screen',index)===owner(button.id,'Screen',index)&&owner(node.id,'BottomSheet',index)===owner(button.id,'BottomSheet',index));
}
export function buttonTextConfig(button,document){
  const saved=button.props.buttonText??{},texts=buttonLabelTexts(button),target=texts.find(node=>node.id===saved.target)??(!saved.target?texts[0]:null);
  const packages=buttonPackages(document,button);
  const translations=Object.fromEntries(Object.entries(document.localization?.translations??{}).filter(([,entries])=>entries[target?.id]?.text!==undefined).map(([locale,entries])=>[locale,{text:entries[target.id].text,runs:entries[target.id].runs??null}]));
  return {mode:'default',target:target?.id??'',group:packages[0]?.props.group??packages[0]?.id??'',default:{text:target?.props.text??'',runs:target?.props.runs??null,...(Object.keys(translations).length?{translations}:{})},variants:[],...saved};
}
export function localizedButtonText(content,document,locale=document.previewContentLocale){
  const fallback=content??{text:'',runs:null},value=content?.translations?.[locale];
  return locale&&locale!==(document.localization?.defaultLocale??'zh-CN')&&value?.text?{...fallback,...value}:fallback;
}
export function buttonTextPreviewNavigation(document,button){
  if(!button.props.buttonText)return {};
  const index=tree(document);
  for(const rule of document.logic?.rules??[]){
    const condition=rule.conditions?.[0];
    if(rule.enabled===false||rule.conditions?.length!==1||condition.type!=='page'||condition.operator==='notEquals'||!rule.effects.some(effect=>effect.target===button.id&&effect.kind==='show'))continue;
    const sequence=index.nodes.get(condition.source),pages=sequence?.children.filter(node=>node.type===(sequence.type==='Carousel'?'Slide':'Tab'))??[];
    const page=pages.findIndex(node=>node.id===condition.value);
    if(page>=0)return {[sequence.id]:page};
  }
  return {};
}
export function buttonTextOwner(document,id,index=tree(document)){
  let node=index.nodes.get(index.parents.get(id));
  while(node&&!buttonTypes.has(node.type)&&node.type!=='BottomSheet')node=index.nodes.get(index.parents.get(node.id));
  return node?.props.buttonText?.target===id&&buttonTypes.has(node.type)?node:null;
}
export function buttonTextResolution(node,document,runtime={},index=tree(document),editing=false){
  const button=buttonTextOwner(document,node.id,index);if(!button)return null;
  const config=buttonTextConfig(button,document),packages=buttonPackages(document,button,index).filter(item=>(item.props.group??item.id)===config.group);
  const choice=editing?runtime[`button-text:${button.id}`]:undefined;
  const selected=packages.find(item=>item.id===(choice||runtime[`package:${config.group}`]))??packages.find(item=>item.props.defaultSelected);
  const variant=config.mode==='package'&&choice!==''?config.variants.find(item=>item.packageId===selected?.id):null;
  const content=localizedButtonText(variant??config.default,document);
  return {packageNode:selected,props:{text:content.text??'',runs:content.runs??null,binding:null,productField:null}};
}
export function remapButtonText(config,ids){
  if(!config)return {};
  return {buttonText:{...config,target:ids.get(config.target)??config.target,group:ids.get(config.group)??config.group,variants:(config.variants??[]).map(item=>({...item,packageId:ids.get(item.packageId)??item.packageId}))}};
}
export function removeButtonTextEffects(document,target){
  if(!document.logic?.rules?.some(rule=>rule.effects.some(effect=>effect.kind==='text'&&effect.target===target)))return document;
  return {...document,logic:{...document.logic,rules:document.logic.rules.map(rule=>({...rule,effects:rule.effects.filter(effect=>effect.kind!=='text'||effect.target!==target)})).filter(rule=>rule.effects.length)}};
}

// Convert only the trial template's previous single-package text rule, preserving its legal-copy effect.
export function upgradeTrialButtonText(document){
  if(document.templateId!=='ht-free-trial')return document;
  const index=tree(document),patches=new Map();let changed=false;
  const rules=(document.logic?.rules??[]).map(rule=>{
    if(rule.enabled===false||rule.conditions?.length!==1)return rule;
    const condition=rule.conditions[0],pkg=index.nodes.get(condition.value);
    if(condition.type!=='package'||condition.operator==='notEquals'||pkg?.type!=='Package')return rule;
    const effects=rule.effects.filter(effect=>{
      if(effect.kind!=='text')return true;
      const target=index.nodes.get(effect.target);let button=index.nodes.get(index.parents.get(target?.id));
      if(!target||target.type!=='Text'||!buttonTypes.has(button?.type)||buttonLabelTexts(button)[0]?.id!==target.id||!buttonPackages(document,button,index).some(item=>item.id===pkg.id))return true;
      const config=patches.get(button.id)??button.props.buttonText??{...buttonTextConfig(button,document),mode:'package',group:pkg.props.group??pkg.id};
      if(config.group!==(pkg.props.group??pkg.id))return true;
      patches.set(button.id,button.props.buttonText?config:{...config,variants:[...config.variants.filter(item=>item.packageId!==pkg.id),{packageId:pkg.id,text:String(effect.value??''),runs:null}]});changed=true;return false;
    });
    return effects.length===rule.effects.length?rule:{...rule,effects};
  }).filter(rule=>rule.effects.length);
  if(!changed)return document;
  const visit=node=>({...node,props:patches.has(node.id)?{...node.props,buttonText:patches.get(node.id)}:node.props,children:node.children.map(visit)});
  return {...document,root:visit(document.root),logic:{...document.logic,rules}};
}
