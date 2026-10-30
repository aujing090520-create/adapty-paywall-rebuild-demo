import { component } from './componentDocument.js';

// Only new template documents pass here; saved personal trees are not reparented.
export function buildHtTemplateFooter(document, variant) {
  if (!['blue-privilege', 'membership-plans', 'payment-recovery'].includes(variant)) return document;
  const blue = variant === 'blue-privilege';
  const member = variant === 'membership-plans';
  const recovery = variant === 'payment-recovery';
  const ids = member ? ['member/plans-heading','products','agreement','purchase','member/cancel-note','legal','links','$home'] : recovery ? ['products','recovery/renewal','timer','purchase','legal','links','$home'] : ['timer', 'agreement', 'purchase', 'legal', 'links', '$home'];
  const hasPurchase = (node) => node.id === 'purchase' || node.children.some((child) => child.type !== 'Screen' && hasPurchase(child));
  const visit = (node) => {
    if (node.type !== 'Screen' || !hasPurchase(node)) return { ...node, children: node.children.map(visit) };
    if (node.children.some((child) => child.type === 'Footer')) return node;
    const moved = new Map();
    const extract = (entry) => {
      if (ids.includes(entry.id)) { moved.set(entry.id, blue && entry.id === 'purchase' ? { ...entry, type: 'PurchaseButton' } : entry); return null; }
      const children=entry.children.map(extract).filter(Boolean);
      if(member&&entry.id==='member/purchase-area'&&!children.length)return null;
      return { ...entry, children };
    };
    const content = node.children.map(extract).filter(Boolean);
    const footer = component(`${node.id}/footer`, 'Footer', '页脚', {
      axis: 'vertical', widthMode: 'fill', heightMode: 'fit', gap: blue ? 0 : 8,
      background: member ? '#f7f7f7' : '#ffffff',
      paddingMode: 'individual', paddingTop: blue ? 0 : 12, paddingBottom: 0,
      paddingLeft: blue ? 0 : member ? 16 : 20, paddingRight: blue ? 0 : member ? 16 : 20,
    }, ids.map((id) => moved.get(id)).filter(Boolean));
    return { ...node, children: [...content, footer] };
  };
  return { ...document, ...(blue ? {blueProductPlacementVersion:1} : {}), root: visit(document.root) };
}

// Repair only the old generated Blue footer placement, preserving every node and style.
export function repairBlueProductPlacement(document) {
  if(document.templateId!=='ht-blue-privilege'||document.blueProductPlacementVersion===1)return document;
  const visit=node=>{
    const children=node.children.map(visit);
    if(node.type!=='Screen')return {...node,children};
    const footer=children.find(child=>child.type==='Footer'&&child.id===`${node.id}/footer`);
    const products=footer?.children.find(child=>child.id==='products'&&child.type==='Stack');
    if(!products)return {...node,children};
    return {...node,children:children.flatMap(child=>child===footer?[products,{...footer,children:footer.children.filter(item=>item!==products)}]:[child])};
  };
  return {...document,blueProductPlacementVersion:1,root:visit(document.root)};
}
