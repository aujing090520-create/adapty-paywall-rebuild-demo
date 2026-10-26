import { useLayoutEffect, useRef } from 'react';

export function workbenchHeight(viewportHeight, top) {
  return Math.max(240, Math.min(1000, viewportHeight - Math.max(12, top) - 16));
}

export default function useWorkbenchHeight() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof window === 'undefined') return;
    let frame;
    const measure = () => {
      frame = undefined;
      const value = `${workbenchHeight(window.innerHeight, element.getBoundingClientRect().top)}px`;
      if (element.style.getPropertyValue('--ne-workbench-height') !== value) element.style.setProperty('--ne-workbench-height', value);
    };
    const schedule = () => { if (frame === undefined) frame = window.requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element.parentElement);
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, []);
  return ref;
}
