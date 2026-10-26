import { HT_PRODUCT_DESIGN_DEFAULTS } from '../products/productStyleModel.js';
import { rebuildHtTemplateScene } from './htTemplateScenes.js';
import { upgradeNavigationRows } from './navigationRows.js';

export const TEMPLATE_VISUAL_VERSION = 1;
const edges = (prefix, vertical, horizontal = vertical) => ({ [`${prefix}Mode`]: 'individual', [`${prefix}Top`]: vertical, [`${prefix}Bottom`]: vertical, [`${prefix}Left`]: horizontal, [`${prefix}Right`]: horizontal });
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Values are design pixels on the existing 390px canvas, from the prior HT renderer.
export function calibrateTemplateVisuals(document, template, sources) {
  const variant = template.documentTemplate;
  if (!HT_PRODUCT_DESIGN_DEFAULTS[variant]) return document;
  const configs = new Map(sources.map((source) => [source.id, source.config ?? {}]));
  const productConfig = configs.get('products') ?? {};
  const horizontal = ['horizontal', 'standard'].includes(productConfig.packageLayout ?? 'standard');
  const blue = variant === 'blue-privilege';
  const member = variant === 'membership-plans';
  const recovery = variant === 'payment-recovery';
  const patch = new Map();
  const set = (id, props) => patch.set(id, { ...patch.get(id), ...props });
  if (blue) {
    const hero = configs.get('hero-image') ?? {};
    set('hero-image/image', { height: 226.2 * (Number(hero.mediaHeight) || 100) / 100 });
    set('hero-image/copy', { justify: 'start', gap: 6, ...edges('padding', 0), paddingTop: 61, paddingLeft: 390 * (hero.copyLeft ?? 12) / 100 });
    set('hero-image/vip', { width: 54.6, height: 24, marginBottom: 14 });
    for (const part of ['prefix', 'suffix']) set(`hero-image/${part}`, { fontSize: hero.copyTitleSize ?? 26, lineHeight: 1.15 });
    set('hero-image/caption', { fontSize: hero.copyCaptionSize ?? 16, lineHeight: 1.2 });
    const config = configs.get('benefits') ?? {};
    const visitRows = (node) => {
      if (/^benefits\/(header|row-\d+)$/.test(node.id)) {
        set(node.id, { heightMode: 'fixed', height: 46.8, gap: 0, ...edges('padding', 0, 16) });
        node.children.forEach((child, index) => {
          set(child.id, { widthMode: 'fill', flexGrow: [1.85, .82, .76][index], heightMode: 'fill', justify: 'center', align: 'center', fontSize: node.id.endsWith('/header') ? 21 : 17, lineHeight: 1.2, ...edges('padding', 0), background: index === 2 ? config.vipColumnBackground ?? '#ffffff' : 'transparent' });
          if (child.type === 'Icon' && index === 2) set(child.id, { iconSize: 22, color: config.accentColor ?? '#ffb40d' });
        });
      }
      node.children.forEach(visitRows);
    };
    visitRows(document.root);
  }
  if (member) {
    set('$screen', { paddingTop: 129, background: '#9c9c9c' });
    set('carousel', { background: '#f7f7f7', radius: 28 });
    set('carousel/slide-0', { gap: 0 });
    set('carousel/slide-image-0', { height: 244.4, objectFit: 'fill' });
    set('carousel/slide-title-0', { color: '#f68920', fontSize: 30.4, paddingTop: 10, lineHeight: 1.2 });
    set('carousel/slide-caption-0', { color: '#a4a4a4', fontSize: 18.3, paddingTop: 7 });
  }
  if (recovery) {
    set('$screen', { paddingTop: 148, backgroundImage: document.root.props.backgroundImage || '/figma-paywall-assets/recovery-art.png', backgroundFit: 'contain', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' });
    set('offer-card', { radius: 32, gap: 10, ...edges('padding', 22, 18) });
    set('headline', { fontSize: (configs.get('headline') ?? {}).fontSize ?? 28, marginTop: 12, marginBottom: 12 });
    set('hero-image/image', { height: 190, widthMode: 'fixed', width: 226, alignSelf: 'center' });
    set('caption', { fontSize: 17, marginTop: 8, marginBottom: 10 });
  }
  if (variant === 'sku-sheet') {
    set('$screen', { paddingTop: 260, background: '#a4a4a4' });
    set('sku-card', { radius: 28, gap: 8, ...edges('padding', 16, 18) });
    set('hero-image/image', { height: 168, objectFit: 'contain' });
    set('headline', { fontSize: 15.6 });
    set('caption', { fontSize: 18.3, lineHeight: 1.15 });
  }
  const visit = (node) => {
    if (node.type === 'Package' && node.props.group === 'products') {
      const index = Number(node.id.match(/package-(\d+)$/)?.[1]);
      const defaults = HT_PRODUCT_DESIGN_DEFAULTS[variant];
      const part = (name) => ({ ...productConfig.productPartStyles?.[name], ...productConfig.packagePartStyles?.[index]?.[name] });
      set(node.id, { gap: horizontal ? 0 : 8, minHeight: Number(productConfig.planHeight) || defaults.frame.planHeight, heightMode: 'fit', radius: productConfig.planRadius ?? 16, borderWidth: 1, ...edges('padding', horizontal ? 0 : 8, horizontal ? 0 : 12), ...Object.fromEntries(['Top', 'Right', 'Bottom', 'Left'].filter((side) => productConfig[`planPadding${side}`] !== undefined).map((side) => [`padding${side}`, Number(productConfig[`planPadding${side}`])])), color: '#8f8f8f', selectedColor: '#151515' });
      set(`products/package-${index}-name`, { fontWeight: 500, color: 'inherit', ...part('name') });
      set(`products/package-${index}-price`, { fontSize: horizontal ? 16 : 17, fontWeight: 700, color: 'inherit', ...part('price') });
      if (horizontal) {
        set(`products/package-header-${index}`, { gap: 8, heightMode: 'fixed', height: 50, justify: 'start', color: 'inherit' });
        set(`products/badge-${index}`, { heightMode: 'fixed', height: 26, minHeight: 26, radius: 14, ...edges('padding', 3, 2) });
        set(`products/badge-space-${index}`, { height: 26 });
        set(`products/price-${index}`, { heightMode: 'fit', minHeight: 30, justify: 'start', gap: 0, color: 'inherit' });
        set(`products/detail-${index}`, { minHeight: 40, justify: 'center', align: 'center', gap: 0 });
        for (const [field, style] of [['savingCopy', 'saving'], ['saveCopy', 'save'], ['supportingCopy', 'supporting']]) set(`products/package-${index}-${field}`, { textAlign: 'center', lineHeight: 1.3, color: ['saving', 'save'].includes(style) ? productConfig.saveTextColor ?? '#ff8207' : '#8f8f8f', ...part(style) });
      }
    }
    node.children.forEach(visit);
  };
  visit(document.root);
  set('products', { gap: horizontal ? 0 : 8, ...edges('padding', 0), ...edges('margin', 0, blue || member ? 16 : 0), widthMode: 'fill', background: horizontal ? '#f5f5f5' : 'transparent', radius: 16 });
  const timer = configs.get('timer') ?? {};
  set('timer', { fontSize: timer.fontSize ?? (blue ? 18 : recovery ? 20 : 14), minHeight: blue ? 52.6 : 30, justify: 'center', ...edges('margin', blue ? 0 : 8) });
  set('agreement', { gap: 3, ...edges('margin', 4, 18) });
  const purchase = configs.get('purchase') ?? {};
  set('purchase', { ...edges('padding', 14, 18), ...edges('margin', 8, blue || member ? 18 : 0), background: purchase.backgroundColor ?? `linear-gradient(90deg, ${(productConfig.purchaseBackgroundGradient ?? ['#ff860a', '#ffb000', '#ffd10b']).join(', ')})`, radius: purchase.radius ?? 32 });
  set('purchase/label', { fontSize: purchase.fontSize ?? 22, lineHeight: 1.2, fontWeight: 700 });
  set('legal', { color: (configs.get('legal') ?? {}).color ?? '#aaaaaa', textAlign: 'left', fontSize: (configs.get('legal') ?? {}).fontSize ?? 11, lineHeight: 1.32, ...edges('margin', 10, blue || member ? 18 : 0) });
  const apply = (node) => ({ ...node, props: { ...node.props, ...patch.get(node.id) }, children: node.children.map(apply) });
  const calibrated = rebuildHtTemplateScene({ ...document, visualDefaultsVersion: TEMPLATE_VISUAL_VERSION, root: apply(document.root) }, template);
  return blue ? upgradeNavigationRows(calibrated) : calibrated;
}

// Change only values still equal to the old generated defaults, never user content or structure.
export function migrateTemplateVisuals(document, previous, current) {
  // A structural default rebuild must not rewrite an existing user draft.
  if (current.htSceneVersion) return document;
  if (document.visualDefaultsVersion === TEMPLATE_VISUAL_VERSION || !current.visualDefaultsVersion) return document;
  const index = (root, map = new Map()) => { map.set(root.id, root); root.children.forEach((child) => index(child, map)); return map; };
  const oldNodes = index(previous.root), newNodes = index(current.root);
  const visit = (node) => {
    const old = oldNodes.get(node.id), next = newNodes.get(node.id), props = { ...node.props };
    if (old?.type === node.type && next?.type === node.type) {
      for (const [key, value] of Object.entries(next.props)) {
        if (['text', 'runs', 'src', 'binding', 'action', 'dataKey', 'group', 'defaultSelected', 'hidden'].includes(key)) continue;
        if (equal(props[key], old.props[key])) props[key] = value;
      }
    }
    let children = node.children.map(visit);
    if (node.id === 'timer' && node.type === 'Countdown' && props.fontSize !== node.props.fontSize) {
      const resizeDigits = (child) => ({ ...child, props: child.type === 'Text' && child.props.fontSize === node.props.fontSize ? { ...child.props, fontSize: props.fontSize } : child.props, children: child.children.map(resizeDigits) });
      children = children.map(resizeDigits);
    }
    return { ...node, props, children };
  };
  return { ...document, visualDefaultsVersion: TEMPLATE_VISUAL_VERSION, root: visit(document.root) };
}
