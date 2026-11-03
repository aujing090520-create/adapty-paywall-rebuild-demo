import React,{useEffect,useRef,useState} from 'react';
import {ChevronDown,ChevronUp,Gift,Info,X} from 'lucide-react';
import {safeTextLink} from './richTextModel.js';

export default function ProductGiftsPreview({attributes,props,items,packageId,editing,safeMediaSource}) {
  const [expanded,setExpanded]=useState(props.initialExpanded!==false),[detail,setDetail]=useState(null),list=useRef(null);
  useEffect(()=>{setExpanded(props.initialExpanded!==false);setDetail(null);if(list.current)list.current.scrollLeft=0;},[packageId,props.initialExpanded]);
  const open=!props.collapsible||expanded;
  return <section {...attributes} data-gift-package={packageId} aria-label="商品礼包" style={{...attributes.style,display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
    <div className="nc-gifts-heading">
      <span className="nc-gifts-title">{props.title}</span>
      {props.description&&<button type="button" aria-label="礼包说明" title="礼包说明" onClick={event=>{if(editing)return;event.stopPropagation();setDetail(detail?.id==='$info'?null:{id:'$info',title:props.title,description:props.description});}}><Info size={15}/></button>}
      {props.collapsible&&<button type="button" className="nc-gifts-toggle" aria-label={open?'收起商品礼包':'展开商品礼包'} aria-expanded={open} onClick={event=>{if(editing)return;event.stopPropagation();setExpanded(!open);setDetail(null);}}>{open?<ChevronUp size={22}/>:<ChevronDown size={22}/>}</button>}
    </div>
    {open&&<div ref={list} className="nc-gifts-list" style={{gap:props.cardGap??10}}>
      {items.map(item=><button type="button" key={item.id} className="nc-gift-card" aria-label={item.title} onClick={event=>{if(editing)return;event.stopPropagation();setDetail(detail?.id===item.id?null:item);}} style={{width:props.cardWidth??190,minHeight:props.cardHeight??68,borderRadius:props.cardRadius??18,background:props.cardBackground??'#ffffff',color:props.cardColor??'#171717',fontSize:props.cardFontSize??16}}>
        {safeMediaSource(item.image)?<img src={safeMediaSource(item.image)} alt="" style={{width:props.imageSize??40,height:props.imageSize??40}}/>:<Gift aria-hidden="true" size={props.imageSize??40} color="#ed66bf"/>}<span>{item.title}</span>
      </button>)}
    </div>}
    {detail&&<div className="nc-gifts-detail" role="region" aria-label="礼包详情"><button type="button" aria-label="关闭礼包详情" onClick={event=>{event.stopPropagation();setDetail(null);}}><X size={16}/></button><strong>{detail.title}</strong>{detail.description&&<p>{detail.description}</p>}{safeTextLink(detail.url)&&<a href={safeTextLink(detail.url)} target="_blank" rel="noreferrer" onClick={event=>event.stopPropagation()}>查看详情</a>}</div>}
  </section>;
}
