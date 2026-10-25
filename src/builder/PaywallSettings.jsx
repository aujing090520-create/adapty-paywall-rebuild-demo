import React from 'react';
import { exitOfferSource, exitOfferTarget, exitOfferId } from './exitOffers.js';
import { closeTargetId } from './closeTargets.js';
import { workflowContext, setInitialStep } from './workflow.js';

export default function PaywallSettings({ document, offerings = [], currentPaywallId, onDocumentChange, onNew, onEdit, sourceId, onSourceChange, onChoose, onUnlink }) {
  const workflow = workflowContext(document);
  const source = workflow.steps.find((page) => page.id === sourceId) ?? exitOfferSource(document);
  const target = exitOfferTarget(document, offerings, currentPaywallId, source?.id);
  const configured = closeTargetId(document, source?.id) || exitOfferId(document, source?.id);
  return <section className="ne-paywall-settings" aria-label="付费墙设置">
    {workflow.flow && onDocumentChange && <label className="ne-field"><span>初始页面</span><select aria-label="初始页面" value={workflow.initial?.id ?? ''} onChange={(event) => onDocumentChange(setInitialStep(document, event.target.value))}>{workflow.steps.filter((page) => !page.props.hidden).map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}
    <h3>关闭后显示</h3><span className="ne-extension-label">Demo 扩展能力</span>
    {onSourceChange && workflow.steps.length > 1 && <label className="ne-field"><span>关闭哪个页面</span><select aria-label="触发屏幕" value={source?.id ?? ''} onChange={(event) => onSourceChange(event.target.value)}>{workflow.steps.filter((page) => !page.props.hidden).map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label>}
    <dl aria-label="关闭后显示规则"><dt>触发事件</dt><dd>关闭「{source?.name ?? '当前页面'}」</dd><dt>显示内容</dt><dd>{target?.name ?? '未关联，关闭后直接离开'}</dd></dl>
    {configured&&!target&&<p className="ne-error" role="alert">关联内容已删除、隐藏或不可用，请重新选择。</p>}
    <div className="ne-exit-actions"><button type="button" className="secondary" onClick={onChoose}>{target ? '更换关联内容' : '选择已有内容'}</button>{!target&&onNew && <button type="button" className="secondary" onClick={onNew}>新建挽留弹窗</button>}{target && onEdit && <button type="button" className="secondary" onClick={onEdit}>编辑关联内容</button>}{configured && <button type="button" className="secondary danger-outline" onClick={onUnlink}>解除关联</button>}</div>
  </section>;
}
