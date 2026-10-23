import React from 'react';
import { ChevronDown, ChevronRight, ArrowRight, ArrowDown, Layers3, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignStartVertical, AlignCenterVertical, AlignEndVertical, SquareDashed, RectangleHorizontal, RectangleVertical, Plus, X, Braces } from 'lucide-react';
import { CONTAINER_TYPES } from './componentDocument.js';
import { selectedStyleKey, stateStyleProps, spacingModePatch, dimensionModePatch, imageMask } from './propertyModel.js';
import { PRODUCT_TEXT_VARIABLES } from './textVariables.js';

export function PropertySection({ title, children, defaultOpen = true, optional = false, className = '' }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return <section className={`rc-prop-section ${className}`}>
    <button type="button" className="rc-prop-heading" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<strong>{title}</strong></span>
      {optional && <small>可选</small>}
    </button>
    {open && <div className="rc-prop-body">{children}</div>}
  </section>;
}

function Field({ label, children, hint }) { return <label className="rc-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
function Select({ label, value, onChange, options, disabled = false }) { return <Field label={label}><select aria-label={label} value={value ?? ''} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [key, name] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{name}</option>; })}</select></Field>; }
function NumberField({ label, value, onChange, min = 0, max = 2000, unit = 'px', icon: Glyph }) {
  const [draft, setDraft] = React.useState(String(value ?? 0));
  React.useEffect(() => setDraft(String(value ?? 0)), [value]);
  return <Field label={label}><div className="rc-unit-input">{Glyph && <Glyph aria-hidden="true" size={16} />}<input aria-label={label} type="number" min={min} max={max} value={draft} onChange={(event) => { const raw = event.target.value; setDraft(raw); const next = Number(raw); if (raw !== '' && Number.isFinite(next) && next >= min && next <= max) onChange(next); }} onBlur={() => { const next = draft === '' || !Number.isFinite(Number(draft)) ? Number(value) || 0 : Number(draft); const result = Math.max(min, Math.min(max, next)); setDraft(String(result)); onChange(result); }} />{unit && <span>{unit}</span>}</div></Field>;
}
function ColorField({ label, value, onChange }) {
  const [draft, setDraft] = React.useState(value ?? 'transparent');
  React.useEffect(() => setDraft(value ?? 'transparent'), [value]);
  const valid = draft.trim() !== '' && (typeof CSS === 'undefined' || CSS.supports(label.includes('背景') ? 'background' : 'color', draft));
  return <Field label={label}><div className="rc-color-input"><input type="color" aria-label={label} value={/^#[a-f\d]{6}$/i.test(value) ? value : '#ffffff'} onChange={(event) => { setDraft(event.target.value); onChange(event.target.value); }} /><input aria-label={`${label}值`} aria-invalid={!valid} title={valid ? undefined : '请输入有效颜色'} value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); if (next.trim() && (typeof CSS === 'undefined' || CSS.supports(label.includes('背景') ? 'background' : 'color', next))) onChange(next); }} onBlur={() => { if (!valid) setDraft(value ?? 'transparent'); }} /></div>{!valid && <small role="alert">请输入有效颜色</small>}</Field>;
}
function SegmentedField({ label, value, onChange, options, icon = false }) { return <Field label={label}><div className={`rc-segmented ${icon ? 'rc-icon-segmented' : ''}`}>{options.map(([key, name, Glyph]) => <button type="button" key={key} className={String(value) === String(key) ? 'active' : ''} aria-label={name} aria-pressed={String(value) === String(key)} title={name} onClick={() => onChange(key)}>{icon && Glyph ? <Glyph size={21} strokeWidth={2.8} /> : name}</button>)}</div></Field>; }
function OptionalToggle({ enabled, onChange }) { return <button type="button" className={`rc-optional-toggle ${enabled ? 'active' : ''}`} aria-pressed={enabled} onClick={() => onChange(!enabled)}>{enabled ? '已启用' : '添加'}</button>; }
const typeNames = { check: '勾选', lock: '锁', star: '星标', bell: '铃铛', moon: '月亮', heart: '爱心', group: '用户组', clock: '时钟', gift: '礼物', arrow: '箭头', dumbbell: '哑铃', weight: '重量', running: '跑步', download: '下载', map: '地图', flower: '花朵', activity: '活动', ticket: '票券', noads: '无广告', blocks: '方块', archive: '归档', shirt: '衣服', seat: '座位', scan: '扫描', help: '帮助', access: '登录', number: '数字' };

function SizeField({ axis, label, p, patch, fixedOnly = false }) {
  const [adding, setAdding] = React.useState(false);
  const name = axis[0].toUpperCase() + axis.slice(1), mode = p[`${axis}Mode`];
  return <div className="rc-size-field">
    {fixedOnly ? <NumberField label={label} value={p[axis]} onChange={(value) => patch({ [axis]: value, [`${axis}Mode`]: 'fixed' })} /> : <SegmentedField label={label} value={mode} options={[[ 'fit', '适应内容' ], [ 'fill', '填满' ], [ 'fixed', '固定' ]]} onChange={(value) => patch(dimensionModePatch(axis, value))} />}
    {!fixedOnly && mode === 'fixed' && <NumberField label={`固定${label}`} value={p[axis]} onChange={(value) => patch({ [axis]: value })} />}
    {!fixedOnly && mode === 'fill' && <><button type="button" className="ne-icon" aria-label={`添加${label}约束`} title={`添加${label}约束`} aria-expanded={adding} onClick={() => setAdding(!adding)}><Plus size={15} /></button>{adding && <div role="menu" className="rc-limit-menu">{[['min', '最小'], ['max', '最大']].filter(([bound]) => !(p[`${bound}${name}Enabled`] || p[`${bound}${name}`] > 0)).map(([bound, text]) => <button type="button" role="menuitem" key={bound} onClick={() => { patch({ [`${bound}${name}Enabled`]: true, [`${bound}${name}`]: bound === 'min' ? 0 : Math.max(1, Number(p[axis]) || (axis === 'width' ? 390 : 844)) }); setAdding(false); }}>添加{text}{label}</button>)}</div>}</>}
    {!fixedOnly && [['min', '最小'], ['max', '最大']].filter(([bound]) => p[`${bound}${name}Enabled`] || p[`${bound}${name}`] > 0).map(([bound, text]) => <div className="rc-limit-row" key={bound}><NumberField label={`${text}${label}`} value={p[`${bound}${name}`]} onChange={(value) => patch({ [`${bound}${name}`]: value })} /><button type="button" className="ne-icon" aria-label={`移除${text}${label}`} title={`移除${text}${label}`} onClick={() => patch({ [`${bound}${name}`]: 0, [`${bound}${name}Enabled`]: false })}><X size={15} /></button></div>)}
  </div>;
}

function SpacingField({ title, prefix, p, patch }) {
  const modeKey = `${prefix}Mode`;
  const mode = p[modeKey] ?? 'axis';
  const sides = [['Top', '上'], ['Right', '右'], ['Bottom', '下'], ['Left', '左']];
  const updateAxis = (vertical, horizontal) => patch({ [`${prefix}Vertical`]: vertical, [`${prefix}Horizontal`]: horizontal, [`${prefix}Top`]: vertical, [`${prefix}Bottom`]: vertical, [`${prefix}Left`]: horizontal, [`${prefix}Right`]: horizontal });
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
  const destinations = ['OpenURL','OpenPage','OpenSheet','NextScreen','OfferCodeRedemption'];
  const group = destinations.includes(action.action) ? 'NavigateTo' : ['NavigateBack','CloseSheet','Dismiss'].includes(action.action) ? 'NavigateBack' : action.action ?? 'None';
  if(type==='PurchaseButton')return <Select label="打开方式" value={action.action==='WebCheckout'?'WebCheckout':'Purchase'} options={[[ 'Purchase','应用内结账' ],[ 'WebCheckout','网页结账' ]]} onChange={(value)=>patch({action:{...action,action:value}})}/>;
  return <>
    <Select label="点击动作" value={group} options={[[ 'None','无' ],[ 'RestorePurchases','恢复购买' ],[ 'NavigateBack','返回' ],[ 'NavigateTo','跳转到' ],...(['Purchase','WebCheckout'].includes(action.action)?[[action.action,action.action==='Purchase'?'购买':'网页结账']]:[])]} onChange={(value) => patch({ action: { ...action, action: value==='NavigateTo'?'OpenURL':value } })} />
    {group==='NavigateTo'&&<Select label="导航目标" value={action.action} options={[[ 'OpenURL','自定义链接' ],[ 'OpenPage','页面' ],[ 'OpenSheet','弹层' ],[ 'NextScreen','下一页' ],[ 'OfferCodeRedemption','优惠码兑换' ]]} onChange={(value)=>patch({action:{...action,action:value}})}/>}
    {action.action === 'OpenURL' && <Field label="链接地址"><input value={action.actionUrl ?? ''} onChange={(event) => patch({ action: { ...action, actionUrl: event.target.value } })} /></Field>}
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

function ContentSection({ selected, p, patch, document, nodes, parents, findPackage, resolveText, changeProduct, fieldNames, demoSkus, setNavigation, onStatus, setDefaultPackage, onMediaType }) {
  const contentRef = React.useRef(null);
  const [variablesOpen, setVariablesOpen] = React.useState(false);
  const type = selected.type;
  if (type === 'Text') {
    let owner = nodes.get(parents.get(selected.id));
    while (owner && owner.type !== 'Countdown') owner = nodes.get(parents.get(owner.id));
    return <PropertySection title="文字属性">
      {owner && <Select label="倒计时字段" value={p.timerField ?? 'none'} options={[[ 'none', '普通文字' ], ...[['days','天'],['hours','小时'],['minutes','分钟'],['seconds','秒']].flatMap(([key, label]) => [[key, `${label}（补零）`], [`${key}WithoutZero`, `${label}（不补零）`]])]} onChange={(value) => patch({ timerField: value === 'none' ? null : value, ...(value !== 'none' ? { binding: null, runs: null } : {}) })} />}
      {!p.timerField && <Field label="文字内容"><textarea ref={contentRef} aria-label="文字内容" value={resolveText(selected, document, findPackage(selected.id, nodes, parents))} readOnly={Boolean(p.binding)} onChange={(event) => patch({ text: event.target.value, runs: null })} /></Field>}
      {!p.timerField && !p.binding && <><button type="button" className="ne-icon" aria-label="插入变量" title="插入变量" aria-expanded={variablesOpen} onClick={() => setVariablesOpen(!variablesOpen)}><Braces size={16}/></button>{variablesOpen && <div role="menu" className="rc-limit-menu">{PRODUCT_TEXT_VARIABLES.map(([key,label])=><button type="button" role="menuitem" key={key} onClick={()=>{const text=resolveText(selected,document),start=contentRef.current?.selectionStart??text.length,end=contentRef.current?.selectionEnd??start;patch({text:`${text.slice(0,start)}{{ ${key} }}${text.slice(end)}`,runs:null});setVariablesOpen(false);}}>{label}</button>)}</div>}</>}
      {p.binding && <><Select label="商品字段" value={p.binding.field} options={Object.entries(fieldNames)} onChange={(field) => patch({ binding: { ...p.binding, field } })} /><button type="button" className="rc-secondary" onClick={() => patch({ binding: null, runs: null, text: resolveText(selected, document, findPackage(selected.id, nodes, parents)) })}>转为独立文字</button></>}
      {p.runs?.map((run, index) => <div key={index} className="rc-rich-run"><Field label={`片段 ${index + 1}`}><input aria-label={`片段 ${index + 1}`} value={run.text} onChange={(event) => patch({ runs: p.runs.map((item, at) => at === index ? { ...item, text: event.target.value } : item) })} /></Field><ColorField label={`片段 ${index + 1} 颜色`} value={run.color ?? p.color} onChange={(color) => patch({ runs: p.runs.map((item, at) => at === index ? { ...item, color } : item) })} />{run.link !== undefined && <Field label={`片段 ${index + 1} 链接`}><input value={run.link} onChange={(event) => patch({ runs: p.runs.map((item, at) => at === index ? { ...item, link: event.target.value } : item) })} /></Field>}</div>)}
    </PropertySection>;
  }
  if (type === 'Image' || type === 'Video') return <><PropertySection title="素材"><MediaEditor value={p.src ?? ''} type={type} onChange={(value, mediaType) => { if (mediaType && mediaType !== type) onMediaType?.(mediaType); patch({ src: value }); }} onError={onStatus} /></PropertySection>{type === 'Video' && <PropertySection title="播放设置">{[['autoPlay', '自动播放', false], ['loop', '循环播放', false], ['muted', '静音', true], ['controls', '播放控件', true]].map(([key, label, fallback]) => <SegmentedField key={key} label={label} value={(p[key] ?? fallback) ? 'yes' : 'no'} options={[[ 'no', '关闭' ], [ 'yes', '开启' ]]} onChange={(value) => patch({ [key]: value === 'yes' })} />)}</PropertySection>}</>;
  if (type === 'Wallet') return <PropertySection title="钱包属性"><Select label="钱包类型" value={p.method ?? 'apple'} options={[[ 'apple', 'Apple Pay' ], [ 'google', 'Google Pay' ]]} onChange={(method) => patch({ method })} /></PropertySection>;
  if (type === 'Icon') return <PropertySection title="图标属性"><Select label="类型" value={p.icon ?? 'check'} options={Object.entries(typeNames)} onChange={(icon) => patch({ icon })} />{p.icon === 'number' && <NumberField label="数字" value={p.number ?? 1} max={99} unit="" onChange={(number) => patch({ number })} />}<ColorField label="颜色" value={p.color} onChange={(color) => patch({ color })} /><NumberField label="透明度" value={p.opacity} min={0} max={100} unit="%" onChange={(opacity) => patch({ opacity })} /></PropertySection>;
  if (type === 'Package') return <PropertySection title="商品属性"><Select label="商品 SKU" value={document.products[p.dataKey]?.skuId ?? ''} options={[[ '', '模板示例数据' ], ...demoSkus.map((sku) => [sku.id, `${sku.displayName} · ${sku.id}`])]} onChange={(skuId) => changeProduct('skuId', skuId)} /><Select label="价格显示" value={p.priceMode ?? '1'} options={[[ '1', '总价' ], [ '0', '月均价' ], [ '3', '总价 / 月均参考价' ], [ '4', '月均价 / 总参考价' ]]} onChange={(priceMode) => patch({ priceMode })} /><Select label="默认选中" value={p.defaultSelected ? 'yes' : 'no'} options={[[ 'yes', '是' ], [ 'no', '否' ]]} onChange={(value) => setDefaultPackage(value === 'yes')} /><Field label="选择组"><input value={p.group ?? selected.id} onChange={(event) => patch({ group: event.target.value })} /></Field>{!document.products[p.dataKey]?.skuId && Object.entries(fieldNames).map(([key, label]) => <Field key={key} label={label}><input value={document.products[p.dataKey]?.[key] ?? ''} onChange={(event) => changeProduct(key, event.target.value)} /></Field>)}</PropertySection>;
  if (type === 'Button' || type === 'PurchaseButton' || type === 'TabButton') return <PropertySection title={type === 'TabButton' ? '标签按钮属性' : '动作属性'}>{type === 'TabButton' ? <><Select label="目标标签页" value={p.target ?? ''} options={[[ '', '未绑定' ], ...[...nodes.values()].filter((node) => node.type === 'Tabs').map((node) => [node.id, node.name])]} onChange={(target) => patch({ target, index: 0 })} /><Select label="对应页面" value={nodes.get(p.target)?.children.length ? p.index ?? 0 : ''} disabled={!nodes.get(p.target)?.children.length} options={nodes.get(p.target)?.children.length ? nodes.get(p.target).children.map((node,index)=>[index,node.name]) : [['','未绑定']]} onChange={(value) => patch({ index: Number(value) })} /></> : <ActionFields p={p} patch={patch} nodes={nodes} parents={parents} type={type} />}</PropertySection>;
  if (type === 'Tabs' || type === 'Carousel' || type === 'Flow') return <PropertySection title="页面属性"><Select label="默认页面" value={p.defaultIndex ?? 0} options={selected.children.map((node, index) => [index, node.name])} onChange={(value) => { patch({ defaultIndex: Number(value) }); setNavigation({ [selected.id]: Number(value) }); }} />{type === 'Carousel' && <><NumberField label="页面间距" value={p.pageSpacing ?? 0} max={200} onChange={(pageSpacing) => patch({ pageSpacing })} /><NumberField label="邻页露出" value={p.pagePeek ?? 0} max={100} onChange={(pagePeek) => patch({ pagePeek })} /><SegmentedField label="循环播放" value={p.loop ? 'yes' : 'no'} options={[[ 'no', '关闭' ], [ 'yes', '开启' ]]} onChange={(value) => patch({ loop: value === 'yes' })} /><SegmentedField label="自动切换" value={p.autoPlay ? 'yes' : 'no'} options={[[ 'no', '关闭' ], [ 'yes', '开启' ]]} onChange={(value) => patch({ autoPlay: value === 'yes' })} />{p.autoPlay && <NumberField label="切换间隔" value={p.autoPlayInterval ?? 3000} min={250} max={60000} unit="ms" onChange={(autoPlayInterval) => patch({ autoPlayInterval })} />}<Select label="分页器位置" value={p.pageControlPosition ?? 'bottom'} options={[[ 'top', '顶部' ], [ 'bottom', '底部' ]]} onChange={(pageControlPosition) => patch({ pageControlPosition })} /><ColorField label="分页指示器颜色" value={p.dotColor ?? '#6d47e8'} onChange={(dotColor) => patch({ dotColor })} /><ColorField label="当前分页颜色" value={p.activeDotColor ?? p.dotColor ?? '#6d47e8'} onChange={(activeDotColor) => patch({ activeDotColor })} /></>}</PropertySection>;
  if (type === 'Toggle') return <PropertySection title="控件属性"><Select label="控件类型" value={p.control ?? 'switch'} options={[[ 'switch', '开关' ], [ 'checkbox', '勾选框' ]]} onChange={(control) => patch({ control })} />{!p.switchTarget && <SegmentedField label="初始状态" value={p.initial ? 'yes' : 'no'} options={[[ 'no', '关闭' ], [ 'yes', '开启' ]]} onChange={(value) => patch({ initial: value === 'yes' })} />}<SegmentedField label="购买前必须勾选" value={p.required ? 'yes' : 'no'} options={[[ 'no', '否' ], [ 'yes', '是' ]]} onChange={(value) => patch({ required: value === 'yes' })} /></PropertySection>;
  if (type === 'Countdown') return <PropertySection title="倒计时属性"><Field label="目标时间（UTC）"><input aria-label="目标时间（UTC）" value={p.deadline ?? ''} placeholder="2026-12-31T23:59:59Z" onChange={(event) => patch({ deadline: event.target.value })} /></Field>{!p.deadline && <Field label="起始时长"><input value={p.start ?? '00:10:00'} onChange={(event) => patch({ start: event.target.value })} /></Field>}<Select label="计时单位" value={p.countFrom ?? 'hours'} options={[[ 'days', '天' ], [ 'hours', '小时' ], [ 'minutes', '分钟' ]]} onChange={(countFrom) => patch({ countFrom })} />{!selected.children.length && <><Field label="前缀"><input value={p.prefix ?? ''} onChange={(event) => patch({ prefix: event.target.value })} /></Field><Field label="后缀"><input value={p.suffix ?? ''} onChange={(event) => patch({ suffix: event.target.value })} /></Field></>}<Select label="预览状态" value={p.previewState ?? 'auto'} options={[[ 'auto', '自动计时' ], [ 'active', '计时中' ], [ 'ended', '已结束' ], [ 'fallback', '兜底' ]]} onChange={(previewState) => { patch({ previewState }); setNavigation({ [selected.id]: previewState === 'auto' ? undefined : previewState }); }} /></PropertySection>;
  if (type === 'Switch' || type === 'ExpressCheckout') return <PropertySection title="状态属性"><Select label="预览状态" value={type === 'Switch' ? p.defaultIndex ?? 0 : p.previewState ?? 'available'} options={type === 'Switch' ? [[0, '关闭'], [1, '开启']] : [[ 'available', '可用' ], [ 'unavailable', '不可用' ], [ 'loading', '加载中' ]]} onChange={(value) => { const next = type === 'Switch' ? { defaultIndex: Number(value) } : { previewState: value }; patch(next); setNavigation({ [selected.id]: type === 'Switch' ? Number(value) : value }); }} /></PropertySection>;
  if (type === 'Custom') return <PropertySection title="网页内容"><Field label="HTML"><textarea className="ne-code-input" value={p.html ?? ''} onChange={(event) => patch({ html: event.target.value })} /></Field></PropertySection>;
  return null;
}

function LayoutSection({ selected, p, patch }) {
  const isContainer = CONTAINER_TYPES.has(selected.type) && selected.type !== 'Carousel';
  return <>
    {isContainer && <PropertySection title="布局" className="rc-layout-section"><SegmentedField label="轴向" value={p.axis} icon options={[[ 'horizontal', '横向', ArrowRight ], [ 'vertical', '纵向', ArrowDown ], [ 'overlay', '叠放', Layers3 ]]} onChange={(axis) => patch({ axis })} /><SegmentedField label="对齐" value={p.align} icon options={[[ 'start', '起始', p.axis === 'horizontal' ? AlignStartVertical : AlignStartHorizontal ], [ 'center', '居中', p.axis === 'horizontal' ? AlignCenterVertical : AlignCenterHorizontal ], [ 'end', '末尾', p.axis === 'horizontal' ? AlignEndVertical : AlignEndHorizontal ], [ 'stretch', '拉伸', Layers3 ]]} onChange={(align) => patch({ align })} />{p.axis !== 'overlay' && <><Select label="分布" value={p.justify} options={[[ 'start', '起始' ], [ 'center', '居中' ], [ 'end', '末尾' ], [ 'between', '两端分布' ]]} onChange={(justify) => patch({ justify })} /><NumberField label="子项间距" value={p.gap} max={200} onChange={(gap) => patch({ gap })} /></>}{p.axis === 'horizontal' && <SegmentedField label="换行" value={p.wrap ? 'yes' : 'no'} options={[[ 'no', '不换行' ], [ 'yes', '换行' ]]} onChange={(value) => patch({ wrap: value === 'yes' })} />}</PropertySection>}
    <PropertySection title="尺寸"><SizeField axis="width" label="宽度" p={p} patch={patch} fixedOnly={selected.type === 'Icon'} /><SizeField axis="height" label="高度" p={p} patch={patch} fixedOnly={selected.type === 'Icon'} /></PropertySection>
    <PropertySection title="布局间距" className="rc-spacing-section"><SpacingField title="内边距" prefix="padding" p={p} patch={patch} /><SpacingField title="外边距" prefix="margin" p={p} patch={patch} /></PropertySection>
  </>;
}

function AppearanceSection({ selected, p, patch, onStatus }) {
  const image = selected.type === 'Image', video = selected.type === 'Video';
  const mask = imageMask(p);
  const fill = p.fillEnabled ?? (p.fillType !== 'color' || p.background !== 'transparent');
  if (selected.type === 'Text') return null;
  if (selected.type === 'Icon') {
    const enabled = p.iconBackground !== 'transparent' || p.radius > 0 || p.borderWidth > 0;
    return <PropertySection title="图标背景" optional><OptionalToggle enabled={enabled} onChange={(value) => patch(value ? { iconBackground: '#f0f0f1' } : { iconBackground: 'transparent', radius: 0, borderWidth: 0 })}/>{enabled && <><ColorField label="背景颜色" value={p.iconBackground} onChange={(iconBackground) => patch({ iconBackground })}/><NumberField label="圆角" value={p.radius} onChange={(radius) => patch({radius})}/><NumberField label="边框宽度" value={p.borderWidth} max={20} onChange={(borderWidth) => patch({borderWidth})}/><ColorField label="边框颜色" value={p.borderColor} onChange={(borderColor) => patch({borderColor})}/></>}</PropertySection>;
  }
  return <><PropertySection title="外观">
    {image ? <Select label="遮罩" value={mask} options={[[ 'rectangle', '矩形' ], [ 'circle', '圆形' ]]} onChange={(value) => patch({ mask: value, shape: 'rectangle' })} /> : <Select label="形状" value={p.shape ?? 'rectangle'} options={[[ 'rectangle', '矩形' ], [ 'pill', '胶囊' ], ...(p.shape === 'circle' ? [[ 'circle', '圆形' ]] : [])]} onChange={(shape) => patch({ shape })} />}
    {selected.type !== 'Icon' && <NumberField label="透明度" value={p.opacity} min={0} max={100} unit="%" onChange={(opacity) => patch({ opacity })} />}
    {selected.type === 'TabButton' && <ColorField label="文字颜色" value={p.color} onChange={(color) => patch({ color })} />}
    {(image ? mask === 'rectangle' : p.shape === 'rectangle') && <NumberField label="圆角" value={image && p.shape === 'pill' ? 999 : p.radius} onChange={(radius) => patch({ radius, ...(image ? { shape: 'rectangle' } : {}) })} />}
    {(image || video) && <Select label="素材适配" value={p.objectFit} options={[[ 'cover', '填满' ], [ 'contain', '完整显示' ], ...(p.objectFit === 'fill' ? [[ 'fill', '拉伸' ]] : []), ...(p.objectFit === 'none' ? [[ 'none', '原始尺寸' ]] : [])]} onChange={(objectFit) => patch({ objectFit })} />}
    {image && <ColorField label="叠加层颜色" value={p.overlayColor ?? 'transparent'} onChange={(overlayColor) => patch({ overlayColor })} />}
  </PropertySection>
    <PropertySection title="填充" optional><OptionalToggle enabled={fill} onChange={(enabled) => patch({ fillEnabled: enabled })}/>{fill && <><SegmentedField label="背景类型" value={p.fillType ?? 'color'} options={[[ 'color', '颜色' ], [ 'image', '图片' ], ...(CONTAINER_TYPES.has(selected.type) ? [[ 'video', '视频' ]] : [])]} onChange={(fillType) => patch({ fillType, fillEnabled: true })} />{p.fillType === 'color' ? <ColorField label="背景颜色" value={p.background} onChange={(background) => patch({ background })} /> : <><MediaEditor background type={p.fillType === 'video' ? 'Video' : 'Screen'} value={p.fillType === 'video' ? p.backgroundVideo ?? '' : p.backgroundImage ?? ''} onChange={(value) => patch(p.fillType === 'video' ? { backgroundVideo: value } : { backgroundImage: value })} onError={onStatus} /><Select label="背景适配" value={p.backgroundFit ?? 'cover'} options={[[ 'cover', '填满' ], [ 'contain', '完整显示' ], [ 'fill', '拉伸' ], [ 'none', '原始尺寸' ]]} onChange={(backgroundFit) => patch({ backgroundFit })} /></>}</>}</PropertySection>
    <PropertySection title="边框" optional><OptionalToggle enabled={Number(p.borderWidth) > 0} onChange={(enabled) => patch({ borderWidth: enabled ? Math.max(1, Number(p.borderWidth) || 1) : 0 })} />{Number(p.borderWidth) > 0 && <div className="rc-two-columns"><NumberField label="边框宽度" value={p.borderWidth} max={20} onChange={(borderWidth) => patch({ borderWidth })} /><ColorField label="边框颜色" value={p.borderColor} onChange={(borderColor) => patch({ borderColor })} /></div>}</PropertySection>
    <PropertySection title="阴影" optional><OptionalToggle enabled={Boolean(Number(p.shadowBlur) || Number(p.shadowX) || Number(p.shadowY))} onChange={(enabled) => patch(enabled ? { shadowBlur: Math.max(4, Number(p.shadowBlur) || 4), shadowX: Number(p.shadowX) || 0, shadowY: Number(p.shadowY) || 2 } : { shadowBlur: 0, shadowX: 0, shadowY: 0 })} />{Boolean(Number(p.shadowBlur) || Number(p.shadowX) || Number(p.shadowY)) && <div className="rc-two-columns"><NumberField label="X 偏移" value={p.shadowX ?? 0} min={-100} max={100} onChange={(shadowX) => patch({ shadowX })} /><NumberField label="Y 偏移" value={p.shadowY ?? 0} min={-100} max={100} onChange={(shadowY) => patch({ shadowY })} /><NumberField label="模糊" value={p.shadowBlur ?? 0} max={100} onChange={(shadowBlur) => patch({ shadowBlur })} /><ColorField label="阴影颜色" value={p.shadowColor ?? '#000000'} onChange={(shadowColor) => patch({ shadowColor })} /></div>}</PropertySection>
  </>;
}

export default function RevenueCatProperties({ selected, p, patch, document, nodes, parents, findPackage, resolveText, changeProduct, fieldNames, demoSkus, setNavigation, onStatus, setDefaultPackage, onMediaType }) {
  const [packageState, setPackageState] = React.useState('default');
  const stateful = ['Package', 'TabButton'].includes(selected.type);
  React.useEffect(() => { if (stateful) setNavigation({ [`package-style:${selected.id}`]: packageState }); }, [stateful, selected.id, packageState, setNavigation]);
  const styleP = stateStyleProps(p, stateful && packageState === 'selected');
  const stylePatch = stateful && packageState === 'selected' ? (values) => patch(Object.fromEntries(Object.entries(values).map(([key, value]) => [selectedStyleKey(key), value]))) : patch;
  const bold = Boolean(p.bold) || Number(p.fontWeight) >= 600;
  return <div className="rc-properties-body">
    <ContentSection selected={selected} p={p} patch={patch} document={document} nodes={nodes} parents={parents} findPackage={findPackage} resolveText={resolveText} changeProduct={changeProduct} fieldNames={fieldNames} demoSkus={demoSkus} setNavigation={setNavigation} onStatus={onStatus} setDefaultPackage={setDefaultPackage} onMediaType={onMediaType} />
    {stateful && <PropertySection title="状态样式"><SegmentedField label="状态" value={packageState} options={[[ 'default', '默认' ], [ 'selected', '选中' ]]} onChange={(value) => { setPackageState(value); setNavigation({ [`package-style:${selected.id}`]: value }); }} /></PropertySection>}
    {selected.type === 'Text' && <PropertySection title="文字样式">
      <div className="rc-two-columns"><Select label="字体" value={p.fontFamily ?? 'system'} options={[[ 'system', '系统字体' ], [ 'serif', '衬线字体' ], [ 'mono', '等宽字体' ]]} onChange={(fontFamily) => patch({ fontFamily })} /><NumberField label="字号" value={p.fontSize} min={8} max={160} onChange={(fontSize) => patch({ fontSize })} /></div>
      <Select label="字重" value={p.bold ? 700 : p.fontWeight} options={[[100,'极细'],[200,'特细'],[300,'细体'],[400,'常规'],[500,'中等'],[600,'半粗'],[700,'粗体'],[800,'特粗'],[900,'极粗']]} onChange={(value) => patch({ fontWeight: Number(value) })} />
      <div className="rc-text-toolbar">{[['粗体', bold, 'bold'], ['斜体', p.italic, 'italic'], ['下划线', p.underline, 'underline'], ['删除线', p.strike, 'strike']].map(([name, active, key]) => <button key={key} type="button" aria-label={name} aria-pressed={Boolean(active)} className={active ? 'active' : ''} onClick={() => patch({ [key]: !active })}>{name}</button>)}</div>
      <ColorField label="文字颜色" value={p.color} onChange={(color) => patch({ color })} /><Select label="文字对齐" value={p.textAlign} options={[[ 'left', '左对齐' ], [ 'center', '居中' ], [ 'right', '右对齐' ]]} onChange={(textAlign) => patch({ textAlign })} />
      <ColorField label="背景颜色" value={p.fillEnabled === false ? 'transparent' : p.background === 'transparent' ? p.textBackground ?? p.background : p.background} onChange={(background) => patch({background})}/>
    </PropertySection>}
    {selected.type === 'Countdown' && !selected.children.length && <PropertySection title="文字样式"><div className="rc-two-columns"><NumberField label="字号" value={p.fontSize} min={8} max={160} onChange={(fontSize) => patch({ fontSize })} /><ColorField label="颜色" value={p.color} onChange={(color) => patch({ color })} /></div></PropertySection>}
    <LayoutSection selected={selected} p={styleP} patch={stylePatch} />
    <AppearanceSection selected={selected} p={styleP} patch={stylePatch} onStatus={onStatus} />
  </div>;
}
