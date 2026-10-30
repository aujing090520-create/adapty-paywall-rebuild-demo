import { component, componentProps, cloneComponent, indexDocument, insertComponent, updateComponent, canContain, removeComponent, moveComponent } from './componentDocument.js';
import { STATE_STYLE_KEYS, selectedStyleKey, textPropertyPatch, BADGE_DEFAULTS, BADGE_COMPONENT_TYPES } from './propertyModel.js';
import { createTabSelectorButton, createTabSelector, createPageControl } from './componentCatalog.js';
import {fontResources,withFontResources} from './fontStyles.js';
import {captureFragmentConfiguration,restoreFragmentConfiguration} from './fragmentConfiguration.js';
import {applyPackagePriceMode,packagePriceMode} from '../products/productParameters.js';
import {COMPARISON_ROW_KEYS} from './htVipColumn.js';

const STYLE_KEYS = new Set(['axis','gap','align','justify','wrap','widthMode','width','minWidth','maxWidth','heightMode','height','minHeight','maxHeight','paddingMode','paddingTop','paddingRight','paddingBottom','paddingLeft','paddingVertical','paddingHorizontal','marginMode','marginTop','marginRight','marginBottom','marginLeft','marginVertical','marginHorizontal','background','backgroundImage','backgroundFit','backgroundVideo','fillType','color','radius','shape','borderWidth','borderColor','fontSize','fontWeight','fontFamily','fontStyle','textAlign','objectFit','opacity','alignSelf','strike','bold','italic','underline','textBackground','iconSize','iconBackground','iconRadius','selectedBorder','selectedBackground','selectedColor','shadowX','shadowY','shadowBlur','shadowColor']);
for (const key of [...STATE_STYLE_KEYS, ...STATE_STYLE_KEYS.map(selectedStyleKey), 'lineHeight', 'flexGrow', 'mask', 'overlayColor', 'overlayEnabled', 'pageSpacing', 'pagePeek', 'pageControlPosition', 'dotColor', 'activeDotColor', 'itemSpacing', 'textSpacing', 'columnGutter', 'iconAlignment', 'connectorEnabled', 'connectorWidth', 'connectorColor', 'connectorOpacity', 'connectorMarginMode', 'connectorMarginVertical', 'connectorMarginTop', 'connectorMarginBottom']) STYLE_KEYS.add(key);
for(const key of ['pageAlignment','transitionTime','transitionAnimation','thumbColor','trackColor','thumbColorOpacity','trackColorOpacity','walletStyle','overlapContent'])STYLE_KEYS.add(key);
export const copyStyles = (node,fonts=[]) => {
  const styles=Object.fromEntries(Object.entries(componentProps(node)).filter(([key]) => STYLE_KEYS.has(key)));
  if(BADGE_COMPONENT_TYPES.includes(node.type))styles.$badge={enabled:node.props.badgeEnabled??Boolean(node.props.badge),style:Object.fromEntries(Object.entries({...BADGE_DEFAULTS,...node.props.badge}).filter(([key])=>STYLE_KEYS.has(key)||['position','positionStyle','textBackgroundOpacity'].includes(key)))};
  const resources=fontResources(styles,fonts);
  return structuredClone(resources.length?{...styles,$fonts:resources}:styles);
};
export function pasteStyles(document, id, styles) {
  const node=indexDocument(document).nodes.get(id);
  if(!node)return document;
  let next=patchComponentProperties(withFontResources(document,styles?.$fonts),id,Object.fromEntries(Object.entries(styles ?? {}).filter(([key])=>STYLE_KEYS.has(key))));
  if(BADGE_COMPONENT_TYPES.includes(node.type)&&styles?.$badge)next=updateComponent(next,id,{props:{badgeEnabled:styles.$badge.enabled,badge:{...BADGE_DEFAULTS,...node.props.badge,...structuredClone(styles.$badge.style)}}});
  return next;
}
export function togglePageControl(document,id,enabled) {
  const node=indexDocument(document).nodes.get(id);
  if(node?.type!=='Carousel')return document;
  const controls=node.children.filter((child)=>child.type==='PageControl');
  if(enabled===Boolean(controls.length))return document;
  return updateComponent(document,id,{props:{pageControlVersion:1},children:enabled?[...node.children,createPageControl(crypto.randomUUID())]:node.children.filter((child)=>child.type!=='PageControl')});
}

