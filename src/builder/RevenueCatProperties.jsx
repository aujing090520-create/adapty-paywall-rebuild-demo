import React from 'react';
import { ArrowRight, ArrowDown, Layers3, AlignLeft, AlignCenter, AlignRight, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical, SquareDashed, RectangleHorizontal, RectangleVertical, Plus, X, Settings2 } from 'lucide-react';
import { CONTAINER_TYPES } from './componentDocument.js';
import { selectedStyleKey, stateStyleProps, spacingModePatch, dimensionModePatch, imageMask, cornerModePatch, CORNER_KEYS, selectionOwner, sequencePages, BADGE_DEFAULTS, utcDateTimeInput, textPropertyPatch } from './propertyModel.js';
import { PRODUCT_TEXT_VARIABLES, TIMER_TEXT_VARIABLES } from './textVariables.js';
import {isGradient,pickerColor,pickerPaint} from './colorModel.js';
import IconField from './IconField.jsx';
import { TEXT_RULES, textRuleName, textRuleProps, textRulePatch } from './textRules.js';
const ColorPickerPopup=React.lazy(()=>import('./ColorPickerPopup.jsx'));
const RichTextEditor=React.lazy(()=>import('./RichTextEditor.jsx'));
const FontManager=React.lazy(()=>import('./FontManager.jsx'));
const FontContext=React.createContext({fonts:[]});

export function PropertySection({ title, children, optional = false, className = '' }) {
  const fields = React.Children.toArray(children);
  const toggle = optional ? fields.find((child) => React.isValidElement(child) && child.type === OptionalToggle) : null;
  return <section className={`rc-prop-section ${className}`}>
    <div className="rc-prop-heading"><strong>{title}</strong>{toggle}</div>
    <div className="rc-prop-body">{fields.filter((child) => child !== toggle)}</div>
  </section>;
}

function Field({ label, children, hint }) { return <label className="rc-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Select({ label, value, onChange, options, disabled = false }) { return <Field label={label}><select aria-label={label} value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [key, name] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{name}</option>; })}</select></Field>; }
function NumberField({ label, value, onChange, min = 0, max = 2000, unit = 'px', icon: Glyph, disabled = false }) {
  const [draft, setDraft] = React.useState(String(value ?? 0));
  React.useEffect(() => setDraft(String(value ?? 0)), [value]);
  return <Field label={label}><div className="rc-unit-input">{Glyph && <Glyph aria-hidden="true" size={16} />}<input aria-label={label} type="number" disabled={disabled} min={min} max={max} value={draft} onChange={(event) => { const raw = event.target.value; setDraft(raw); const next = Number(raw); if (raw !== '' && Number.isFinite(next) && next >= min && next <= max) onChange(next); }} onBlur={() => { const next = draft === '' || !Number.isFinite(Number(draft)) ? Number(value) || 0 : Number(draft); const result = Math.max(min, Math.min(max, next)); setDraft(String(result)); onChange(result); }} />{unit && <span>{unit}</span>}</div></Field>;
}
function ColorField({ label, value, onChange, opacity=100, onPaintChange, opacityReadOnly=false }) {
  const [draft, setDraft] = React.useState(value ?? 'transparent');
  const [anchor,setAnchor]=React.useState(null);
  const allowGradient=label.includes('背景')||label.endsWith('文字颜色')||label.endsWith('边框颜色');
  React.useEffect(() => setDraft(value ?? 'transparent'), [value]);
  const valid = draft.trim() !== '' && (typeof CSS === 'undefined' || CSS.supports(allowGradient ? 'background' : 'color', draft));
  const close=React.useCallback(()=>setAnchor(null),[]);
  return <><Field label={label}><div className="rc-color-input"><button type="button" className="rc-color-swatch" aria-label={`编辑${label}`} title={`编辑${label}`} aria-expanded={Boolean(anchor)} style={{background:pickerColor(value,opacity)}} onClick={(event)=>setAnchor(event.currentTarget.getBoundingClientRect())}/><input aria-label={`${label}值`} aria-invalid={!valid} title={valid ? undefined : '请输入有效颜色'} value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); if (next.trim() && (typeof CSS === 'undefined' || CSS.supports(allowGradient ? 'background' : 'color', next))) onChange(next); }} onBlur={() => { if (!valid) setDraft(value ?? 'transparent'); }} /></div>{!valid && <small role="alert">请输入有效颜色</small>}</Field>{anchor&&<React.Suspense fallback={null}><ColorPickerPopup label={label} value={pickerColor(value,opacity)} opacityReadOnly={opacityReadOnly&&!isGradient(value)} allowGradient={allowGradient} anchor={anchor} onClose={close} onChange={(next)=>{const paint=pickerPaint(next);if(!paint)return;if(onPaintChange)onPaintChange({...paint,opacity:opacityReadOnly?100:paint.opacity});else onChange(next);}}/></React.Suspense>}</>;
}
function PaintField({ label, property, opacityKey, p, patch, opacityReadOnly = false }) {
  const key = opacityKey ?? `${property}Opacity`;
  return <div className="rc-paint-field"><ColorField label={label} value={p[property]} opacity={p[key]??100} opacityReadOnly={opacityReadOnly} onPaintChange={({color,opacity})=>patch({[property]:color,[key]:opacity})} onChange={(value) => patch({ [property]: value,...(isGradient(value)?{[key]:100}:{}) })} /><NumberField label={`${label}不透明度`} value={isGradient(p[property])?100:p[key]??100} disabled={opacityReadOnly||isGradient(p[property])} max={100} unit="%" onChange={(value) => patch({ [key]: value })} /></div>;
}
function CornerField({ p, patch }) {
  return <div className="rc-corner-field">{p.radiusMode === 'individual' ? <div className="rc-four-values">{CORNER_KEYS.map((key, index) => <NumberField key={key} label={`圆角${['左上', '右上', '右下', '左下'][index]}`} value={p[key] ?? p.radius} onChange={(value) => patch({ [key]: value })} />)}</div> : <NumberField label="圆角" value={p.radius} onChange={(radius) => patch({ radius })} />}<button type="button" className="rc-spacing-toggle" aria-label={`圆角切换为${p.radiusMode === 'individual' ? '统一' : '四角'}配置`} title="切换圆角配置" onClick={() => patch(cornerModePatch(p))}><SquareDashed size={18} /></button></div>;
}
function SegmentedField({ label, value, onChange, options, icon = false }) { return <Field label={label}><div className={`rc-segmented ${icon ? 'rc-icon-segmented' : ''}`}>{options.map(([key, name, Glyph]) => <button type="button" key={key} className={String(value) === String(key) ? 'active' : ''} aria-label={name} aria-pressed={String(value) === String(key)} title={name} onClick={() => onChange(key)}>{icon && Glyph ? <Glyph size={21} strokeWidth={2.8} /> : name}</button>)}</div></Field>; }
function CheckboxField({label,checked,onChange,disabled=false}) { return <label className="rc-checkbox-field"><span>{label}</span><input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={(event)=>onChange(event.target.checked)}/></label>; }
function OptionalToggle({ enabled, onChange }) { return <button type="button" className={`rc-optional-toggle ${enabled ? 'active' : ''}`} aria-label={enabled ? '移除配置' : '添加配置'} title={enabled ? '移除配置' : '添加配置'} aria-pressed={enabled} onClick={() => onChange(!enabled)}>{enabled ? <X size={15}/> : <Plus size={15}/>}</button>; }
const typeNames = { check: '勾选', lock: '锁', star: '星标', bell: '铃铛', moon: '月亮', heart: '爱心', group: '用户组', clock: '时钟', gift: '礼物', arrow: '箭头', dumbbell: '哑铃', weight: '重量', running: '跑步', download: '下载', map: '地图', flower: '花朵', activity: '活动', ticket: '票券', noads: '无广告', blocks: '方块', archive: '归档', shirt: '衣服', seat: '座位', scan: '扫描', help: '帮助', access: '登录', number: '数字' };

