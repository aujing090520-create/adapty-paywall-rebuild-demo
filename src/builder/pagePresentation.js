const modes = new Set(['fullscreen', 'sheet', 'window']);
export const PAGE_PRESENTATIONS = [['fullscreen', '全屏页面'], ['sheet', '底部半窗'], ['window', '居中窗口']];

export function pagePresentation(props = {}) {
  return modes.has(props.pagePresentation) ? props.pagePresentation : 'fullscreen';
}

export function pageFrame(props = {}, viewportHeight = 844) {
  const mode = pagePresentation(props), windowed = mode !== 'fullscreen';
  const inset = windowed ? Math.max(0, Math.min(100, Number(props.windowInset) || 0)) : 0;
  const available = Math.max(1, viewportHeight - inset * 2);
  const height = windowed ? Math.min(available, Math.max(120, Number(props.windowHeight) || 600)) : viewportHeight;
  return {mode, height, inset, radius: windowed ? props.windowRadius ?? 24 : 0};
}

// Replace generated top-padding simulation with a real viewport, retaining every content node.
export function upgradePagePresentation(document) {
  let changed = false;
  const visit = screen => {
    let children = screen.children.map(visit);
    if(screen.type==='Screen') {
      const closeIds = new Set(['member/header/close','recovery/header/close','sku/header/close']);
      const collect = node=>[node,...node.children.flatMap(collect)];
      const canonical = children.filter(child=>!child.props.navigationRow).flatMap(collect).find(node=>closeIds.has(node.id)&&node.props.action?.action==='Dismiss');
      if(canonical) children=children.map(row=>{
        if(!row.props.navigationRow)return row;
        const kept=row.children.filter(button=>!(button.type==='Button'&&button.props.action?.action==='Dismiss'&&button.children.length===1&&button.children[0].type==='Icon'&&button.children[0].props.icon==='tabler:outline:x'));
        if(kept.length===row.children.length)return row;
        changed=true;
        return kept.length?{...row,children:kept}:null;
      }).filter(Boolean);
    }
    const childChange = children.length!==screen.children.length || children.some((child, i) => child !== screen.children[i]);
    if (screen.type !== 'Screen' || screen.props.pagePresentation) return childChange ? {...screen, children} : screen;
    const scene = children.find(child => child.id === '$scene' && child.type === 'Stack');
    const surface = scene?.children.find(child => ['member/sheet', 'offer-card', 'sku-card'].includes(child.id));
    if (!surface) {
      if (screen.children.some(child=>child.type==='Flow')) return childChange ? {...screen, children} : screen;
      return childChange ? {...screen,children} : screen;
    }
    changed = true;
    const top = scene.props.paddingTop ?? 0;
    const backdrop = children.find(child => child.id === 'recovery/backdrop');
    const body = {...surface, props: {...surface.props, minHeight: 0, heightMode: 'fit', height: 0, radius: 0, radiusMode: 'uniform'}};
    return {...screen, props: {...screen.props, pagePresentation: 'sheet', windowHeight: Math.max(120, 844 - top), windowRadius: surface.props.radiusTopLeft ?? surface.props.radius ?? 24,
      windowBackdrop: screen.props.background ?? '#8f8f8f', windowBackgroundImage: backdrop?.props.src ?? '', background: surface.props.background ?? '#ffffff', backgroundImage: '', axis: 'vertical',
      paddingMode: 'individual', paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, minHeight: 0, heightMode: 'fill', height: 844},
      children: children.map(child => child === backdrop ? {...child,props:{...child.props,pageBackdrop:true}} : child === scene ? {...scene, props: {...scene.props, paddingTop: 0, minHeight: 0, heightMode: 'fit', height: 0}, children: scene.children.map(item => item === surface ? body : item)} : child)};
  };
  const root = visit(document.root);
  return changed ? {...document, root} : document;
}
