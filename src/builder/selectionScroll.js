// Keep an in-place selection stable when dependent content disappears below it.
export function selectionScrollController() {
  let pending = null;
  const areas = new Map();
  const release = (element, state) => {
    element.style.paddingBottom = state.padding;
    element.style.overflowAnchor = state.anchor;
    element.removeEventListener('scroll', state.onScroll);
    areas.delete(element);
  };
  return {
    capture(target) {
      const view = target?.ownerDocument?.defaultView;
      if (!view) return;
      for (let element = target.parentElement; element; element = element.parentElement) {
        if (element.classList.contains('native-phone')) break;
        if (!/(auto|scroll)/.test(view.getComputedStyle(element).overflowY)) continue;
        if (element.scrollTop > 0) pending = { element, top: element.scrollTop };
        break;
      }
    },
    restore() {
      if (!pending) return;
      const { element, top } = pending;
      pending = null;
      if (!element.isConnected) return;
      let state = areas.get(element);
      if (!state) {
        state = { padding: element.style.paddingBottom, anchor: element.style.overflowAnchor,
          base: parseFloat(element.ownerDocument.defaultView.getComputedStyle(element).paddingBottom) || 0, reserve: 0 };
        state.onScroll = () => {
          const position = element.scrollTop;
          const naturalMax = Math.max(0, element.scrollHeight - state.reserve - element.clientHeight);
          const reserve = Math.max(0, position - naturalMax);
          if (reserve >= state.reserve - .5) return;
          state.reserve = reserve;
          element.style.paddingBottom = `${state.base + reserve}px`;
          if (!reserve) release(element, state);
        };
        element.addEventListener('scroll', state.onScroll, { passive: true });
        areas.set(element, state);
      }
      // Recompute against natural content, so switching back cannot accumulate space.
      element.style.paddingBottom = `${state.base}px`;
      state.reserve = Math.max(0, top + element.clientHeight - element.scrollHeight);
      element.style.overflowAnchor = 'none';
      element.style.paddingBottom = `${state.base + state.reserve}px`;
      element.scrollTop = top;
      if (!state.reserve) release(element, state);
    },
    clear() {
      pending = null;
      for (const [element, state] of areas) release(element, state);
    },
  };
}