function tabControls(tab) {
  const controls = [];
  const visit = (node) => {
    if (node.type === 'Tabs') return;
    if (node.type === 'TabControl') controls.push(node);
    else node.children.forEach(visit);
  };
  visit(tab);
  return controls;
}

// Reindex selectors by the page identity they pointed to before a structural edit.
export function reconcileTabStructure(before, after) {
  if(before===after)return after;
  const {nodes:oldNodes,parents:oldParents}=indexDocument(before);
  const oldOwner = (id) => {
    let node = oldNodes.get(id);
    while (node && node.type !== 'Tabs') node = oldNodes.get(oldParents.get(node.id));
    return node;
  };
  let next=after;
  for(const owner of indexDocument(after).nodes.values()) {
    if(owner.type!=='Tabs')continue;
    const previous=oldNodes.get(owner.id);
    const changed = previous && (previous.children.length !== owner.children.length || previous.children.some((tab,index)=>tab.id!==owner.children[index].id));
    const oldIds=previous?.children.map((tab)=>tab.id) ?? [],newIds=owner.children.map((tab)=>tab.id);
    if (changed) {
      const defaultId=oldIds[previous.props.defaultIndex??0];
      next=updateComponent(next,owner.id,{props:{defaultIndex:Math.max(0,newIds.includes(defaultId)?newIds.indexOf(defaultId):Math.min(previous.props.defaultIndex??0,newIds.length-1))}});
    }
    for(const page of owner.children)for(const control of tabControls(page)) {
      const owned=control.children.filter((child)=>child.type==='TabButton');
      const transferred = oldOwner(control.id)?.id !== owner.id && owned.some((child)=>child.props.target && child.props.target!==owner.id);
      const unbound = owned.some((child)=>!child.props.target);
      if(!changed && !transferred && !unbound)continue;
      const buttons=owner.children.map((tab,index)=>{
        const oldIndex=transferred || !previous ? index : oldIds.indexOf(tab.id),existing=owned.find((button)=>button.props.index===oldIndex);
        return existing?{...existing,props:{...existing.props,target:owner.id,index}}:createTabSelectorButton(crypto.randomUUID(),owner.id,index);
      });
      let inserted=false;
      const children=control.children.flatMap((child)=>{
        if(!owned.includes(child))return [child];
        if(inserted)return [];
        inserted=true;return buttons;
      });
      if (!owned.length) children.push(...buttons);
      next=updateComponent(next,control.id,{children});
    }
  }
  return next;
}

export const removeEditorComponent=(document,id)=>reconcileTabStructure(document,removeComponent(document,id));
export const moveEditorComponent=(document,id,parentId,at=Infinity)=>reconcileTabStructure(document,moveComponent(document,id,parentId,at));

export function insertPackageComponent(document, parentId, node) {
  if (node.type !== 'Package') return document;
  const { nodes, parents } = indexDocument(document);
  const boundary = (entry) => ['Screen','BottomSheet','Tab','SwitchCase','CheckoutState'].includes(entry.type) || ['overlay','sheet'].includes(entry.props.presentation);
  const packages = (root) => {
    const result = [];
    const visit = (entry) => {
      if (entry !== root && boundary(entry)) return;
      if (entry.type === 'Package') result.push(entry);
      else entry.children.forEach(visit);
    };
    visit(root);
    return result;
  };
  let scope = nodes.get(parentId), peers = [];
  if (!scope) return document;
  // Join the nearest existing package group without coupling separate screens or sheets.
  while (scope) {
    peers = packages(scope);
    if (peers.length || boundary(scope)) break;
    scope = nodes.get(parents.get(scope.id));
  }
  const entry = { ...node, props: { ...node.props, group: peers[0]?.props.group ?? peers[0]?.id ?? scope?.id ?? parentId, defaultSelected: !peers.some((peer) => peer.props.defaultSelected) } };
  const next = insertComponent(document, parentId, entry);
  if (next === document) return document;
  const key = entry.props.dataKey ?? entry.id;
  return { ...next, products: { ...next.products, [key]: next.products[key] ?? { name: '商品名称', price: '', skuId: '' } } };
}

