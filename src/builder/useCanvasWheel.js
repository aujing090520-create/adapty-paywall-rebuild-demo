import { useEffect } from 'react';

export function panCanvasWheel(element, event) {
  if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey) return false;
  const horizontal = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
  if (!horizontal || !event.shiftKey && Math.abs(horizontal) < Math.abs(event.deltaY)) return false;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
  // Consume the gesture even at an edge so it cannot become browser history navigation.
  event.preventDefault();
  element.scrollLeft = Math.max(0, Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + horizontal * unit));
  if (!event.shiftKey && event.deltaY) {
    const verticalUnit = event.deltaMode === 2 ? element.clientHeight : unit;
    element.scrollTop = Math.max(0, Math.min(element.scrollHeight - element.clientHeight, element.scrollTop + event.deltaY * verticalUnit));
  }
  return true;
}

export default function useCanvasWheel(ref, editing) {
  useEffect(() => {
    const element = ref.current;
    if (!editing || !element) return;
    const onWheel = event => panCanvasWheel(element, event);
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [ref, editing]);
}
