const legacyRows = new Set(['member/header','sku/header']);

// Only called for generated defaults or an explicit navigation edit, never on saved-tree read.
export function pinScreenNavigation(screen) {
  if(screen.children.some(child=>child.type==='Header'))return !screen.props.pagePresentation&&!screen.children.some(child=>child.id==='$scene')?{...screen,props:{...screen.props,pagePresentation:'fullscreen'}}:screen;
  const rows=[];
  const collect=(node,ancestors=[])=>{
    if(node!==screen&&['Screen','BottomSheet'].includes(node.type))return;
    if(node.type==='Stack'&&(node.props.navigationRow||legacyRows.has(node.id)))rows.push({node,ancestors});
    else node.children.forEach(child=>collect(child,[...ancestors,node]));
  };
  collect(screen);
  if(rows.length!==1)return screen;
  const {node:row,ancestors}=rows[0];
  const overlapContent=ancestors.some(node=>node!==screen&&node.type==='Stack'&&node.props.axis==='overlay');
  const remove=node=>({...node,children:node.children.filter(child=>child.id!==row.id).map(remove)});
  const next=remove(screen);
  const header={...row,type:'Header',name:'页头',props:{...row.props,fixedNavigation:true,overlapContent,background:row.props.background??'transparent',shadowOpacity:0}};
  const backdrops=next.children.filter(child=>child.props.pageBackdrop||child.id==='recovery/backdrop');
  return {...next,props:{...next.props,...(!next.props.pagePresentation&&!next.children.some(child=>child.id==='$scene')?{pagePresentation:'fullscreen'}:{})},children:[...backdrops,header,...next.children.filter(child=>!backdrops.includes(child))]};
}

export function buildTemplateNavigationHeaders(document) {
  const visit=node=>{
    const children=node.children.map(visit);
    const current=children.some((child,index)=>child!==node.children[index])?{...node,children}:node;
    return node.type==='Screen'?pinScreenNavigation(current):current;
  };
  const root=visit(document.root);
  return root===document.root?document:{...document,root};
}