const packageBoundary = (node) => ['Screen','BottomSheet','Tab','SwitchCase','CheckoutState'].includes(node.type) || ['overlay','sheet'].includes(node.props.presentation);

function packageScope(document, id) {
  const { nodes, parents } = indexDocument(document);
  const selected = nodes.get(id);
  if (selected?.type !== 'Package') return [];
  let scope = nodes.get(parents.get(id));
  while (scope && !packageBoundary(scope)) scope = nodes.get(parents.get(scope.id));
  if (!scope) return [];
  const result = [];
  const visit = (node) => {
    if (node !== scope && packageBoundary(node)) return;
    if (node.type === 'Package') result.push(node);
    else node.children.forEach(visit);
  };
  visit(scope);
  return result;
}

export function packageSelectionGroups(document, id) {
  const packages = packageScope(document, id);
  const groups = [];
  for (const [index, node] of packages.entries()) {
    const key = node.props.group ?? node.id;
    let group = groups.find((entry) => entry.key === key);
    if (!group) { group = { key, members: [], first: index + 1 }; groups.push(group); }
    group.members.push(index + 1);
  }
  return groups;
}

export function changePackageSelectionGroup(document, id, choice) {
  const packages = packageScope(document, id);
  const target = packages.find((node) => node.id === id);
  if (!target) return document;
  const groups = packageSelectionGroups(document, id);
  const previous = target.props.group ?? target.id;
  let next = choice;
  if (choice === '__new__') {
    const used = new Set([...indexDocument(document).nodes.keys(), ...groups.map((group) => group.key)]);
    let index = 1;
    while (used.has(`package-group:${id}:${index}`)) index++;
    next = `package-group:${id}:${index}`;
  } else if (!groups.some((group) => group.key === choice)) return document;
  if (next === previous) return document;
  const previousPeers = packages.filter((node) => node.id !== id && (node.props.group ?? node.id) === previous);
  const nextPeers = packages.filter((node) => node.id !== id && (node.props.group ?? node.id) === next);
  const nextHasDefault = nextPeers.some((node) => node.props.defaultSelected);
  const promote = target.props.defaultSelected && !previousPeers.some((node) => node.props.defaultSelected) ? previousPeers[0]?.id : null;
  const visit = (node) => {
    let props = node.props;
    if (node.id === id) props = { ...props, group: next, defaultSelected: !nextHasDefault };
    else if (node.id === promote) props = { ...props, defaultSelected: true };
    return { ...node, props, children: node.children.map(visit) };
  };
  return { ...document, root: visit(document.root) };
}

export function reconcileTabNavigation(before,after,navigation) {
  const oldNodes=indexDocument(before).nodes;
  const result={...navigation};
  for(const owner of indexDocument(after).nodes.values()) {
    const old=oldNodes.get(owner.id);
    if(owner.type!=='Tabs'||!old||navigation[owner.id]===undefined)continue;
    const currentId=old.children[navigation[owner.id]]?.id,index=owner.children.findIndex((tab)=>tab.id===currentId);
    result[owner.id]=index<0?Math.max(0,Math.min(navigation[owner.id],owner.children.length-1)):index;
  }
  return result;
}

export function appendTab(document, tabsId, tab) {
  const owner = indexDocument(document).nodes.get(tabsId);
  if (owner?.type !== 'Tabs' || tab?.type !== 'Tab') return document;
  let next = insertComponent(document, tabsId, tab);
  if (next === document) return document;
  const index = owner.children.length;
  for (const page of owner.children) {
    for (const control of tabControls(page)) {
      const owned = control.children.filter((child)=>child.type==='TabButton' && (!child.props.target || child.props.target===tabsId));
      if (owned.some((child)=>child.props.index===index)) continue;
      next = updateComponent(next, control.id, {children:[...control.children,createTabSelectorButton(crypto.randomUUID(),tabsId,index)]});
    }
  }
  const first = owner.children[0];
  const selectors = first ? tabControls(indexDocument(next).nodes.get(first.id)).map(cloneComponent) : [createTabSelector(crypto.randomUUID(),tabsId,1)];
  return updateComponent(next,tab.id,{children:[...selectors,...tab.children]});
}

