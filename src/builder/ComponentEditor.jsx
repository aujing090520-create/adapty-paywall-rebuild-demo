import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Copy, ChevronRight, ChevronDown, GripVertical, ArrowUp, ArrowDown, Eye, Pencil, Save, FolderOpen, X, Layers, Type, Image as ImageIcon, Package as PackageIcon, MoreHorizontal, MousePointerClick, Smartphone, Workflow, GalleryHorizontal, PanelTop, PanelBottom, Clock3, ToggleLeft, ListOrdered, Video, Star, Code, CreditCard, Columns2 } from 'lucide-react';
import { COMPONENT_NAMES, COMPONENT_TYPES, CONTAINER_TYPES, componentProps, importComponentDocument, indexDocument, validDocument, updateComponent, removeComponent, insertComponent, moveComponent, canContain, createNativeComponent, readComponentDocument, saveComponentDocument, cloneComponent, captureNativeComponent, resolveComponentText } from './componentDocument.js';
import { DEMO_SKUS } from '../productPricing.js';
import ComponentPreview from './ComponentPreview.jsx';
import ComponentPicker from './ComponentPicker.jsx';
import LayerActionsMenu from './LayerActionsMenu.jsx';
import { createCatalogComponent, upgradeCanonicalComponents, catalogFor } from './componentCatalog.js';
import { editorClipboard, copyFragment, pasteFragment, copyStyles, pasteStyles, wrapInStack } from './componentOperations.js';
import { treeChildren, compositionSummary, initialCollapsed } from './componentTree.js';
import './componentEditor.css';