function SizeField({ axis, label, p, patch, fixedOnly = false, allowConstraints = true }) {
  const [adding, setAdding] = React.useState(false);
  const name = axis[0].toUpperCase() + axis.slice(1), mode = p[`${axis}Mode`];
  return <div className="rc-size-field">
    {fixedOnly ? <NumberField label={label} value={p[axis]} onChange={(value) => patch({ [axis]: value, [`${axis}Mode`]: 'fixed' })} /> : <SegmentedField label={label} value={mode} options={[[ 'fit', '适应内容' ], [ 'fill', '填满' ], [ 'fixed', '固定' ]]} onChange={(value) => patch(dimensionModePatch(axis, value))} />}
    {!fixedOnly && mode === 'fixed' && <NumberField label={`固定${label}`} value={p[axis]} onChange={(value) => patch({ [axis]: value })} />}
    {!fixedOnly && allowConstraints && mode === 'fill' && <><button type="button" className="ne-icon" aria-label={`添加${label}约束`} title={`添加${label}约束`} aria-expanded={adding} onClick={() => setAdding(!adding)}><Plus size={15} /></button>{adding && <div role="menu" className="rc-limit-menu">{[['min', '最小'], ['max', '最大']].filter(([bound]) => !(p[`${bound}${name}Enabled`] || p[`${bound}${name}`] > 0)).map(([bound, text]) => <button type="button" role="menuitem" key={bound} onClick={() => { patch({ [`${bound}${name}Enabled`]: true, [`${bound}${name}`]: bound === 'min' ? 0 : Math.max(1, Number(p[axis]) || (axis === 'width' ? 390 : 844)) }); setAdding(false); }}>添加{text}{label}</button>)}</div>}</>}
    {!fixedOnly && [['min', '最小'], ['max', '最大']].filter(([bound]) => p[`${bound}${name}Enabled`] || p[`${bound}${name}`] > 0).map(([bound, text]) => <div className="rc-limit-row" key={bound}><NumberField label={`${text}${label}`} value={p[`${bound}${name}`]} onChange={(value) => patch({ [`${bound}${name}`]: value })} /><button type="button" className="ne-icon" aria-label={`移除${text}${label}`} title={`移除${text}${label}`} onClick={() => patch({ [`${bound}${name}`]: 0, [`${bound}${name}Enabled`]: false })}><X size={15} /></button></div>)}
  </div>;
}

function SpacingField({ title, prefix, p, patch, verticalOnly = false }) {
  const modeKey = `${prefix}Mode`;
  const mode = p[modeKey] ?? 'axis';
  const sides = [['Top', '上'], ['Right', '右'], ['Bottom', '下'], ['Left', '左']];
  const updateAxis = (vertical, horizontal) => patch({ [`${prefix}Vertical`]: vertical, [`${prefix}Horizontal`]: horizontal, [`${prefix}Top`]: vertical, [`${prefix}Bottom`]: vertical, [`${prefix}Left`]: horizontal, [`${prefix}Right`]: horizontal });
  if(verticalOnly)return <div className="rc-spacing-field"><span className="rc-spacing-label">{title}</span>{mode==='individual'?<div className="rc-two-columns">{[['Top','上'],['Bottom','下']].map(([side,label])=><NumberField key={side} label={`${title}${label}`} value={p[`${prefix}${side}`]} max={500} onChange={(value)=>patch({[`${prefix}${side}`]:value})}/>)}</div>:<NumberField label={`${title}纵向`} value={p[`${prefix}Vertical`]??p[`${prefix}Top`]} max={500} onChange={(value)=>updateAxis(value,0)}/>}<button type="button" className="rc-spacing-toggle" aria-label={`${title}切换上下配置`} title="切换上下配置" onClick={()=>patch(spacingModePatch(p,prefix))}><SquareDashed size={18}/></button></div>;
  return <div className="rc-spacing-field">
    <span className="rc-spacing-label">{title}</span>
    {mode === 'individual' ? <div className="rc-four-values">{sides.map(([side, label]) => <NumberField key={side} label={`${title}${label}`} value={p[`${prefix}${side}`]} min={prefix === 'margin' ? -200 : 0} max={500} onChange={(value) => patch({ [`${prefix}${side}`]: value })} />)}</div> : <div className="rc-two-columns rc-spacing-values"><NumberField label={`${title}纵向`} icon={RectangleHorizontal} value={p[`${prefix}Vertical`] ?? p[`${prefix}Top`]} min={prefix === 'margin' ? -200 : 0} max={500} onChange={(value) => updateAxis(value, p[`${prefix}Horizontal`] ?? p[`${prefix}Right`])} /><NumberField label={`${title}横向`} icon={RectangleVertical} value={p[`${prefix}Horizontal`] ?? p[`${prefix}Right`]} min={prefix === 'margin' ? -200 : 0} max={500} onChange={(value) => updateAxis(p[`${prefix}Vertical`] ?? p[`${prefix}Top`], value)} /></div>}
    <button type="button" className="rc-spacing-toggle" aria-label={`${title}切换为${mode === 'individual' ? '轴向' : '四边'}配置`} aria-pressed={mode === 'individual'} title={`${title}：${mode === 'individual' ? '轴向' : '四边'}配置`} onClick={() => patch(spacingModePatch(p, prefix))}><SquareDashed size={18} /></button>
  </div>;
}

