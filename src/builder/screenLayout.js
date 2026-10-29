import { componentProps } from './componentDocument.js';

export function screenChromeLayout(screen, runtime = {}, nodes = new Map()) {
  const visible = screen.children.filter((child) => {
    const props = child.props;
    return !props.hidden && !props.pageBackdrop && !['overlay', 'sheet'].includes(props.presentation)
      && (!props.visibleWhen || Boolean(runtime[props.visibleWhen.id] ?? nodes.get(props.visibleWhen.id)?.props.initial) === props.visibleWhen.value);
  });
  const header = visible.find((child) => child.type === 'Header');
  const footer = visible.find((child) => child.type === 'Footer');
  const content = screen.children.filter((child) => !child.props.pageBackdrop && !['Header', 'Footer'].includes(child.type));
  const first = visible.find((child) => !['Header', 'Footer'].includes(child.type));
  const props = first && componentProps(first);
  const horizontalMargin = props && (props.marginMode === 'individual' ? Number(props.marginLeft) + Number(props.marginRight) : 2 * Number(props.marginHorizontal));
  const underHeader = Boolean(header && ['Image', 'Video', 'Custom'].includes(first?.type) && props.widthMode === 'fill' && !horizontalMargin && !props.maxWidth);
  return { header, footer, content, underHeader };
}
