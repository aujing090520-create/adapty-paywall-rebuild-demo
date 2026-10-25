import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, PanelTop, Smartphone, Check } from 'lucide-react';
import { canvasCloseTargets } from './closeTargets.js';
import { exitContentChoices, exitOfferTarget } from './exitOffers.js';
import { workflowContext } from './workflow.js';
import { indexDocument } from './componentDocument.js';

export default function CloseTargetPicker({ document, source, offerings = [], boundOfferings = [], initialId, onBack, onCreate, onBind, onBindSaved, onImport, onSourceChange }) {
  const [tab, setTab] = useState('canvas'), [query, setQuery] = useState('');
  const [selected, setSelected] = useState(initialId ? { id: initialId, local: true } : null);
  const [library, setLibrary] = useState(null);
  const targets = canvasCloseTargets(document, source.id);
  const current = exitOfferTarget(document, offerings, undefined, source.id);
  const match = (name) => name.toLowerCase().includes(query.toLowerCase());
  const choose = (item) => setSelected(item);
  const localNode = targets.find((node) => node.id === selected?.id);
  const apply = () => selected?.local ? onBind(selected.id) : selected?.existing ? onBindSaved(selected.owner) : selected?.source && onImport(selected.source, selected.id);
  const choice = (node, extra) => <button type="button" key={`${extra.owner ?? 'main'}:${node.id}`} disabled={node.props.hidden} aria-pressed={selected?.id === node.id && selected?.owner === extra.owner} className="ne-target-choice" onClick={() => choose({ id: node.id, name: node.name, ...extra })}>{node.type === 'BottomSheet' ? <PanelTop size={18}/> : <Smartphone size={18}/>}<span>{node.name}<small>{node.props.hidden ? '已隐藏' : node.type === 'BottomSheet' ? '弹窗' : '页面'}</small></span>{selected?.id === node.id && <Check size={15}/>}</button>;
  return <div className="ne-step-picker ne-close-picker">
    <header><button type="button" className="ne-icon" aria-label="返回图层" title="返回图层" onClick={onBack}><ArrowLeft size={17}/></button><strong>关闭后显示</strong></header>
    <div className="ne-close-source"><span>关闭「{source.name}」后</span><strong>{selected?.name ?? localNode?.name ?? '选择要显示的弹窗或页面'}</strong></div>
    {onSourceChange&&workflowContext(document).steps.length>1&&<label className="ne-field ne-close-source"><span>关闭哪个页面</span><select aria-label="关闭哪个页面" value={source.id} onChange={(event)=>{setSelected(null);onSourceChange(event.target.value);}}>{workflowContext(document).steps.filter((page)=>!page.props.hidden).map((page)=><option value={page.id} key={page.id}>{page.name}</option>)}</select></label>}
    <button type="button" className="ne-blank-step" onClick={() => onCreate(false)}><Plus size={18}/>{current?'新建并更换关联':'新建挽留弹窗'}</button>
    <div className="ne-step-tabs" role="tablist" aria-label="关闭目标来源">{[['canvas','当前画布'],['templates','弹窗样式'],['saved','已保存内容']].map(([id, name]) => <button type="button" role="tab" key={id} aria-selected={tab === id} onClick={() => { setTab(id); setLibrary(null); setSelected(null); }}>{name}</button>)}</div>
    {tab !== 'templates' && <label className="ne-picker-search"><Search size={15}/><input aria-label="搜索关闭目标" placeholder="搜索名称" value={query} onChange={(event) => setQuery(event.target.value)}/></label>}
    {tab === 'canvas' && <div className="ne-step-screens">
      {targets.filter((node) => match(node.name)).map((node) => choice(node, { local: true }))}
      {boundOfferings.filter((item) => match(item.name)).map((item) => { const node = indexDocument(item.document).nodes.get(item.document.settings?.presentationSurfaceId) ?? item.document.root; return choice({ ...node, name: item.name }, { owner: item.id, existing: true }); })}
      {!targets.length && !boundOfferings.length && <p className="ne-picker-empty">当前画布还没有其他页面或弹窗</p>}
    </div>}
    {tab === 'templates' && <div className="ne-step-screens"><button type="button" className="ne-modal-style" onClick={() => onCreate(false)}><img src="/ht-retention-gift.png" alt="优惠礼盒"/><span>居中挽留弹窗</span></button><button type="button" onClick={() => onCreate(true)}><Plus size={17}/>空白弹窗</button></div>}
    {tab === 'saved' && <div className="ne-step-screens"><strong>复制到当前画布</strong>{library ? <><button type="button" className="ne-step-back" onClick={() => { setLibrary(null); setSelected(null); }}>返回已保存内容</button>{exitContentChoices(library.document).filter((node) => match(node.name)).map((node) => choice(node, { source: library.document, owner: library.id }))}</> : <>{offerings.filter((item) => match(item.name)).map((item) => <button type="button" className="ne-target-choice" key={item.id} onClick={() => { setLibrary(item); setSelected(null); }}><PanelTop size={17}/><span>{item.name}<small>{item.id.startsWith('local-exit-') ? '历史弹窗' : '已保存付费墙'} · {item.id.slice(-6)}</small></span></button>)}{!offerings.length && <p className="ne-picker-empty">暂无已保存内容</p>}</>}</div>}
    <footer className="ne-creation-footer"><span>{selected?.name ?? localNode?.name ?? '尚未选择'}</span><button type="button" className="primary" disabled={!selected?.id} onClick={apply}>{selected?.source ? '复制并关联' : current?'更换关联':'关联此内容'}</button></footer>
  </div>;
}