function ActionFields({ p, patch, nodes, parents, type }) {
  const action = p.action ?? { action: 'None' };
  const pages = [...nodes.values()].filter((node) => node.type === 'Screen' && nodes.get(parents.get(node.id))?.type === 'Flow');
  const sheets = [...nodes.values()].filter((node) => node.type === 'BottomSheet');
  const destinations = ['NavigateTo','OpenPrivacy','OpenTerms','OpenURL','OpenPage','OpenSheet','NextScreen','OfferCodeRedemption','WebCheckout'];
  const group = destinations.includes(action.action) ? 'NavigateTo' : ['NavigateBack','CloseSheet'].includes(action.action) ? 'NavigateBack' : action.action ?? 'None';
  if(type==='PurchaseButton')return <><Select label="打开方式" value={['Purchase','WebCheckout','WebPaywall','CustomCheckout'].includes(action.action)?action.action:'Purchase'} options={[[ 'Purchase','标准结账' ],[ 'WebCheckout','网页结账（浏览器）' ],[ 'WebPaywall','网页付费墙' ],[ 'CustomCheckout','自定义结账' ]]} onChange={(value)=>patch({action:{...action,action:value}})}/>{action.action==='CustomCheckout'&&<><Field label="结账链接"><input aria-label="结账链接" value={action.actionUrl??''} onChange={(event)=>patch({action:{...action,actionUrl:event.target.value}})}/></Field><Select label="链接打开方式" value={action.openMethod??'external_browser'} options={[[ 'external_browser','外部浏览器' ],[ 'deep_link','深链' ]]} onChange={(openMethod)=>patch({action:{...action,openMethod}})}/>{[['attachPackageId','附带商品套餐 ID'],['attachAppUserId','附带应用用户 ID'],['attachEnvironment','附带环境']].map(([key,label])=><CheckboxField key={key} label={label} checked={action[key]!==false} onChange={(value)=>patch({action:{...action,[key]:value}})}/>)}</>}</>;
  return <>
    <Select label="点击动作" value={group} options={[[ 'None','未配置' ],[ 'NavigateTo','跳转到' ],[ 'NavigateBack','返回' ],[ 'RestorePurchases','恢复购买' ],[ 'Dismiss','关闭付费墙' ],...(action.action==='Purchase'?[[ 'Purchase','购买（旧配置）' ]]:[])]} onChange={(value) => patch({ action: { ...action, action: value } })} />
    {group==='NavigateTo'&&<Select label="导航目标" value={action.action==='NavigateTo'?'':action.action} options={[[ '', '选择目标' ],[ 'OpenPrivacy','隐私政策' ],[ 'OpenTerms','服务条款' ],[ 'OpenURL','自定义链接' ],[ 'WebCheckout','网页购买' ],[ 'OfferCodeRedemption','优惠码兑换' ],[ 'OpenSheet','弹层' ],...(pages.length || ['OpenPage','NextScreen'].includes(action.action) ? [[ 'OpenPage','页面' ],[ 'NextScreen','下一页' ]] : [])]} onChange={(value)=>patch({action:{...action,action:value||'NavigateTo',...(['OpenPrivacy','OpenTerms','OpenURL'].includes(value)&&action.openMethod===undefined?{openMethod:'in_app_browser'}:{})}})}/>}
    {['OpenPrivacy','OpenTerms','OpenURL'].includes(action.action) && <><Field label="链接地址"><input aria-label="链接地址" value={action.actionUrl ?? ''} onChange={(event) => patch({ action: { ...action, actionUrl: event.target.value } })} /></Field><Select label="链接打开方式" value={action.openMethod ?? 'external_browser'} options={[[ 'in_app_browser','应用内浏览器' ],[ 'external_browser','外部浏览器' ],[ 'deep_link','深链' ]]} onChange={(openMethod)=>patch({action:{...action,openMethod}})}/></>}
    {action.action === 'OpenPage' && <Select label="目标页面" value={action.actionPage ?? ''} options={[[ '', '未绑定' ], ...pages.map((node) => [node.id, node.name])]} onChange={(value) => patch({ action: { ...action, actionPage: value } })} />}
    {action.action === 'OpenSheet' && <Select label="目标弹层" value={action.actionPage ?? ''} options={[[ '', '未绑定' ], ...sheets.map((node) => [node.id, node.name])]} onChange={(value) => patch({ action: { ...action, actionPage: value } })} />}
  </>;
}

function MediaEditor({ value, type, onChange, onError, background = false }) {
  const accept = type === 'Screen' ? 'image/png,image/jpeg,image/webp,image/gif' : background ? 'video/mp4' : 'image/png,image/jpeg,image/webp,image/gif,video/mp4';
  const upload = (file) => {
    if (!file) return;
    if (!accept.split(',').includes(file.type)) return onError(background && type === 'Video' ? '请选择 MP4 视频' : type === 'Screen' ? '请选择 PNG、JPG、WebP 或 GIF 图片' : '请选择 PNG、JPG、WebP、GIF 图片或 MP4 视频');
    if (file.size > 10 * 1024 * 1024) return onError('媒体文件不能超过 10 MB');
    const reader = new FileReader(); reader.onload = () => onChange(String(reader.result), type === 'Screen' ? undefined : file.type.startsWith('video/') ? 'Video' : 'Image'); reader.onerror = () => onError('文件读取失败'); reader.readAsDataURL(file);
  };
  return <div className="rc-media-editor">{value && (type === 'Video' ? <video src={value} controls /> : <img src={value} alt="当前素材" />)}<label className="rc-upload">{value ? '替换素材' : '上传素材'}<input type="file" accept={accept} onChange={(event) => { upload(event.target.files[0]); event.target.value = ''; }} /></label><Field label={type === 'Screen' ? '背景图片地址' : '素材地址'}><input value={value} onChange={(event) => onChange(event.target.value)} /></Field>{value && <button type="button" className="rc-secondary" onClick={() => onChange('')}>删除素材</button>}</div>;
}

