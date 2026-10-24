export const STATE_STYLE_KEYS = ['axis','gap','align','justify','wrap','widthMode','width','minWidth','maxWidth','heightMode','height','minHeight','maxHeight','paddingMode','paddingTop','paddingRight','paddingBottom','paddingLeft','paddingVertical','paddingHorizontal','marginMode','marginTop','marginRight','marginBottom','marginLeft','marginVertical','marginHorizontal','background','backgroundImage','backgroundVideo','backgroundFit','backgroundPosition','backgroundRepeat','fillType','color','opacity','radius','shape','borderWidth','borderColor','shadowX','shadowY','shadowBlur','shadowColor'];
export const selectedStyleKey = (key) => `selected${key[0].toUpperCase()}${key.slice(1)}`;
STATE_STYLE_KEYS.push('minWidthEnabled', 'maxWidthEnabled', 'minHeightEnabled', 'maxHeightEnabled', 'fillEnabled');
export const CORNER_KEYS = ['radiusTopLeft', 'radiusTopRight', 'radiusBottomRight', 'radiusBottomLeft'];
export const PAINT_OPACITY_KEYS = ['colorOpacity', 'backgroundOpacity', 'borderOpacity', 'shadowOpacity', 'overlayOpacity', 'iconBackgroundOpacity'];
STATE_STYLE_KEYS.push('radiusMode', 'iconBackgroundEnabled', 'borderEnabled', 'shadowEnabled', ...CORNER_KEYS, ...PAINT_OPACITY_KEYS);
STATE_STYLE_KEYS.push('mask', 'overlayColor', 'overlayEnabled', 'iconBackground');
STATE_STYLE_KEYS.push('appearanceEnabled', 'maskEnabled');
export const sequencePages = (node) => node.type === 'Carousel' ? node.children.filter((child)=>child.type==='Slide') : node.children;
export function utcDateTimeInput(value) {
  if(!value)return '';
  const date=new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString().slice(0,19):'';
}
export const BADGE_DEFAULTS={text:'徽标',positionStyle:'overlay',position:'top-center',widthMode:'fit',heightMode:'fit',paddingMode:'axis',paddingVertical:4,paddingHorizontal:8,marginMode:'axis',marginVertical:0,marginHorizontal:0,fontSize:14,fontWeight:400,color:'#000000',textAlign:'center',background:'#11d483',shape:'pill',radius:0,borderWidth:0,borderColor:'#cccccc',shadowBlur:0,shadowColor:'#000000',backgroundOpacity:100,colorOpacity:100};

export function selectionOwner(node, nodes, parents) {
  let current = node;
  while (current) {
    if (['Package', 'TabButton'].includes(current.type)) return current;
    current = nodes.get(parents.get(current.id));
  }
  return null;
}

export function paintColor(value, opacity = 100) {
  const amount = Math.max(0, Math.min(100, Number(opacity) || 0));
  if (!value || value === 'transparent' || amount === 100 || /gradient\(/i.test(value)) return value;
  return `color-mix(in srgb, ${value === 'inherit' ? 'currentColor' : value} ${amount}%, transparent)`;
}

export function cornerModePatch(props) {
  if (props.radiusMode === 'individual') return { radiusMode: 'all', radius: props.radiusTopLeft ?? props.radius ?? 0 };
  return { radiusMode: 'individual', ...Object.fromEntries(CORNER_KEYS.map((key) => [key, props.radius ?? 0])) };
}

export function cornerRadius(props) {
  if (props.appearanceEnabled === false || props.maskEnabled === false) return 0;
  if (props.shape === 'pill') return 999;
  if (props.shape === 'circle') return '50%';
  const numeric = (value) => Math.max(0, Number(value) || 0);
  return props.radiusMode === 'individual' ? CORNER_KEYS.map((key) => `${numeric(props[key] ?? props.radius)}px`).join(' ') : numeric(props.radius);
}

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
  if (node.type === 'Video') {
    if (patch.autoPlay === false && !(patch.controls ?? node.props.controls ?? true)) next.controls = true;
    if (patch.controls === false && !(patch.autoPlay ?? node.props.autoPlay ?? false)) next.autoPlay = true;
  }
  if (['Image','Video'].includes(node.type) && patch.mask !== undefined) next.shape = 'rectangle';
  if (node.type === 'Text' && patch.fontWeight !== undefined) next.bold = false;
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
  if (node.type === 'Text' && patch.background !== undefined) { next.textBackground = 'transparent'; next.fillEnabled = true; }
  if (patch.bold !== undefined) next.fontWeight = patch.bold ? 700 : 400;
  if (node.type !== 'Text' || !node.props.runs?.length || patch.runs !== undefined) return next;
  const keys = ['fontSize', 'fontFamily', 'color', 'colorOpacity', 'fontWeight', 'bold', 'italic', 'underline'];
  if (!keys.some((key) => next[key] !== undefined) && next.strike === undefined) return next;
  next.runs = node.props.runs.map((run) => ({ ...run, ...Object.fromEntries(keys.filter((key) => next[key] !== undefined).map((key) => [key, next[key]])), ...(next.strike !== undefined ? { strikethrough: next.strike } : {}) }));
  return next;
}

