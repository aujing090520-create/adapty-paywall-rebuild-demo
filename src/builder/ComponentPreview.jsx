import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, LockKeyhole, Star, Bell, Moon, Heart, Users, Clock3, Gift, ChevronRight, Dumbbell, Download, MapPin, Flower2, Activity, Ticket, Ban, Blocks, Archive, Shirt, Armchair, ScanSearch, CircleHelp, LogIn, PersonStanding } from 'lucide-react';
import { componentProps, resolveComponentText, indexDocument } from './componentDocument.js';

const PreviewContext = createContext(null);
const TimerContext = createContext(null);
const icons = { check: Check, lock: LockKeyhole, star: Star, bell: Bell, moon: Moon, heart: Heart, group: Users, clock: Clock3, gift: Gift, arrow: ChevronRight, dumbbell: Dumbbell, weight: Dumbbell, running: PersonStanding, download: Download, map: MapPin, flower: Flower2, activity: Activity, ticket: Ticket, noads: Ban, blocks: Blocks, archive: Archive, shirt: Shirt, seat: Armchair, scan: ScanSearch, help: CircleHelp, access: LogIn };
export const safeMediaSource = (url) => /^(https?:\/\/|\/(?!\/)|data:(image|video)\/)/i.test(url ?? '') ? url : '';
const dimension = (mode, value) => mode === 'fixed' ? `${Math.max(0, Number(value) || 0)}px` : mode === 'fit' ? 'fit-content' : '100%';
export function componentStyle(node) {
  const props = componentProps(node);
  const numeric = (key, fallback = 0) => Number.isFinite(Number(props[key])) ? Number(props[key]) : fallback;
  return {
    width: dimension(props.widthMode, props.width), height: props.heightMode === 'fixed' ? dimension('fixed', props.height) : undefined,
    minWidth: 0, flexShrink: 0, boxSizing: 'border-box',
    minHeight: props.minHeight ?? undefined, background: props.background,
    color: node.props.color, fontSize: numeric('fontSize', 14), fontWeight: props.fontWeight,
    textAlign: node.props.textAlign, opacity: numeric('opacity', 100) / 100, borderRadius: numeric('radius'),
    border: props.borderWidth ? `${numeric('borderWidth')}px solid ${props.borderColor}` : undefined,
    padding: ['Top', 'Right', 'Bottom', 'Left'].map((side) => `${numeric(`padding${side}`)}px`).join(' '),
    margin: ['Top', 'Right', 'Bottom', 'Left'].map((side) => `${numeric(`margin${side}`)}px`).join(' '),
    alignSelf: props.alignSelf === 'auto' ? undefined : props.alignSelf,
    ...(node.props.backgroundImage ? { backgroundImage: `url(${JSON.stringify(safeMediaSource(node.props.backgroundImage))})`, backgroundSize: node.props.backgroundFit ?? 'cover', backgroundPosition: 'center' } : {}),
  };
}
function containerStyle(node) {
  const p = componentProps(node);
  if (p.axis === 'overlay') return { display: 'grid', alignItems: 'stretch' };
  return { display: 'flex', flexDirection: p.axis === 'horizontal' ? 'row' : 'column', gap: `${Math.max(0, Number(p.gap) || 0)}px`, alignItems: ({ start: 'flex-start', end: 'flex-end', stretch: 'stretch', center: 'center' }[p.align]) ?? 'stretch', justifyContent: ({ start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between' }[p.justify]) ?? 'flex-start', flexWrap: p.wrap ? 'wrap' : 'nowrap' };
}
export function NativeComponent({ node, packageNode = null, floating = false }) {
  const context = useContext(PreviewContext);
  const timer = useContext(TimerContext);
  const { document, selectedId, onSelect, editing, runtime, setRuntime, runAction } = context;
  const props = componentProps(node);
  if (props.hidden || (['overlay','sheet'].includes(props.presentation) && !floating)) return null;
  if (props.visibleWhen && Boolean(runtime[props.visibleWhen.id] ?? context.nodeIndex.get(props.visibleWhen.id)?.props.initial) !== props.visibleWhen.value) return null;
  const currentPackage = node.type === 'Package' ? node : packageNode;
  const select = (event) => { if (editing) { event.stopPropagation(); onSelect(node.id); } };
  const style = componentStyle(node);
  const attributes = { 'data-component-id': node.id, 'data-component-type': node.type, 'data-axis': props.axis, 'data-width': props.widthMode, className: `nc-node nc-${node.type.toLowerCase()} ${props.presentation === 'overlay' ? 'nc-overlay' : ''} ${editing && selectedId === node.id ? 'nc-inspected' : ''}`, style, onClick: select };
  const children = (items = node.children) => items.map((child) => <NativeComponent key={child.id} node={child} packageNode={currentPackage} />);
  if (node.type === 'Text') {
    const value = props.timerField && timer ? timer[props.timerField] ?? '' : resolveComponentText(node, document, currentPackage);
    if (node.props.binding && !value) return null;
    return <div {...attributes} style={{ ...style, textDecoration: props.strike ? 'line-through' : undefined, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.35 }}>{node.props.runs?.length && !node.props.binding ? node.props.runs.map((run, index) => <React.Fragment key={index}>{run.breakBefore && <br />}<span style={{ color: run.color, fontSize: run.fontSize ? Number(run.fontSize) : undefined, fontWeight: run.fontWeight ?? (run.bold ? 700 : undefined), fontStyle: run.italic ? 'italic' : undefined, textDecoration: run.strikethrough ? 'line-through' : run.underline || run.link !== undefined ? 'underline' : undefined }} onClick={!editing && /^https?:\/\//i.test(run.link ?? '') ? (event) => { event.stopPropagation(); window.open(run.link, '_blank', 'noopener,noreferrer'); } : undefined}>{run.text}</span></React.Fragment>) : value}</div>;
  }
  if (node.type === 'Image' || node.type === 'Video') {
    const src = safeMediaSource(props.src);
    return <div {...attributes}>{src ? node.type === 'Video' ? <video src={src} muted playsInline controls style={{ width: '100%', height: '100%', objectFit: props.objectFit }} /> : <img src={src} alt={node.name || '图片'} draggable={false} style={{ width: '100%', height: '100%', objectFit: props.objectFit, display: 'block', borderRadius: 'inherit' }} /> : <div className="nc-empty-media" />}</div>;
  }
  if (node.type === 'Custom') return <div {...attributes}><iframe title={node.name} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; font-src data:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;box-sizing:border-box;font-family:Arial,sans-serif}</style></head><body>${props.html ?? ''}</body></html>`} style={{width:'100%',height:'100%',border:0,pointerEvents:editing?'none':'auto'}} /></div>;
  if (node.type === 'Icon') {
    const Icon = icons[props.icon];
    return <div {...attributes}>{Icon ? <Icon size={props.iconSize ?? props.fontSize ?? 20} /> : props.icon === 'number' ? props.number ?? '1' : props.icon ?? '✓'}</div>;
  }
  if (node.type === 'Toggle') return <div {...attributes}><input type="checkbox" role={props.control === 'checkbox' ? 'checkbox' : 'switch'} aria-label={node.name} checked={props.switchTarget ? (runtime[props.switchTarget] ?? context.nodeIndex.get(props.switchTarget)?.props.defaultIndex ?? 0) === 1 : runtime[node.id] ?? props.initial ?? false} onChange={(event) => setRuntime((current) => ({ ...current, [node.id]: event.target.checked, ...(props.switchTarget ? {[props.switchTarget]:event.target.checked?1:0} : {}) }))} onClick={(event) => { event.stopPropagation(); if (editing) onSelect(node.id); }} /></div>;
  if (node.type === 'Countdown') return <div {...attributes} style={{...style,...containerStyle(node)}}>{node.children.length ? <CountdownContent key={`${node.id}-${props.start}-${props.deadline}`} node={node} context={context} packageNode={currentPackage}/> : <Countdown key={`${node.id}-${props.start}`} props={props} />}</div>;
  if (node.type === 'Wallet') return <div {...attributes} role="button" tabIndex={0} style={{...style,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={(event)=>{select(event); if(!editing) {event.stopPropagation(); context.onStatus('钱包结账预览：未发起真实交易');}}}>{props.method === 'google' ? 'Google Pay' : 'Apple Pay'}</div>;
  if (node.type === 'Switch') {
    const chosen = runtime[node.id] ?? props.defaultIndex ?? 0;
    return <div {...attributes} style={{...style,...containerStyle(node)}}>{children(node.children.filter((child)=>child.type !== 'SwitchCase' || child.props.index === chosen))}</div>;
  }
  if (node.type === 'ExpressCheckout') return <div {...attributes} style={{...style,...containerStyle(node)}}>{children(node.children.filter((child)=>child.props.state === (runtime[node.id] ?? props.previewState ?? 'available')))}</div>;
  if (node.type === 'Package') {
    const group = props.group ?? node.id;
    const selected = runtime[`package:${group}`] ? runtime[`package:${group}`] === node.id : Boolean(props.defaultSelected);
    return <div {...attributes} role="button" tabIndex={0} aria-pressed={selected} style={{ ...style, ...containerStyle(node), ...(selected ? { borderColor: props.selectedBorder ?? '#167aff', background: props.selectedBackground ?? '#ffffff' } : {}) }} onClick={(event) => { select(event); setRuntime((current) => ({ ...current, [`package:${group}`]: node.id })); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setRuntime((current) => ({ ...current, [`package:${group}`]: node.id })); } }}>{children()}</div>;
  }
  if (['Tabs', 'Carousel', 'Flow'].includes(node.type)) {
    const chosen = Math.max(0, Math.min(node.children.length - 1, runtime[node.id] ?? props.defaultIndex ?? 0));
    return <div {...attributes} style={{ ...style, ...containerStyle(node) }}>{node.children[chosen] && children([node.children[chosen]])}{node.type === 'Carousel' && node.children.length > 1 && <div className="nc-pagination">{node.children.map((child, index) => <button type="button" key={child.id} title={`第 ${index + 1} 页`} aria-label={`第 ${index + 1} 页`} aria-current={chosen === index ? 'true' : undefined} style={{ color: props.dotColor ?? '#6d47e8' }} onClick={(event) => { event.stopPropagation(); setRuntime((current) => ({ ...current, [node.id]: index })); }}>●</button>)}</div>}</div>;
  }
  if (['Button','TabButton','PurchaseButton'].includes(node.type)) {
    const active = node.type === 'TabButton' && (runtime[props.target] ?? context.nodeIndex.get(props.target)?.props.defaultIndex ?? 0) === props.index;
    return <div {...attributes} role="button" tabIndex={0} style={{ ...style, ...containerStyle(node), ...(active ? { background: props.selectedBackground ?? '#167aff', color: props.selectedColor ?? '#ffffff' } : {}) }} onClick={(event) => { select(event); if (node.type === 'TabButton') setRuntime((current) => ({ ...current, [props.target]: props.index })); else if (!editing) { event.stopPropagation(); runAction(node); } }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if (editing) onSelect(node.id); else if (node.type === 'TabButton') setRuntime((current) => ({ ...current, [props.target]: props.index })); else runAction(node); } }}>{children()}</div>;
  }
  if(node.type==='Screen'&&node.children.some((child)=>['Header','Footer'].includes(child.type)))return <div {...attributes} style={{...style,display:'flex',flexDirection:'column',minHeight:844}}>{children(node.children.filter((child)=>child.type==='Header'))}<div className="nc-screen-content" style={{...containerStyle(node),flex:'1 0 auto',minWidth:0}}>{children(node.children.filter((child)=>!['Header','Footer'].includes(child.type)))}</div>{children(node.children.filter((child)=>child.type==='Footer'))}</div>;
  return <div {...attributes} style={{ ...style, ...containerStyle(node), ...(['Header','Footer'].includes(node.type)?{position:'sticky',[node.type==='Header'?'top':'bottom']:0,zIndex:4}:{} ) }}>{node.type === 'Timeline' ? node.children.map((child, index) => <div className="nc-timeline-step" key={child.id} style={{ borderColor: props.lineColor ?? '#d6d2e8' }}><NativeComponent node={child} packageNode={currentPackage} />{index < node.children.length - 1 && <span className="nc-timeline-line" />}</div>) : children()}</div>;
}
function CountdownContent({node,context,packageNode}) {
  const [now,setNow] = useState(Date.now);
  const [opened] = useState(Date.now);
  useEffect(()=>{const interval=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(interval);},[]);
  const [h,m,s] = String(node.props.start ?? '00:10:00').split(':').map(Number);
  const deadline = node.props.deadline ? Date.parse(node.props.deadline) : opened + ((h||0)*3600+(m||0)*60+(s||0))*1000;
  const seconds = Math.max(0,Math.ceil((deadline-now)/1000)||0);
  const state = context.runtime[node.id] ?? (node.props.previewState && node.props.previewState !== 'auto' ? node.props.previewState : seconds ? 'active' : 'ended');
  const values = {hours:String(Math.floor(seconds/3600)).padStart(2,'0'),minutes:String(Math.floor(seconds/60)%60).padStart(2,'0'),seconds:String(seconds%60).padStart(2,'0')};
  return <TimerContext.Provider value={values}>{node.children.filter((child)=>child.props.state === state).map((child)=><NativeComponent key={child.id} node={child} packageNode={packageNode}/>)}</TimerContext.Provider>;
}
function Countdown({ props }) {
  const parse = (value) => { const parts = String(value ?? '00:00:00').split(':').map(Number); return parts.length === 3 && parts.every(Number.isFinite) ? Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]) : 0; };
  const [remaining, setRemaining] = useState(() => parse(props.start));
  useEffect(() => { const timer = window.setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, []);
  const parts = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60];
  return <span className="nc-countdown"><span style={{ color: props.prefixColor }}>{props.prefix}</span>{parts.map((part, index) => <React.Fragment key={index}>{index > 0 && <span>:</span>}<strong style={{ background: props.digitBackground, borderRadius: 4, padding: '0 3px' }}>{String(part).padStart(2, '0')}</strong></React.Fragment>)}<span>{props.suffix}</span></span>;
}
export default function ComponentPreview({ document, selectedId, onSelect, editing, navigation, onStatus }) {
  const [runtime, setRuntime] = useState({});
  const viewport = useRef(null), [scale, setScale] = useState(0.82);
  useEffect(() => { setRuntime((current) => ({ ...current, ...navigation })); }, [navigation]);
  useLayoutEffect(() => { const resize = () => setScale((viewport.current?.clientWidth ?? 320) / 390); const observer = new ResizeObserver(resize); if (viewport.current) observer.observe(viewport.current); resize(); return () => observer.disconnect(); }, []);
  useEffect(() => { const root = viewport.current; const element = [...(root?.querySelectorAll('[data-component-id]') ?? [])].find((item) => item.dataset.componentId === selectedId); if (!root || !element) return; const outer = root.getBoundingClientRect(), inner = element.getBoundingClientRect(); if (inner.top < outer.top) root.scrollTop += inner.top - outer.top; else if (inner.bottom > outer.bottom) root.scrollTop += Math.min(inner.top - outer.top, inner.bottom - outer.bottom); }, [selectedId, navigation]);
  const runAction = (node) => {
    const action = node.props.action ?? {};
    if (action.action === 'OpenSheet') {
      const target = indexDocument(document).nodes.get(action.actionPage);
      if (target?.type === 'BottomSheet') setRuntime((current)=>({...current,overlay:target.id})); else onStatus('请先选择有效的底部弹层');
    } else if (action.action === 'CloseSheet') {
      setRuntime((current)=>({...current,overlay:null}));
    } else if (action.action === 'OpenURL') {
      if (/^https?:\/\//i.test(action.actionUrl ?? '')) window.open(action.actionUrl, '_blank', 'noopener,noreferrer');
      else onStatus('请填写有效的 http 或 https 链接');
    } else if (action.action === 'OpenPage') {
      const { nodes, parents } = indexDocument(document), target = nodes.get(action.actionPage), owner = nodes.get(parents.get(target?.id));
      if (owner?.type === 'Flow') { setRuntime((current) => ({ ...current, [owner.id]: owner.children.findIndex((item) => item.id === target.id) })); if (viewport.current) viewport.current.scrollTop = 0; }
      else onStatus('尚未配置有效的目标页面');
    } else if (action.action === 'NextScreen') {
      const flow = findComponent(document.root, (item) => item.type === 'Flow');
      if (flow) setRuntime((current) => ({ ...current, [flow.id]: Math.min(flow.children.length - 1, (current[flow.id] ?? 0) + 1) }));
    } else if (action.action === 'Purchase') {
      const required = findComponent(document.root, (item) => item.type === 'Toggle' && item.props.required && !(runtime[item.id] ?? item.props.initial));
      onStatus(required ? '请先勾选同意协议' : '购买预览：未发起真实交易');
    } else onStatus(({ RestorePurchases: '恢复购买预览', Dismiss: '关闭预览', WebCheckout: '网页结账预览', OfferCodeRedemption: '优惠码兑换预览', OpenPage: '页面跳转预览' }[action.action]) ?? '未配置点击动作');
  };
  const nodeIndex = indexDocument(document).nodes, overlay = nodeIndex.get(runtime.overlay);
  return <PreviewContext.Provider value={{ document, nodeIndex, selectedId, onSelect, editing, runtime, setRuntime, runAction, onStatus }}><div className="phone native-phone"><div className="nc-viewport" ref={viewport}><div className="nc-design" style={{ zoom: scale }}><NativeComponent node={document.root} /></div></div>{overlay && <div className="nc-floating-overlay"><div className="nc-floating-backdrop" onClick={()=>setRuntime((current)=>({...current,overlay:null}))}/><div className="nc-floating-design" style={{zoom:scale,height:(viewport.current?.clientHeight??844)/scale}}><NativeComponent node={overlay} floating/></div></div>}</div></PreviewContext.Provider>;
}
function findComponent(node, predicate) { if (predicate(node)) return node; for (const child of node.children) { const result = findComponent(child, predicate); if (result) return result; } return null; }
