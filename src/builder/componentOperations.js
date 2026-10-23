import { component, componentProps, cloneComponent, indexDocument, insertComponent, updateComponent, canContain } from './componentDocument.js';

const STYLE_KEYS = new Set(['axis','gap','align','justify','wrap','widthMode','width','minWidth','maxWidth','heightMode','height','minHeight','maxHeight','paddingMode','paddingTop','paddingRight','paddingBottom','paddingLeft','paddingVertical','paddingHorizontal','marginMode','marginTop','marginRight','marginBottom','marginLeft','marginVertical','marginHorizontal','background','backgroundImage','backgroundFit','backgroundVideo','fillType','color','radius','shape','borderWidth','borderColor','fontSize','fontWeight','fontFamily','fontStyle','textAlign','objectFit','opacity','alignSelf','strike','bold','italic','underline','textBackground','iconSize','iconBackground','iconRadius','selectedBorder','selectedBackground','selectedColor','shadowX','shadowY','shadowBlur','shadowColor']);
export const copyStyles = (node) => Object.fromEntries(Object.entries(componentProps(node)).filter(([key]) => STYLE_KEYS.has(key)));
export function pasteStyles(document, id, styles) {
  return updateComponent(document,id,{props:Object.fromEntries(Object.entries(styles ?? {}).filter(([key])=>STYLE_KEYS.has(key)))});
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
  return {document:next,ids};
}
export function wrapInStack(document, id) {
  const {nodes,parents} = indexDocument(document), node = nodes.get(id), parent = nodes.get(parents.get(id));
  const wrapper = component(crypto.randomUUID(),'Stack','布局容器',{gap:8},node ? [node] : []);
  if (!parent || !canContain(parent,wrapper) || !canContain(wrapper,node)) return {document,id};
  return {document:updateComponent(document,parent.id,{children:parent.children.map((entry)=>entry.id === id ? wrapper : entry)}),id:wrapper.id};
}

// Internal clipboard survives template switches without reading the OS clipboard.
export const editorClipboard = { fragment:null, styles:null };
