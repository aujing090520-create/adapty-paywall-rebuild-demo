import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Copy, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Eye, EyeOff, Pencil, Save, FolderOpen, X, Layers, Type, Image as ImageIcon, FolderClosed as PackageIcon, MoreHorizontal, MousePointerClick, Smartphone, Workflow, GalleryHorizontal, PanelTop, PanelBottom, Clock3, ToggleLeft, ListOrdered, Video, Star, Code, CreditCard, Columns2, Rows2, Minus, Maximize2 } from 'lucide-react';
import { COMPONENT_NAMES, CONTAINER_TYPES, componentLayerLabel, uniqueSceneName, componentProps, importComponentDocument, indexDocument, validDocument, updateComponent, insertComponent, canContain, readComponentDocument, saveComponentDocument, cloneComponent, captureNativeComponent, resolveComponentText } from './componentDocument.js';
import { DEMO_SKUS } from '../productPricing.js';
import PaywallPresentation from './PaywallPresentation.jsx';
import PaywallSettings from './PaywallSettings.jsx';
import { Settings } from 'lucide-react';
import ComponentPicker from './ComponentPicker.jsx';
import LayerActionsMenu from './LayerActionsMenu.jsx';
import { createCatalogComponent, upgradeCanonicalComponents, catalogFor, createTabSelector } from './componentCatalog.js';
import { editorClipboard, copyFragment, pasteFragment, copyStyles, pasteStyles, wrapInStack, patchComponentProperties, appendTab, insertPackageComponent, togglePageControl, removeEditorComponent as removeComponent, moveEditorComponent as moveComponent, reconcileTabNavigation } from './componentOperations.js';
import { treeChildren, initialCollapsed, pageContext, isOverlaySurface, surfaceContext } from './componentTree.js';
import './componentEditor.css';
import useWorkbenchHeight from './useWorkbenchHeight.js';
import useCanvasWheel from './useCanvasWheel.js';
import RevenueCatProperties from './RevenueCatProperties.jsx';
import { migrateTemplateVisuals } from './templateVisuals.js';
import { defaultPackagePatch, sequencePages } from './propertyModel.js';
import {fontResources,withFontResources} from './fontStyles.js';
import { documentArtboards } from './artboards.js';
import { workflowContext, workflowEdges, workflowIssues, owningScreen, owningModal, addWorkflowStep, duplicateWorkflowStep, moveWorkflowStep, removeWorkflowStep, setInitialStep } from './workflow.js';
import WorkflowConnections, { STEP_BOARD_GAP, STEP_CANVAS_GUTTER } from './WorkflowConnections.jsx';
import { flowInitialIndex } from './componentTree.js';
import { GripVertical } from 'lucide-react';
import { upgradeButtonModals, buttonModalEdges, createButtonModal, attachButtonModal, addNavigationButton, navigationButton } from './buttonModals.js';
import { upgradeNavigationRows } from './navigationRows.js';
import { exitOfferConnections, exitOfferSource, exitOfferId, workspaceExitOfferIds, exitOfferTarget, bindExitOffer } from './exitOffers.js';
import { bindCloseTarget, closeTargetId, createRetentionModal, importCloseTarget, removeCanvasModal, modalPresentationDocument } from './closeTargets.js';
const StepPicker = React.lazy(()=>import('./StepPicker.jsx'));
const CloseTargetPicker = React.lazy(()=>import('./CloseTargetPicker.jsx'));

const libraryKey = 'paywall-component-library-v3';
const fieldNames = { name: '商品名称', price: '主价格', reference: '参考价', monthlyPrice: 'SKU 月均价', referencePrice: 'SKU 原价', supportingCopy: '辅助文案', savingCopy: '优惠说明', saveCopy: 'SAVE 文案', badgeText: '标签文字' };
const iconFor = (type,axis) => ({ Screen: Smartphone, Flow: Workflow, Stack:axis==='horizontal'?Columns2:axis==='overlay'?Layers:Rows2, Text: Type, Image: ImageIcon, Video, Icon: Star, Custom: Code, Package: PackageIcon, Button: MousePointerClick, PurchaseButton: CreditCard, Header: PanelTop, Footer: PanelBottom, BottomSheet: PanelBottom, Carousel: GalleryHorizontal, Tabs: Columns2, TabControl: Columns2, TabButton: MousePointerClick, Timeline: ListOrdered, Countdown: Clock3, Toggle: ToggleLeft, Switch: ToggleLeft, Wallet: CreditCard, ExpressCheckout: CreditCard }[type] ?? Layers);
function Field({ label, children }) { return <label className="ne-field"><span>{label}</span>{children}</label>; }
function Select({ label, value, onChange, options }) { return <Field label={label}><select aria-label={label} value={value ?? ''} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const [key, name] = Array.isArray(option) ? option : [option, option]; return <option key={key} value={key}>{name}</option>; })}</select></Field>; }
function readLibrary() { try { const value = JSON.parse(localStorage.getItem(libraryKey) ?? '[]'); return Array.isArray(value) ? value.filter((item) => item?.name && validDocument({ version: 3, products: {}, fonts:item.fonts, root: { id: '$library', type: 'Screen', props: {}, children: [item.node] } })) : []; } catch { return []; } }