export function dimensionModePatch(axis, mode) {
  const name = axis[0].toUpperCase() + axis.slice(1);
  return { [`${axis}Mode`]: mode, ...(mode !== 'fill' ? { [`min${name}`]: 0, [`max${name}`]: 0, [`min${name}Enabled`]: false, [`max${name}Enabled`]: false } : {}) };
}

export function imageMask(props) {
  if (props.maskEnabled === false) return 'rectangle';
  if (props.mask && props.mask !== 'none') return props.mask === 'rounded' ? 'rectangle' : props.mask;
  return props.shape === 'circle' ? 'circle' : 'rectangle';
}

export function countdownValues(seconds, countFrom = 'hours') {
  const days = Math.floor(seconds / 86400);
  const hours = countFrom === 'days' ? Math.floor(seconds / 3600) % 24 : Math.floor(seconds / 3600);
  const minutes = countFrom === 'minutes' ? Math.floor(seconds / 60) : Math.floor(seconds / 60) % 60;
  const raw = { days, hours, minutes, seconds: seconds % 60 };
  return Object.fromEntries(Object.entries(raw).flatMap(([key, value]) => [[key, String(value).padStart(2, '0')], [`${key}WithoutZero`, String(value)]]));
}

export function countdownSeconds(start) {
  const values = String(start ?? '').split(':');
  if (values.length !== 3 || values.some((value) => !/^\d+$/.test(value))) return null;
  const [h, m, s] = values.map(Number);
  return m < 60 && s < 60 ? h * 3600 + m * 60 + s : null;
}

export function countdownDeadline(value) {
  const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value) ? `${value}Z` : value;
  return Date.parse(utc);
}

export function effectiveFillType(props) {
  return props.fillType ?? (props.backgroundVideo ? 'video' : props.backgroundImage ? 'image' : 'color');
}

export function mainAxisFillStyle(props,parentProps) {
  if(props.heightMode!=='fill'||parentProps?.axis!=='vertical'||!['fixed','fill'].includes(parentProps.heightMode))return {};
  return {height:0,flexBasis:'0%',flexGrow:props.flexGrow??1,flexShrink:1};
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
    if (['Flow','Tabs','Carousel'].includes(node.type)) {
      const pages = sequencePages(node);
      children = [...(pages.length ? [pages[Math.max(0, Math.min(pages.length - 1, runtime[node.id] ?? node.props.defaultIndex ?? 0))]] : []), ...node.children.filter((child)=>child.type==='PageControl')];
    }
    if (node.type === 'Switch') children = children.filter((child) => child.type !== 'SwitchCase' || child.props.index === (runtime[node.id] ?? node.props.defaultIndex ?? 0));
    if (node.type === 'ExpressCheckout') children = children.filter((child) => child.props.state === (runtime[node.id] ?? node.props.previewState ?? 'available'));
    if (node.type === 'Countdown') children = children.filter((child) => child.props.state === (runtime[node.id] ?? runtime[`countdown-state:${node.id}`] ?? (node.props.previewState !== 'auto' ? node.props.previewState : null) ?? (countdownSeconds(node.props.start ?? '00:10:00') === null ? 'fallback' : countdownSeconds(node.props.start ?? '00:10:00') > 0 ? 'active' : 'ended')));
    if(node.type==='Countdown'&&node.props.fallbackEnabled===false)children=children.filter((child)=>child.props.state!=='fallback');
    children.forEach(visit);
  };
  visit(document.root);
  return result;
}