function ContentSection({ selected, p, patch, document, nodes, parents, findPackage, resolveText, changeProduct, fieldNames, demoSkus, setNavigation, onStatus, setDefaultPackage, onMediaType, onPageControl, rule='default' }) {
  const [uploading,setUploading]=React.useState(false);
  const type = selected.type;
  if(type==='Toggle' && p.switchControl)return <PropertySection title="开关填充"><PaintField label="滑块颜色" property="thumbColor" p={p} patch={patch}/><PaintField label="轨道颜色" property="trackColor" p={p} patch={patch}/></PropertySection>;
  if(type==='Indicators')return null;
  if(type==='PageControl')return <PropertySection title="分页控件属性"><NumberField label="指示器间距" value={p.gap} max={200} onChange={(gap)=>patch({gap})}/></PropertySection>;
  if (type === 'TabButton') return null;
  if (type === 'Timeline') return <>
    <PropertySection title="时间线属性"><Select label="图标对齐" value={p.iconAlignment ?? 'title'} options={[[ 'title', '标题' ], [ 'content', '标题和描述' ]]} onChange={(iconAlignment) => patch({ iconAlignment })} /></PropertySection>
    <PropertySection title="间距"><NumberField label="节点间距" value={p.itemSpacing ?? p.gap} max={200} onChange={(itemSpacing) => patch({ itemSpacing })}/><NumberField label="标题与描述" value={p.textSpacing ?? 4} max={200} onChange={(textSpacing) => patch({ textSpacing })}/><NumberField label="列间距" value={p.columnGutter ?? 16} max={200} onChange={(columnGutter) => patch({ columnGutter })}/></PropertySection>
  </>;
  if (type === 'TimelineItem') return <PropertySection title="连接线" optional><OptionalToggle enabled={p.connectorEnabled !== false} onChange={(connectorEnabled) => patch({ connectorEnabled })}/>{p.connectorEnabled !== false && <>
    <NumberField label="连接线宽度" value={p.connectorWidth ?? 1} max={100} onChange={(connectorWidth) => patch({ connectorWidth })}/>
    <div className="rc-corner-field">{p.connectorMarginMode === 'individual' ? <div className="rc-two-columns">{[['Top','上'], ['Bottom','下']].map(([key,label])=><NumberField key={key} label={`连接线留白${label}`} value={p[`connectorMargin${key}`] ?? 0} max={200} onChange={(value)=>patch({[`connectorMargin${key}`]:value})}/>)}</div> : <NumberField label="连接线纵向留白" value={p.connectorMarginVertical ?? 0} max={200} onChange={(connectorMarginVertical)=>patch({connectorMarginVertical})}/>}
      <button type="button" className="rc-spacing-toggle" title="切换连接线上下留白" aria-label="切换连接线上下留白" onClick={()=>patch(p.connectorMarginMode === 'individual' ? {connectorMarginMode:'axis',connectorMarginVertical:p.connectorMarginTop??0} : {connectorMarginMode:'individual',connectorMarginTop:p.connectorMarginVertical??0,connectorMarginBottom:p.connectorMarginVertical??0})}><SquareDashed size={18}/></button>
    </div>
    <PaintField label="连接线颜色" property="connectorColor" opacityKey="connectorOpacity" p={{...p,connectorColor:p.connectorColor??nodes.get(parents.get(selected.id))?.props.lineColor??'#d6d2e8'}} patch={patch}/>
  </>}</PropertySection>;
  if (type === 'Text') {
    let owner = nodes.get(parents.get(selected.id));
    while (owner && owner.type !== 'Countdown') owner = nodes.get(parents.get(owner.id));
    return <PropertySection title="文字属性">
      {rule==='default' && owner && p.timerField && <Select label="倒计时字段（旧模板）" value={p.timerField} options={[[ 'none', '普通文字' ], ...[['days','天'],['hours','小时'],['minutes','分钟'],['seconds','秒']].flatMap(([key, label]) => [[key, `${label}（补零）`], [`${key}WithoutZero`, `${label}（不补零）`]])]} onChange={(value) => patch({ timerField: value === 'none' ? null : value, ...(value !== 'none' ? { binding: null, runs: null } : {}) })} />}
      {!p.timerField && (p.binding ? <Field label="文字内容"><textarea aria-label="文字内容" value={resolveText(selected, document, findPackage(selected.id, nodes, parents))} readOnly/></Field> : <React.Suspense fallback={<div className="rc-rich-loading">加载文字编辑器</div>}><RichTextEditor key={selected.id} aria-label="文字内容" p={p} value={resolveText({...selected,props:p},document)} onChange={patch} variables={[...PRODUCT_TEXT_VARIABLES,...(owner?TIMER_TEXT_VARIABLES:[])]}/></React.Suspense>)}
      {rule==='default' && p.binding && <><Select label="商品字段" value={p.binding.field} options={Object.entries(fieldNames)} onChange={(field) => patch({ binding: { ...p.binding, field } })} /><button type="button" className="rc-secondary" onClick={() => patch({ binding: null, runs: null, text: resolveText(selected, document, findPackage(selected.id, nodes, parents)) })}>转为独立文字</button></>}
    </PropertySection>;
  }
  if (type === 'Image' || type === 'Video') return <><PropertySection title="素材"><MediaEditor value={p.src ?? ''} type={type} onChange={(value, mediaType) => { if (mediaType && mediaType !== type) onMediaType?.(mediaType); patch({ src: value }); }} onError={onStatus} /><Select label="素材适配" value={p.objectFit} options={[[ 'cover', '填满' ], [ 'contain', '完整显示' ], ...(p.objectFit === 'fill' ? [[ 'fill', '拉伸' ]] : []), ...(p.objectFit === 'none' ? [[ 'none', '原始尺寸' ]] : [])]} onChange={(objectFit) => patch({ objectFit })} /></PropertySection>{type === 'Video' && <PropertySection title="播放设置">{[['loop', '循环播放', false], ['muted', '静音', true], ['autoPlay', '自动播放', false], ['controls', '播放控件', true]].map(([key, label, fallback]) => <CheckboxField key={key} label={label} checked={Boolean(p[key] ?? fallback)} disabled={key==='autoPlay' && !(p.controls??true)} onChange={(value) => patch({ [key]: value })} />)}</PropertySection>}</>;
  if (type === 'Wallet') return <PropertySection title="钱包样式"><Select label="按钮样式" value={p.walletStyle??'black'} options={[[ 'black','黑色' ],[ 'white','白色' ],[ 'white-outline','白色描边' ]]} onChange={(walletStyle)=>patch({walletStyle})}/></PropertySection>;
  if (type === 'Icon') return <PropertySection title="图标属性"><IconField value={p.icon??'check'} onChange={(icon)=>patch({icon})} legacyNames={typeNames}/>{p.icon === 'number' && <NumberField label="数字" value={p.number ?? 1} max={99} unit="" onChange={(number) => patch({ number })} />}<PaintField label="颜色" property="color" p={p} patch={patch} /></PropertySection>;
  if (type === 'Package') return <PropertySection title="商品属性"><Select label="商品 SKU" value={document.products[p.dataKey]?.skuId ?? ''} options={[[ '', '模板示例数据' ], ...demoSkus.map((sku) => [sku.id, `${sku.displayName} · ${sku.id}`])]} onChange={(skuId) => changeProduct('skuId', skuId)} /><Select label="价格显示" value={p.priceMode ?? '1'} options={[[ '1', '总价' ], [ '0', '月均价' ], [ '3', '总价 / 月均参考价' ], [ '4', '月均价 / 总参考价' ]]} onChange={(priceMode) => patch({ priceMode })} /><Select label="默认选中" value={p.defaultSelected ? 'yes' : 'no'} options={[[ 'yes', '是' ], [ 'no', '否' ]]} onChange={(value) => setDefaultPackage(value === 'yes')} /><Field label="选择组"><input value={p.group ?? selected.id} onChange={(event) => patch({ group: event.target.value })} /></Field>{!document.products[p.dataKey]?.skuId && Object.entries(fieldNames).map(([key, label]) => <Field key={key} label={label}><input value={document.products[p.dataKey]?.[key] ?? ''} onChange={(event) => changeProduct(key, event.target.value)} /></Field>)}</PropertySection>;
  if (type === 'Button' || type === 'PurchaseButton') return <PropertySection title="动作属性"><ActionFields p={p} patch={patch} nodes={nodes} parents={parents} type={type} /></PropertySection>;
  if (['Tabs','Carousel','Flow'].includes(type)) return <><PropertySection title="页面属性">{type==='Carousel'&&<><Select label="页面纵向对齐" value={p.pageAlignment??'top'} options={[[ 'top','顶部' ],[ 'center','居中' ],[ 'bottom','底部' ]]} onChange={(pageAlignment)=>patch({pageAlignment})}/><NumberField label="页面间距" value={p.pageSpacing??0} max={200} onChange={(pageSpacing)=>patch({pageSpacing})}/><NumberField label="邻页露出" value={p.pagePeek??0} max={100} onChange={(pagePeek)=>patch({pagePeek})}/></>}
    <Select label="默认页面" value={p.defaultIndex??0} options={sequencePages(selected).map((node,index)=>[index,node.name])} onChange={(value)=>{patch({defaultIndex:Number(value)});setNavigation({[selected.id]:Number(value)});}}/>
    {type==='Carousel'&&<><CheckboxField label="循环播放" checked={Boolean(p.loop)} onChange={(loop)=>patch({loop})}/><CheckboxField label="自动切换" checked={Boolean(p.autoPlay)} onChange={(autoPlay)=>patch({autoPlay})}/>{p.autoPlay&&<><NumberField label="每页停留时间" value={p.autoPlayInterval??2500} min={250} max={60000} unit="ms" onChange={(autoPlayInterval)=>patch({autoPlayInterval})}/><NumberField label="过渡时间" value={p.transitionTime??500} max={10000} unit="ms" onChange={(transitionTime)=>patch({transitionTime})}/><Select label="过渡动画" value={p.transitionAnimation??'slide'} options={[[ 'slide','滑动' ],[ 'fade','淡入淡出' ]]} onChange={(transitionAnimation)=>patch({transitionAnimation})}/></>}</>}
  </PropertySection>{type==='Carousel'&&<PropertySection title="分页控件" optional><OptionalToggle enabled={selected.children.some((child)=>child.type==='PageControl')} onChange={onPageControl}/>{selected.children.some((child)=>child.type==='PageControl')&&<Select label="分页器位置" value={p.pageControlPosition??'bottom'} options={[[ 'top','顶部' ],[ 'bottom','底部' ]]} onChange={(pageControlPosition)=>patch({pageControlPosition})}/>}</PropertySection>}</>;
  if (type === 'Toggle') return <PropertySection title="控件属性"><Select label="控件类型" value={p.control ?? 'switch'} options={[[ 'switch', '开关' ], [ 'checkbox', '勾选框' ]]} onChange={(control) => patch({ control })} />{!p.switchTarget && <SegmentedField label="初始状态" value={p.initial ? 'yes' : 'no'} options={[[ 'no', '关闭' ], [ 'yes', '开启' ]]} onChange={(value) => patch({ initial: value === 'yes' })} />}<SegmentedField label="购买前必须勾选" value={p.required ? 'yes' : 'no'} options={[[ 'no', '否' ], [ 'yes', '是' ]]} onChange={(value) => patch({ required: value === 'yes' })} /></PropertySection>;
  if (type === 'Countdown') return <PropertySection title="倒计时属性"><Field label="目标时间（UTC）"><input type="datetime-local" step="1" aria-label="目标时间（UTC）" value={utcDateTimeInput(p.deadline)} onChange={(event)=>patch({deadline:event.target.value?`${event.target.value.replace(/Z$/,'')}Z`:''})}/></Field>{!p.deadline && p.start!==undefined && <Field label="起始时长（旧模板）"><input value={p.start} onChange={(event) => patch({ start: event.target.value })} /></Field>}<Select label="计时单位" value={p.countFrom ?? 'hours'} options={[[ 'days', '天' ], [ 'hours', '小时' ], [ 'minutes', '分钟' ]]} onChange={(countFrom) => patch({ countFrom })} /><CheckboxField label="自定义兜底内容" checked={p.fallbackEnabled!==false} onChange={(fallbackEnabled)=>patch({fallbackEnabled})}/></PropertySection>;
  if (type === 'Switch') return <PropertySection title="开关属性"><Select label="默认状态" value={p.defaultIndex??0} options={[[0,'关闭'],[1,'开启']]} onChange={(value)=>{patch({defaultIndex:Number(value)});setNavigation({[selected.id]:Number(value)});}}/></PropertySection>;
  if (type === 'ExpressCheckout') return null;
  if (type === 'Custom') return <PropertySection title="自定义组件"><a className="rc-secondary" href="/custom-component/example.zip" download>下载示例</a><label className="rc-upload">{uploading?'正在校验 ZIP':p.customBundle?'替换 ZIP':'上传 ZIP'}<input type="file" accept=".zip,application/zip" disabled={uploading} onChange={async(event)=>{const file=event.target.files?.[0];event.target.value='';if(!file)return;setUploading(true);try{const {installCustomBundle}=await import('./customBundle.js');const customBundle=await installCustomBundle(file);patch({customBundle});}catch(error){onStatus(error.message);}finally{setUploading(false);}}}/></label>{p.customBundle&&<><div className="rc-custom-file">{p.customBundle.name}</div><button type="button" className="rc-secondary" onClick={()=>patch({customBundle:null})}>移除 ZIP</button></>}{p.html!==undefined&&!p.customBundle&&<Field label="HTML（旧配置）"><textarea className="ne-code-input" value={p.html} onChange={(event)=>patch({html:event.target.value})}/></Field>}</PropertySection>;
  return null;
}

