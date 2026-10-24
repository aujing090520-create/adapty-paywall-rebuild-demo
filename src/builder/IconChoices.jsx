import React,{useEffect,useMemo,useState} from 'react';
import catalog from './tablerCatalog.json';
import TablerGlyph from './TablerGlyph.jsx';
import {iconAliases as aliases,iconLabel} from './iconLabels.js';

const choices=catalog.icons.flatMap(([name,styles])=>[['outline',1],['filled',2]].filter(([,bit])=>styles&bit).map(([variant])=>({id:`tabler:${variant}:${name}`,label:iconLabel(`tabler:${variant}:${name}`),search:[name,aliases[name]??'',variant==='filled'?'填充':'线框'].join(' ').toLowerCase()})));
export default function IconChoices({query,value,activeIndex,onChoose,onResults,listId}){
  const [limit,setLimit]=useState(60);
  const results=useMemo(()=>{const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return choices.filter((choice)=>terms.every((term)=>choice.search.includes(term)));},[query]);
  useEffect(()=>{setLimit(60);onResults(results);},[results,onResults]);
  useEffect(()=>{if(activeIndex>=limit)setLimit(activeIndex+20);},[activeIndex,limit]);
  useEffect(()=>{document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({block:'nearest'});},[activeIndex,listId]);
  return <div id={listId} className="rc-icon-options" role="listbox" aria-label="图标库" onScroll={(event)=>{const e=event.currentTarget;if(e.scrollTop+e.clientHeight>=e.scrollHeight-20)setLimit((current)=>Math.min(results.length,current+60));}}>{results.slice(0,limit).map((choice,index)=><button type="button" role="option" id={`${listId}-${index}`} key={choice.id} data-icon-choice={choice.id} aria-label={choice.label} title={choice.label} aria-selected={choice.id===value} className={index===activeIndex?'active':''} onMouseDown={(event)=>event.preventDefault()} onClick={()=>onChoose(choice.id)}><TablerGlyph icon={choice.id} width={24} height={24}/></button>)}{!results.length&&<div className="rc-icon-empty">没有匹配图标</div>}</div>;
}
