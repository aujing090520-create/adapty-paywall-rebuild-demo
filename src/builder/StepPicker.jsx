import React, { useState } from 'react';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { importComponentDocument } from './componentDocument.js';
import { workflowContext } from './workflow.js';
import { exitContentChoices } from './exitOffers.js';

export default function StepPicker({ offerings, onBack, onAdd, purpose = 'step', onPurposeChange, currentDocument, surfaces = [], initialSurface, onUseSurface, triggerSource }) {
  const isExit = purpose === 'exit';
  const [tab, setTab] = useState(initialSurface ? 'saved' : 'templates');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(initialSurface ? { name: initialSurface.name, document: currentDocument, nodeId: initialSurface.id, current: true } : null);
  const source = selected?.document;
  const choices = source ? isExit ? exitContentChoices(source) : workflowContext(source).steps : [];
  const choose = (document, nodeId) => {
    if (!isExit) return onAdd(document, nodeId);
    setSelected((value) => ({ ...value, document, nodeId }));
  };
  const create = () => selected?.current ? onUseSurface?.(selected.nodeId) : onAdd(selected?.document, selected?.nodeId);
  return <div className="ne-step-picker">
    <header><button className="ne-icon" title="返回图层" aria-label="返回图层" onClick={onBack}><ArrowLeft size={17}/></button><strong>{isExit ? '创建退出挽留' : '创建流程'}</strong></header>
    {onPurposeChange && <div className="ne-step-tabs" role="tablist" aria-label="流程触发方式">{[['step', '下一步骤'], ['exit', '关闭后挽留']].map(([id, label]) => <button type="button" role="tab" key={id} aria-selected={purpose === id} onClick={() => onPurposeChange(id)}>{label}</button>)}</div>}
    {isExit && <div className="ne-creation-trigger" aria-label="创建触发关系"><span>触发事件</span><strong>关闭「{triggerSource?.name ?? '最终购买页面'}」</strong></div>}
    <button type="button" className="ne-blank-step" aria-pressed={Boolean(isExit && selected?.blank)} onClick={() => isExit ? setSelected({ blank: true }) : onAdd()}><Plus size={18}/>{isExit ? '空白弹窗' : '空白屏幕'}</button>
    <div className="ne-step-tabs" role="tablist" aria-label={isExit ? '退出优惠来源' : '步骤来源'}>{[['templates', '模板'], ['saved', isExit ? '已有内容' : '已保存付费墙']].map(([id, label]) => <button type="button" role="tab" key={id} aria-selected={tab === id} onClick={() => { setTab(id); setSelected(null); }}>{label}</button>)}</div>
    <label className="ne-picker-search"><Search size={15}/><input aria-label="搜索步骤来源" placeholder="搜索" value={query} onChange={(event)=>setQuery(event.target.value)}/></label>
    {source && !selected.current ? <div className="ne-step-screens"><button className="ne-step-back" onClick={() => setSelected(null)}>全部来源</button><strong>{selected.name}</strong>{choices.map((node) => <button type="button" key={node.id} aria-pressed={isExit ? selected.nodeId === node.id : undefined} onClick={() => choose(source, node.id)}><span>{node.name}</span>{isExit && <small>{node.type === 'BottomSheet' ? '弹窗' : '屏幕'}</small>}</button>)}</div> : <>
      {isExit && tab === 'saved' && surfaces.length > 0 && <div className="ne-step-screens"><strong>当前页面弹层</strong>{surfaces.filter((node) => node.name.toLowerCase().includes(query.toLowerCase())).map((node) => <button type="button" key={node.id} aria-pressed={selected?.current && selected.nodeId === node.id} onClick={() => setSelected({ name: node.name, document: currentDocument, nodeId: node.id, current: true })}>{node.name}</button>)}</div>}
      <div className="ne-step-sources">{tab === 'templates' ? templates.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())).map((item) => <button type="button" key={item.id} onClick={() => { const document = importComponentDocument(createBuilderNodes(item.id), item); setSelected({ document, name: item.title }); }}>{item.asset && <img src={item.asset} alt="" loading="lazy"/>}<span>{item.title}</span></button>) : offerings.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).map((item) => <button type="button" key={item.id} onClick={() => setSelected({ document: item.document, name: item.name })}><span>{item.name}</span></button>)}</div>
      {tab === 'saved' && !offerings.length && (!isExit || !surfaces.length) && <p className="ne-picker-empty">暂无已有内容</p>}
    </>}
    {isExit && <footer className="ne-creation-footer"><span>{selected?.blank ? '空白弹窗' : choices.find((node) => node.id === selected?.nodeId)?.name ?? '尚未选择内容'}</span><button type="button" className="primary" disabled={!selected?.blank && !selected?.nodeId} onClick={create}>创建退出优惠</button></footer>}
  </div>;
}
