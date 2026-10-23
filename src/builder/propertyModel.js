export const STATE_STYLE_KEYS = ['axis','gap','align','justify','wrap','widthMode','width','minWidth','maxWidth','heightMode','height','minHeight','maxHeight','paddingMode','paddingTop','paddingRight','paddingBottom','paddingLeft','paddingVertical','paddingHorizontal','marginMode','marginTop','marginRight','marginBottom','marginLeft','marginVertical','marginHorizontal','background','backgroundImage','backgroundVideo','backgroundFit','backgroundPosition','backgroundRepeat','fillType','color','opacity','radius','shape','borderWidth','borderColor','shadowX','shadowY','shadowBlur','shadowColor'];
export const selectedStyleKey = (key) => `selected${key[0].toUpperCase()}${key.slice(1)}`;

export function defaultPackagePatch(document, id, enabled) {
  const group = (node) => node.props.group ?? node.id;
  let target;
  const find = (node) => { if (node.id === id) target = node; node.children.forEach(find); };
  find(document.root);
  if (target?.type !== 'Package') return document;
  const visit = (node) => ({ ...node, props: node.type === 'Package' && (node.id === id || enabled && group(node) === group(target)) ? { ...node.props, defaultSelected: node.id === id && enabled } : node.props, children: node.children.map(visit) });
  return { ...document, root: visit(document.root) };
}

export function stateStyleProps(props, selected) {
  if (!selected) return props;
  const result = { ...props };
  for (const key of STATE_STYLE_KEYS) {
    const value = props[selectedStyleKey(key)];
    if (value !== undefined) result[key] = value;
  }
  if (props.selectedBorderColor === undefined && props.selectedBorder !== undefined) result.borderColor = props.selectedBorder;
  return result;
}

export function spacingModePatch(props, prefix) {
  const individual = props[`${prefix}Mode`] === 'individual';
  const vertical = props[`${prefix}Top`] ?? props[`${prefix}Vertical`] ?? 0;
  const horizontal = props[`${prefix}Right`] ?? props[`${prefix}Horizontal`] ?? 0;
  return individual ? {
    [`${prefix}Mode`]: 'axis', [`${prefix}Vertical`]: vertical, [`${prefix}Horizontal`]: horizontal,
    [`${prefix}Top`]: vertical, [`${prefix}Bottom`]: vertical, [`${prefix}Left`]: horizontal, [`${prefix}Right`]: horizontal,
  } : {
    [`${prefix}Mode`]: 'individual',
    [`${prefix}Top`]: props[`${prefix}Vertical`] ?? vertical, [`${prefix}Bottom`]: props[`${prefix}Vertical`] ?? vertical,
    [`${prefix}Left`]: props[`${prefix}Horizontal`] ?? horizontal, [`${prefix}Right`]: props[`${prefix}Horizontal`] ?? horizontal,
  };
}

export function textPropertyPatch(node, patch) {
  const next = { ...patch };
  for (const prefix of ['', 'selected']) {
    for (const axis of ['Width', 'Height']) {
      const minKey = prefix ? `${prefix}Min${axis}` : `min${axis}`;
      const maxKey = prefix ? `${prefix}Max${axis}` : `max${axis}`;
      const minimum = next[minKey] ?? node.props[minKey] ?? 0;
      const maximum = next[maxKey] ?? node.props[maxKey] ?? 0;
      if (maximum > 0 && minimum > maximum) {
        if (next[minKey] !== undefined) next[maxKey] = minimum;
        else if (next[maxKey] !== undefined) next[minKey] = maximum;
      }
    }
  }
  if (node.type === 'Text' && patch.background !== undefined) next.textBackground = 'transparent';
  if (patch.bold !== undefined) next.fontWeight = patch.bold ? 700 : 400;
  if (node.type !== 'Text' || !node.props.runs?.length || patch.runs !== undefined) return next;
  const keys = ['fontSize', 'color', 'fontWeight', 'bold', 'italic', 'underline'];
  if (!keys.some((key) => next[key] !== undefined) && next.strike === undefined) return next;
  next.runs = node.props.runs.map((run) => ({ ...run, ...Object.fromEntries(keys.filter((key) => next[key] !== undefined).map((key) => [key, next[key]])), ...(next.strike !== undefined ? { strikethrough: next.strike } : {}) }));
  return next;
}

export function countdownSeconds(start) {
  const values = String(start ?? '').split(':');
  if (values.length !== 3 || values.some((value) => !/^\d+$/.test(value))) return null;
  const [h, m, s] = values.map(Number);
  return m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}

export function effectiveFillType(props) {
  return props.fillType ?? (props.backgroundVideo ? 'video' : props.backgroundImage ? 'image' : 'color');
}

export function checkedControl(props, id, runtime, nodes) {
  return props.switchTarget ? (runtime[props.switchTarget] ?? nodes.get(props.switchTarget)?.props.defaultIndex ?? 0) === 1 : Boolean(runtime[id] ?? props.initial);
}

export function activeComponents(document, runtime) {
  const nodes = new Map();
  const index = (node) => { nodes.set(node.id, node); node.children.forEach(index); };
  index(document.root);
  const result = [];
  const visit = (node) => {
    if (node.props.hidden || (['overlay','sheet'].includes(node.props.presentation) && runtime.overlay !== node.id)) return;
    const condition = node.props.visibleWhen;
    if (condition && Boolean(runtime[condition.id] ?? nodes.get(condition.id)?.props.initial) !== condition.value) return;
    result.push(node);
    let children = node.children;
    if (['Flow','Tabs','Carousel'].includes(node.type)) children = children.length ? [children[Math.max(0, Math.min(children.length - 1, runtime[node.id] ?? node.props.defaultIndex ?? 0))]] : [];
    if (node.type === 'Switch') children = children.filter((child) => child.type !== 'SwitchCase' || child.props.index === (runtime[node.id] ?? node.props.defaultIndex ?? 0));
    if (node.type === 'ExpressCheckout') children = children.filter((child) => child.props.state === (runtime[node.id] ?? node.props.previewState ?? 'available'));
    if (node.type === 'Countdown') children = children.filter((child) => child.props.state === (runtime[node.id] ?? runtime[`countdown-state:${node.id}`] ?? (node.props.previewState !== 'auto' ? node.props.previewState : null) ?? (countdownSeconds(node.props.start ?? '00:10:00') === null ? 'fallback' : countdownSeconds(node.props.start ?? '00:10:00') > 0 ? 'active' : 'ended')));
    children.forEach(visit);
  };
  visit(document.root);
  return result;
}