function LayoutSection({ selected, p, patch, parent }) {
  if (selected.type === 'TimelineItem' || selected.type==='Countdown' || selected.type==='Toggle'&&p.switchControl) return null;
  if(selected.type==='Wallet')return <PropertySection title="尺寸"><SizeField axis="width" label="宽度" p={p} patch={patch}/></PropertySection>;
  if(selected.type==='Custom')return <PropertySection title="尺寸"><SizeField axis="width" label="宽度" p={p} patch={patch}/><SizeField axis="height" label="高度" p={p} patch={patch}/>{p.heightMode==='fit'&&<NumberField label="加载时初始高度" value={p.loadingHeight??300} onChange={(loadingHeight)=>patch({loadingHeight})}/>}</PropertySection>;
  if (selected.type === 'Indicators')return <PropertySection title="尺寸"><NumberField label="高度" value={p.height} onChange={(height)=>patch({height,heightMode:'fixed'})}/><NumberField label="宽度" value={p.width} onChange={(width)=>patch({width,widthMode:'fixed'})}/></PropertySection>;
  const isContainer = CONTAINER_TYPES.has(selected.type) && !['Tabs', 'Carousel', 'PageControl', 'Timeline', 'TimelineItem', 'Switch','ExpressCheckout'].includes(selected.type);
  return <>
    {isContainer && <PropertySection title="布局" className="rc-layout-section">
      <SegmentedField label="轴向" value={p.axis} icon options={[[ 'horizontal', '横向', ArrowRight ], [ 'vertical', '纵向', ArrowDown ], [ 'overlay', '叠放', Layers3 ]]} onChange={(axis) => patch({ axis })} />
      <SegmentedField label="对齐" value={p.align} icon options={[[ 'start', '起始', p.axis === 'horizontal' ? AlignStartVertical : AlignStartHorizontal ], [ 'center', '居中', p.axis === 'horizontal' ? AlignCenterVertical : AlignCenterHorizontal ], [ 'end', '末尾', p.axis === 'horizontal' ? AlignEndVertical : AlignEndHorizontal ], ...(p.align === 'stretch' ? [[ 'stretch', '拉伸（旧模板）', Layers3 ]] : [])]} onChange={(align) => patch({ align })} />
      {p.axis !== 'overlay' && <><Select label="分布" value={p.justify} options={[[ 'between', '两端分布' ], [ 'around', '各项两侧均分' ], [ 'evenly', '各项等距' ], [ 'start', '起始' ], [ 'center', '居中' ], [ 'end', '末尾' ]]} onChange={(justify) => patch({ justify })} /><NumberField label="子项间距" value={p.gap} max={200} onChange={(gap) => patch({ gap })} /></>}
      {p.wrap && p.axis === 'horizontal' && <SegmentedField label="换行（旧模板）" value="yes" options={[[ 'no', '不换行' ], [ 'yes', '换行' ]]} onChange={(value) => patch({ wrap: value === 'yes' })} />}
    </PropertySection>}
    {!['Carousel','PageControl'].includes(selected.type)&&<PropertySection title="尺寸"><SizeField axis="width" label="宽度" p={p} patch={patch} fixedOnly={selected.type === 'Icon'} allowConstraints={selected.type !== 'Screen'} /><SizeField axis="height" label="高度" p={p} patch={patch} fixedOnly={selected.type === 'Icon'} /></PropertySection>}
    <PropertySection title="布局间距" className="rc-spacing-section"><SpacingField title="内边距" prefix="padding" p={p} patch={patch} verticalOnly={selected.type==='Carousel'} />{selected.type !== 'Screen' && !(selected.type==='Icon'&&parent?.type==='TimelineItem') && <SpacingField title="外边距" prefix="margin" p={p} patch={patch} />}</PropertySection>
  </>;
}

