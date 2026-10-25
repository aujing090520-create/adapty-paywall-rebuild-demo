import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Copy, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Save, FolderOpen, X, Layers, Type, Image as ImageIcon, Package as PackageIcon, MoreHorizontal, MousePointerClick, Smartphone, Workflow, GalleryHorizontal, PanelTop, PanelBottom, Clock3, ToggleLeft, ListOrdered, Video, Star, Code, CreditCard, Columns2, Rows2 } from 'lucide-react';
import { COMPONENT_NAMES, CONTAINER_TYPES, componentProps, importComponentDocument, indexDocument, validDocument, updateComponent, insertComponent, canContain, readComponentDocument, saveComponentDocument, cloneComponent, captureNativeComponent, resolveComponentText } from './componentDocument.js';
import { DEMO_SKUS } from '../productPricing.js';
import ComponentPreview from './ComponentPreview.jsx';
import ComponentPicker from './ComponentPicker.jsx';
import LayerActionsMenu from './LayerActionsMenu.jsx';
import { createCatalogComponent, upgradeCanonicalComponents, catalogFor, createTabSelector } from './componentCatalog.js';
import { editorClipboard, copyFragment, pasteFragment, copyStyles, pasteStyles, wrapInStack, patchComponentProperties, appendTab, togglePageControl, removeEditorComponent as removeComponent, moveEditorComponent as moveComponent, reconcileTabNavigation } from './componentOperations.js';
import { treeChildren, initialCollapsed, pageContext, isUnconfiguredDetailPage, isOverlaySurface, surfaceContext } from './componentTree.js';
import './componentEditor.css';
import RevenueCatProperties from './RevenueCatProperties.jsx';
import { migrateTemplateVisuals } from './templateVisuals.js';
import { defaultPackagePatch, sequencePages } from './propertyModel.js';
import {fontResources,withFontResources} from './fontStyles.js';

const libraryKey = 'paywall-component-library-v3';
const fieldNames = { name: '商品名称', price: '主价格', reference: '参考价', supportingCopy: '辅助文案', savingCopy: '优惠说明', saveCopy: 'SAVE 文案', badgeText: '标签文字' };
const iconFor = (type,axis) => ({ Screen: Smartphone, Flow: Workflow, Stack:axis==='horizontal'?Columns2:axis==='overlay'?Layers:Rows2, Text: Type, Image: ImageIcon, Video, Icon: Star, Custom: Code, Package: PackageIcon, Button: MousePointerClick, PurchaseButton: CreditCard, Header: PanelTop, Footer: PanelBottom, BottomSheet: PanelBottom, Carousel: GalleryHorizontal, Tabs: Columns2, TabControl: Columns2, TabButton: MousePointerClick, Timeline: ListOrdered, Countdown: Clock3, Toggle: ToggleLeft, Switch: ToggleLeft, Wallet: CreditCard, ExpressCheckout: CreditCard }[type] ?? Layers);
function Field({ label, children }) { return <label className="ne-field"><span>{label}</span>{children}</label>; }
function Select({ label, value, onChange, options }) { return <Field label={label}><select aria-label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [key, name] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{name}</option>; })}</select></Field>; }
function readLibrary() { try { const value = JSON.parse(localStorage.getItem(libraryKey) ?? '[]'); return Array.isArray(value) ? value.filter((item) => item?.name && validDocument({ version: 3, products: {}, fonts:item.fonts, root: { id: '$library', type: 'Screen', props: {}, children: [item.node] } })) : []; } catch { return []; } }