export default function ComponentEditor({ template, initialNodes, initialDocument, onDocumentChange, persistence = 'legacy', offerings = [], currentPaywallId, onCreateExitOffer, onExitOfferChange, isExitOffer = false, backdropDocument }) {
  const [initial] = useState(() => {
    try {
      const saved = persistence === 'session' ? initialDocument : readComponentDocument(localStorage, template?.id ?? 'blank');
      if (saved && (!validDocument(saved) || saved.templateId !== (template?.id ?? 'blank'))) throw new Error('已保存的付费墙内容无效，原记录仍然保留');
      const defaults = importComponentDocument(initialNodes, template);
      const document = saved ? persistence === 'session' ? saved : migrateTemplateVisuals(saved, importComponentDocument(initialNodes, template, false), defaults) : defaults;
      return { document: upgradeNavigationRows(upgradeButtonModals(upgradeCanonicalComponents(document), offerings, currentPaywallId)), error: '' };
    } catch (error) {
      return { document: upgradeNavigationRows(upgradeButtonModals(upgradeCanonicalComponents(importComponentDocument(initialNodes, template)), offerings, currentPaywallId)), error: error.message };
    }
  });
  const [mainDocument, setMainDocument] = useState(initial.document);
  const [focusedOfferingId, setFocusedOfferingId] = useState(null);
  const boundExits = mainDocument.settings?.buttonModalVersion ? [] : offerings.filter((offering) => workspaceExitOfferIds(mainDocument).includes(offering.id));
  const activeExit = boundExits.find((offering) => offering.id === focusedOfferingId) ?? null;
  const document = activeExit?.document ?? mainDocument;
  const owner = activeExit?.id ?? null;
  const scope = owner ?? 'main';
  const setDocument = (update) => {
    if (activeExit) onExitOfferChange?.(activeExit.id, typeof update === 'function' ? update(document) : update);
    else setMainDocument(update);
  };
  const [saveError, setSaveError] = useState(initial.error);
  const blockedSave = Boolean(initial.error);
  const latest = useRef(document), latestMain = useRef(mainDocument);
  latestMain.current = mainDocument;
  useEffect(() => { onDocumentChange?.(mainDocument); }, [mainDocument, onDocumentChange]);
  const [contexts, setContexts] = useState({});
  const context = contexts[scope] ?? {};
  const setContext = (key, update, target = scope) => setContexts((current) => ({ ...current, [target]: { ...current[target], [key]: typeof update === 'function' ? update(current[target]?.[key] ?? (key === 'collapsed' ? initialEditorCollapsed(document) : {})) : update } }));
  const selectedId = context.selectedId ?? document.settings?.presentationSurfaceId ?? pageContext(document).active.id;
  const setSelectedId = (update) => setContext('selectedId', update);
  const collapsed = useMemo(() => { const next = context.collapsed ?? initialEditorCollapsed(document); if (context.collapsed) return next; next.delete(document.settings?.presentationSurfaceId); return next; }, [context.collapsed, document]);
  const setCollapsed = (update) => setContext('collapsed', update);
  const [editing, setEditing] = useState(true);
  const [hoveredLayer, setHoveredLayer] = useState(null);
  useEffect(() => setHoveredLayer(null), [editing, mainDocument, focusedOfferingId]);
  const [previewMode, setPreviewMode] = useState('flow'), [previewNavigation, setPreviewNavigation] = useState({});
  const navigation = context.navigation ?? (document.settings?.presentationSurfaceId ? { overlay: document.settings.presentationSurfaceId } : {});
  const setNavigation = (update) => setContext('navigation', update);
  const [zoom, setZoom] = useState(0.55);
  const boardElements = useRef(new Map());
  const boardScroll = useRef(null);
  useCanvasWheel(boardScroll, editing);
  const workbench = useWorkbenchHeight();
  const patchNavigation = React.useCallback((values)=>setContexts((current)=>({ ...current, [scope]: { ...current[scope], navigation: { ...current[scope]?.navigation, ...values } } })),[scope]);
  const previousDocuments=useRef(new Map());
  useEffect(()=>{const before=previousDocuments.current.get(scope);previousDocuments.current.set(scope,document);if(before&&before!==document)setNavigation((current)=>reconcileTabNavigation(before,document,current));},[document,scope]);
  const [addTarget, setAddTarget] = useState(null), [dragId, setDragId] = useState(null), [status, setStatus] = useState('');
  const [layerMenu,setLayerMenu] = useState(null), [renaming,setRenaming] = useState(null);
  const [library, setLibrary] = useState(readLibrary), [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stepPicker, setStepPicker] = useState(false);
  const [creationSurfaceId, setCreationSurfaceId] = useState(null);
  const [sceneUndo, setSceneUndo] = useState(null);
  const [exitSourceId, setExitSourceId] = useState(null);
  const workflow = workflowContext(mainDocument);
  const exitSource = workflow.steps.find((page) => page.id === exitSourceId && !page.props.hidden) ?? workflow.initial ?? exitOfferSource(mainDocument);
  const exitConnections = mainDocument.settings?.buttonModalVersion ? [] : exitOfferConnections(mainDocument, offerings, currentPaywallId);
  const modalEdges = buttonModalEdges(mainDocument, contexts.main?.navigation ?? {});
  const closeTarget = exitOfferTarget(mainDocument, offerings, currentPaywallId, exitSource?.id);
  const boundExit = boundExits.find((offering) => offering.id === exitOfferId(mainDocument, exitSource?.id));
  const openExitSettings = (sourceId) => { if (typeof sourceId === 'string') setExitSourceId(sourceId); setFocusedOfferingId(null); setSettingsOpen(true); setAddTarget(null); setStepPicker(false); };
  const openCreation = (purpose = 'step', surfaceId = null, sourceId) => { if (sourceId) setExitSourceId(sourceId); setFocusedOfferingId(null); setSettingsOpen(false); setAddTarget(null); setCreationSurfaceId(surfaceId); setStepPicker(purpose); };
  const flowWarnings = useMemo(()=>workflowIssues(mainDocument),[mainDocument]);
  const mainPages = pageContext(mainDocument, contexts.main?.navigation ?? {});
  const { nodes, parents } = useMemo(() => indexDocument(document), [document]);
  const pages = pageContext(document, navigation);
  const { surfaces, surface, triggers } = surfaceContext(document, navigation, selectedId);
  const selected = nodes.get(selectedId) ?? document.root;
  const isPageRoot = selected.id === pages.active.id || selected.id === document.root.id || selected.id === document.settings?.presentationSurfaceId;
  const isModalRoot = selected.type === 'BottomSheet' || Boolean(activeExit && isPageRoot);
  const p = componentProps(selected);
  const parent = nodes.get(parents.get(selected.id));
  const insertionParent = CONTAINER_TYPES.has(selected.type) ? selected : parent ?? document.root;
  const pickerParent = nodes.get(addTarget);
  const commerceAllowed = Boolean(pickerParent && owningModal(document,pickerParent.id)) || !workflowContext(document).steps.some((page)=>page.id===owningScreen(document,pickerParent?.id)?.id&&page.id!==workflowContext(document).final?.id);
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
    const timer = setTimeout(() => setSaveError(saveComponentDocument(localStorage, mainDocument) ? '' : '本地保存失败，请缩小媒体文件后重试'), 250);
    return () => clearTimeout(timer);
  }, [mainDocument, blockedSave, persistence]);
  useEffect(() => { if (persistence === 'session') return; const flush = () => { if (!blockedSave) saveComponentDocument(localStorage, latestMain.current); }; window.addEventListener('pagehide', flush); return () => { flush(); window.removeEventListener('pagehide', flush); }; }, [blockedSave, persistence]);
  const select = (id, source = document, targetOwner = owner) => {
    setSettingsOpen(false);
    setAddTarget(null); setLayerMenu(null); setRenaming(null);
    setFocusedOfferingId(targetOwner); setEditing(true);
    const { nodes: sourceNodes, parents: sourceParents } = indexDocument(source);
    if (!targetOwner) {
      const screen = owningScreen(source, id);
      const modalEdge = exitConnections.find((edge) => !edge.targetOwner && edge.target === id);
      if (sourceNodes.get(id)?.type==='BottomSheet' && modalEdge) setExitSourceId(modalEdge.source);
      else if (workflowContext(source).steps.some((page) => page.id === screen?.id)) setExitSourceId(screen.id);
    } else if (exitOfferId(mainDocument, exitSource?.id) !== targetOwner) setExitSourceId(exitConnections.find((edge) => edge.targetOwner === targetOwner)?.source ?? null);
    const targetScope = targetOwner ?? 'main';
    const reveal = {}; const expand = new Set(); let current = sourceNodes.get(id);
    while (current) {
      expand.add(current.id);
      if (['overlay','sheet'].includes(current.props.presentation)) reveal.overlay = current.id;
      const owner = sourceNodes.get(sourceParents.get(current.id));
      if (owner && ['Tabs', 'Carousel', 'Flow'].includes(owner.type)) {const index=sequencePages(owner).findIndex((item)=>item.id===current.id);if(index>=0)reveal[owner.id]=index;}
      if (owner?.type === 'Switch' && current.type === 'SwitchCase') reveal[owner.id] = current.props.index;
      if (owner?.type === 'ExpressCheckout' && current.type === 'CheckoutState') reveal[owner.id] = current.props.state;
      if (owner?.type === 'Countdown' && current.type === 'CountdownState') reveal[owner.id] = current.props.state;
      current = owner;
    }
    if (!reveal.overlay) reveal.overlay = null;
    setContexts((all) => { const old = all[targetScope] ?? {}; return { ...all, [targetScope]: { ...old, selectedId: id, collapsed: new Set([...(old.collapsed ?? initialEditorCollapsed(source))].filter((key) => !expand.has(key))), navigation: { ...old.navigation, ...reveal } } }; });
  };
  const mainNavigation = contexts.main?.navigation ?? {};
  const boards = useMemo(() => { const main=documentArtboards(mainDocument,null,mainNavigation),exit=boundExits.flatMap((offering)=>documentArtboards(offering.document,offering.id,contexts[offering.id]?.navigation??{}));const stepIds=new Set(workflowContext(mainDocument).steps.map((page)=>page.id));return [...main.filter((board)=>stepIds.has(board.node.id)),...exit,...main.filter((board)=>!stepIds.has(board.node.id)&&(board.kind==='弹层'||board.node.id===mainPages.active.id||board.node.id===mainDocument.settings?.presentationSurfaceId))]; }, [mainDocument, offerings, contexts]);
  const activeBoard = boards.find((board) => board.owner === owner && board.node.id === (surface?.id ?? pages.active.id)) ?? boards.find((board) => board.owner === owner);
  const fitBoards = () => { const width=boardScroll.current?.clientWidth;if(width)setZoom(Math.max(0.3,Math.min(0.75,Math.floor(((width-40-STEP_CANVAS_GUTTER-STEP_BOARD_GAP*(Math.min(boards.length,2)-1))/(390*Math.min(boards.length,2)))*20)/20))); };
  useEffect(()=>{fitBoards();},[boards.length]);
  useEffect(()=>{const element=boardElements.current.get(activeBoard?.key),scroll=boardScroll.current;if(!element||!scroll)return;const rect=element.getBoundingClientRect(),outer=scroll.getBoundingClientRect();const initial=activeBoard?.owner===null&&activeBoard.node.id===workflow.initial?.id;if(initial||rect.left<outer.left||rect.right>outer.right)scroll.scrollTo({left:Math.max(0,scroll.scrollLeft+rect.left-outer.left-20-(initial?STEP_CANVAS_GUTTER:0))});},[activeBoard?.key,workflow.initial?.id,zoom]);
  const focusBoard = (board) => select(board.node.id, board.document, board.owner);
  const focusExit = () => { const board = closeTarget?.local ? boards.find((item) => !item.owner && item.node.id === closeTargetId(mainDocument, exitSource?.id)) : boards.find((item) => item.owner === boundExit?.id); if (board) focusBoard(board); };
  const patch = (props) => setDocument((current) => {
    const changed = patchComponentProperties(current, selected.id, props);
    return props.action?.action === 'OpenSheet' && props.action.actionPage ? attachButtonModal(changed, selected.id, props.action.actionPage) : changed;
  });
  const addModal = (blank) => { const result = createButtonModal(document, selected.id, blank); if (!result.id) return; setDocument(result.document); select(result.id, result.document, owner); };
  const addNav = (kind) => { const result = addNavigationButton(document, selected.id, kind); if (!result.id) return; setDocument(result.document); select(result.id, result.document, owner); };
  const add = (type) => {
    const owner = nodes.get(addTarget); if(!owner)return;
    const nav = ['CloseButton','BackButton'].includes(type);
    if (nav && owner.type === 'Screen') { const result = addNavigationButton(document, owner.id, type === 'BackButton' ? 'back' : 'close'); setDocument(result.document); setAddTarget(null); select(result.id, result.document); return; }
    const switchOwner = type === 'Toggle' && owner.type === 'SwitchCase' ? findAncestor(owner.id,nodes,parents,'Switch') : null;
    const next = nav ? navigationButton(type === 'BackButton' ? 'back' : 'close') : createCatalogComponent(type, undefined, { switchTarget: switchOwner?.id, index: owner.props.index });
    if(type==='Tab'){let number=owner.children.length+1;while(owner.children.some((child)=>child.name===`标签 ${number}`))number++;next.name=`标签 ${number}`;}
    if(type==='TabButton'){ const tabs=findAncestor(owner.id,nodes,parents,'Tabs'); next.props={...next.props,target:tabs?.id ?? '',index:owner.children.length};next.children=[createCatalogComponent('Text')];next.children[0].props.text='标签'; }
    if(type==='TabControl'){const tabs=findAncestor(owner.id,nodes,parents,'Tabs');if(tabs)next.children=createTabSelector(next.id,tabs.id,tabs.children.length).children;}
    if(type==='SwitchCase')next.props.index=[0,1].find((index)=>!owner.children.some((child)=>child.type==='SwitchCase'&&child.props.index===index)) ?? 0;
    if(type==='CheckoutState')next.props.state=['available','unavailable','loading'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'available';
    if(type==='CountdownState')next.props.state=['active','ended','fallback'].find((state)=>!owner.children.some((child)=>child.props.state===state)) ?? 'active';
    let updated=type==='Tab' && owner.type==='Tabs' ? appendTab(document,owner.id,next) : type==='Package'?insertPackageComponent(document,owner.id,next):insertComponent(document,owner.id,next);
    if(updated===document)return setStatus('该容器无法添加此组件');
    setDocument(updated);setAddTarget(null);setCollapsed((old)=>new Set([...old].filter((id)=>id!==owner.id)));setSelectedId(next.id);
    if(type==='Tab'&&owner.type==='Tabs')setNavigation((current)=>({...current,[owner.id]:owner.children.length}));
  };
  const openAdd=(id,source=document,targetOwner=owner)=>{select(id,source,targetOwner);setLayerMenu(null);setAddTarget(id);};
  const openMenu=(event,id,source=document,targetOwner=owner)=>{
    event.preventDefault();event.stopPropagation();select(id,source,targetOwner);
    const rect=event.currentTarget.getBoundingClientRect();
    const scene=Boolean(source.root.id===id&&targetOwner||indexDocument(source).nodes.get(id)?.type==='BottomSheet');
    const linked=exitConnections.some((edge)=>targetOwner?edge.targetOwner===targetOwner:!edge.targetOwner&&edge.target===id);
    setLayerMenu({id,x:rect.right,y:rect.bottom,step:targetOwner===null&&workflow.steps.some((page)=>page.id===id),scene:scene?{linked}:false});
  };
  const unlink = () => { const linkedId=exitOfferId(mainDocument,exitSource.id); let next = bindCloseTarget(mainDocument, exitSource.id, ''); if(linkedId)next={...next,settings:{...next.settings,retainedPopupIds:[...new Set([...next.settings?.retainedPopupIds??[],linkedId])]}};setSceneUndo({ before: mainDocument, after: next }); setMainDocument(next); setStatus('已解除关联，内容仍保留在画布中'); };
  const deleteScene = (id) => {
    let next = mainDocument;
    if (owner) {for (const page of workflow.steps) { if (exitOfferId(next, page.id) === owner) next = bindCloseTarget(next, page.id, ''); }next={...next,settings:{...next.settings,retainedPopupIds:(next.settings?.retainedPopupIds??[]).filter((item)=>item!==owner)}};}
    else next = removeCanvasModal(mainDocument, id);
    setSceneUndo({ before: mainDocument, after: next }); setMainDocument(next); setFocusedOfferingId(null); select(exitSource.id, next, null); setStatus('已移除弹窗及其关联');
  };
  const duplicateAt=(id)=>{const owner=nodes.get(parents.get(id));if(!owner)return;const result=pasteFragment(document,owner.id,copyFragment(document,id),owner.children.findIndex((node)=>node.id===id)+1);if(result.ids.length){const copyId=result.ids[0],copy=indexDocument(result.document).nodes.get(copyId);setDocument(['Screen','BottomSheet'].includes(copy.type)?updateComponent(result.document,copyId,{name:uniqueSceneName(result.document,copy.name,copyId)}):result.document);setSelectedId(copyId);}};
  const menuAction=(action)=>{
    const node=nodes.get(layerMenu?.id);if(!node)return;const owner=nodes.get(parents.get(node.id));setLayerMenu(null);
    if (layerMenu.scene && action === 'delete') { deleteScene(node.id); return; }
    if (layerMenu.scene && action === 'unlink') { unlink(); return; }
    if(layerMenu.step&&action!=='rename'){
      let next=mainDocument,id=node.id;
      if(action==='duplicate'){const result=duplicateWorkflowStep(mainDocument,node.id);if(result.error)return setStatus(result.error);next=result.document;id=result.id;}
      if(['up','down'].includes(action))next=moveWorkflowStep(mainDocument,node.id,action==='up'?-1:1);
      if(action==='delete'){next=removeWorkflowStep(mainDocument,node.id);id=workflowContext(next).initial.id;}
      setMainDocument(next);select(id,next,null);return;
    }
    if(action==='rename' && node.type === 'Screen'){select(node.id);setRenaming({id:node.id,before:node.name});}
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
  const highlightLayer = (id, source, targetOwner) => {
    const boardId = surfaceContext(source, {}, id).surface?.id ?? owningScreen(source, id)?.id;
    setHoveredLayer({ id, owner: targetOwner, boardId });
  };
  const renderTree = (node, depth = 0, source = document, targetOwner = owner, inSelectedSubtree = false) => {
    const targetScope=targetOwner??'main',state=contexts[targetScope]??{},closed=targetScope===scope?collapsed:state.collapsed??initialEditorCollapsed(source);
    const Icon = iconFor(node.type,componentProps(node).axis), isCollapsed = closed.has(node.id);
    const visibleChildren = treeChildren(node, state.navigation??{}).filter((child) => !isOverlaySurface(child) || node.props.action?.action === 'OpenSheet' && node.props.action.actionPage === child.id);
    const isSelected = targetOwner === owner && selected.id === node.id;
    const sourceIndex=source===document?{nodes,parents}:indexDocument(source);
    const content = node.type === 'Text' ? resolveComponentText(node, source, findPackage(node.id, sourceIndex.nodes, sourceIndex.parents)) : '';
    const displayLabel=componentLayerLabel(node,content);
    return <React.Fragment key={node.id}><div data-layer-id={node.id} data-layer-type={node.type} className={`ne-tree-row ${isSelected ? 'selected' : inSelectedSubtree ? 'in-selected-subtree' : ''}${node.props.hidden?' is-hidden':''}`} style={{ paddingLeft: 20 + depth * 16 }} onMouseEnter={() => highlightLayer(node.id, source, targetOwner)} onMouseLeave={() => setHoveredLayer(null)} onFocus={() => highlightLayer(node.id, source, targetOwner)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHoveredLayer(null); }} draggable={node.type!=='Screen'&&node.id!==source.root.id&&node.id!==source.settings?.presentationSurfaceId&&!renaming} onDragStart={(event) => { event.stopPropagation(); select(node.id,source,targetOwner); setDragId(node.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', node.id); }} onDragEnd={() => setDragId(null)} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => targetOwner===owner&&drop(event, node, false)}>
      {node.type !== 'Screen' && <GripVertical size={12} className="ne-tree-grip" aria-hidden="true"/>}
      {visibleChildren.length?<button type="button" className="ne-icon ne-expand" title={isCollapsed ? '展开' : '收起'} aria-label={`${isCollapsed?'展开':'收起'}${displayLabel}`} aria-expanded={!isCollapsed} onClick={() => setContexts((all)=>{const current=all[targetScope]??{};const next=new Set(current.collapsed??initialEditorCollapsed(source));if(next.has(node.id))next.delete(node.id);else next.add(node.id);return {...all,[targetScope]:{...current,collapsed:next}};})}>{isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>:<span className="ne-leaf-spacer" aria-hidden="true"/>}
      {targetOwner === owner && renaming?.id===node.id?<input className="ne-tree-rename" aria-label="重命名图层" autoFocus value={node.name} onChange={(event)=>setDocument((current)=>updateComponent(current,node.id,{name:event.target.value}))} onBlur={()=>setRenaming(null)} onKeyDown={(event)=>{if(event.key==='Enter')setRenaming(null);if(event.key==='Escape'){setDocument((current)=>updateComponent(current,node.id,{name:renaming.before}));setRenaming(null);}}}/>:<button className="ne-tree-select" onClick={() => select(node.id,source,targetOwner)} title={`${COMPONENT_NAMES[node.type]}：${displayLabel}${content&&content!==displayLabel?`\n${content}`:''}`} aria-label={`${displayLabel}${node.props.hidden?'（隐藏）':''}`}><Icon size={16} /><span className="ne-tree-label">{displayLabel}</span>{node.props.hidden&&<EyeOff size={13} className="ne-layer-hidden" aria-hidden="true"/>}</button>}
      <div className="ne-row-actions">{CONTAINER_TYPES.has(node.type)&&catalogFor(node).length>0&&<button type="button" className="ne-icon" title="添加子组件" aria-label={`向${node.name}添加组件`} onClick={()=>openAdd(node.id,source,targetOwner)}><Plus size={14}/></button>}<button type="button" className="ne-icon" data-layer-menu-trigger title="更多操作" aria-label={`${displayLabel}的更多操作`} onClick={(event)=>openMenu(event,node.id,source,targetOwner)}><MoreHorizontal size={16}/></button></div>
      {CONTAINER_TYPES.has(node.type) && dragId && <span className="ne-drop-inside" aria-label="放入此容器" title="放入此容器" onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => targetOwner===owner&&drop(event, node, true)}><Plus size={14}/></span>}
    </div>{!isCollapsed && <>{node.type === 'Flow' && <div className="ne-page-picker" style={{paddingLeft: 24 + depth * 12}}><Select label="当前页面" value={treeChildren(node,navigation)[0]?.id ?? ''} options={node.children.map((child)=>[child.id,child.name])} onChange={select}/></div>}{visibleChildren.map((child) => renderTree(child, depth + 1, source, targetOwner, inSelectedSubtree || isSelected))}</>}</React.Fragment>;
  };
  const saveLibrary = () => {
    const name = libraryName.trim(); if (!name) return setStatus('请输入组件名称');
    const node=captureNativeComponent(document,selected);
    const next = [{ id: crypto.randomUUID(), name, node, fonts:fontResources(node,document.fonts) }, ...library];
    try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); setLibraryName(''); setStatus('已保存当前组件结构与样式'); } catch { setStatus('组件库保存失败：本地空间不足'); }
  };
  const changeProduct = (key, value) => setDocument((current) => ({ ...current, products: { ...current.products, [p.dataKey ?? selected.id]: { ...current.products[p.dataKey ?? selected.id], [key]: value } }, root: updateComponent(current, selected.id, { props: { dataKey: p.dataKey ?? selected.id } }).root }));
  const addStep = (source,screenId,options) => {
    const result=addWorkflowStep(mainDocument,{source,screenId,beforeId:workflow.initial?.id,...options});
    if(result.error)return setStatus(result.error);
    setMainDocument(result.document);setStepPicker(false);select(result.id,result.document,null);
  };
  const createModal = (blank = false) => { const result = createRetentionModal(mainDocument, exitSource.id, blank); setMainDocument(result.document); setStepPicker(false); select(result.id, result.document, null); };
  const bindModal = (id) => { const next = bindCloseTarget(mainDocument, exitSource.id, id); setMainDocument(next); setStepPicker(false); select(id, next, null); setStatus(`已关联：关闭「${exitSource.name}」后显示该内容`); };
  const bindSaved = (id) => { const next = bindExitOffer(mainDocument, exitSource.id, id); setMainDocument(next); setStepPicker(false); setSettingsOpen(true); };
  const importModal = (source, id) => { const result = importCloseTarget(mainDocument, exitSource.id, source, id); if (result.error) return setStatus(result.error); setMainDocument(result.document); setStepPicker(false); select(result.id, result.document, null); };
  const previewDocument = previewMode === 'modal' ? activeExit?.document ?? modalPresentationDocument(mainDocument, surface?.id) ?? mainDocument : mainDocument;
  const startPreview = (mode = 'flow') => { const flow=workflow.flow; setPreviewMode(mode); setPreviewNavigation(flow?{[flow.id]:mode==='close'?flow.children.findIndex((page)=>page.id===exitSource.id):flowInitialIndex(flow),[`history:${flow.id}`]:[],overlay:null}:{overlay:null}); setEditing(false); workbench.current?.scrollIntoView?.({block:'start'}); };
  return <div className="native-editor" data-no-translate="true">
    {saveError && <p className="ne-error" role="alert">{saveError}{blockedSave ? '。为保护原记录，本次未覆盖保存。' : ''}</p>}
    <div className="builder ne-builder" ref={workbench}>
      <aside className="ne-layers">{stepPicker?<React.Suspense fallback={<p>加载内容来源…</p>}>{stepPicker==='exit'?<CloseTargetPicker key={exitSource.id} document={mainDocument} source={exitSource} offerings={offerings} boundOfferings={boundExits} initialId={creationSurfaceId} onBack={()=>setStepPicker(false)} onCreate={createModal} onBind={bindModal} onBindSaved={bindSaved} onImport={importModal} onSourceChange={setExitSourceId}/>:<StepPicker offerings={offerings} nextStep={workflow.initial} onBack={()=>setStepPicker(false)} onAdd={addStep}/>}</React.Suspense>:pickerParent?<ComponentPicker commerceAllowed={commerceAllowed} parent={pickerParent} onBack={()=>setAddTarget(null)} onAdd={add}/>:<>
        <header><strong>图层</strong><button className="ne-icon" title="添加组件" aria-label="添加组件" onClick={()=>openAdd(insertionParent.id===document.root.id?pages.active.id:insertionParent.id)}><Plus size={17}/></button></header>
        <div className="ne-tree">
          <div role="tree" aria-label="组件图层">{workflow.steps.map((page)=>renderTree(mainDocument.settings?.presentationSurfaceId?indexDocument(mainDocument).nodes.get(mainDocument.settings.presentationSurfaceId):page,0,mainDocument,null))}
            {mainPages.shared.filter((node)=>!isOverlaySurface(node)).map((node)=>renderTree(node,0,mainDocument,null))}
          </div>
        </div>
      </>}</aside>
      <div className="canvas-area ne-canvas ne-artboard-canvas">{flowWarnings.length>0&&<div className="ne-workflow-issues" role="status">{flowWarnings.map((message)=><div key={message}>{message}</div>)}</div>}
        <div className="device-controls"><span>iPhone · 390 × 844</span>
          <div className="ne-zoom"><button className="ne-icon" aria-label="缩小画布" title="缩小画布" disabled={zoom<=0.3} onClick={()=>setZoom((value)=>Math.max(0.3,Math.round((value-0.1)*100)/100))}><Minus size={15}/></button><select aria-label="画布缩放" value={zoom} onChange={(event)=>setZoom(Number(event.target.value))}>{[0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,1].map((value)=><option value={value} key={value}>{Math.round(value*100)}%</option>)}</select><button className="ne-icon" aria-label="放大画布" title="放大画布" disabled={zoom>=1} onClick={()=>setZoom((value)=>Math.min(1,Math.round((value+0.1)*100)/100))}><Plus size={15}/></button><button className="ne-icon" aria-label="适应画布" title="适应画布" onClick={fitBoards}><Maximize2 size={15}/></button></div>
          <button className="secondary" onClick={()=>editing?startPreview('flow'):setEditing(true)}>{editing?<Eye size={15}/>:<Pencil size={15}/>} {editing?'预览流程':'返回编辑'}</button>
          {editing&&(surface||activeExit)&&<button type="button" className="secondary" onClick={()=>startPreview('modal')}><Eye size={15}/>预览弹窗</button>}
        </div>
        {!activeExit && !isExitOffer && surface&&<div className="ne-surface-context" aria-label="当前弹窗"><strong>{surface.name}</strong><span>{exitConnections.some((edge)=>!edge.targetOwner&&edge.target===surface.id)?'页面关闭时显示':triggers.length?'按钮点击时显示':'尚未关联'}</span>{triggers.map((node)=><button type="button" className="ne-surface-trigger" key={node.id} onClick={()=>select(node.id)} title={`定位触发按钮：${node.name}`}>{node.name}</button>)}</div>}
        {editing?<div ref={boardScroll} className="ne-artboard-scroll" role="region" aria-label="多画板画布" tabIndex={0}><div className="ne-artboard-track">
          <WorkflowConnections boards={boards} edges={[...workflowEdges(mainDocument),...modalEdges]} zoom={zoom} initialStepId={workflow.initial?.id} onAddStep={!mainDocument.settings?.presentationSurfaceId&&!isExitOffer&&workflow.steps.length<10?()=>openCreation():undefined} onSelect={(id)=>select(id,mainDocument,null)}/>
          {boards.map((board)=><section key={board.key} ref={(element)=>{if(element)boardElements.current.set(board.key,element);else boardElements.current.delete(board.key);}} className={`ne-artboard${activeBoard?.key===board.key?' active':''}`} aria-label={`画板：${board.label}`} data-board-owner={board.owner??'main'} style={{width:390*zoom}}>
            <header><button type="button" aria-label={`选择画板：${board.label}`} aria-pressed={activeBoard?.key===board.key} onClick={()=>focusBoard(board)}><span>{board.label}</span><small>{modalEdges.filter((edge)=>edge.target===board.node.id).map((edge)=>`点击「${edge.label}」后显示`).join(' / ')||(board.owner||board.kind==='弹层'?'尚未关联':board.node.id===workflow.initial?.id?'初始页面':'页面')}</small></button>
            </header>
            <div className="ne-artboard-frame" style={{height:844*zoom}}><div className="ne-artboard-scale" style={{transform:`scale(${zoom})`}}><PaywallPresentation document={board.document} selectedId={activeBoard?.key===board.key?selected.id:undefined} highlightedId={hoveredLayer?.owner===board.owner&&hoveredLayer?.boardId===board.node.id?hoveredLayer.id:undefined} inspectable={activeBoard?.key===board.key} onSelect={(id)=>select(id,board.document,board.owner)} editing navigation={board.navigation} onStatus={setStatus} currentPaywallId={board.owner??currentPaywallId} backdropDocument={board.owner?mainDocument:backdropDocument} backdropNavigation={board.owner&&workflow.flow?{[workflow.flow.id]:workflow.flow.children.findIndex((page)=>page.id===(exitOfferId(mainDocument,exitSource?.id)===board.owner?exitSource?.id:exitConnections.find((edge)=>edge.targetOwner===board.owner)?.source))}:undefined}/></div></div>
          </section>)}
        </div></div>:<div className="ne-interactive-board"><PaywallPresentation key={`interactive:${previewMode}`} document={previewDocument} onSelect={select} editing={false} navigation={previewMode==='modal'&&previewDocument.settings?.presentationSurfaceId?{overlay:previewDocument.settings.presentationSurfaceId}:previewNavigation} onNavigate={(next)=>setPreviewNavigation((current)=>({...current,...next}))} onStatus={setStatus} offerings={previewMode==='modal'?[]:offerings} currentPaywallId={currentPaywallId} backdropDocument={previewMode==='modal'?mainDocument:backdropDocument} backdropNavigation={workflow.flow?{[workflow.flow.id]:workflow.flow.children.findIndex((page)=>page.id===exitSource?.id)}:undefined}/></div>}{status && <div className="ne-status" role="status"><span>{status}</span><button className="ne-icon" title="关闭提示" onClick={() => setStatus('')}><X size={14} /></button></div>}</div>
      <aside className="ne-properties">{settingsOpen ? <><header><strong>关闭后显示</strong><button type="button" className="ne-icon" aria-label="返回组件属性" title="返回组件属性" onClick={() => setSettingsOpen(false)}><X size={16}/></button></header>
        <PaywallSettings document={mainDocument} sourceId={exitSource?.id} onSourceChange={setExitSourceId} offerings={offerings} currentPaywallId={currentPaywallId} onChoose={()=>openCreation('exit',closeTargetId(mainDocument,exitSource?.id)||null)} onNew={!isExitOffer?()=>createModal(false):undefined} onEdit={focusExit} onUnlink={unlink}/>
      </> : <><header><strong>{COMPONENT_NAMES[selected.type]}</strong><div className="ne-actions"><button className="ne-icon" title="保存到组件库" aria-label="保存到组件库" onClick={() => setLibraryOpen(true)}><Save size={16} /></button><button className="ne-icon" title="打开组件库" aria-label="打开组件库" onClick={() => setLibraryOpen(true)}><FolderOpen size={16} /></button></div></header>
        <section>{selected.type === 'Screen' ? <Field label="页面名称"><input value={selected.name} onChange={(event) => setDocument((current) => updateComponent(current, selected.id, { name: event.target.value }))} /></Field> : <Field label="组件类型"><output>{COMPONENT_NAMES[selected.type]}</output></Field>}
          {selected.type==='Screen'&&!owner&&workflow.flow&&workflow.steps.length>1&&workflow.steps.some((page)=>page.id===selected.id)&&<Select label="初始页面" value={workflow.initial?.id??''} options={workflow.steps.filter((page)=>!page.props.hidden).map((page)=>[page.id,page.name])} onChange={(id)=>setMainDocument((current)=>setInitialStep(current,id))}/>}
          <div className="ne-actions"><button className="ne-icon" title="上移" aria-label="上移" disabled={isPageRoot || !parent || parent.children[0]?.id === selected.id} onClick={() => reorder(-1)}><ArrowUp size={16} /></button><button className="ne-icon" title="下移" aria-label="下移" disabled={isPageRoot || !parent || parent.children.at(-1)?.id === selected.id} onClick={() => reorder(1)}><ArrowDown size={16} /></button><button className="ne-icon" title="复制组件" aria-label="复制组件" disabled={isPageRoot || !parent} onClick={() => duplicateAt(selected.id)}><Copy size={16} /></button><button className="ne-icon danger" title={isModalRoot?'删除弹窗':'删除组件'} aria-label={isModalRoot?'删除弹窗':'删除组件'} disabled={!isModalRoot&&(isPageRoot||!parent)} onClick={()=>{if(isModalRoot)deleteScene(selected.id);else{setDocument((current)=>removeComponent(current,selected.id));setSelectedId(parent.id);}}}><Trash2 size={16}/></button></div>
          {!isPageRoot&&<Select label="显示状态" value={p.hidden?'hidden':'visible'} onChange={(value)=>patch({hidden:value==='hidden'})} options={[[ 'visible','显示' ],[ 'hidden','隐藏' ]]}/>}
        </section>
        {selected.type==='Screen'&&<section aria-label="页面导航按钮"><strong>导航按钮</strong><div className="ne-actions ne-modal-actions"><button type="button" className="secondary" onClick={()=>addNav('close')}><X size={14}/>添加关闭按钮</button><button type="button" className="secondary" onClick={()=>addNav('back')}><ChevronRight size={14} style={{transform:'rotate(180deg)'}}/>添加返回按钮</button></div></section>}
        {isModalRoot&&<section aria-label="弹窗触发按钮"><strong>触发按钮</strong>{triggers.map((button)=><button type="button" className="ne-surface-trigger" key={button.id} onClick={()=>select(button.id)}>{button.name}</button>)}</section>}
        <RevenueCatProperties key={`${scope}:${selected.id}`} selected={selected} p={p} patch={patch} document={document} nodes={nodes} parents={parents} resolveText={resolveComponentText} findPackage={findPackage} changeProduct={changeProduct} fieldNames={fieldNames} demoSkus={DEMO_SKUS} navigation={navigation} setNavigation={patchNavigation} onStatus={setStatus} onFontsChange={saveFonts} onModalCreate={addModal} onModalEdit={(id)=>select(id)} onPageControl={(enabled)=>setDocument((current)=>togglePageControl(current,selected.id,enabled))} onMediaType={(type) => setDocument((current) => updateComponent(current, selected.id, { type }))} setDefaultPackage={(value) => setDocument((current) => defaultPackagePatch(current, selected.id, value))} />
        </>}
      </aside>
    </div>
    {sceneUndo&&mainDocument===sceneUndo.after&&<button type="button" className="ne-scene-undo secondary" onClick={()=>{setMainDocument(sceneUndo.before);setSceneUndo(null);setStatus('已撤销移除');}}>撤销移除</button>}
    {menuNode&&<LayerActionsMenu menu={layerMenu} node={menuNode} scene={layerMenu.scene} step={layerMenu.step?{count:workflow.steps.length,index:workflow.steps.findIndex((page)=>page.id===menuNode.id)}:undefined} isRoot={menuNode.id===document.root.id||menuNode.id===pages.active.id||menuNode.id===document.settings?.presentationSurfaceId} canPaste={Boolean(editorClipboard.fragment?.roots.every((node)=>canContain(CONTAINER_TYPES.has(menuNode.type)?menuNode:nodes.get(parents.get(menuNode.id)),node)))} canWrap={Boolean(parents.get(menuNode.id)&&canContain(nodes.get(parents.get(menuNode.id)),{type:'Stack'})&&canContain({type:'Stack'},menuNode))} hasStyles={Boolean(editorClipboard.styles)} onAction={menuAction} onClose={()=>setLayerMenu(null)}/>}
    {libraryOpen && <div className="modal-backdrop"><section className="modal ne-library" role="dialog" aria-label="组件库"><header><h2>组件库</h2><button className="ne-icon" title="关闭组件库" onClick={() => setLibraryOpen(false)}><X size={18} /></button></header><div className="ne-library-body"><Field label="组件名称"><input value={libraryName} maxLength={40} onChange={(event) => setLibraryName(event.target.value)} /></Field><button className="secondary" onClick={saveLibrary}><Save size={16} />保存当前组件</button>{library.map((record) => <div className="ne-library-row" key={record.id}><span>{record.name} · {COMPONENT_NAMES[record.node.type]}</span><button className="secondary" disabled={!canContain(insertionParent, record.node)} onClick={() => { const node = cloneComponent(record.node); setDocument((current) => withFontResources(insertComponent(current, insertionParent.id, node),record.fonts)); setSelectedId(node.id); setLibraryOpen(false); }}>插入</button><button className="ne-icon danger" title={`删除 ${record.name}`} onClick={() => { const next = library.filter((item) => item.id !== record.id); try { localStorage.setItem(libraryKey, JSON.stringify(next)); setLibrary(next); } catch { setStatus('组件库保存失败'); } }}><Trash2 size={16} /></button></div>)}</div></section></div>}
  </div>;
}
function findPackage(id, nodes, parents) { let current = nodes.get(id); while (current) { if (current.type === 'Package') return current; current = nodes.get(parents.get(current.id)); } return null; }
function initialEditorCollapsed(document) {
  const result=initialCollapsed(document.root),{steps,initial}=workflowContext(document);
  for(const page of steps)if(page.id!==initial?.id)result.add(page.id);
  return result;
}
function findAncestor(id,nodes,parents,type) {let current=nodes.get(id);while(current){if(current.type===type)return current;current=nodes.get(parents.get(current.id));}return null;}