// Match the same selector inside its owning Tabs; never match labels by their text.
function tabStylePeers(document, id) {
  const { nodes, parents } = indexDocument(document);
  let control = nodes.get(id);
  while (control && !['TabControl', 'Tabs'].includes(control.type)) control = nodes.get(parents.get(control.id));
  if (control?.type !== 'TabControl') return [];
  let owner = control, tab;
  while (owner && owner.type !== 'Tabs') {
    if (owner.type === 'Tab') tab = owner;
    owner = nodes.get(parents.get(owner.id));
  }
  if (!tab || !owner?.children.some((child) => child.id === tab.id)) return [];
  const at = tabControls(tab).findIndex((node) => node.id === control.id);
  const path = [];
  for (let current = nodes.get(id); current?.id !== control.id;) {
    const parent = nodes.get(parents.get(current.id));
    const siblings = parent.children.filter((child) => child.type === current.type);
    if (current.type === 'TabButton' && (current.props.target && current.props.target !== owner.id || siblings.filter((child) => child.props.index === current.props.index).length !== 1)) return [];
    path.unshift({ type: current.type, at: siblings.findIndex((child) => child.id === current.id), index: current.props.index, count: siblings.length });
    current = parent;
  }
  return owner.children.filter((child) => child.type === 'Tab' && child.id !== tab.id).flatMap((peerTab) => {
    let peer = tabControls(peerTab)[at];
    for (const step of path) {
      if (!peer) break;
      const matches = peer.children.filter((child) => child.type === step.type);
      if (step.type === 'TabButton') {
        const buttons = matches.filter((child) => child.props.index === step.index && (!child.props.target || child.props.target === owner.id));
        peer = buttons.length === 1 ? buttons[0] : null;
      } else peer = matches.length === step.count ? matches[step.at] : null;
    }
    return peer ? [peer] : [];
  });
}

export function patchCountdownContent(document, timerId, stateId, textId, values) {
  const timer=indexDocument(document).nodes.get(timerId);
  const state=timer?.type==='Countdown'?timer.children.find(child=>child.id===stateId&&child.type==='CountdownState'):null;
  if(!state)return document;
  if(textId)return state.children.some(child=>child.id===textId&&child.type==='Text')?patchComponentProperties(document,textId,values):document;
  if(state.children.length)return document;
  const ids=indexDocument(document).nodes;let id=`${state.id}/text`,suffix=2;while(ids.has(id))id=`${state.id}/text-${suffix++}`;
  const text=component(id,'Text','文字',textPropertyPatch({type:'Text',props:{}},{widthMode:'fit',fontSize:24,fontWeight:700,textAlign:'center',...values}));
  return updateComponent(document,state.id,{children:[text]});
}

