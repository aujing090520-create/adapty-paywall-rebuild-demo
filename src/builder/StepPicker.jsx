import React, { useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { importComponentDocument } from './componentDocument.js';
import { workflowContext } from './workflow.js';

export default function StepPicker({ offerings, onBack, onAdd }) {
  const [tab,setTab]=useState('templates'),[query,setQuery]=useState(''),[selected,setSelected]=useState(null);
  const source=selected?.document;
  return <div className="ne-step-picker">
    <header><button className="ne-icon" title="返回图层" aria-label="返回图层" onClick={onBack}><ArrowLeft size={17}/></button><strong>添加步骤</strong></header>
    <button type="button" className="ne-blank-step" onClick={()=>onAdd()}><Plus size={18}/>空白屏幕</button>
    <div className="ne-step-tabs" role="tablist" aria-label="步骤来源">{[['templates','模板'],['saved','已保存付费墙']].map(([id,label])=><button type="button" role="tab" key={id} aria-selected={tab===id} onClick={()=>{setTab(id);setSelected(null);}}>{label}</button>)}</div>
    <label className="ne-picker-search"><Search size={15}/><input aria-label="搜索步骤来源" placeholder="搜索" value={query} onChange={(event)=>setQuery(event.target.value)}/></label>
    {source?<div className="ne-step-screens"><button className="ne-step-back" onClick={()=>setSelected(null)}>全部来源</button><strong>{selected.name}</strong>{workflowContext(source).steps.map((screen)=><button type="button" key={screen.id} onClick={()=>onAdd(source,screen.id)}>{screen.name}</button>)}</div>:<div className="ne-step-sources">{tab==='templates'?templates.filter((item)=>item.title.toLowerCase().includes(query.toLowerCase())).map((item)=><button type="button" key={item.id} onClick={()=>{const document=importComponentDocument(createBuilderNodes(item.id),item);setSelected({document,name:item.title});}}>{item.asset&&<img src={item.asset} alt="" loading="lazy"/>}<span>{item.title}</span></button>):offerings.filter((item)=>item.name.toLowerCase().includes(query.toLowerCase())).map((item)=><button type="button" key={item.id} onClick={()=>setSelected({document:item.document,name:item.name})}><span>{item.name}</span></button>)}</div>}
  </div>;
}
