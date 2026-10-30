import React,{useState,useEffect} from 'react';
import {X,Plus,Trash2} from 'lucide-react';
import {indexDocument,COMPONENT_NAMES} from './componentDocument.js';
import {LOGIC_TARGET_TYPES} from './paywallLogic.js';
import {CONTENT_LANGUAGES,resourceFields,RESOURCE_FIELD_LABELS} from './contentLocalization.js';
import {renameBusinessVariable,variableKeyError} from './workbenchModel.js';
import TimeSourceSettings from './TimeSourceSettings.jsx';
import {timeSources,TIME_STATES} from './businessTime.js';
import {componentPages} from './componentPages.js';

const uid=()=>crypto.randomUUID();
const Field=({label,children})=><label className="rc-field"><span>{label}</span>{children}</label>;
const Select=({label,value,options,onChange})=><Field label={label}><select aria-label={label} value={value??''} onChange={e=>onChange(e.target.value)}>{options.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></Field>;
const Remove=({label,onClick})=><button type="button" className="ne-icon danger" aria-label={label} title={label} onClick={onClick}><Trash2 size={16}/></button>;
const label=node=>`${COMPONENT_NAMES[node.type]} · ${node.type==='Text'?(node.props.text??'').slice(0,24):node.name} · ${node.id}`;
function VariableKey({variable,variables,onChange}){
  const [draft,setDraft]=useState(variable.key);useEffect(()=>setDraft(variable.key),[variable.key]);
  const error=variableKeyError(variables,variable.id,draft);
  return <Field label="变量键"><input aria-label="变量键" aria-invalid={Boolean(error)} value={draft} onChange={event=>setDraft(event.target.value)} onBlur={()=>{if(!error)onChange(draft);}}/>{error&&<small role="alert">{error}</small>}</Field>;
}

export default function WorkbenchSettings({document,onChange,onClose,onPreview,initialTab='logic'}) {
  const [tab,setTab]=useState(initialTab==='timeSources'?'data':initialTab),[language,setLanguage]=useState(document.localization?.defaultLocale??'zh-CN'),[target,setTarget]=useState(''),[dataType,setDataType]=useState(initialTab==='timeSources'?'timeSources':'gifts'),[sku,setSku]=useState('');
  const nodes=[...indexDocument(document).nodes.values()],skus=[...new Set(Object.values(document.products).map(row=>row.skuId).filter(Boolean))];
  const logic=document.logic??{},localization=document.localization??{},business=document.business??{};
  const patchLogic=patch=>onChange({...document,logic:{...logic,...patch}}),patchLocale=patch=>onChange({...document,localization:{...localization,...patch}});
  const rules=(logic.rules??[]).map((item,index)=>({...item,id:item.id??`legacy-rule-${index}`})),variables=(logic.variables??[]).map((item,index)=>({...item,id:item.id??`legacy-variable-${index}`}));
  const assets=(localization.assets??[]).map((item,index)=>({...item,id:item.id??`legacy-asset-${index}`}));
  const patchRule=(id,patch)=>patchLogic({rules:rules.map(rule=>rule.id===id?{...rule,...patch}:rule)});
  const activeSku=sku||skus[0]||'';
  const items=dataType==='gifts'?business.bySku?.[activeSku]?.gifts??[]:business.benefits??[];
  const setItems=next=>onChange({...document,business:{...business,...(dataType==='gifts'?{bySku:{...business.bySku,[activeSku]:{...business.bySku?.[activeSku],gifts:next}}}:{benefits:next})}});
  const editItem=(index,key,value)=>setItems(items.map((item,at)=>at!==index?item:language==='zh-CN'?{...item,[key]:value}:{...item,translations:{...item.translations,[language]:{...item.translations?.[language],[key]:value}}}));
  const translatable=nodes.filter(node=>node.type==='Text'&&!node.props.binding||resourceFields(node).length);
  const selected=translatable.find(node=>node.id===target)??translatable.find(node=>node.type==='Text')??translatable[0];
  const override=localization.translations?.[language]?.[selected?.id]??{};
  const setTranslation=(key,value)=>patchLocale({translations:{...localization.translations,[language]:{...localization.translations?.[language],[selected.id]:{...override,[key]:value,...(key==='text'?{runs:null}:{})}}}});
  return <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-label="工作区配置" className="modal ne-workbench-settings">
    <header><h2>工作区配置</h2><button type="button" className="ne-icon" aria-label="关闭工作区配置" onClick={onClose}><X size={18}/></button></header>
    <nav aria-label="工作区设置分类">{[['logic','条件与联动'],['data','业务数据'],['language','内容语言'],['assets','资源变体']].map(([key,name])=><button type="button" className={tab===key?'active':''} key={key} onClick={()=>setTab(key)}>{name}</button>)}</nav>
    <div className="ne-workbench-settings-body">
      {tab==='logic'&&<>
        <h3>业务变量</h3>{variables.map(variable=><div className="ne-settings-row" key={variable.id}><VariableKey variable={variable} variables={variables} onChange={key=>onChange(renameBusinessVariable(document,variable.id,key))}/><Select label="变量类型" value={variable.type} options={[[ 'boolean','布尔值' ],['string','文字'],['number','数字']]} onChange={type=>patchLogic({variables:variables.map(item=>item.id===variable.id?{...item,type,value:type==='boolean'?false:type==='number'?0:''}:item)})}/><Field label="变量默认值">{variable.type==='boolean'?<input aria-label="变量默认值" type="checkbox" checked={Boolean(variable.value)} onChange={e=>patchLogic({variables:variables.map(item=>item.id===variable.id?{...item,value:e.target.checked}:item)})}/>:<input aria-label="变量默认值" type={variable.type==='number'?'number':'text'} value={variable.value??''} onChange={e=>patchLogic({variables:variables.map(item=>item.id===variable.id?{...item,value:variable.type==='number'?Number(e.target.value):e.target.value}:item)})}/>}</Field><Remove label="删除业务变量" onClick={()=>patchLogic({variables:variables.filter(item=>item.id!==variable.id)})}/></div>)}
        <button type="button" className="secondary" onClick={()=>{let index=1;while(variables.some(item=>item.key===`content_${index}`))index++;patchLogic({variables:[...variables,{id:uid(),key:`content_${index}`,type:'boolean',value:true}]});}}><Plus size={15}/>添加变量</button>
        <h3>条件规则</h3>{rules.map(rule=><fieldset key={rule.id}><legend>{rule.name||'规则'}</legend><div className="ne-settings-row"><Field label="规则名称"><input aria-label="规则名称" value={rule.name} onChange={e=>patchRule(rule.id,{name:e.target.value})}/></Field><Field label="启用规则"><input aria-label="启用规则" type="checkbox" checked={rule.enabled!==false} onChange={e=>patchRule(rule.id,{enabled:e.target.checked})}/></Field><Remove label="删除规则" onClick={()=>patchLogic({rules:rules.filter(item=>item.id!==rule.id)})}/></div>
          {rule.conditions.map((condition,index)=>{
            const update=patch=>patchRule(rule.id,{conditions:rule.conditions.map((item,at)=>at===index?{...item,...patch}:item)});
            const tabs=nodes.filter(node=>node.type==='Tabs'),selectedTab=tabs.find(node=>node.id===condition.source);
            const sequences=nodes.filter(node=>componentPages(node).length),selectedSequence=sequences.find(node=>node.id===condition.source);
            return <div className="ne-settings-row" key={index}>
              <Select label="条件类型" value={condition.type} options={[[ 'sku','选中 SKU' ],['package','选中商品套餐'],['page','当前组件页面'],['tab','选中等级 Tab'],['hasGift','有无礼包'],['variable','业务变量'],['timeSource','业务时间源状态']]} onChange={type=>update({type,source:'',value:type==='hasGift'?true:''})}/>
              {condition.type==='page'&&<Select label="条件组件" value={condition.source} options={[[ '', '选择轮播或标签页' ],...sequences.map(node=>[node.id,`${node.type==='Carousel'?'轮播':'标签页'} · ${node.id}`])]} onChange={source=>update({source,value:''})}/>}
              {condition.type==='page'&&<Select label="条件页面" value={condition.value} options={[[ '', '选择组件页面' ],...componentPages(selectedSequence).map((page,index)=>[page.id,`${index+1}. ${page.name}`])]} onChange={value=>update({value})}/>}
              {condition.type==='package'&&<Select label="条件套餐" value={condition.value} options={[[ '', '选择商品套餐' ],...nodes.filter(node=>node.type==='Package').map((node,index)=>[node.id,`套餐 ${index+1} · ${node.id}`])]} onChange={value=>update({value})}/>}
              {condition.type==='tab'&&<Select label="等级组件" value={condition.source} options={[[ '', '选择等级组件' ],...tabs.map(node=>[node.id,node.name])]} onChange={source=>update({source,value:''})}/>}
              {condition.type==='variable'&&<Select label="业务变量" value={condition.source} options={[[ '', '选择变量' ],...variables.map(item=>[item.key,item.key])]} onChange={source=>update({source,value:''})}/>}
              {condition.type==='timeSource'&&<Select label="条件时间源" value={condition.source} options={[[ '', '选择时间源' ],...timeSources(document).map(source=>[source.id,source.name])]} onChange={source=>update({source,value:''})}/>}
              <Select label="比较方式" value={condition.operator??'equals'} options={[[ 'equals','等于' ],['notEquals','不等于']]} onChange={operator=>update({operator})}/>
              {!['page','package'].includes(condition.type)&&(condition.type==='timeSource'?<Select label="条件值" value={condition.value} options={[[ '', '选择状态' ],...TIME_STATES]} onChange={value=>update({value})}/>:condition.type==='sku'?<Select label="条件值" value={condition.value} options={[[ '', '选择 SKU' ],...skus.map(id=>[id,id])]} onChange={value=>update({value})}/>:condition.type==='tab'?<Select label="条件值" value={condition.value} options={[[ '', '选择等级' ],...(selectedTab?.children??[]).map((node,index)=>[String(index),node.name])]} onChange={value=>update({value})}/>:condition.type==='hasGift'||variables.find(item=>item.key===condition.source)?.type==='boolean'?<Select label="条件值" value={String(condition.value)} options={[[ 'true','是' ],['false','否']]} onChange={value=>update({value:value==='true'})}/>:<Field label="条件值"><input aria-label="条件值" value={condition.value} onChange={e=>update({value:e.target.value})}/></Field>)}
              <Remove label="删除条件" onClick={()=>patchRule(rule.id,{conditions:rule.conditions.filter((_,at)=>at!==index)})}/>
            </div>;
          })}
          <button type="button" className="secondary" onClick={()=>patchRule(rule.id,{conditions:[...rule.conditions,{type:'sku',value:'',operator:'equals'}]})}><Plus size={15}/>添加并且条件</button>
          {rule.effects.map((effect,index)=>{const update=patch=>patchRule(rule.id,{effects:rule.effects.map((item,at)=>at===index?{...item,...patch}:item)});return <div className="ne-settings-row" key={index}><Select label="影响节点" value={effect.target} options={[[ '', '选择节点' ],...nodes.filter(node=>LOGIC_TARGET_TYPES.has(node.type)).map(node=>[node.id,label(node)])]} onChange={target=>update({target,kind:'show'})}/><Select label="联动行为" value={effect.kind} options={[[ 'show','显示' ],['hide','隐藏'],...(['Button','PurchaseButton'].includes(nodes.find(node=>node.id===effect.target)?.type)?[[ 'disable','禁用按钮' ],['enable','启用按钮']]:[]),...(nodes.find(node=>node.id===effect.target)?.type==='Text'?[[ 'text','替换文字' ]]:[])]} onChange={kind=>update({kind})}/>{effect.kind==='text'&&<Field label="联动文字"><textarea aria-label="联动文字" value={effect.value??''} onChange={e=>update({value:e.target.value})}/></Field>}<Remove label="删除联动" onClick={()=>patchRule(rule.id,{effects:rule.effects.filter((_,at)=>at!==index)})}/></div>;})}
          <button type="button" className="secondary" onClick={()=>patchRule(rule.id,{effects:[...rule.effects,{target:'',kind:'show'}]})}><Plus size={15}/>添加影响节点</button>
        </fieldset>)}<button type="button" className="secondary" onClick={()=>patchLogic({rules:[...rules,{id:uid(),name:`规则 ${rules.length+1}`,enabled:true,conditions:[{type:'sku',value:'',operator:'equals'}],effects:[{target:'',kind:'show'}]}]})}><Plus size={15}/>添加规则</button>
      </>}
      {tab==='data'&&<>
        <div className="ne-settings-row"><Select label="数据列表" value={dataType} options={[[ 'gifts','SKU 礼包' ],['benefits','会员福利'],['timeSources','业务时间源']]} onChange={setDataType}/>{dataType==='gifts'&&<Select label="数据 SKU" value={activeSku} options={[[ '', '选择 SKU' ],...skus.map(id=>[id,id])]} onChange={setSku}/>} {dataType!=='timeSources'&&<Select label="条目语言" value={language} options={CONTENT_LANGUAGES} onChange={setLanguage}/>}</div>
        {dataType==='timeSources'?<TimeSourceSettings document={document} onChange={onChange}/>:<>
        {items.map((item,index)=><fieldset key={`${item.id??'legacy'}:${index}`}><legend>{item.title||'新条目'}</legend>{[['title','条目标题'],['description','条目说明'],['image','条目图片'],['url','条目链接']].map(([key,label])=><Field label={label} key={key}><input aria-label={label} value={language==='zh-CN'?item[key]??'':item.translations?.[language]?.[key]??''} placeholder={language==='zh-CN'?'':item[key]??''} onChange={e=>editItem(index,key,e.target.value)}/></Field>)}<Remove label="删除条目" onClick={()=>setItems(items.filter((_,at)=>at!==index))}/></fieldset>)}
        <button type="button" className="secondary" disabled={dataType==='gifts'&&!activeSku} onClick={()=>setItems([...items,{id:uid(),title:'新条目',description:'',image:'',url:''}])}><Plus size={15}/>添加条目</button>
        <button type="button" className="secondary" disabled={items.length>0||dataType==='gifts'&&!activeSku} onClick={()=>setItems([{id:uid(),title:'示例会员礼包',description:'专属身份装扮',image:'/ht-retention-gift.png',translations:{en:{title:'Sample member gift',description:'Exclusive profile decoration'},ar:{title:'هدية عضوية تجريبية',description:'زينة حصرية للملف الشخصي'}}},{id:uid(),title:'示例福利券',description:'会员专享福利',image:'/ht-retention-gift.png'}])}>填入示例数据</button>
        </>}
      </>}
      {tab==='language'&&<>
        <Select label="默认内容语言" value={localization.defaultLocale??'zh-CN'} options={CONTENT_LANGUAGES} onChange={defaultLocale=>{patchLocale({defaultLocale});setLanguage(defaultLocale);onPreview({contentLocale:defaultLocale});}}/>
        <Select label="编辑内容语言" value={language} options={CONTENT_LANGUAGES} onChange={value=>{setLanguage(value);onPreview({contentLocale:value});}}/>
        <Select label="翻译节点" value={selected?.id??''} options={translatable.map(node=>[node.id,label(node)])} onChange={setTarget}/>
        {selected?.type==='Text'?<Field label="内容译文"><textarea aria-label="内容译文" value={override.text??''} placeholder={selected.props.text??''} onChange={e=>setTranslation('text',e.target.value)}/></Field>:selected&&<>{resourceFields(selected).map(key=><Field key={key} label={`语言${RESOURCE_FIELD_LABELS[key]}地址`}><input aria-label={`语言${RESOURCE_FIELD_LABELS[key]}地址`} value={override[key]??''} placeholder={selected.props[key]??''} onChange={e=>setTranslation(key,e.target.value)}/></Field>)}</>}
      </>}
      {tab==='assets'&&<>
        {assets.map(asset=>{const update=patch=>patchLocale({assets:assets.map(item=>item.id===asset.id?{...item,...patch}:item)});const fields=resourceFields(nodes.find(node=>node.id===asset.target));return <fieldset key={asset.id}><legend>资源变体</legend><Select label="资源节点" value={asset.target} options={[[ '', '选择素材节点' ],...nodes.filter(node=>resourceFields(node).length).map(node=>[node.id,label(node)])]} onChange={target=>{const allowed=resourceFields(nodes.find(node=>node.id===target));update({target,field:allowed.includes(asset.field)?asset.field:allowed[0]??''});}}/><div className="ne-settings-row"><Select label="资源语言" value={asset.language} options={[[ '', '全部语言' ],...CONTENT_LANGUAGES]} onChange={language=>update({language})}/><Select label="资源主题" value={asset.theme} options={[[ '', '全部主题' ],['light','浅色'],['dark','深色']]} onChange={theme=>update({theme})}/><Select label="资源平台" value={asset.platform} options={[[ '', '全部平台' ],['ios','iOS'],['android','Android']]} onChange={platform=>update({platform})}/><Select label="资源字段" value={asset.field} options={[...(!fields.includes(asset.field)?[[asset.field??'','请选择适用字段']]:[]),...fields.map(key=>[key,RESOURCE_FIELD_LABELS[key]])]} onChange={field=>update({field})}/></div><Field label="变体素材地址"><input aria-label="变体素材地址" value={asset.src} onChange={e=>update({src:e.target.value})}/></Field><Remove label="删除资源变体" onClick={()=>patchLocale({assets:assets.filter(item=>item.id!==asset.id)})}/></fieldset>;})}
        <button type="button" className="secondary" onClick={()=>patchLocale({assets:[...assets,{id:uid(),target:'',language:'',theme:'',platform:'',field:'src',src:''}]})}><Plus size={15}/>添加资源变体</button>
      </>}
    </div><footer><button type="button" className="primary" onClick={onClose}>完成</button></footer>
  </section></div>;
}
