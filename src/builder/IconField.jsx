import React,{useCallback,useId,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {iconLabel} from './iconLabels.js';
const IconChoices=React.lazy(()=>import('./IconChoices.jsx'));

export default function IconField({value,onChange,legacyNames}){
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),[results,setResults]=useState([]);
  const ref=useRef(null),listId=useId();
  const choose=(id)=>{onChange(id);setOpen(false);setQuery('');};
  const onResults=useCallback((items)=>setResults(items),[]);
  const display=iconLabel(value,legacyNames);
  const onKeyDown=(event)=>{
    if(event.key==='Escape'){setOpen(false);event.preventDefault();return;}
    if(['ArrowDown','ArrowUp'].includes(event.key)||open&&!query&&['ArrowLeft','ArrowRight'].includes(event.key)){
      event.preventDefault();setOpen(true);
      const list=ref.current?.querySelector('[role="listbox"]');
      const columns=list?Math.max(1,getComputedStyle(list).gridTemplateColumns.split(' ').length):6;
      const step={ArrowDown:columns,ArrowUp:-columns,ArrowLeft:-1,ArrowRight:1}[event.key];
      setActive((current)=>open?Math.max(0,Math.min(results.length-1,current+step)):0);
    }
    if(event.key==='Enter'&&open&&results[active]){event.preventDefault();choose(results[active].id);}
  };
  return <div className="rc-icon-field" ref={ref} onBlur={(event)=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}><label className="rc-field"><span>类型</span><div className="rc-icon-search"><input role="combobox" aria-label="类型" aria-expanded={open} aria-controls={open?listId:undefined} aria-activedescendant={open&&results[active]?`${listId}-${active}`:undefined} aria-autocomplete="list" value={open?query:display} placeholder="搜索图标" onFocus={()=>{setOpen(true);setQuery('');setActive(0);}} onChange={(event)=>{setOpen(true);setQuery(event.target.value);setActive(0);}} onKeyDown={onKeyDown}/><button type="button" title="选择图标" aria-label="选择图标" onMouseDown={(event)=>event.preventDefault()} onClick={()=>{setOpen(!open);setQuery('');setActive(0);}}><ChevronDown size={16}/></button></div></label>{open&&<React.Suspense fallback={<div className="rc-icon-empty">加载中</div>}><IconChoices query={query} value={value} activeIndex={active} onChoose={choose} onResults={onResults} listId={listId}/></React.Suspense>}</div>;
}
