const HT_TEMPLATES = new Set(['ht-blue-privilege','ht-membership-plans','ht-payment-recovery','ht-sku-sheet']);
function referencedIds(document) {
  const ids = new Set();
  const collect = value => {
    if (typeof value === 'string') ids.add(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  };
  const visit = node => {collect(node.props);node.children.forEach(visit);};
  visit(document.root);
  Object.entries(document).filter(([key])=>!['root','products'].includes(key)).forEach(([,value])=>collect(value));
  return ids;
}
export function isEmptyGeneratedLayout(node) {
  return node.type==='Stack' && !node.children.length && /^(footer|features|list-\d+)$|\/detail-\d+$/.test(node.id) && Object.entries(node.props).every(([key,value])=>['axis','gap','textAlign'].includes(key)||/^(padding|margin)(Top|Right|Bottom|Left|Vertical|Horizontal)$/.test(key)&&Number(value)===0);
}
// Only fresh imported templates are cleaned. User-created empty containers remain editable.
export function pruneGeneratedEmptyLayouts(document) {
  const referenced = referencedIds(document);
  const visit = node => ({...node,children:node.children.filter(child=>!isEmptyGeneratedLayout(child)||referenced.has(child.id)).map(visit)});
  return {...document,root:visit(document.root)};
}
// Repair the exact former HT label placeholder once; never flatten arbitrary saved layouts.
export function normalizeHtLabelSlots(document) {
  if (!HT_TEMPLATES.has(document.templateId) || document.htLabelSlotVersion===1) return document;
  const referenced = referencedIds(document);
  const visit = (node,parent) => {
    const children = node.children.map(child=>visit(child,node));
    const next = children.some((child,index)=>child!==node.children[index])?{...node,children}:node;
    const match = node.id.match(/^products\/badge-space-(\d+)$/), child = children[0];
    if (match && parent?.id===`products/package-header-${match[1]}` && next.type==='Stack' && children.length===1 && child.type==='Stack' && child.id===`products/package-${match[1]}/product-label` && child.props.productField==='badgeText' && !referenced.has(node.id) && Object.keys(node.props).every(key=>['height','heightMode'].includes(key)) && node.props.heightMode==='fixed' && child.props.heightMode==='fixed' && node.props.height===child.props.height) return child;
    return next;
  };
  return {...document,root:visit(document.root),htLabelSlotVersion:1};
}

export function layoutContainerReasons(node,parent) {
  const p=node.props,reasons=[];
  if(p.selectionGroup)reasons.push('商品选择组边界');
  if(p.dataSource||p.collapsible||p.horizontalScroll)reasons.push('数据或展开/滚动边界');
  if(p.action||p.visibleWhen||p.productField||p.hidden)reasons.push('交互或条件可见性边界');
  if(p.axis==='overlay')reasons.push('叠放与覆盖定位');
  if(Object.keys(p).some(key=>/background|border|radius|shadow|mask|overlay|badge/i.test(key)&&p[key]&&p[key]!=='transparent'))reasons.push('独立背景或外观边界');
  if(Object.entries(p).some(([key,value])=>/padding|margin|height|width|flexGrow|alignSelf/i.test(key)&&value!==0&&value!=='fit'&&value!=='auto'))reasons.push('尺寸、伸缩或留白约束');
  if(parent?.type==='Package')reasons.push('套餐内容排版与选择职责分离');
  if(node.children.length>1)reasons.push('子元素排列、对齐或间距');
  if(!node.children.length)reasons.push(reasons.length?'显式占位或图形表面':'空的可编辑插槽');
  if(!reasons.length)reasons.push('独立内容分组/排版配置入口，保留可编辑边界');
  return reasons;
}