export default function ComponentEditor({ template, initialNodes, initialDocument, onDocumentChange, persistence = 'legacy' }) {
  const [initial] = useState(() => {
    try {
      const saved = persistence === 'session' ? initialDocument : readComponentDocument(localStorage, template?.id ?? 'blank');
      if (saved && (!validDocument(saved) || saved.templateId !== (template?.id ?? 'blank'))) throw new Error('已保存的付费墙内容无效，原记录仍然保留');
      const defaults = importComponentDocument(initialNodes, template);
      const document = saved ? persistence === 'session' ? saved : migrateTemplateVisuals(saved, importComponentDocument(initialNodes, template, false), defaults) : defaults;
      return { document: upgradeCanonicalComponents(document), error: '' };
    } catch (error) {
      return { document: upgradeCanonicalComponents(importComponentDocument(initialNodes, template)), error: error.message };
    }
  });
  const [document, setDocument] = useState(initial.document);
  const [saveError, setSaveError] = useState(initial.error);
  const blockedSave = Boolean(initial.error);
  const latest = useRef(document);
  useEffect(() => { onDocumentChange?.(document); }, [document, onDocumentChange]);
  const [selectedId, setSelectedId] = useState(() => pageContext(initial.document).active.id);
  const [collapsed, setCollapsed] = useState(() => initialCollapsed(initial.document.root));
  const [editing, setEditing] = useState(true), [navigation, setNavigation] = useState({});
  const patchNavigation = React.useCallback((values)=>setNavigation((current)=>({...current,...values})),[]);
  const previousDocument=useRef(document);
  useEffect(()=>{const before=previousDocument.current;previousDocument.current=document;setNavigation((current)=>reconcileTabNavigation(before,document,current));},[document]);
  const [addTarget, setAddTarget] = useState(null), [dragId, setDragId] = useState(null), [status, setStatus] = useState('');
  const [layerMenu,setLayerMenu] = useState(null), [renaming,setRenaming] = useState(null);
  const [library, setLibrary] = useState(readLibrary), [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const { nodes, parents } = useMemo(() => indexDocument(document), [document]);
  const pages = pageContext(document, navigation);
  const { surfaces, surface, triggers } = surfaceContext(document, navigation, selectedId);
  const selected = nodes.get(selectedId) ?? document.root;
  const isPageRoot = selected.id === pages.active.id || selected.id === document.root.id;
  const p = componentProps(selected);
  const parent = nodes.get(parents.get(selected.id));
  const insertionParent = CONTAINER_TYPES.has(selected.type) ? selected : parent ?? document.root;
  const pickerParent = nodes.get(addTarget);
  const menuNode = nodes.get(layerMenu?.id);
  latest.current = document;
  const saveFonts=(fonts)=>{
    if(blockedSave)throw new Error(initial.error);
    const next={...latest.current,fonts};
    if(persistence !== 'session' && !saveComponentDocument(localStorage,next))throw new Error('字体保存失败，本地存储空间不足；原配置保留');
    setDocument(next);
  };
  useEffect(() => {
    if (blockedSave || persistence === 'session') return;
    const timer = setTimeout(() => setSaveError(saveComponentDocument(localStorage, document) ? '' : '本地保存失败，请缩小媒体文件后重试'), 250);
    return () => clearTimeout(timer);
  }, [document, blockedSave, persistence]);
  useEffect(() => { if (persistence === 'session') return; const flush = () => { if (!blockedSave) saveComponentDocument(localStorage, latest.current); }; window.addEventListener('pagehide', flush); return () => { flush(); window.removeEventListener('pagehide', flush); }; }, [blockedSave, persistence]);
  const select = (id) => {
    setSelectedId(id); setEditing(true);
    const reveal = {}; const expand = new Set(); let current = nodes.get(id);
    while (current) {
      expand.add(current.id);
      if (['overlay','sheet'].includes(current.props.presentation)) reveal.overlay = current.id;
      const owner = nodes.get(parents.get(current.id));
      if (owner && ['Tabs', 'Carousel', 'Flow'].includes(owner.type)) {const index=sequencePages(owner).findIndex((item)=>item.id===current.id);if(index>=0)reveal[owner.id]=index;}
      if (owner?.type === 'Switch' && current.type === 'SwitchCase') reveal[owner.id] = current.props.index;
      if (owner?.type === 'ExpressCheckout' && current.type === 'CheckoutState') reveal[owner.id] = current.props.state;
      if (owner?.type === 'Countdown' && current.type === 'CountdownState') reveal[owner.id] = current.props.state;
      current = owner;
    }
    if (!reveal.overlay) reveal.overlay = null;
    setCollapsed((old) => new Set([...old].filter((key) => !expand.has(key))));
    setNavigation((current) => ({ ...current, ...reveal }));
  };
  const patch = (props) => setDocument((current) => patchComponentProperties(current, selected.id, props));
  const add = (type) => {
    const owner = nodes.get(addTarget); if(!owner)return;
    const next = createCatalogComponent(type);
    if(type==='Tab'){let number=owner.children.length+1;while(owner.children.some((child)=>child.name===`标签 ${number}`))number++;next.name=`标签 ${number}`;}
    if(type==='TabButton'){ const tabs=findAncestor(owner.id,nodes,parents,'Tabs'); next.props={...next.props,target:tabs?.id ?? '',index:owner.children.length};next.children=[createCatalogComponent('Text')];next.children[0].props.text='标签'; }
    if(type==='TabControl'){const tabs=findAncestor(owner.id,nodes,parents,'Tabs');if(tabs)next.children=createTabSelector(next.id,tabs.id,tabs.children.length).children;}
    if(type==='SwitchCase')next.props.index=[0,1].find((index)=>!owner.children.some((child)=>child.type==='SwitchCase'&&child.props.index===index)) ?? 0;
    if(type==='CheckoutState')next.props.state=['available','unavailable','loading'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'available';
    if(type==='CountdownState')next.props.state=['active','ended','fallback'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'active';
    let updated=type==='Tab' && owner.type==='Tabs' ? appendTab(document,owner.id,next) : insertComponent(document,owner.id,next);
    if(updated===document)return setStatus('该容器无法添加此组件');
    if(type==='Package')updated={...updated,products:{...updated.products,[next.id]:{name:'商品名称',price:'',skuId:''}}};
    setDocument(updated);setAddTarget(null);setCollapsed((old)=>new Set([...old].filter((id)=>id!==owner.id)));setSelectedId(next.id);
    if(type==='Tab'&&owner.type==='Tabs')setNavigation((current)=>({...current,[owner.id]:owner.children.length}));
  };
  const openAdd=(id)=>{select(id);setLayerMenu(null);setAddTarget(id);};
  const openMenu=(event,id)=>{event.preventDefault();event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();setLayerMenu({id,x:rect.right,y:rect.bottom});};
  const duplicateAt=(id)=>{const owner=nodes.get(parents.get(id));if(!owner)return;const result=pasteFragment(document,owner.id,copyFragment(document,id),owner.children.findIndex((node)=>node.id===id)+1);if(result.ids.length){setDocument(result.document);setSelectedId(result.ids[0]);}};
  const menuAction=(action)=>{
    const node=nodes.get(layerMenu?.id);if(!node)return;const owner=nodes.get(parents.get(node.id));setLayerMenu(null);
    if(action==='rename'){select(node.id);setRenaming({id:node.id,before:node.name});}
    if(action==='copy'){editorClipboard.fragment=copyFragment(document,node.id,node.id===document.root.id||node.id===pages.active.id);setStatus('已复制图层');}
    if(action==='paste'){const target=CONTAINER_TYPES.has(node.type)?node:owner;if(!target)return;const result=pasteFragment(document,target.id,editorClipboard.fragment);if(result.ids.length){setDocument(result.document);setSelectedId(result.ids[0]);setCollapsed((old)=>new Set([...old].filter((id)=>id!==target.id)));}}
    if(action==='duplicate')duplicateAt(node.id);
    if(action==='wrap'){const result=wrapInStack(document,node.id);setDocument(result.document);setSelectedId(result.id);}
    if(action==='copyStyles'){editorClipboard.styles=copyStyles(node,document.fonts);setStatus('已复制样式');}
    if(action==='pasteStyles')setDocument(pasteStyles(document,node.id,editorClipboard.styles));
    if(action==='hide')setDocument(updateComponent(document,node.id,{props:{hidden:!node.props.hidden}}));
    if(action==='delete'&&owner){setDocument(removeComponent(document,node.id));setSelectedId(owner.id);}
    if(['up','down'].includes(action)&&owner){const at=owner.children.findIndex((child)=>child.id===node.id),target=at+(action==='up'?-1:1);if(target>=0&&target<owner.children.length)setDocument(moveComponent(document,node.id,owner.id,target));}
  };
  const reorder = (direction) => { if (!parent) return; const position = parent.children.findIndex((item) => item.id === selected.id); if (position + direction < 0 || position + direction >= parent.children.length) return; setDocument((current) => moveComponent(current, selected.id, parent.id, position + direction)); };
  const drop = (event, target, inside) => { event.preventDefault(); event.stopPropagation(); if (!dragId || dragId === target.id) return; const owner = inside ? target : nodes.get(parents.get(target.id)); if (!owner) return; const remaining = owner.children.filter((item) => item.id !== dragId); const at = inside ? remaining.length : remaining.findIndex((item) => item.id === target.id); const next = moveComponent(document, dragId, owner.id, at); if (next === document) setStatus('此位置不能容纳该组件'); else { setDocument(next); setSelectedId(dragId); } setDragId(null); };
  const renderTree = (node, depth = 0) => {
    const Icon = iconFor(node.type,componentProps(node).axis), isCollapsed = collapsed.has(node.id);
    const visibleChildren = treeChildren(node, navigation).filter((child) => !isOverlaySurface(child));
    const content = node.type === 'Text' ? resolveComponentText(node, document, findPackage(node.id, nodes, parents)) : '';
    const displayLabel=node.name&&node.name!==COMPONENT_NAMES[node.type]?node.name:content||node.name||COMPONENT_NAMES[node.type];
    return <React.Fragment key={node.id}><div data-layer-id={node.id} data-layer-type={node.type} className={`ne-tree-row ${selected.id === node.id ? 'selected' : ''}${node.props.hidden?' is-hidden':''}`} style={{ paddingLeft: 8 + depth * 20 }} draggable={node.id !== document.root.id&&node.id!==pages.active.id&&!renaming} onDragStart={(event) => { event.stopPropagation(); setDragId(node.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', node.id); }} onDragEnd={() => setDragId(null)} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => drop(event, node, false)}>
      {visibleChildren.length?<button type="button" className="ne-icon ne-expand" title={isCollapsed ? '展开' : '收起'} aria-label={`${isCollapsed?'展开':'收起'}${displayLabel}`} aria-expanded={!isCollapsed} onClick={() => setCollapsed((old) => { const next = new Set(old); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })}>{isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>:<span className="ne-leaf-spacer" aria-hidden="true"/>}
      {renaming?.id===node.id?<input className="ne-tree-rename" aria-label="重命名图层" autoFocus value={node.name} onChange={(event)=>setDocument((current)=>updateComponent(current,node.id,{name:event.target.value}))} onBlur={()=>setRenaming(null)} onKeyDown={(event)=>{if(event.key==='Enter')setRenaming(null);if(event.key==='Escape'){setDocument((current)=>updateComponent(current,node.id,{name:renaming.before}));setRenaming(null);}}}/>:<button className="ne-tree-select" onClick={() => select(node.id)} title={`${COMPONENT_NAMES[node.type]}：${displayLabel}${content&&content!==displayLabel?`\n${content}`:''}`} aria-label={`${displayLabel}${node.props.hidden?'（隐藏）':''}`}><Icon size={16} /><span className="ne-tree-label">{displayLabel}</span>{node.props.hidden&&<EyeOff size={13} className="ne-layer-hidden" aria-hidden="true"/>}</button>}
      <div className="ne-row-actions">{CONTAINER_TYPES.has(node.type)&&catalogFor(node).length>0&&<button type="button" className="ne-icon" title="添加子组件" aria-label={`向${node.name}添加组件`} onClick={()=>openAdd(node.id)}><Plus size={14}/></button>}<button type="button" className="ne-icon" data-layer-menu-trigger title="更多操作" aria-label={`${displayLabel}的更多操作`} onClick={(event)=>openMenu(event,node.id)}><MoreHorizontal size={16}/></button></div>
      {CONTAINER_TYPES.has(node.type) && dragId && <span className="ne-drop-inside" onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => drop(event, node, true)}>放入</span>}
    </div>{!isCollapsed && <>{node.type === 'Flow' && <div className="ne-page-picker" style={{paddingLeft: 24 + depth * 12}}><Select label="当前页面" value={treeChildren(node,navigation)[0]?.id ?? ''} options={node.children.map((child)=>[child.id,child.name])} onChange={select}/></div>}{visibleChildren.map((child) => renderTree(child, depth + 1))}</>}</React.Fragment>;
  };
  const saveLibrary = () => {
    const name = libraryName.trim(); if (!name) return setStatus('请输入组件名称');
    const node=captureNativeComponent(document,selected);
    const next = [{ id: crypto.randomUUID(), name, node, fonts:fontResources(node,document.fonts) }, ...library];
    try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); setLibraryName(''); setStatus('已保存当前组件结构与样式'); } catch { setStatus('组件库保存失败：本地空间不足'); }
  };
  const changeProduct = (key, value) => setDocument((current) => ({ ...current, products: { ...current.products, [p.dataKey ?? selected.id]: { ...current.products[p.dataKey ?? selected.id], [key]: value } }, root: updateComponent(current, selected.id, { props: { dataKey: p.dataKey ?? selected.id } }).root }));
  return <div className="native-editor" data-no-translate="true">
    {saveError && <p className="ne-error" role="alert">{saveError}{blockedSave ? '。为保护原记录，本次未覆盖保存。' : ''}</p>}
    <div className="builder ne-builder">
      <aside className="ne-layers">{pickerParent?<ComponentPicker parent={pickerParent} onBack={()=>setAddTarget(null)} onAdd={add}/>:<><section className="ne-page-management" aria-label="页面管理"><div className="ne-page-heading"><strong>页面</strong>{pages.flow&&<button className="ne-icon" title="全局外观" aria-label="全局外观" onClick={()=>select(document.root.id)}><Layers size={15}/></button>}</div><Select label="编辑页面" value={pages.active.id} options={pages.pages.map((page)=>[page.id,`${page.name}${isUnconfiguredDetailPage(page)?' · 内容待补充':''}`])} onChange={(id)=>{setAddTarget(null);select(id);}}/></section><header><strong>图层</strong><button className="ne-icon" title="添加组件" aria-label="添加组件" onClick={() => openAdd(insertionParent.id===document.root.id?pages.active.id:insertionParent.id)}><Plus size={17} /></button></header><div className="ne-tree">
        <div role="tree" aria-label="组件图层">{renderTree(pages.active)}{pages.shared.some((node)=>!isOverlaySurface(node))&&<><div className="ne-shared-heading">共享图层</div>{pages.shared.filter((node)=>!isOverlaySurface(node)).map((node)=>renderTree(node))}</>}</div>
        {surfaces.length>0&&<section className="ne-surfaces" aria-label="弹层"><h3>弹层</h3><div role="tree" aria-label="弹层图层">{surfaces.map((node)=>renderTree(node))}</div></section>}
      </div></>}
      </aside>
      <div className="canvas-area ne-canvas"><div className="device-controls"><span>iPhone · 390 × 844</span><button className="secondary" onClick={() => { setEditing(!editing); setNavigation((current)=>({ ...current, overlay: surface?.id ?? null })); }}>{editing ? <Eye size={15} /> : <Pencil size={15} />}{editing ? '交互预览' : '返回编辑'}</button></div>
        {surface&&<div className="ne-surface-context" aria-label="当前弹层"><button type="button" className="ne-icon" aria-label="返回主页面" title="返回主页面" onClick={()=>select(pages.active.id)}><ArrowUp size={16}/></button><strong>{surface.name}</strong>{triggers.map((node)=><button type="button" className="ne-surface-trigger" key={node.id} onClick={()=>select(node.id)} title={`定位触发按钮：${node.name}`}>{node.name}</button>)}</div>}
        {isUnconfiguredDetailPage(pages.active)&&<div className="ne-page-draft" role="status">内容待补充 · 暂不开放预览跳转</div>}<ComponentPreview document={document} selectedId={selected.id} onSelect={select} editing={editing} navigation={navigation} onNavigate={(next)=>setNavigation((current)=>({...current,...next}))} onStatus={setStatus} />{status && <div className="ne-status" role="status"><span>{status}</span><button className="ne-icon" title="关闭提示" onClick={() => setStatus('')}><X size={14} /></button></div>}</div>
      <aside className="ne-properties"><header><strong>{COMPONENT_NAMES[selected.type]}</strong><div className="ne-actions"><button className="ne-icon" title="保存到组件库" aria-label="保存到组件库" onClick={() => setLibraryOpen(true)}><Save size={16} /></button><button className="ne-icon" title="打开组件库" aria-label="打开组件库" onClick={() => setLibraryOpen(true)}><FolderOpen size={16} /></button></div></header>
        <section><Field label={isPageRoot?'页面名称':'图层名称'}><input value={selected.name} onChange={(event) => setDocument((current) => updateComponent(current, selected.id, { name: event.target.value }))} /></Field><div className="ne-actions"><button className="ne-icon" title="上移" aria-label="上移" disabled={isPageRoot || !parent || parent.children[0]?.id === selected.id} onClick={() => reorder(-1)}><ArrowUp size={16} /></button><button className="ne-icon" title="下移" aria-label="下移" disabled={isPageRoot || !parent || parent.children.at(-1)?.id === selected.id} onClick={() => reorder(1)}><ArrowDown size={16} /></button><button className="ne-icon" title="复制组件" aria-label="复制组件" disabled={isPageRoot || !parent} onClick={() => duplicateAt(selected.id)}><Copy size={16} /></button><button className="ne-icon danger" title="删除组件" aria-label="删除组件" disabled={isPageRoot || !parent} onClick={() => { setDocument((current) => removeComponent(current, selected.id)); setSelectedId(parent.id); }}><Trash2 size={16} /></button></div>{!isPageRoot&&<Select label="显示状态" value={p.hidden ? 'hidden' : 'visible'} onChange={(value) => patch({ hidden: value === 'hidden' })} options={[[ 'visible', '显示' ], [ 'hidden', '隐藏' ]]} />}
        </section>
        <RevenueCatProperties key={selected.id} selected={selected} p={p} patch={patch} document={document} nodes={nodes} parents={parents} resolveText={resolveComponentText} findPackage={findPackage} changeProduct={changeProduct} fieldNames={fieldNames} demoSkus={DEMO_SKUS} navigation={navigation} setNavigation={patchNavigation} onStatus={setStatus} onFontsChange={saveFonts} onPageControl={(enabled)=>setDocument((current)=>togglePageControl(current,selected.id,enabled))} onMediaType={(type) => setDocument((current) => updateComponent(current, selected.id, { type }))} setDefaultPackage={(value) => setDocument((current) => defaultPackagePatch(current, selected.id, value))} />
      </aside>
    </div>
    {menuNode&&<LayerActionsMenu menu={layerMenu} node={menuNode} isRoot={menuNode.id===document.root.id||menuNode.id===pages.active.id} canPaste={Boolean(editorClipboard.fragment?.roots.every((node)=>canContain(CONTAINER_TYPES.has(menuNode.type)?menuNode:nodes.get(parents.get(menuNode.id)),node)))} canWrap={Boolean(parents.get(menuNode.id)&&canContain(nodes.get(parents.get(menuNode.id)),{type:'Stack'})&&canContain({type:'Stack'},menuNode))} hasStyles={Boolean(editorClipboard.styles)} onAction={menuAction} onClose={()=>setLayerMenu(null)}/>}
    {libraryOpen && <div className="modal-backdrop"><section className="modal ne-library" role="dialog" aria-label="组件库"><header><h2>组件库</h2><button className="ne-icon" title="关闭组件库" onClick={() => setLibraryOpen(false)}><X size={18} /></button></header><div className="ne-library-body"><Field label="组件名称"><input value={libraryName} maxLength={40} onChange={(event) => setLibraryName(event.target.value)} /></Field><button className="secondary" onClick={saveLibrary}><Save size={16} />保存当前组件</button>{library.map((record) => <div className="ne-library-row" key={record.id}><span>{record.name} · {COMPONENT_NAMES[record.node.type]}</span><button className="secondary" disabled={!canContain(insertionParent, record.node)} onClick={() => { const node = cloneComponent(record.node); setDocument((current) => withFontResources(insertComponent(current, insertionParent.id, node),record.fonts)); setSelectedId(node.id); setLibraryOpen(false); }}>插入</button><button className="ne-icon danger" title={`删除 ${record.name}`} onClick={() => { const next = library.filter((item) => item.id !== record.id); try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); } catch { setStatus('组件库保存失败'); } }}><Trash2 size={16} /></button></div>)}</div></section></div>}
  </div>;
}
function findPackage(id, nodes, parents) { let current = nodes.get(id); while (current) { if (current.type === 'Package') return current; current = nodes.get(parents.get(current.id)); } return null; }
function findAncestor(id,nodes,parents,type) {let current=nodes.get(id);while(current){if(current.type===type)return current;current=nodes.get(parents.get(current.id));}return null;}