function AppearanceSection({ selected, p, patch, onStatus }) {
  const image = ['Image','Video'].includes(selected.type);
  const mask = imageMask(p);
  if (['Text', 'Timeline', 'TimelineItem','Countdown','Wallet','Custom'].includes(selected.type) || selected.type==='Toggle'&&p.switchControl) return null;
  if (selected.type === 'Screen') return <FillSection selected={selected} p={p} patch={patch} onStatus={onStatus} required />;
  if (selected.type === 'Indicators')return <><PropertySection title="填充"><PaintField label="背景颜色" property="background" p={p} patch={patch}/></PropertySection><BorderShadowSections p={p} patch={patch} strokeOnly/></>;
  if (selected.type === 'Icon') {
    const enabled = p.iconBackgroundEnabled ?? (p.iconBackground !== 'transparent' || p.radius > 0 || CORNER_KEYS.some((key)=>p[key]>0) || p.borderWidth > 0 || p.shadowBlur > 0);
    return <><PropertySection title="图标背景" optional><OptionalToggle enabled={enabled} onChange={(value) => patch(value ? { iconBackgroundEnabled: true, iconBackground: '#ffffff' } : { iconBackgroundEnabled: false, iconBackground: 'transparent', radius: 0, radiusMode: 'all', shape: 'rectangle', borderEnabled: false, borderWidth: 0, shadowEnabled: false, shadowBlur: 0, shadowX: 0, shadowY: 0 })}/>{enabled && <><PaintField label="背景颜色" property="iconBackground" p={p} patch={(values)=>patch({...values,iconBackgroundEnabled:true})}/><Select label="形状" value={p.shape ?? 'rectangle'} options={[[ 'rectangle', '矩形' ], [ 'circle', '圆形' ]]} onChange={(shape)=>patch({shape})}/>{p.shape === 'rectangle' && <CornerField p={p} patch={patch}/>}</>}</PropertySection>{enabled && <BorderShadowSections p={p} patch={patch}/>}</>;
  }
  const appearanceKey=image?'maskEnabled':'appearanceEnabled', appearance=p[appearanceKey]!==false;
  return <><PropertySection title={image ? '遮罩' : '外观'} optional><OptionalToggle enabled={appearance} onChange={(enabled)=>patch({[appearanceKey]:enabled})}/>{appearance&&<>
    {image ? <Select label="遮罩" value={mask} options={[[ 'rectangle', '矩形' ], [ 'circle', '圆形' ]]} onChange={(value) => patch({ mask: value, shape: 'rectangle' })} /> : <Select label="形状" value={p.shape ?? 'rectangle'} options={[[ 'rectangle', '矩形' ], [ 'pill', '胶囊' ], ...(p.shape === 'circle' ? [[ 'circle', '圆形' ]] : [])]} onChange={(shape) => patch({ shape })} />}
    {!image && p.opacity !== 100 && <NumberField label="组件透明度（旧模板）" value={p.opacity} min={0} max={100} unit="%" onChange={(opacity) => patch({ opacity })} />}
    {(image ? mask === 'rectangle' : p.shape === 'rectangle') && <CornerField p={image && p.shape === 'pill' ? { ...p, radius: 999 } : p} patch={patch} />}
  </>}</PropertySection>
    {image ? <PropertySection title="叠加层" optional><OptionalToggle enabled={p.overlayEnabled ?? (Boolean(p.overlayColor) && p.overlayColor !== 'transparent')} onChange={(enabled) => patch({ overlayEnabled: enabled, ...(enabled && (!p.overlayColor || p.overlayColor === 'transparent') ? { overlayColor: '#000000', overlayOpacity: 20 } : {}) })}/>{(p.overlayEnabled ?? (Boolean(p.overlayColor) && p.overlayColor !== 'transparent')) && <PaintField label="叠加层颜色" property="overlayColor" opacityKey="overlayOpacity" p={p} patch={(values)=>patch({...values,overlayEnabled:true})}/>}</PropertySection> : <FillSection selected={selected} p={p} patch={patch} onStatus={onStatus}/>}
    <BorderShadowSections p={p} patch={patch}/>
  </>;
}

