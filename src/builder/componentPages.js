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

export function findComponent(root,id) {
  if(root.id===id)return root;
  for(const child of root.children){const found=findComponent(child,id);if(found)return found;}
  return null;
}

