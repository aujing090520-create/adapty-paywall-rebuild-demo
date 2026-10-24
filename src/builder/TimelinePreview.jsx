import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { paintColor } from './propertyModel.js';

const TimelineContext = createContext(null);

export function TimelinePreview({ node, props, attributes, style, render }) {
  const root = useRef(null);
  const [connectors, setConnectors] = useState({});
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const items = [...element.children].filter((child) => child.hasAttribute('data-timeline-item'));
      const scale = element.offsetWidth ? element.getBoundingClientRect().width / element.offsetWidth : 1;
      const next = {};
      items.slice(0, -1).forEach((item, index) => {
        const marker = item.querySelector('[data-timeline-marker]');
        const destination = items[index + 1].querySelector('[data-timeline-marker]');
        if (!marker || !destination || !scale) return;
        const rect = item.getBoundingClientRect(), from = marker.getBoundingClientRect(), to = destination.getBoundingClientRect();
        next[item.dataset.componentId] = { left: (from.left + from.width / 2 - rect.left) / scale, top: (from.bottom - rect.top) / scale, height: Math.max(0, (to.top - from.bottom) / scale) };
      });
      setConnectors((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.querySelectorAll('[data-timeline-item], [data-timeline-marker]').forEach((item) => observer.observe(item));
    measure();
    return () => observer.disconnect();
  }, [node, props.itemSpacing, props.columnGutter, props.textSpacing, props.iconAlignment]);
  return <TimelineContext.Provider value={{ ...props, connectors }}><div {...attributes} ref={root} style={{ ...style, display: 'flex', flexDirection: 'column', gap: props.itemSpacing ?? props.gap }}>{node.children.map((child) => render(child))}</div></TimelineContext.Provider>;
}

export function TimelineItemPreview({ node, props, attributes, style, render }) {
  const timeline = useContext(TimelineContext) ?? {};
  const marker = node.children.find((child) => ['Icon', 'Image'].includes(child.type));
  const content = node.children.filter((child) => child !== marker);
  const connector = timeline.connectors?.[node.id];
  const textSpacing = timeline.textSpacing ?? 4;
  const top = props.connectorMarginMode === 'individual' ? props.connectorMarginTop ?? 0 : props.connectorMarginVertical ?? 0;
  const bottom = props.connectorMarginMode === 'individual' ? props.connectorMarginBottom ?? 0 : props.connectorMarginVertical ?? 0;
  return <div {...attributes} data-timeline-item="" style={{ ...style, display: 'grid', position: 'relative', gridTemplateColumns: 'max-content minmax(0, 1fr)', columnGap: timeline.columnGutter ?? props.gap, rowGap: textSpacing }}>
    {props.connectorEnabled !== false && connector && <span data-timeline-connector="" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', left: connector.left, top: connector.top + top, height: Math.max(0, connector.height - top - bottom), width: props.connectorWidth ?? 1, transform: 'translateX(-50%)', background: paintColor(props.connectorColor ?? timeline.lineColor ?? '#d6d2e8', props.connectorOpacity ?? 100) }} />}
    {marker && <div data-timeline-marker="" style={{ gridColumn: 1, gridRow: timeline.iconAlignment === 'content' ? '1 / span 2' : 1, alignSelf: 'center', justifySelf: 'center', position: 'relative' }}>{render(marker)}</div>}
    {content.map((child, index) => render(child, child.type === 'Stack' && content.length === 1 ? { display: 'grid', gridColumn: 2, gridRow: '1 / span 2', gridTemplateRows: 'subgrid', rowGap: textSpacing, gap: textSpacing } : { gridColumn: 2, gridRow: index + 1 }))}
  </div>;
}
