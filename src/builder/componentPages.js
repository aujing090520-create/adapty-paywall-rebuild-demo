export function componentPages(node) {
  if(node?.type==='Carousel')return node.children.filter(child=>child.type==='Slide');
  if(node?.type==='Tabs')return node.children.filter(child=>child.type==='Tab');
  if(node?.type==='Flow')return node.children.filter(child=>child.type==='Screen');
  return [];
}

export function tabButtonTarget(props,nodes){
  const sequence=nodes.get(props.target),pages=componentPages(sequence);
  if(sequence?.type==='Flow'&&sequence.props.navigationMode!=='tabs')return null;
  const index=props.pageId?pages.findIndex(page=>page.id===props.pageId):Number(props.index??0);
  return index>=0&&pages[index]&&!pages[index].props.hidden?{sequence,index,page:pages[index]}:null;
}

export function tabControlTarget(control) {
  if (control?.props.target) return control.props.target;
  const targets = new Set(control?.children.filter(child=>child.type==='TabButton').map(child=>child.props.target).filter(Boolean));
  return targets.size===1 ? [...targets][0] : '';
}

export function pageSequenceLabel(node) {
  const count=componentPages(node).length;
  return node.type==='Flow' ? `完整页面（${count} 个页面）` : `${node.name} · ${node.type==='Tabs'?'标签页':'轮播'}（${count} 页）`;
}

export function pageSequencesFor(id,nodes,parents) {
  const screenOf=id=>{
    let node=nodes.get(id);
    while(node&&node.type!=='Screen')node=nodes.get(parents.get(node.id));
    return node;
  };
  const screen=screenOf(id);
  return [...nodes.values()].filter(node=>node.type==='Flow'
    ? node.children.some(child=>child.type==='Screen'&&child.id===screen?.id)
    : ['Tabs','Carousel'].includes(node.type)&&screenOf(node.id)?.id===screen?.id);
}

export function findComponent(root,id) {
  if(root.id===id)return root;
  for(const child of root.children){const found=findComponent(child,id);if(found)return found;}
  return null;
}