const libraryKey = 'paywall-component-library-v3';
const fieldNames = { name: '商品名称', price: '主价格', reference: '参考价', supportingCopy: '辅助文案', savingCopy: '优惠说明', saveCopy: 'SAVE 文案', badgeText: '标签文字' };
const iconFor = (type) => ({ Screen: Smartphone, Flow: Workflow, Text: Type, Image: ImageIcon, Video, Icon: Star, Custom: Code, Package: PackageIcon, Button: MousePointerClick, PurchaseButton: CreditCard, Header: PanelTop, Footer: PanelBottom, BottomSheet: PanelBottom, Carousel: GalleryHorizontal, Tabs: Columns2, TabControl: Columns2, TabButton: MousePointerClick, Timeline: ListOrdered, Countdown: Clock3, Toggle: ToggleLeft, Switch: ToggleLeft, Wallet: CreditCard, ExpressCheckout: CreditCard }[type] ?? Layers);
function Field({ label, children }) { return <label className="ne-field"><span>{label}</span>{children}</label>; }
function Select({ label, value, onChange, options }) { return <Field label={label}><select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [key, name] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{name}</option>; })}</select></Field>; }
function NumberField({ label, value, onChange, min = 0, max = 2000 }) { return <Field label={label}><input type="number" min={min} max={max} value={Number.isFinite(Number(value)) ? value : 0} onChange={(event) => { if (event.target.value !== '') onChange(Math.max(min, Math.min(max, Number(event.target.value)))); }} /></Field>; }
function ColorField({ label, value, onChange }) { return <Field label={label}><div className="ne-color"><input type="color" aria-label={label} value={/^#[a-f\d]{6}$/i.test(value) ? value : '#ffffff'} onChange={(event) => onChange(event.target.value)} /><input aria-label={`${label}值`} value={value ?? 'transparent'} onChange={(event) => onChange(event.target.value)} /></div></Field>; }
function readLibrary() { try { const value = JSON.parse(localStorage.getItem(libraryKey) ?? '[]'); return Array.isArray(value) ? value.filter((item) => item?.name && validDocument({ version: 3, products: {}, root: { id: '$library', type: 'Screen', props: {}, children: [item.node] } })) : []; } catch { return []; } }

export default function ComponentEditor({ template, initialNodes }) {
  const [initial] = useState(() => { try { return { document: upgradeCanonicalComponents(readComponentDocument(localStorage, template?.id ?? 'blank') ?? importComponentDocument(initialNodes, template)), error: '' }; } catch (error) { return { document: upgradeCanonicalComponents(importComponentDocument(initialNodes, template)), error: error.message }; } });
  const [document, setDocument] = useState(initial.document);
  const [saveError, setSaveError] = useState(initial.error);
  const blockedSave = Boolean(initial.error);
  const latest = useRef(document);
  const [selectedId, setSelectedId] = useState(document.root.id);
  const [collapsed, setCollapsed] = useState(() => initialCollapsed(initial.document.root));
  const [editing, setEditing] = useState(true), [navigation, setNavigation] = useState({});
  const [addTarget, setAddTarget] = useState(null), [dragId, setDragId] = useState(null), [status, setStatus] = useState('');
  const [layerMenu,setLayerMenu] = useState(null), [renaming,setRenaming] = useState(null);
  const [library, setLibrary] = useState(readLibrary), [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const { nodes, parents } = useMemo(() => indexDocument(document), [document]);
  const selected = nodes.get(selectedId) ?? document.root;
  const p = componentProps(selected);
  const parent = nodes.get(parents.get(selected.id));
  const insertionParent = CONTAINER_TYPES.has(selected.type) ? selected : parent ?? document.root;
  const pickerParent = nodes.get(addTarget);
  const menuNode = nodes.get(layerMenu?.id);
  latest.current = document;
  useEffect(() => {
    if (blockedSave) return;
    const timer = setTimeout(() => setSaveError(saveComponentDocument(localStorage, document) ? '' : '本地保存失败，请缩小媒体文件后重试'), 250);
    return () => clearTimeout(timer);
  }, [document, blockedSave]);
  useEffect(() => { const flush = () => { if (!blockedSave) saveComponentDocument(localStorage, latest.current); }; window.addEventListener('pagehide', flush); return () => { flush(); window.removeEventListener('pagehide', flush); }; }, [blockedSave]);
  const select = (id) => {
    setSelectedId(id); setEditing(true);
    const reveal = {}; const expand = new Set(); let current = nodes.get(id);
    while (current) {
      expand.add(current.id);
      if (['overlay','sheet'].includes(current.props.presentation)) reveal.overlay = current.id;
      const owner = nodes.get(parents.get(current.id));
      if (owner && ['Tabs', 'Carousel', 'Flow'].includes(owner.type)) reveal[owner.id] = owner.children.findIndex((item) => item.id === current.id);
      if (owner?.type === 'Switch' && current.type === 'SwitchCase') reveal[owner.id] = current.props.index;
      if (owner?.type === 'ExpressCheckout' && current.type === 'CheckoutState') reveal[owner.id] = current.props.state;
      if (owner?.type === 'Countdown' && current.type === 'CountdownState') reveal[owner.id] = current.props.state;
      current = owner;
    }
    if (!reveal.overlay) reveal.overlay = null;
    setCollapsed((old) => new Set([...old].filter((key) => !expand.has(key))));
    setNavigation(reveal);
  };
  const patch = (props) => setDocument((current) => updateComponent(current, selected.id, { props }));
  const add = (type) => {
    const owner = nodes.get(addTarget); if(!owner)return;
    const next = createCatalogComponent(type);
    if(type==='TabButton'){ const tabs=findAncestor(owner.id,nodes,parents,'Tabs'); next.props={...next.props,target:tabs?.id ?? '',index:owner.children.length};next.children=[createCatalogComponent('Text')];next.children[0].props.text='标签'; }
    if(type==='TabControl'){const tabs=findAncestor(owner.id,nodes,parents,'Tabs');next.children=next.children.map((child)=>({...child,props:{...child.props,target:tabs?.id??''}}));}
    if(type==='SwitchCase')next.props.index=[0,1].find((index)=>!owner.children.some((child)=>child.type==='SwitchCase'&&child.props.index===index)) ?? 0;
    if(type==='CheckoutState')next.props.state=['available','unavailable','loading'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'available';
    if(type==='CountdownState')next.props.state=['active','ended','fallback'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'active';
    let updated=insertComponent(document,owner.id,next);
    if(updated===document)return setStatus('该容器无法添加此组件');
    if(type==='Package')updated={...updated,products:{...updated.products,[next.id]:{name:'商品名称',price:'',skuId:''}}};
    setDocument(updated);setAddTarget(null);setCollapsed((old)=>new Set([...old].filter((id)=>id!==owner.id)));setSelectedId(next.id);
  };
  const openAdd=(id)=>{select(id);setLayerMenu(null);setAddTarget(id);};
  const openMenu=(event,id)=>{event.preventDefault();event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();setLayerMenu({id,x:rect.right,y:rect.bottom});};
  const duplicateAt=(id)=>{const owner=nodes.get(parents.get(id));if(!owner)return;const result=pasteFragment(document,owner.id,copyFragment(document,id),owner.children.findIndex((node)=>node.id===id)+1);if(result.ids.length){setDocument(result.document);setSelectedId(result.ids[0]);}};
  const menuAction=(action)=>{
    const node=nodes.get(layerMenu?.id);if(!node)return;const owner=nodes.get(parents.get(node.id));setLayerMenu(null);
    if(action==='rename'){select(node.id);setRenaming({id:node.id,before:node.name});}
    if(action==='copy'){editorClipboard.fragment=copyFragment(document,node.id,node.id===document.root.id);setStatus('已复制图层');}
    if(action==='paste'){const target=CONTAINER_TYPES.has(node.type)?node:owner;if(!target)return;const result=pasteFragment(document,target.id,editorClipboard.fragment);if(result.ids.length){setDocument(result.document);setSelectedId(result.ids[0]);setCollapsed((old)=>new Set([...old].filter((id)=>id!==target.id)));}}
    if(action==='duplicate')duplicateAt(node.id);
    if(action==='wrap'){const result=wrapInStack(document,node.id);setDocument(result.document);setSelectedId(result.id);}
    if(action==='copyStyles'){editorClipboard.styles=copyStyles(node);setStatus('已复制样式');}
    if(action==='pasteStyles')setDocument(pasteStyles(document,node.id,editorClipboard.styles));
    if(action==='hide')setDocument(updateComponent(document,node.id,{props:{hidden:!node.props.hidden}}));
    if(action==='delete'&&owner){setDocument(removeComponent(document,node.id));setSelectedId(owner.id);}
    if(['up','down'].includes(action)&&owner){const at=owner.children.findIndex((child)=>child.id===node.id),target=at+(action==='up'?-1:1);if(target>=0&&target<owner.children.length)setDocument(moveComponent(document,node.id,owner.id,target));}
  };
  const reorder = (direction) => { if (!parent) return; const position = parent.children.findIndex((item) => item.id === selected.id); if (position + direction < 0 || position + direction >= parent.children.length) return; setDocument((current) => moveComponent(current, selected.id, parent.id, position + direction)); };
  const moveTo = (parentId) => { if (!parentId) return; const next = moveComponent(document, selected.id, parentId); if (next === document) setStatus('无法移动到这个容器'); else { setDocument(next); setCollapsed((old) => new Set([...old].filter((id) => id !== parentId))); } };
  const drop = (event, target, inside) => { event.preventDefault(); event.stopPropagation(); if (!dragId || dragId === target.id) return; const owner = inside ? target : nodes.get(parents.get(target.id)); if (!owner) return; const remaining = owner.children.filter((item) => item.id !== dragId); const at = inside ? remaining.length : remaining.findIndex((item) => item.id === target.id); const next = moveComponent(document, dragId, owner.id, at); if (next === document) setStatus('此位置不能容纳该组件'); else { setDocument(next); setSelectedId(dragId); } setDragId(null); };
  const renderTree = (node, depth = 0) => {
    const Icon = iconFor(node.type), isCollapsed = collapsed.has(node.id);
    const content = node.type === 'Text' ? resolveComponentText(node, document, findPackage(node.id, nodes, parents)) : '';
    const displayLabel=node.name&&node.name!==COMPONENT_NAMES[node.type]?node.name:content||node.name||COMPONENT_NAMES[node.type];
    const summary = isCollapsed ? compositionSummary(node) : '';
    return <React.Fragment key={node.id}><div data-layer-id={node.id} data-layer-type={node.type} className={`ne-tree-row ${selected.id === node.id ? 'selected' : ''}`} style={{ paddingLeft: 8 + depth * 12 }} draggable={node.id !== document.root.id&&!renaming} onDragStart={(event) => { event.stopPropagation(); setDragId(node.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', node.id); }} onDragEnd={() => setDragId(null)} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => drop(event, node, false)}>
      <button type="button" className="ne-icon ne-expand" title={isCollapsed ? '展开' : '收起'} disabled={!node.children.length} onClick={() => setCollapsed((old) => { const next = new Set(old); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })}>{node.children.length ? isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} /> : <span />}</button>
      {renaming?.id===node.id?<input className="ne-tree-rename" aria-label="重命名图层" autoFocus value={node.name} onChange={(event)=>setDocument((current)=>updateComponent(current,node.id,{name:event.target.value}))} onBlur={()=>setRenaming(null)} onKeyDown={(event)=>{if(event.key==='Enter')setRenaming(null);if(event.key==='Escape'){setDocument((current)=>updateComponent(current,node.id,{name:renaming.before}));setRenaming(null);}}}/>:<button className="ne-tree-select" onClick={() => select(node.id)} title={`${COMPONENT_NAMES[node.type]}：${node.name}${content ? ` · ${content}` : ''}${summary ? `；组成：${summary}` : ''}`}><Icon size={15} /><span className="ne-tree-label"><span>{displayLabel}</span><small>{COMPONENT_NAMES[node.type]}{node.props.hidden ? ' · 隐藏' : ''}</small>{summary && <small className="ne-composition">{summary}</small>}</span></button>}
      <div className="ne-row-actions">{CONTAINER_TYPES.has(node.type)&&catalogFor(node).length>0&&<button type="button" className="ne-icon" title="添加子组件" aria-label={`向${node.name}添加组件`} onClick={()=>openAdd(node.id)}><Plus size={14}/></button>}<button type="button" className="ne-icon" data-layer-menu-trigger title="更多操作" aria-label={`${displayLabel}的更多操作`} onClick={(event)=>openMenu(event,node.id)}><MoreHorizontal size={16}/></button></div>
      {CONTAINER_TYPES.has(node.type) && dragId && <span className="ne-drop-inside" onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => drop(event, node, true)}>放入</span>}
      <GripVertical size={12} className="ne-grip" />
    </div>{!isCollapsed && <>{node.type === 'Flow' && <div className="ne-page-picker" style={{paddingLeft: 24 + depth * 12}}><Select label="当前页面" value={treeChildren(node,navigation)[0]?.id ?? ''} options={node.children.map((child)=>[child.id,child.name])} onChange={select}/></div>}{treeChildren(node, navigation).map((child) => renderTree(child, depth + 1))}</>}</React.Fragment>;
  };
  const saveLibrary = () => {
    const name = libraryName.trim(); if (!name) return setStatus('请输入组件名称');
    const next = [{ id: crypto.randomUUID(), name, node: captureNativeComponent(document, selected) }, ...library];
    try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); setLibraryName(''); setStatus('已保存当前组件结构与样式'); } catch { setStatus('组件库保存失败：本地空间不足'); }
  };
  const changeProduct = (key, value) => setDocument((current) => ({ ...current, products: { ...current.products, [p.dataKey ?? selected.id]: { ...current.products[p.dataKey ?? selected.id], [key]: value } }, root: updateComponent(current, selected.id, { props: { dataKey: p.dataKey ?? selected.id } }).root }));
  return <div className="native-editor" data-no-translate="true">
    {saveError && <p className="ne-error" role="alert">{saveError}{blockedSave ? '。为保护原记录，本次未覆盖保存。' : ''}</p>}
    <div className="builder ne-builder">
      <aside className="ne-layers">{pickerParent?<ComponentPicker parent={pickerParent} onBack={()=>setAddTarget(null)} onAdd={add}/>:<><header><strong>图层</strong><button className="ne-icon" title="添加组件" aria-label="添加组件" onClick={() => openAdd(insertionParent.id)}><Plus size={17} /></button></header><div role="tree" aria-label="组件图层" className="ne-tree">{renderTree(document.root)}</div></>}
      </aside>
      <div className="canvas-area ne-canvas"><div className="device-controls"><span>iPhone · 390 × 844</span><button className="secondary" onClick={() => { setEditing(!editing); setNavigation((current)=>({ ...current, overlay: null })); }}>{editing ? <Eye size={15} /> : <Pencil size={15} />}{editing ? '交互预览' : '返回编辑'}</button></div><ComponentPreview document={document} selectedId={selected.id} onSelect={select} editing={editing} navigation={navigation} onNavigate={(next)=>setNavigation((current)=>({...current,...next}))} onStatus={setStatus} />{status && <div className="ne-status" role="status"><span>{status}</span><button className="ne-icon" title="关闭提示" onClick={() => setStatus('')}><X size={14} /></button></div>}</div>
      <aside className="ne-properties"><header><strong>{COMPONENT_NAMES[selected.type]}</strong><div className="ne-actions"><button className="ne-icon" title="保存到组件库" aria-label="保存到组件库" onClick={() => setLibraryOpen(true)}><Save size={16} /></button><button className="ne-icon" title="打开组件库" aria-label="打开组件库" onClick={() => setLibraryOpen(true)}><FolderOpen size={16} /></button></div></header>
        <section><Field label="图层名称"><input value={selected.name} onChange={(event) => setDocument((current) => updateComponent(current, selected.id, { name: event.target.value }))} /></Field><div className="ne-actions"><button className="ne-icon" title="上移" aria-label="上移" disabled={!parent || parent.children[0]?.id === selected.id} onClick={() => reorder(-1)}><ArrowUp size={16} /></button><button className="ne-icon" title="下移" aria-label="下移" disabled={!parent || parent.children.at(-1)?.id === selected.id} onClick={() => reorder(1)}><ArrowDown size={16} /></button><button className="ne-icon" title="复制组件" aria-label="复制组件" disabled={!parent} onClick={() => duplicateAt(selected.id)}><Copy size={16} /></button><button className="ne-icon danger" title="删除组件" aria-label="删除组件" disabled={!parent} onClick={() => { setDocument((current) => removeComponent(current, selected.id)); setSelectedId(parent.id); }}><Trash2 size={16} /></button></div><Select label="显示状态" value={p.hidden ? 'hidden' : 'visible'} onChange={(value) => patch({ hidden: value === 'hidden' })} options={[[ 'visible', '显示' ], [ 'hidden', '隐藏' ]]} />
          {parent && <Select label="所在容器" value={parent.id} onChange={moveTo} options={[...nodes.values()].filter((node) => node.id !== selected.id && canContain(node, selected)).map((node) => [node.id, `${node.name} · ${COMPONENT_NAMES[node.type]}`])} />}
        </section>
        <section><h3>内容</h3>
          {selected.type==='Custom'&&<Field label="网页内容 HTML"><textarea className="ne-code-input" value={p.html??''} onChange={(event)=>patch({html:event.target.value})}/></Field>}
          {selected.type==='Wallet'&&<Select label="钱包" value={p.method??'apple'} options={[[ 'apple','Apple Pay' ],[ 'google','Google Pay' ]]} onChange={(method)=>patch({method})}/>}
          {selected.type==='ExpressCheckout'&&<Select label="预览状态" value={p.previewState??'available'} options={[[ 'available','可用' ],[ 'unavailable','不可用' ],[ 'loading','加载中' ]]} onChange={(previewState)=>{patch({previewState});setNavigation({[selected.id]:previewState});}}/>}
          {selected.type==='Switch'&&<Select label="初始状态" value={p.defaultIndex??0} options={[[0,'关闭'],[1,'开启']]} onChange={(value)=>{patch({defaultIndex:Number(value)});setNavigation({[selected.id]:Number(value)});}}/>}
          {selected.type==='Text'&&findAncestor(selected.id,nodes,parents,'Countdown')&&<Select label="倒计时字段" value={p.timerField??'none'} options={[[ 'none','普通文字' ],['hours','小时'],['minutes','分钟'],['seconds','秒']]} onChange={(value)=>patch({timerField:value==='none'?null:value})}/>}
          {selected.type==='Countdown'&&selected.children.length>0&&<><Field label="起始时长"><input value={p.start??'00:10:00'} onChange={(event)=>patch({start:event.target.value})}/></Field><Field label="结束时间（ISO）"><input value={p.deadline??''} onChange={(event)=>patch({deadline:event.target.value})}/></Field><Select label="预览状态" value={p.previewState??'auto'} options={[[ 'auto','自动计时' ],['active','计时中'],['ended','已结束'],['fallback','兜底']]} onChange={(previewState)=>{patch({previewState});setNavigation({[selected.id]:previewState==='auto'?undefined:previewState});}}/></>}
          {selected.type === 'Text' && <>{p.binding ? <><Select label="商品字段" value={p.binding.field} options={Object.entries(fieldNames)} onChange={(field) => patch({ binding: { ...p.binding, field } })} /><Field label="当前商品内容"><input readOnly value={resolveComponentText(selected, document, findPackage(selected.id, nodes, parents))} /></Field><button className="secondary" onClick={() => patch({ binding: null, text: resolveComponentText(selected, document, findPackage(selected.id, nodes, parents)) })}>转为独立文字</button></> : <Field label="文字内容"><textarea value={p.text ?? ''} onChange={(event) => patch({ text: event.target.value, runs: null })} /></Field>}</>}
          {['Image', 'Video', 'Screen'].includes(selected.type) && <MediaField value={selected.type === 'Screen' ? p.backgroundImage ?? '' : p.src ?? ''} type={selected.type} onChange={(value, mediaType) => { if (selected.type === 'Screen') patch({ backgroundImage: value }); else setDocument((current) => updateComponent(current, selected.id, { type: mediaType ?? selected.type, props: { src: value } })); }} onError={setStatus} />}
          {selected.type === 'Package' && <><Select label="SKU" value={document.products[p.dataKey]?.skuId ?? ''} options={[[ '', '模板示例数据' ], ...DEMO_SKUS.map((sku) => [sku.id, `${sku.displayName} · ${sku.id}`])]} onChange={(value) => changeProduct('skuId', value)} /><Select label="主价格" value={p.priceMode ?? '1'} options={[[ '1', '总价' ], [ '0', '月均价' ], [ '3', '总价 / 月均参考价' ], [ '4', '月均价 / 总参考价' ]]} onChange={(priceMode) => patch({ priceMode })} />{!document.products[p.dataKey]?.skuId && Object.entries(fieldNames).map(([key, label]) => <Field key={key} label={label}><input value={document.products[p.dataKey]?.[key] ?? ''} onChange={(event) => changeProduct(key, event.target.value)} /></Field>)}<Field label="选择组"><input value={p.group ?? selected.id} onChange={(event) => patch({ group: event.target.value })} /></Field></>}
          {selected.type === 'Text' && <>{p.localizationKey !== undefined && <Field label="多语言 Key"><input value={p.localizationKey} onChange={(event) => patch({ localizationKey: event.target.value })} /></Field>}{p.runs?.length > 0 && <div className="ne-rich-runs"><h3>文字片段</h3>{p.runs.map((run, index) => { const edit = (value) => patch({ runs: p.runs.map((item, at) => at === index ? { ...item, ...value } : item) }); return <div className="ne-rich-run" key={index}><Field label={`片段 ${index + 1}`}><input value={run.text} onChange={(event) => edit({ text: event.target.value })} /></Field><div className="ne-grid"><ColorField label="片段颜色" value={run.color ?? p.color} onChange={(color) => edit({ color })} /><NumberField label="片段字号" value={run.fontSize ?? p.fontSize} min={8} max={160} onChange={(fontSize) => edit({ fontSize })} /></div>{run.link !== undefined && <Field label="片段链接"><input value={run.link} onChange={(event) => edit({ link: event.target.value })} /></Field>}</div>; })}</div>}</>}
          {selected.type === 'Package' && <Select label="初始选中" value={p.defaultSelected ? 'yes' : 'no'} options={[[ 'yes','是' ],[ 'no','否' ]]} onChange={(value) => setDocument((current) => { let next = current; if (value === 'yes') for (const node of indexDocument(current).nodes.values()) if (node.type === 'Package' && node.props.group === p.group) next = updateComponent(next, node.id, { props: { defaultSelected: false } }); return updateComponent(next, selected.id, { props: { defaultSelected: value === 'yes' } }); })} />}
          {selected.type === 'Button' && p.action?.action === 'OpenPage' && <Select label="目标页面" value={p.action.actionPage ?? ''} options={[[ '', '未绑定' ], ...[...nodes.values()].filter((node) => node.type === 'Screen' && nodes.get(parents.get(node.id))?.type === 'Flow').map((node) => [node.id, node.name])]} onChange={(actionPage) => patch({ action: { ...p.action, actionPage } })} />}
          {selected.type === 'Icon' && <><Select label="图标" value={p.icon ?? 'check'} options={['check','lock','star','bell','moon','heart','group','clock','gift','arrow','dumbbell','running','download','map','flower','number']} onChange={(icon) => patch({ icon })} />{p.icon === 'number' && <NumberField label="序号" value={p.number ?? 1} onChange={(number) => patch({ number })} />}</>}
          {['Tabs', 'Carousel', 'Flow'].includes(selected.type) && <Select label="初始页面" value={p.defaultIndex ?? 0} options={selected.children.map((node, index) => [index, node.name])} onChange={(value) => { patch({ defaultIndex: Number(value) }); setNavigation({ [selected.id]: Number(value) }); }} />}
          {selected.type === 'TabButton' && <><Select label="目标标签页" value={p.target ?? ''} options={[[ '', '未绑定' ], ...[...nodes.values()].filter((node) => node.type === 'Tabs').map((node) => [node.id, node.name])]} onChange={(target) => patch({ target })} /><NumberField label="页序号（从 0 起）" value={p.index ?? 0} onChange={(index) => patch({ index })} max={20} /></>}
          {selected.type === 'Toggle' && <><Select label="控件" value={p.control ?? 'switch'} options={[[ 'switch', '开关' ], [ 'checkbox', '勾选框' ]]} onChange={(control) => patch({ control })} /><Select label="初始状态" value={p.initial ? 'on' : 'off'} options={[[ 'off', '关闭' ], [ 'on', '开启' ]]} onChange={(value) => patch({ initial: value === 'on' })} /><Select label="购买前必须勾选" value={p.required ? 'yes' : 'no'} options={[[ 'no', '否' ], [ 'yes', '是' ]]} onChange={(value) => patch({ required: value === 'yes' })} /></>}
          {selected.type === 'Countdown' && !selected.children.length && <>{[['start','起始时间'],['prefix','前缀'],['suffix','后缀']].map(([key,label]) => <Field key={key} label={label}><input value={p[key] ?? ''} onChange={(event) => patch({ [key]: event.target.value })} /></Field>)}<ColorField label="数字底色" value={p.digitBackground ?? 'transparent'} onChange={(digitBackground) => patch({ digitBackground })} /><ColorField label="前缀颜色" value={p.prefixColor ?? p.color} onChange={(prefixColor) => patch({ prefixColor })} /></>}
          {selected.type==='Button'&&p.action?.action==='OpenSheet'&&<Select label="目标弹层" value={p.action.actionPage??''} options={[[ '', '未绑定' ],...[...nodes.values()].filter((node)=>node.type==='BottomSheet').map((node)=>[node.id,node.name])]} onChange={(actionPage)=>patch({action:{...p.action,actionPage}})}/>}
          {selected.type === 'Button' && <><Select label="点击动作" value={p.action?.action ?? 'None'} options={[[ 'None', '无' ],[ 'Purchase', '购买' ],[ 'OpenURL', '打开链接' ],[ 'OpenPage', '打开页面' ],[ 'OpenSheet','打开弹层' ],[ 'CloseSheet','返回弹层外' ],[ 'NextScreen', '下一页' ],[ 'RestorePurchases', '恢复购买' ],[ 'Dismiss', '关闭' ],[ 'WebCheckout', '网页结账' ],[ 'OfferCodeRedemption', '兑换优惠码' ]]} onChange={(action) => patch({ action: { ...p.action, action } })} />{p.action?.action === 'OpenURL' && <Field label="链接地址"><input value={p.action.actionUrl ?? ''} onChange={(event) => patch({ action: { ...p.action, actionUrl: event.target.value } })} /></Field>}</>}
        </section>
        <section><h3>样式</h3><div className="ne-grid">
          {(['Text','Icon'].includes(selected.type)||(selected.type==='Countdown'&&!selected.children.length)) && <><NumberField label={selected.type === 'Icon' ? '图标大小' : '字号'} value={selected.type === 'Icon' ? p.iconSize ?? p.fontSize : p.fontSize} min={8} max={160} onChange={(value) => patch(selected.type === 'Icon' ? { iconSize: value } : { fontSize: value })} /><ColorField label="颜色" value={p.color} onChange={(color) => patch({ color })} />{selected.type !== 'Icon' && <><Select label="字重" value={p.fontWeight} options={[[400,'常规'],[500,'中等'],[600,'半粗'],[700,'粗体'],[800,'特粗']]} onChange={(fontWeight) => patch({ fontWeight: Number(fontWeight) })} /><Select label="文字对齐" value={p.textAlign} options={[[ 'left', '左对齐' ],[ 'center','居中' ],[ 'right','右对齐' ]]} onChange={(textAlign) => patch({ textAlign })} /></>}{selected.type === 'Text' && <Select label="划线" value={p.strike ? 'yes' : 'no'} options={[[ 'no','无' ],[ 'yes','删除线' ]]} onChange={(value) => patch({ strike: value === 'yes' })} />}</>}
          <ColorField label="背景" value={p.background} onChange={(background) => patch({ background })} /><NumberField label="圆角" value={p.radius} onChange={(radius) => patch({ radius })} /><NumberField label="边框宽度" value={p.borderWidth} max={20} onChange={(borderWidth) => patch({ borderWidth })} /><ColorField label="边框颜色" value={p.borderColor} onChange={(borderColor) => patch({ borderColor })} />
          {selected.type === 'Package' && <><ColorField label="选中边框" value={p.selectedBorder ?? '#167aff'} onChange={(selectedBorder) => patch({ selectedBorder })} /><ColorField label="选中背景" value={p.selectedBackground ?? '#ffffff'} onChange={(selectedBackground) => patch({ selectedBackground })} /></>}
          {selected.type === 'TabButton' && <><ColorField label="选中背景" value={p.selectedBackground ?? '#167aff'} onChange={(selectedBackground) => patch({ selectedBackground })} /><ColorField label="选中文字" value={p.selectedColor ?? '#ffffff'} onChange={(selectedColor) => patch({ selectedColor })} /></>}
          {['Image','Video','Screen'].includes(selected.type) && <Select label="图片适配" value={selected.type === 'Screen' ? p.backgroundFit ?? 'cover' : p.objectFit} options={[[ 'cover','填满' ],[ 'contain','完整显示' ]]} onChange={(value) => patch(selected.type === 'Screen' ? { backgroundFit: value } : { objectFit: value })} />}
        </div></section>
        <section><h3>布局</h3><div className="ne-grid">
          {CONTAINER_TYPES.has(selected.type) && <><Select label="排列" value={p.axis} options={[[ 'vertical','纵向' ],[ 'horizontal','横向' ],[ 'overlay','叠放' ]]} onChange={(axis) => patch({ axis })} /><NumberField label="子项间距" value={p.gap} max={200} onChange={(gap) => patch({ gap })} /><Select label="交叉轴对齐" value={p.align} options={[[ 'stretch','拉伸' ],[ 'start','起始' ],[ 'center','居中' ],[ 'end','末尾' ]]} onChange={(align) => patch({ align })} /><Select label="主轴分布" value={p.justify} options={[[ 'start','起始' ],[ 'center','居中' ],[ 'end','末尾' ],[ 'between','两端分布' ]]} onChange={(justify) => patch({ justify })} />{p.axis === 'horizontal' && <Select label="换行" value={p.wrap ? 'yes' : 'no'} options={[[ 'no','不换行' ],[ 'yes','换行' ]]} onChange={(value) => patch({ wrap: value === 'yes' })} />}</>}
          <Select label="宽度" value={p.widthMode} options={[[ 'fill','填满容器' ],[ 'fit','适应内容' ],[ 'fixed','固定' ]]} onChange={(widthMode) => patch({ widthMode })} />{p.widthMode === 'fixed' && <NumberField label="宽度 px" value={p.width} onChange={(width) => patch({ width })} />}
          <Select label="高度" value={p.heightMode} options={[[ 'fit','适应内容' ],[ 'fixed','固定' ]]} onChange={(heightMode) => patch({ heightMode })} />{p.heightMode === 'fixed' && <NumberField label="高度 px" value={p.height} onChange={(height) => patch({ height })} />}
          <NumberField label="最小高度" value={p.minHeight ?? 0} onChange={(minHeight) => patch({ minHeight })} />
          {['Top','Right','Bottom','Left'].map((side,index) => <NumberField key={side} label={`内边距${['上','右','下','左'][index]}`} value={p[`padding${side}`]} max={500} onChange={(value) => patch({ [`padding${side}`]: value })} />)}
          {['Top','Right','Bottom','Left'].map((side,index) => <NumberField key={`m${side}`} label={`外边距${['上','右','下','左'][index]}`} value={p[`margin${side}`]} min={-200} max={500} onChange={(value) => patch({ [`margin${side}`]: value })} />)}
        </div></section>
      </aside>
    </div>
    {menuNode&&<LayerActionsMenu menu={layerMenu} node={menuNode} isRoot={menuNode.id===document.root.id} canPaste={Boolean(editorClipboard.fragment?.roots.every((node)=>canContain(CONTAINER_TYPES.has(menuNode.type)?menuNode:nodes.get(parents.get(menuNode.id)),node)))} canWrap={Boolean(parents.get(menuNode.id)&&canContain(nodes.get(parents.get(menuNode.id)),{type:'Stack'})&&canContain({type:'Stack'},menuNode))} hasStyles={Boolean(editorClipboard.styles)} onAction={menuAction} onClose={()=>setLayerMenu(null)}/>}
    {libraryOpen && <div className="modal-backdrop"><section className="modal ne-library" role="dialog" aria-label="组件库"><header><h2>组件库</h2><button className="ne-icon" title="关闭组件库" onClick={() => setLibraryOpen(false)}><X size={18} /></button></header><div className="ne-library-body"><Field label="组件名称"><input value={libraryName} maxLength={40} onChange={(event) => setLibraryName(event.target.value)} /></Field><button className="secondary" onClick={saveLibrary}><Save size={16} />保存当前组件</button>{library.map((record) => <div className="ne-library-row" key={record.id}><span>{record.name} · {COMPONENT_NAMES[record.node.type]}</span><button className="secondary" disabled={!canContain(insertionParent, record.node)} onClick={() => { const node = cloneComponent(record.node); setDocument((current) => insertComponent(current, insertionParent.id, node)); setSelectedId(node.id); setLibraryOpen(false); }}>插入</button><button className="ne-icon danger" title={`删除 ${record.name}`} onClick={() => { const next = library.filter((item) => item.id !== record.id); try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); } catch { setStatus('组件库保存失败'); } }}><Trash2 size={16} /></button></div>)}</div></section></div>}
  </div>;
}
function findPackage(id, nodes, parents) { let current = nodes.get(id); while (current) { if (current.type === 'Package') return current; current = nodes.get(parents.get(current.id)); } return null; }
function findAncestor(id,nodes,parents,type) {let current=nodes.get(id);while(current){if(current.type===type)return current;current=nodes.get(parents.get(current.id));}return null;}
function MediaField({ value, type, onChange, onError }) {
  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) && !(type !== 'Screen' && file.type === 'video/mp4')) return onError('请选择 PNG、JPG、WebP、GIF 图片或 MP4 视频');
    if (file.size > 10 * 1024 * 1024) return onError('媒体文件不能超过 10 MB');
    const reader = new FileReader(); reader.onload = () => onChange(String(reader.result), type === 'Screen' ? undefined : file.type.startsWith('video/') ? 'Video' : 'Image'); reader.onerror = () => onError('文件读取失败'); reader.readAsDataURL(file);
  };
  return <div className="ne-media">{value && (type === 'Video' ? <video src={value} controls /> : <img src={value} alt="当前素材" />)}<label className="ne-upload">{value ? '替换素材' : '上传素材'}<input type="file" accept={type === 'Screen' ? 'image/png,image/jpeg,image/webp,image/gif' : 'image/png,image/jpeg,image/webp,image/gif,video/mp4'} onChange={(event) => { upload(event.target.files[0]); event.target.value = ''; }} /></label><Field label={type === 'Screen' ? '背景图片地址' : '素材地址'}><input value={value} onChange={(event) => onChange(event.target.value)} /></Field>{value && <button className="secondary" onClick={() => onChange('')}>删除媒体</button>}</div>;
}