export function patchComponentProperties(document, id, values) {
  const node = indexDocument(document).nodes.get(id);
  if (!node) return document;
  let next = updateComponent(document, id, { props: textPropertyPatch(node, values) });
  if (node.props.comparisonRowId) {
    const rowValues = Object.fromEntries(Object.entries(values).filter(([key])=>COMPARISON_ROW_KEYS.includes(key)));
    if (Object.keys(rowValues).length) for (const peer of indexDocument(document).nodes.values()) {
      if (peer.id !== id && peer.props.comparisonRowId === node.props.comparisonRowId) next=updateComponent(next,peer.id,{props:rowValues});
    }
  }
  if (node.type === 'Package' && values.priceMode !== undefined) {
    const configured = applyPackagePriceMode(indexDocument(next).nodes.get(id),values.priceMode);
    next = updateComponent(next,id,{props:configured.props,children:configured.children});
  }
  if (node.type === 'ProductParameter' && values.parameter !== undefined) {
    const {nodes,parents} = indexDocument(next);
    let owner = nodes.get(parents.get(id));
    while (owner && owner.type !== 'Package') owner = nodes.get(parents.get(owner.id));
    if (owner) next = updateComponent(next,owner.id,{props:{priceMode:packagePriceMode(owner)}});
  }
  if (['Button','PurchaseButton'].includes(node.type) && values.action?.action) {
    const type = node.type === 'PurchaseButton' && !['Purchase','WebCheckout','WebPaywall','CustomCheckout'].includes(values.action.action) ? 'Button' : node.type === 'Button' && values.action.action === 'Purchase' ? 'PurchaseButton' : node.type;
    if (type !== node.type) next = updateComponent(next, id, { type, props: { ...componentProps(node), ...values } });
  }
  const styles = Object.fromEntries(Object.entries(values).filter(([key]) => STYLE_KEYS.has(key)));
  if (!Object.keys(styles).length) return next;
  for (const peer of tabStylePeers(document, id)) {
    next = updateComponent(next, peer.id, { props: textPropertyPatch(peer, styles) });
  }
  return next;
}
export function copyFragment(document, id, contentsOnly = false) {
  const node = indexDocument(document).nodes.get(id);
  if (!node) return null;
  const roots = contentsOnly ? node.children : [node];
  const keys = new Set();
  const visit = (entry) => { if (entry.props.dataKey) keys.add(entry.props.dataKey);if(entry.type==='Package'&&document.products[entry.id])keys.add(entry.id); if (entry.props.binding?.key) keys.add(entry.props.binding.key); entry.children.forEach(visit); };
  roots.forEach(visit);
  return { roots:structuredClone(roots), products:Object.fromEntries([...keys].filter((key)=>document.products[key]).map((key)=>[key,structuredClone(document.products[key])])), fonts:fontResources(roots,document.fonts),configuration:captureFragmentConfiguration(document,roots) };
}
export function pasteFragment(document, parentId, fragment, at = Infinity) {
  const parent = indexDocument(document).nodes.get(parentId);
  if (!fragment?.roots?.length || !fragment.roots.every((root)=>canContain(parent,root))) return { document, ids:[] };
  const nodeIds=new Map();
  const forest = cloneComponent(component(crypto.randomUUID(),'Stack','复制内容',{},fragment.roots),nodeIds);
  const keys = new Map(Object.keys(fragment.products ?? {}).map((key)=>[key,crypto.randomUUID()]));
  const sourceIds=new Map([...nodeIds].map(([source,target])=>[target,source]));
  const rebind = entry => {const dataKey=entry.props.dataKey??(entry.type==='Package'?sourceIds.get(entry.id):undefined);return {...entry,props:{...entry.props,...(keys.has(dataKey)?{dataKey:keys.get(dataKey)}:{}),...(keys.has(entry.props.binding?.key)?{binding:{...entry.props.binding,key:keys.get(entry.props.binding.key)}}:{})},children:entry.children.map(rebind)};};
  const roots = forest.children.map(rebind);
  let next = {...document,products:{...document.products,...Object.fromEntries([...keys].map(([oldKey,newKey])=>[newKey,structuredClone(fragment.products[oldKey])]))}};
  const ids = [];
  for (const [index,node] of roots.entries()) {
    const updated = insertComponent(next,parentId,node,at === Infinity ? at : at + index);
    if (updated === next) return {document,ids:[]};
    next = updated; ids.push(node.id);
  }
  return {document:restoreFragmentConfiguration(withFontResources(reconcileTabStructure(document,next),fragment.fonts),fragment.configuration,nodeIds),ids};
}
export function wrapInStack(document, id) {
  const {nodes,parents} = indexDocument(document), node = nodes.get(id), parent = nodes.get(parents.get(id));
  const wrapper = component(crypto.randomUUID(),'Stack','布局容器',{gap:8},node ? [node] : []);
  if (!parent || !canContain(parent,wrapper) || !canContain(wrapper,node)) return {document,id};
  return {document:updateComponent(document,parent.id,{children:parent.children.map((entry)=>entry.id === id ? wrapper : entry)}),id:wrapper.id};
}

// Internal clipboard survives template switches without reading the OS clipboard.
export const editorClipboard = { fragment:null, styles:null };