function FillSection({selected,p,patch,onStatus,required=false}) {
  const enabled=required || (p.fillEnabled ?? (p.fillType !== 'color' || p.background !== 'transparent'));
  const update=(values)=>patch({...values,fillEnabled:true});
  return <PropertySection title="填充" optional={!required}>
    {!required && <OptionalToggle enabled={enabled} onChange={(fillEnabled)=>patch({fillEnabled})}/>}
    {enabled && <><SegmentedField label="背景类型" value={p.fillType ?? 'color'} options={[[ 'color', '颜色' ], [ 'image', '图片' ], ...(CONTAINER_TYPES.has(selected.type) ? [[ 'video', '视频' ]] : [])]} onChange={(fillType) => update({ fillType, fillEnabled: true })} />
      {p.fillType === 'color' ? <PaintField label="背景颜色" property="background" p={p} patch={update} opacityReadOnly={required || selected.type === 'Header'}/> : <><MediaEditor background type={p.fillType === 'video' ? 'Video' : 'Screen'} value={p.fillType === 'video' ? p.backgroundVideo ?? '' : p.backgroundImage ?? ''} onChange={(value) => update(p.fillType === 'video' ? { backgroundVideo: value } : { backgroundImage: value })} onError={onStatus} /><Select label="背景适配" value={p.backgroundFit ?? 'cover'} options={[[ 'cover', '填满' ], [ 'contain', '完整显示' ], [ 'fill', '拉伸' ], [ 'none', '原始尺寸' ]]} onChange={(backgroundFit) => update({ backgroundFit })} /></>}
    </>}
  </PropertySection>;
}

function BorderShadowSections({p,patch,strokeOnly=false,prefix=''}) {
  const border=p.borderEnabled ?? (Number(p.borderWidth)>0);
  const shadow=p.shadowEnabled ?? Boolean(Number(p.shadowBlur)||Number(p.shadowX)||Number(p.shadowY));
  return <>
    <PropertySection title={`${prefix}${strokeOnly?'描边':'边框'}`} optional><OptionalToggle enabled={border} onChange={(enabled) => patch({ borderEnabled: enabled, borderWidth: enabled ? Math.max(1, Number(p.borderWidth) || 1) : 0 })} />{border && <><PaintField label={`${prefix}边框颜色`} property="borderColor" opacityKey="borderOpacity" p={p} patch={patch} /><NumberField label={`${prefix}边框宽度`} value={p.borderWidth} max={20} onChange={(borderWidth) => patch({ borderEnabled: true, borderWidth })} /></>}</PropertySection>
    {!strokeOnly&&<PropertySection title={`${prefix}阴影`} optional><OptionalToggle enabled={shadow} onChange={(enabled) => patch(enabled ? { shadowEnabled: true, shadowBlur: 6, shadowX: 0, shadowY: 2, shadowColor: '#000000', shadowOpacity: 20 } : { shadowEnabled: false, shadowBlur: 0, shadowX: 0, shadowY: 0 })} />{shadow && <><div className="rc-two-columns"><NumberField label={`${prefix}X 偏移`} value={p.shadowX ?? 0} min={-100} max={100} onChange={(shadowX) => patch({ shadowEnabled: true, shadowX })} /><NumberField label={`${prefix}Y 偏移`} value={p.shadowY ?? 0} min={-100} max={100} onChange={(shadowY) => patch({ shadowEnabled: true, shadowY })} /></div><NumberField label={`${prefix}模糊`} value={p.shadowBlur ?? 0} max={100} onChange={(shadowBlur) => patch({ shadowEnabled: true, shadowBlur })} /><PaintField label={`${prefix}阴影颜色`} property="shadowColor" opacityKey="shadowOpacity" p={p} patch={patch} /></>}</PropertySection>}
  </>;
}

function FontField({p,patch,label}) {
  const {fonts,onFontsChange}=React.useContext(FontContext),[open,setOpen]=React.useState(false);
  const legacy=p.fontFamily&&p.fontFamily!=='system'&&!fonts.some(font=>font.id===p.fontFamily);
  return <><div className="rc-font-field"><Select label={label} value={p.fontFamily??'system'} options={[[ 'system','系统字体' ],...fonts.map(font=>[font.id,font.family]),...(legacy?[[p.fontFamily,`${({serif:'衬线字体',mono:'等宽字体'})[p.fontFamily]??p.fontFamily}（旧配置）`]]:[]),...(onFontsChange?[[ '$add-font','添加字体' ]]:[])]} onChange={(value)=>value==='$add-font'?setOpen(true):patch({fontFamily:value})}/><button type="button" className="ne-icon" title="配置字体族" aria-label="配置字体族" disabled={!onFontsChange} onClick={()=>setOpen(true)}><Settings2 size={15}/></button></div>{open&&<React.Suspense fallback={<div role="status">加载字体配置</div>}><FontManager fonts={fonts} onSave={onFontsChange} onClose={()=>setOpen(false)}/></React.Suspense>}</>;
}

function TypographyFields({p,patch,badge=false}) {
  const label=(name)=>`${badge?'徽标':''}${name}`;
  return <>
    <SegmentedField label={label('文字对齐')} value={p.textAlign} options={[[ 'left','左对齐',AlignLeft ],[ 'center','居中',AlignCenter ],[ 'right','右对齐',AlignRight ]]} icon onChange={(textAlign)=>patch({textAlign})}/>
    <FontField label={badge?'徽标字体':'字体'} p={p} patch={patch}/>
    <Select label={label('字重')} value={p.bold?700:p.fontWeight} options={[[100,'极细'],[200,'特细'],[300,'细体'],[400,'常规'],[500,'中等'],[600,'半粗'],[700,'粗体'],[800,'特粗'],[900,'极粗']]} onChange={(value)=>patch({fontWeight:Number(value)})}/>
    <NumberField label={label('字号')} value={p.fontSize} min={8} max={160} onChange={(fontSize)=>patch({fontSize})}/>
    <PaintField label={label('文字颜色')} property="color" p={p} patch={patch}/>
    <PaintField label={badge?'徽标文字背景':'背景颜色'} property={badge?'textBackground':'background'} opacityKey={badge?'textBackgroundOpacity':'backgroundOpacity'} p={badge?p:{...p,background:p.fillEnabled===false?'transparent':p.background==='transparent'?p.textBackground??p.background:p.background}} patch={patch}/>
  </>;
}

