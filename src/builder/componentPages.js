export function componentPages(node) {
  if(node?.type==='Carousel')return node.children.filter(child=>child.type==='Slide');
  if(node?.type==='Tabs')return node.children.filter(child=>child.type==='Tab');
  return [];
}

export function findComponent(root,id) {
  if(root.id===id)return root;
  for(const child of root.children){const found=findComponent(child,id);if(found)return found;}
  return null;
}

