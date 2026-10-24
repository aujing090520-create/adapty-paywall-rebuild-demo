import React,{useEffect,useMemo,useState} from 'react';
import catalog from './tablerCatalog.json';
import TablerGlyph from './TablerGlyph.jsx';

const aliases={check:'勾选',lock:'锁',icons:'图形图标',star:'星标',heart:'爱心',bell:'铃铛',moon:'月亮',gift:'礼物',clock:'时钟',users:'用户组',flower:'花朵',map:'地图',activity:'活动',ticket:'票券',download:'下载',archive:'归档',shirt:'衣服',scan:'扫描',home:'首页',search:'搜索',settings:'设置',x:'关闭',plus:'添加',minus:'减少',circle:'圆形',square:'方形','circle-check':'圆形勾选','circle-x':'圆形关闭','arrow-right':'向右箭头','arrow-left':'向左箭头','arrow-up':'向上箭头','arrow-down':'向下箭头',crown:'皇冠',diamond:'钻石',award:'奖章',trophy:'奖杯',world:'地球',language:'语言',book:'书本',message:'消息',phone:'电话',camera:'相机',photo:'图片',video:'视频',player:'播放',volume:'音量',microphone:'麦克风'};
const choices=catalog.icons.flatMap(([name,styles])=>[['outline',1],['filled',2]].filter(([,bit])=>styles&bit).map(([variant])=>({id:`tabler:${variant}:${name}`,label:`${variant==='filled'?'填充':'线框'} · ${aliases[name]??name}`,search:[name,aliases[name]??'',variant==='filled'?'填充':'线框'].join(' ').toLowerCase()})));
export default function IconChoices({query,value,activeIndex,onChoose,onResults,listId}){
  const [limit,setLimit]=useState(60);
  const results=useMemo(()=>{const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return choices.filter((choice)=>terms.every((term)=>choice.search.includes(term)));},[query]);
  useEffect(()=>{setLimit(60);onResults(results);},[results,onResults]);
  useEffect(()=>{if(activeIndex>=limit)setLimit(activeIndex+20);},[activeIndex,limit]);
  useEffect(()=>{document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView?.({block:'nearest'});},[activeIndex,listId]);
  return <div id={listId} className="rc-icon-options" role="listbox" aria-label="图标库" onScroll={(event)=>{const e=event.currentTarget;if(e.scrollTop+e.clientHeight>=e.scrollHeight-20)setLimit((current)=>Math.min(results.length,current+60));}}>{results.slice(0,limit).map((choice,index)=><button type="button" role="option" id={`${listId}-${index}`} key={choice.id} data-icon-choice={choice.id} aria-selected={choice.id===value} className={index===activeIndex?'active':''} onMouseDown={(event)=>event.preventDefault()} onClick={()=>onChoose(choice.id)}><TablerGlyph icon={choice.id} width={20} height={20}/><span>{choice.label}</span></button>)}{!results.length&&<div className="rc-icon-empty">没有匹配图标</div>}</div>;
}
