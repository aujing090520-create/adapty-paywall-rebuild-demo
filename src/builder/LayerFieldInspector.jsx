import React, { useLayoutEffect, useState } from 'react';
import { ArrowLeft, Upload, RotateCcw } from 'lucide-react';
import { TYPE_NAMES, writeLayerField } from './layerModel.js';
import { HT_PRODUCT_DESIGN_DEFAULTS } from '../products/productStyleModel.js';

export default function LayerFieldInspector({ entry: layer, owner, onChange, onParent }) {
  const entry = { ...layer, type: layer.controlType ?? layer.type };
  const [error, setError] = useState('');
  const [observedStyle, setObservedStyle] = useState({ fontSize: 14, color: '#161616' });
  useLayoutEffect(() => {
    if (!entry.productPart) return;
    const card = [...document.querySelectorAll('[data-product-card]')].find((element) => element.dataset.productNodeId === owner.id && Number(element.dataset.productIndex) === entry.rowIndex);
    const element = card?.querySelector(`[data-inspector-area="product-${entry.productPart}"]`);
    if (!element) return;
    const style = getComputedStyle(element.querySelector('strong') ?? element);
    const scale = HT_PRODUCT_DESIGN_DEFAULTS[owner.config?.productTemplate] ? (card.closest('.ht-paywall')?.clientWidth ?? 390) / 390 : 1;
    const rgb = style.color.match(/\d+/g);
    setObservedStyle({ fontSize: Math.round(parseFloat(style.fontSize) / scale * 10) / 10, color: rgb ? '#' + rgb.slice(0, 3).map((value) => Number(value).toString(16).padStart(2, '0')).join('') : '#161616' });
  }, [entry.id, owner.config]);
  const currentStyle = owner.config?.packagePartStyles?.[entry.rowIndex]?.[entry.productPart] ?? {};
  const patchStyle = (key, value) => {
    const styles = owner.config?.packagePartStyles ?? {};
    onChange(owner.id, { config: { ...owner.config, packagePartStyles: { ...styles, [entry.rowIndex]: { ...styles[entry.rowIndex], [entry.productPart]: { ...currentStyle, [key]: value } } } } });
  };
  const commit = (value) => onChange(owner.id, writeLayerField(owner, entry.binding, value));
  const iconOptions = entry.iconOptions ?? (owner.type === 'Timeline' ? [['number', '序号'], ['lock', '锁'], ['bell', '铃铛'], ['star', '星星']] : null);
  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 10 * 1024 * 1024) { setError('请选择不超过 10MB 的 PNG、JPG、WebP 或 GIF 图片'); return; }
    const reader = new FileReader();
    reader.onload = () => { commit(reader.result); setError(''); };
    reader.onerror = () => setError('图片读取失败');
    reader.readAsDataURL(file);
  };
  return <section className="layer-inspector">
    <button type="button" className="layer-parent" onClick={onParent}><ArrowLeft size={15} />{owner.label || TYPE_NAMES[owner.type] || owner.type}</button>
    <h2>{entry.role || TYPE_NAMES[entry.type] || entry.type}</h2>
    {entry.productPart && <button type="button" className="layer-parent" title="恢复该文字样式" aria-label="恢复该文字样式" disabled={!Object.keys(currentStyle).length} onClick={() => { const styles = owner.config?.packagePartStyles ?? {}; const next = { ...styles[entry.rowIndex] }; delete next[entry.productPart]; onChange(owner.id, { config: { ...owner.config, packagePartStyles: { ...styles, [entry.rowIndex]: next } } }); }}><RotateCcw size={15} /></button>}
    {entry.binding?.readOnly ? <><label>商品字段<input value={entry.value ?? ''} readOnly /></label><span className="layer-binding">SKU 绑定</span></> : entry.type === 'Image' ? <><label className="layer-upload">{entry.value ? <img src={entry.value} alt="当前图片" /> : <Upload size={24} />}<span>替换图片</span><input aria-label="替换图片" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => upload(event.target.files?.[0])} /></label><label>图片地址<input value={entry.value ?? ''} onChange={(event) => commit(event.target.value)} /></label></> : entry.type === 'Rating' ? <label>评分<input type="number" min="0" max="5" step="0.1" value={entry.value ?? 5} onChange={(event) => commit(Math.max(0, Math.min(5, Number(event.target.value))))} /></label> : entry.type === 'Icon' && iconOptions ? <label>图标<select value={entry.value ?? iconOptions[0][0]} onChange={(event) => commit(event.target.value)}>{iconOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : <label>{entry.type === 'URL' ? '链接地址' : entry.type === 'Icon' ? '图标' : entry.type === 'Timer Value' ? '初始时间' : '文字内容'}<textarea value={entry.value ?? ''} onChange={(event) => commit(event.target.value)} /></label>}
    {error && <p role="alert">{error}</p>}
    {entry.productPart && <><label>字号<input aria-label="当前文字字号" type="number" min="8" max="64" step="1" value={currentStyle.fontSize ?? observedStyle.fontSize} onChange={(event) => patchStyle('fontSize', Math.max(8, Math.min(64, Number(event.target.value) || 8)))} /></label><label>颜色<input aria-label="当前文字颜色" type="color" value={currentStyle.color ?? observedStyle.color} onChange={(event) => patchStyle('color', event.target.value)} /></label></>}
    <button type="button" className="secondary" onClick={onParent}>组件样式与布局</button>
  </section>;
}
