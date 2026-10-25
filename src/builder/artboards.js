import { pageContext, surfaceContext, isUnconfiguredDetailPage } from './componentTree.js';

export function documentArtboards(document, owner = null, navigation = {}) {
  const { flow, pages, active } = pageContext(document, navigation);
  const presentation = document.settings?.presentationSurfaceId;
  if (presentation) {
    const surface = surfaceContext(document, navigation, presentation).surface;
    if (surface) return [{ key: `${owner}:${surface.id}`, owner, document, node: surface, label: surface.name, kind: '退出优惠', navigation: { ...navigation, overlay: surface.id } }];
  }
  const seen = new Set();
  return pages.filter((page) => !isUnconfiguredDetailPage(page) || page.id === active.id).flatMap((page) => {
    const state = { ...navigation, ...(flow ? { [flow.id]: pages.indexOf(page) } : {}), overlay: null };
    const board = { key: `${owner ?? 'main'}:${page.id}`, owner, document, node: page, label: page.name, kind: owner ? '退出优惠' : '页面', navigation: state };
    return [board, ...surfaceContext(document, state).surfaces.map((surface) => ({ ...board, key: `${owner ?? 'main'}:${surface.id}`, node: surface, label: surface.name, kind: '弹层', navigation: { ...state, overlay: surface.id } }))];
  }).filter((board) => { if (seen.has(board.key)) return false; seen.add(board.key); return true; });
}
