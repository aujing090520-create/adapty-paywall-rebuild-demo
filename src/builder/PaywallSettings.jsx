import React from 'react';
import { exitOfferTarget } from './exitOffers.js';

export default function PaywallSettings({ document, offerings, currentPaywallId, onChange, surfaces = [], onCreate, onEdit }) {
  const id = document.settings?.exitOfferOfferingId ?? '';
  const target = exitOfferTarget(document, offerings, currentPaywallId);
  const missing = id && !offerings.some((offering) => offering.id === id);
  return <section className="ne-paywall-settings" aria-label="付费墙设置">
    <h3>退出优惠</h3>
    <label className="ne-field"><span>退出优惠 Offering</span><select aria-label="退出优惠 Offering" value={id} onChange={(event) => event.target.value.startsWith('surface:') ? onCreate?.(event.target.value.slice(8)) : onChange({ ...document.settings, exitOfferOfferingId: event.target.value })}>
      <option value="">不展示退出优惠</option>
      {missing && <option value={id} disabled>已绑定的 Offering 不可用</option>}
      {onCreate && surfaces.map((surface) => <option key={`surface:${surface.id}`} value={`surface:${surface.id}`}>使用当前弹层 · {surface.name}</option>)}
      {offerings.map((offering) => <option key={offering.id} value={offering.id} disabled={!offering.packageCount}>{offering.name}{!offering.packageCount ? '（未配置商品）' : ''}</option>)}
    </select></label>
    <div className="ne-exit-actions">{onCreate && <button type="button" className="secondary" onClick={() => onCreate()}>新建退出优惠</button>}{offerings.some((offering) => offering.id === id) && onEdit && <button type="button" className="secondary" onClick={onEdit}>编辑退出优惠</button>}</div>
    {target && <dl><dt>付费墙</dt><dd>{target.name}</dd><dt>商品数量</dt><dd>{target.packageCount}</dd></dl>}
    {id && !target && <p className="ne-error" role="alert">退出优惠不可用，请重新选择已保存且包含商品的付费墙。</p>}
  </section>;
}
