import { component, componentProps, cloneComponent, indexDocument, insertComponent, updateComponent, canContain, removeComponent, moveComponent } from './componentDocument.js';
import { STATE_STYLE_KEYS, selectedStyleKey, textPropertyPatch } from './propertyModel.js';
import { createTabSelectorButton, createTabSelector, createPageControl } from './componentCatalog.js';

const STYLE_KEYS = new Set(['axis','gap','align','justify','wrap','widthMode','width','minWidth','maxWidth','heightMode','height','minHeight','maxHeight','paddingMode','paddingTop','paddingRight','paddingBottom','paddingLeft','paddingVertical','paddingHorizontal','marginMode','marginTop','marginRight','marginBottom','marginLeft','marginVertical','marginHorizontal','background','backgroundImage','backgroundFit','backgroundVideo','fillType','color','radius','shape','borderWidth','borderColor','fontSize','fontWeight','fontFamily','fontStyle','textAlign','objectFit','opacity','alignSelf','strike','bold','italic','underline','textBackground','iconSize','iconBackground','iconRadius','selectedBorder','selectedBackground','selectedColor','shadowX','shadowY','shadowBlur','shadowColor']);
for (const key of [...STATE_STYLE_KEYS, ...STATE_STYLE_KEYS.map(selectedStyleKey), 'lineHeight', 'flexGrow', 'mask', 'overlayColor', 'overlayEnabled', 'pageSpacing', 'pagePeek', 'pageControlPosition', 'dotColor', 'activeDotColor', 'itemSpacing', 'textSpacing', 'columnGutter', 'iconAlignment', 'connectorEnabled', 'connectorWidth', 'connectorColor', 'connectorOpacity', 'connectorMarginMode', 'connectorMarginVertical', 'connectorMarginTop', 'connectorMarginBottom']) STYLE_KEYS.add(key);
for(const key of ['pageAlignment','transitionTime','transitionAnimation','thumbColor','trackColor','thumbColorOpacity','trackColorOpacity','walletStyle'])STYLE_KEYS.add(key);
export const copyStyles = (node) => Object.fromEntries(Object.entries(componentProps(node)).filter(([key]) => STYLE_KEYS.has(key)));
export function pasteStyles(document, id, styles) {
  return patchComponentProperties(document,id,Object.fromEntries(Object.entries(styles ?? {}).filter(([key])=>STYLE_KEYS.has(key))));
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
  const oldNodes=indexDocument(before).nodes;
  let next=after;
  for(const owner of indexDocument(after).nodes.values()) {
    if(owner.type!=='Tabs')continue;
    const previous=oldNodes.get(owner.id);
    if(!previous||previous.children.length===owner.children.length&&previous.children.every((tab,index)=>tab.id===owner.children[index].id))continue;
    const oldIds=previous.children.map((tab)=>tab.id),newIds=owner.children.map((tab)=>tab.id);
    const defaultId=oldIds[previous.props.defaultIndex??0];
    next=updateComponent(next,owner.id,{props:{defaultIndex:Math.max(0,newIds.includes(defaultId)?newIds.indexOf(defaultId):Math.min(previous.props.defaultIndex??0,newIds.length-1))}});
    for(const page of owner.children)for(const control of tabControls(page)) {
      const owned=control.children.filter((child)=>child.type==='TabButton'&&(!child.props.target||child.props.target===owner.id));
      if(!owned.length)continue;
      const buttons=owner.children.map((tab,index)=>{
        const oldIndex=oldIds.indexOf(tab.id),existing=owned.find((button)=>button.props.index===oldIndex);
        return existing?{...existing,props:{...existing.props,target:owner.id,index}}:createTabSelectorButton(crypto.randomUUID(),owner.id,index);
      });
      let inserted=false;
      const children=control.children.flatMap((child)=>{
        if(!owned.includes(child))return [child];
        if(inserted)return [];
        inserted=true;return buttons;
      });
      next=updateComponent(next,control.id,{children});
    }
  }
  return next;
}

export const removeEditorComponent=(document,id)=>reconcileTabStructure(document,removeComponent(document,id));
export const moveEditorComponent=(document,id,parentId,at=Infinity)=>reconcileTabStructure(document,moveComponent(document,id,parentId,at));

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

export function patchComponentProperties(document, id, values) {
  const node = indexDocument(document).nodes.get(id);
  if (!node) return document;
  let next = updateComponent(document, id, { props: textPropertyPatch(node, values) });
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
  const visit = (entry) => { if (entry.props.dataKey) keys.add(entry.props.dataKey); if (entry.props.binding?.key) keys.add(entry.props.binding.key); entry.children.forEach(visit); };
  roots.forEach(visit);
  return { roots:structuredClone(roots), products:Object.fromEntries([...keys].filter((key)=>document.products[key]).map((key)=>[key,structuredClone(document.products[key])])) };
}
export function pasteFragment(document, parentId, fragment, at = Infinity) {
  const parent = indexDocument(document).nodes.get(parentId);
  if (!fragment?.roots?.length || !fragment.roots.every((root)=>canContain(parent,root))) return { document, ids:[] };
  const forest = cloneComponent(component(crypto.randomUUID(),'Stack','复制内容',{},fragment.roots));
  const keys = new Map(Object.keys(fragment.products ?? {}).map((key)=>[key,crypto.randomUUID()]));
  const rebind = (entry) => ({...entry,props:{...entry.props,...(keys.has(entry.props.dataKey)?{dataKey:keys.get(entry.props.dataKey)}:{}),...(keys.has(entry.props.binding?.key)?{binding:{...entry.props.binding,key:keys.get(entry.props.binding.key)}}:{})},children:entry.children.map(rebind)});
  const roots = forest.children.map(rebind);
  let next = {...document,products:{...document.products,...Object.fromEntries([...keys].map(([oldKey,newKey])=>[newKey,structuredClone(fragment.products[oldKey])]))}};
  const ids = [];
  for (const [index,node] of roots.entries()) {
    const updated = insertComponent(next,parentId,node,at === Infinity ? at : at + index);
    if (updated === next) return {document,ids:[]};
    next = updated; ids.push(node.id);
  }
  return {document:reconcileTabStructure(document,next),ids};
}
export function wrapInStack(document, id) {
  const {nodes,parents} = indexDocument(document), node = nodes.get(id), parent = nodes.get(parents.get(id));
  const wrapper = component(crypto.randomUUID(),'Stack','布局容器',{gap:8},node ? [node] : []);
  if (!parent || !canContain(parent,wrapper) || !canContain(wrapper,node)) return {document,id};
  return {document:updateComponent(document,parent.id,{children:parent.children.map((entry)=>entry.id === id ? wrapper : entry)}),id:wrapper.id};
}

// Internal clipboard survives template switches without reading the OS clipboard.
export const editorClipboard = { fragment:null, styles:null };
