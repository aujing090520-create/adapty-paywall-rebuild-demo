import { pageContext, surfaceContext, isUnconfiguredDetailPage } from './componentTree.js';
import { modalBindings } from './buttonModals.js';

export function documentArtboards(document, owner = null, navigation = {}) {
  const { flow, pages, active } = pageContext(document, navigation);
  const presentation = document.settings?.presentationSurfaceId;
  if (presentation) {
    const surface = surfaceContext(document, navigation, presentation).surface;
    if (surface) return [{ key: `${owner}:${surface.id}`, owner, document, node: surface, label: surface.name, kind: '退出优惠', navigation: { ...navigation, overlay: surface.id } }];
  }
  const seen = new Set();
  const bindings = document.settings?.buttonModalVersion ? modalBindings(document) : null;
  return pages.filter((page) => !isUnconfiguredDetailPage(page) || page.id === active.id).flatMap((page) => {
    const state = { ...navigation, ...(flow ? { [flow.id]: pages.indexOf(page) } : {}), overlay: null };
    const board = { key: `${owner ?? 'main'}:${page.id}`, owner, document, node: page, label: page.name, kind: owner ? '退出优惠' : '页面', navigation: state };
    const surfaces = bindings ? bindings.filter((binding) => binding.screen?.id === page.id || binding.screen?.id === document.root.id && flow && page.id === active.id).map((binding) => binding.modal) : surfaceContext(document, state).surfaces;
    return [board, ...surfaces.map((surface) => ({ ...board, key: `${owner ?? 'main'}:${surface.id}`, node: surface, label: surface.name, kind: '弹层', navigation: { ...state, overlay: surface.id } }))];
  }).filter((board) => { if (seen.has(board.key)) return false; seen.add(board.key); return true; });
}