function BadgeSection({selected,p,patch}){
  if(!['Stack','Package','Slide','PurchaseButton'].includes(selected.type))return null;
  const enabled=p.badgeEnabled??Boolean(p.badge),badge={...BADGE_DEFAULTS,...p.badge};
  const update=(values)=>{const {background,...typography}=values;patch({badge:{...badge,...textPropertyPatch({type:'Text',props:badge},typography),...('background' in values?{background}: {})},badgeEnabled:true});};
  return <PropertySection title="徽标" optional><OptionalToggle enabled={enabled} onChange={(badgeEnabled)=>patch({badgeEnabled,...(badgeEnabled&&!p.badge?{badge:{...BADGE_DEFAULTS}}:{})})}/>{enabled&&<div className="rc-badge-properties">
    <React.Suspense fallback={<div className="rc-rich-loading">加载文字编辑器</div>}><RichTextEditor aria-label="徽标文字" p={badge} value={badge.text} onChange={update} variables={PRODUCT_TEXT_VARIABLES}/></React.Suspense>
    <TypographyFields p={badge} patch={update} badge/>
    <PropertySection title="徽标位置"><Select label="徽标样式" value={badge.positionStyle} options={[[ 'overlay','覆盖边框' ],[ 'nested','内嵌边框' ]]} onChange={(positionStyle)=>update({positionStyle})}/><Select label="徽标对齐" value={badge.position} options={[[ 'top-left','左上' ],[ 'top-center','上方居中' ],[ 'top-right','右上' ],[ 'bottom-left','左下' ],[ 'bottom-center','下方居中' ],[ 'bottom-right','右下' ]]} onChange={(position)=>update({position})}/></PropertySection>
    <PropertySection title="徽标间距"><SpacingField title="内边距" prefix="padding" p={badge} patch={update}/><SpacingField title="外边距" prefix="margin" p={badge} patch={update}/></PropertySection>
    <PropertySection title="徽标外观" optional><OptionalToggle enabled={badge.appearanceEnabled!==false} onChange={(appearanceEnabled)=>update({appearanceEnabled})}/>{badge.appearanceEnabled!==false&&<><Select label="徽标形状" value={badge.shape} options={[[ 'rectangle','矩形' ],[ 'pill','胶囊' ]]} onChange={(shape)=>update({shape})}/>{badge.shape==='rectangle'&&<CornerField p={badge} patch={update}/>}</>}</PropertySection>
    <PropertySection title="徽标填充" optional><OptionalToggle enabled={badge.fillEnabled!==false} onChange={(fillEnabled)=>update({fillEnabled})}/>{badge.fillEnabled!==false&&<PaintField label="徽标背景颜色" property="background" p={badge} patch={update}/>}</PropertySection>
    <BorderShadowSections p={badge} patch={update} prefix="徽标"/>
  </div>}</PropertySection>;
}

export default function RevenueCatProperties({ selected, p, patch, document, nodes, parents, findPackage, resolveText, changeProduct, fieldNames, demoSkus, navigation = {}, setNavigation, onStatus, setDefaultPackage, onMediaType, onPageControl, onFontsChange }) {
  const rule=selected.type==='Text'?textRuleName(navigation.textRule):'default';
  const textP=textRuleProps(p,rule), textPatch=(values)=>patch(textRulePatch(p,rule,values));
  const owner = selected.type==='Indicators'?selected:selectionOwner(selected, nodes, parents);
  const [packageState, setPackageState] = React.useState(() => navigation[`package-style:${owner?.id}`] ?? 'default');
  const stateful = Boolean(owner);
  React.useEffect(() => { if (stateful) setNavigation({ [`package-style:${owner.id}`]: packageState }); }, [stateful, owner?.id, packageState, setNavigation]);
  const styleP = stateStyleProps(p, stateful && packageState === 'selected');
  const stylePatch = stateful && packageState === 'selected' ? (values) => patch(Object.fromEntries(Object.entries(values).map(([key, value]) => [selectedStyleKey(key), value]))) : patch;
  return <FontContext.Provider value={{fonts:document.fonts??[],onFontsChange}}><div className="rc-properties-body">
    {selected.type==='Text'&&<div className="rc-text-rule"><Select label="文字规则" value={rule} options={TEXT_RULES} onChange={(value)=>{if(value!=='default'&&!p.textRules?.[value])patch(textRulePatch(p,value,{}));setNavigation({textRule:value});}}/></div>}
    <ContentSection key={rule} rule={rule} selected={selected} p={selected.type==='Text'?textP:p} patch={selected.type==='Text'?textPatch:patch} document={document} nodes={nodes} parents={parents} findPackage={findPackage} resolveText={resolveText} changeProduct={changeProduct} fieldNames={fieldNames} demoSkus={demoSkus} setNavigation={setNavigation} onStatus={onStatus} setDefaultPackage={setDefaultPackage} onMediaType={onMediaType} onPageControl={onPageControl}/>
    {stateful && rule==='default' && <PropertySection title="状态样式"><SegmentedField label="状态" value={packageState} options={[[ 'default', '默认' ], [ 'selected', selected.type==='Indicators'?'当前':'选中' ]]} onChange={(value) => { setPackageState(value); setNavigation({ [`package-style:${owner.id}`]: value }); }} /></PropertySection>}
    {selected.type === 'Text' && <PropertySection title="文字样式">
      <TypographyFields p={textP} patch={textPatch}/>
    </PropertySection>}
    {selected.type === 'Countdown' && !selected.children.length && <PropertySection title="文字样式"><div className="rc-two-columns"><NumberField label="字号" value={p.fontSize} min={8} max={160} onChange={(fontSize) => patch({ fontSize })} /><ColorField label="颜色" value={p.color} onChange={(color) => patch({ color })} /></div></PropertySection>}
    {rule==='default'&&<LayoutSection selected={selected} p={styleP} patch={stylePatch} parent={nodes.get(parents.get(selected.id))}/>}
    <AppearanceSection selected={selected} p={styleP} patch={stylePatch} onStatus={onStatus} />
    <BadgeSection selected={selected} p={p} patch={patch}/>
  </div></FontContext.Provider>;
}
