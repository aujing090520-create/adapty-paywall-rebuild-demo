import React, { useState } from 'react';
import { ArrowLeft, Blocks, ChevronRight, LayoutTemplate } from 'lucide-react';
import { PAYWALL_STYLE_TYPES, paywallMetadataError } from './paywallMetadata.js';

export default function CreatePaywall({ draft, setDraft, setView, setModal, onStartBlank }) {
  const [error, setError] = useState('');
  const patch = (next) => { setDraft((current) => ({ ...current, ...next })); setError(''); };
  const start = (method) => {
    const message = paywallMetadataError(draft);
    if (message) { setError(message); return; }
    if (method === 'template') setModal({ kind: 'templates' });
    else onStartBlank();
  };
  return <section className="create">
    <button className="back" onClick={() => setView('list')}><ArrowLeft size={18} />付费墙</button>
    <div className="create-header"><h1>创建付费墙</h1></div>
    <div className="create-layout">
      <div className="create-metadata" aria-label="样式信息">
        <label className="create-metadata-field"><span>paywall 样式类型<i aria-hidden="true">*</i></span><select aria-label="paywall 样式类型" required value={draft.styleType} onChange={(event) => patch({ styleType: event.target.value })}>{PAYWALL_STYLE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="create-metadata-field"><span>paywall 样式名称<i aria-hidden="true">*</i></span><input aria-label="paywall 样式名称" required maxLength={100} value={draft.name} aria-invalid={Boolean(error) && !draft.name.trim()} aria-describedby={error ? 'create-metadata-error' : undefined} onChange={(event) => patch({ name: event.target.value })} /></label>
        <div className="create-metadata-field"><span id="create-status-label">状态<i aria-hidden="true">*</i></span><button type="button" role="switch" className={`create-status-switch ${draft.enabled ? 'enabled' : ''}`} aria-labelledby="create-status-label" aria-checked={draft.enabled} onClick={() => patch({ enabled: !draft.enabled })}><i aria-hidden="true"/><span>{draft.enabled ? '启用' : '禁用'}</span></button></div>
        {error && <p id="create-metadata-error" className="create-metadata-error" role="alert">{error}</p>}
      </div>
      <aside className="create-methods" aria-label="选择创建方式">
        <h2>选择创建方式</h2>
        <button type="button" onClick={() => start('blank')}><Blocks size={22}/><span>从空白开始</span><ChevronRight size={18}/></button>
        <button type="button" onClick={() => start('template')}><LayoutTemplate size={22}/><span>选择模板</span><ChevronRight size={18}/></button>
      </aside>
    </div>
  </section>;
}
