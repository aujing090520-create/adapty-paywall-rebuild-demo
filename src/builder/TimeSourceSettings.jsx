import React,{useEffect,useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {TIME_SCOPES,TIME_STATES,timeSources,sourceKeyError,removeTimeSource,timeSourceReferences} from './businessTime.js';
import {utcDateTimeInput} from './propertyModel.js';

function DataKey({source,sources,onChange}) {
  const [draft,setDraft]=useState(source.key);
  useEffect(()=>setDraft(source.key),[source.key]);
  const error=sourceKeyError(sources,source.id,draft);
  return <label className="rc-field"><span>接口数据键</span><input aria-label="接口数据键" value={draft} aria-invalid={Boolean(error)} onChange={event=>setDraft(event.target.value)} onBlur={()=>{if(!error)onChange(draft);}}/>{error&&<small role="alert">{error}</small>}</label>;
}

export default function TimeSourceSettings({document,onChange}) {
  const sources=timeSources(document);
  const patch=(id,values)=>onChange({...document,business:{...document.business,timeSources:sources.map(source=>source.id===id?{...source,...values}:source)}});
  const setExpiry=(source,value)=>patch(source.id,{sample:{...source.sample,expiresAt:value?`${value}Z`:''}});
  return <section aria-label="业务时间源配置">
    <h3>业务时间源</h3><div role="status">数据环境：Demo 样例，未连接真实业务接口</div>
    {sources.map(source=><fieldset key={source.id}><legend>{source.name||'未命名时间源'}</legend>
      <label className="rc-field"><span>时间源名称</span><input aria-label="时间源名称" value={source.name} onChange={event=>patch(source.id,{name:event.target.value})}/></label>
      <DataKey source={source} sources={sources} onChange={key=>patch(source.id,{key})}/>
      <label className="rc-field"><span>适用范围</span><select aria-label="适用范围" value={source.scope} onChange={event=>patch(source.id,{scope:event.target.value})}>{TIME_SCOPES.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
      <label className="rc-field"><span>样例业务状态</span><select aria-label="样例业务状态" value={source.sample?.status??'unavailable'} onChange={event=>patch(source.id,{sample:{...source.sample,status:event.target.value}})}>{TIME_STATES.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
      <label className="rc-field"><span>样例到期时间（UTC）</span><input aria-label="样例到期时间（UTC）" type="datetime-local" step="1" value={utcDateTimeInput(source.sample?.expiresAt)} onInput={event=>setExpiry(source,event.currentTarget.value)} onChange={event=>setExpiry(source,event.target.value)}/></label>
      <button type="button" className="ne-icon danger" aria-label="删除时间源" title={timeSourceReferences(document,source.id).length?'已被倒计时或联动规则引用':'删除时间源'} disabled={Boolean(timeSourceReferences(document,source.id).length)} onClick={()=>onChange(removeTimeSource(document,source.id))}><Trash2 size={16}/></button>
    </fieldset>)}
    <button type="button" className="secondary" onClick={()=>{let index=1;while(sources.some(source=>source.key===`campaign_${index}`))index++;onChange({...document,business:{...document.business,timeSources:[...sources,{id:crypto.randomUUID(),name:`活动时间源 ${index}`,key:`campaign_${index}`,scope:'campaign',sample:{status:'active',expiresAt:new Date(Date.now()+3*86400000).toISOString()}}]}});}}><Plus size={15}/>添加时间源</button>
  </section>;
}
