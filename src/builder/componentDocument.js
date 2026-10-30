import { productPackageRows, listRowsFor, privilegeRowsFor, agreementSegmentsFor, heroTitleParts } from './fieldModels.js';
import { resolveProductPrice, productPriceFields, skuById, skuCopy } from '../productPricing.js';
import { linkActionFor, visibleLinkLabels } from '../linkActions.js';
import { HT_PRODUCT_DESIGN_DEFAULTS } from '../products/productStyleModel.js';
import { calibrateTemplateVisuals } from './templateVisuals.js';
import {buildTemplateNavigationHeaders} from './templateNavigationHeaders.js';
import { effectiveFillType } from './propertyModel.js';
import { localSettingsResetting } from '../templateStorage.js';
import { packageDisplayFields } from '../products/packageFields.js';
import {validWorkbenchConfiguration} from './workbenchModel.js';
import { PRODUCT_PARAMETERS, productParameterPreview } from '../products/productParameters.js';
import {pruneGeneratedEmptyLayouts,normalizeHtLabelSlots} from './layoutContainers.js';
import {buildFreeTrialTemplate} from './freeTrialTemplate.js';
import {remapButtonText} from './buttonText.js';
import {remapPurchasePages} from './purchaseSelection.js';

export const DOCUMENT_VERSION = 3;
export const COMPONENT_TYPES = ['Screen', 'Stack', 'Text', 'ProductParameter', 'Image', 'Video', 'Icon', 'Custom', 'Header', 'Footer', 'Package', 'PurchaseButton', 'BottomSheet', 'ExpressCheckout', 'CheckoutState', 'Wallet', 'Button', 'Tabs', 'Tab', 'TabControl', 'TabButton', 'Carousel', 'Slide', 'PageControl', 'Indicators', 'Timeline', 'TimelineItem', 'Switch', 'SwitchCase', 'Toggle', 'Countdown', 'CountdownState', 'Flow'];
export const COMPONENT_NAMES = { Screen: '页面', Stack: '布局容器', Text: '文字', Image: '图片', Video: '视频', Icon: '图标', Custom: '自定义网页', Header: '页头', Footer: '页脚', Package: '商品', PurchaseButton: '购买按钮', BottomSheet: '底部弹层', ExpressCheckout: '快捷结账', CheckoutState: '结账状态内容', Wallet: '钱包按钮', Button: '按钮', Tabs: '标签页', Tab: '标签页面', TabControl: '标签按钮组', TabButton: '标签按钮', Carousel: '轮播', Slide: '轮播页', Timeline: '时间线', TimelineItem: '时间节点', Switch: '开关', SwitchCase: '开关状态内容', Toggle: '开关控件', Countdown: '倒计时', CountdownState: '倒计时状态内容', Flow: '多页面流程' };
Object.assign(COMPONENT_NAMES, { ProductParameter: '商品参数', PageControl: '分页控件', Indicators: '分页指示器',Custom:'自定义组件',BottomSheet:'弹窗',Package:'商品套餐' });
export const CONTAINER_TYPES = new Set(['Screen', 'Stack', 'Header', 'Footer', 'Package', 'PurchaseButton', 'BottomSheet', 'ExpressCheckout', 'CheckoutState', 'Button', 'Tabs', 'Tab', 'TabControl', 'TabButton', 'Carousel', 'Slide', 'PageControl', 'Timeline', 'TimelineItem', 'Switch', 'SwitchCase', 'Countdown', 'CountdownState', 'Flow']);
export const DEFAULT_PROPS = { axis: 'vertical', gap: 8, align: 'stretch', justify: 'start', widthMode: 'fill', width: 160, minWidth: 0, maxWidth: 0, heightMode: 'fit', height: 160, minHeight: 0, maxHeight: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, paddingVertical: 0, paddingHorizontal: 0, paddingMode: 'axis', marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0, marginVertical: 0, marginHorizontal: 0, marginMode: 'axis', background: 'transparent', color: '#171717', radius: 0, borderWidth: 0, borderColor: '#dedee3', fontSize: 14, fontWeight: 400, textAlign: 'left', objectFit: 'contain', opacity: 100, alignSelf: 'auto', shadowX: 0, shadowY: 0, shadowBlur: 0, shadowColor: '#000000', shape: 'rectangle', fillType: 'color', mask: 'none', overlayColor: 'transparent', iconBackground: 'transparent', iconRadius: 0 };
export const componentProps = (node) => {
  const props = { ...DEFAULT_PROPS, color: node.type === 'Screen' ? '#171717' : 'inherit', ...(['Toggle', 'Icon'].includes(node.type) ? { widthMode: 'fit' } : {}), ...(node.type === 'TabButton' ? { selectedBackground: '#167aff', selectedColor: '#ffffff' } : {}), ...node.props };
  props.fillType = effectiveFillType(node.props);
  for (const key of ['colorOpacity', 'backgroundOpacity', 'borderOpacity', 'shadowOpacity', 'overlayOpacity', 'iconBackgroundOpacity']) props[key] = node.props[key] ?? (node.type === 'Icon' && key === 'colorOpacity' ? node.props.opacity ?? 100 : 100);
  if (node.type === 'Timeline') {
    const item = node.children.find((child) => child.type === 'TimelineItem');
    const copy = item?.children.find((child) => child.type === 'Stack');
    props.itemSpacing = node.props.itemSpacing ?? props.gap;
    props.columnGutter = node.props.columnGutter ?? item?.props.gap ?? 16;
    props.textSpacing = node.props.textSpacing ?? copy?.props.gap ?? 4;
    props.iconAlignment = node.props.iconAlignment ?? 'title';
  }
  if (node.type === 'Icon' && node.props.radius === undefined) props.radius = node.props.iconRadius ?? props.radius;
  for (const prefix of ['padding', 'margin']) {
    const source = node.props;
    const vertical = source[`${prefix}Vertical`] ?? props[`${prefix}Top`];
    const horizontal = source[`${prefix}Horizontal`] ?? props[`${prefix}Right`];
    const asymmetric = props[`${prefix}Top`] !== props[`${prefix}Bottom`] || props[`${prefix}Left`] !== props[`${prefix}Right`];
    props[`${prefix}Mode`] = source[`${prefix}Mode`] === 'individual' || (asymmetric && source[`${prefix}Vertical`] === undefined && source[`${prefix}Horizontal`] === undefined) ? 'individual' : source[`${prefix}Mode`] ?? 'axis';
    props[`${prefix}Vertical`] = vertical;
    props[`${prefix}Horizontal`] = horizontal;
  }
  if (node.type === 'Icon') {
    const glyph = props.iconSize ?? props.fontSize;
    const sides = (prefix, axis) => props[`${prefix}Mode`] === 'individual' ? Number(props[`${prefix}${axis === 'width' ? 'Left' : 'Top'}`]) + Number(props[`${prefix}${axis === 'width' ? 'Right' : 'Bottom'}`]) : 2 * Number(props[`${prefix}${axis === 'width' ? 'Horizontal' : 'Vertical'}`]);
    for (const axis of ['width', 'height']) {
      const name = axis[0].toUpperCase() + axis.slice(1);
      if (props[`${axis}Mode`] !== 'fixed') props[axis] = Math.max(Number(glyph) + sides('padding', axis) + 2 * Number(props.borderEnabled === false ? 0 : props.borderWidth), Number(props[`min${name}`]) || 0);
      props[`${axis}Mode`] = 'fixed';
    }
  }
  return props;
};
export const component = (id, type, name, props = {}, children = []) => ({ id, type, name: name || COMPONENT_NAMES[type], props, children });
export function componentLayerLabel(node, content = '') {
  if (node.type === 'Screen') return node.name || COMPONENT_NAMES.Screen;
  if (node.type === 'Text') return content.trim() || COMPONENT_NAMES.Text;
  if (node.type === 'ProductParameter') return `商品参数 · ${PRODUCT_PARAMETERS[node.props.parameter]?.label ?? '未选择'}`;
  if (node.type === 'CountdownState') return ({active:'计时中',ended:'已结束',fallback:'数据不可用'})[node.props.state] ?? COMPONENT_NAMES.CountdownState;
  if (node.type === 'SwitchCase' && [0, 1].includes(node.props.index)) return `${node.props.index === 1 ? '开启' : '关闭'} · ${COMPONENT_NAMES.SwitchCase}`;
  return COMPONENT_NAMES[node.type] || node.type;
}
export function uniqueSceneName(document, preferred, exceptId) {
  const names = new Set([...indexDocument(document).nodes.values()].filter((node) => node.id !== exceptId && ['Screen','BottomSheet'].includes(node.type)).map((node) => node.name));
  const base = preferred?.trim() || '页面';
  let name = base, number = 2;
  while (names.has(name)) name = `${base} ${number++}`;
  return name;
}
const text = (id, value, props = {}) => component(id, 'Text', '', { text: String(value ?? ''), ...props });
const stack = (id, name, children, props = {}) => component(id, 'Stack', name, props, children.filter(Boolean));
const image = (id, src, props = {}) => component(id, 'Image', '', { src: src ?? '', heightMode: 'fixed', height: 180, objectFit: 'contain', ...props });
const insets = (value = 0) => Object.fromEntries(['Top', 'Right', 'Bottom', 'Left'].map((side) => [`padding${side}`, value]));
const safeNumber = (value, fallback) => value !== '' && value != null && Number.isFinite(Number(value)) ? Number(value) : fallback;

export function indexDocument(document) {
  const nodes = new Map(), parents = new Map();
  const visit = (node, parent = null) => { nodes.set(node.id, node); parents.set(node.id, parent); node.children.forEach((child) => visit(child, node.id)); };
  visit(document.root);
  return { nodes, parents };
}
export function validDocument(document) {
  if (document?.version !== DOCUMENT_VERSION || document.root?.type !== 'Screen' || !document.products || typeof document.products !== 'object') return false;
  if(!validWorkbenchConfiguration(document))return false;
  if (document.settings !== undefined && (!document.settings || typeof document.settings !== 'object' || Array.isArray(document.settings) || document.settings.exitOfferOfferingId !== undefined && typeof document.settings.exitOfferOfferingId !== 'string')) return false;
  if (document.settings?.presentationSurfaceId !== undefined && typeof document.settings.presentationSurfaceId !== 'string') return false;
  const exitBindings = document.settings?.exitOffersByScreen;
  if (exitBindings !== undefined && (!exitBindings || typeof exitBindings !== 'object' || Array.isArray(exitBindings) || Object.values(exitBindings).some((id) => typeof id !== 'string'))) return false;
  const closeBindings = document.settings?.closeTargetsByScreen;
  if (closeBindings !== undefined && (!closeBindings || typeof closeBindings !== 'object' || Array.isArray(closeBindings) || Object.values(closeBindings).some((id) => typeof id !== 'string'))) return false;
  if (document.settings?.retainedPopupIds !== undefined && (!Array.isArray(document.settings.retainedPopupIds) || document.settings.retainedPopupIds.some((id) => typeof id !== 'string'))) return false;
  if(document.fonts!==undefined&&(!Array.isArray(document.fonts)||document.fonts.some(font=>!font||typeof font.id!=='string'||typeof font.family!=='string'||!Array.isArray(font.faces)||font.faces.some(face=>!face||typeof face.src!=='string'))))return false;
  const ids = new Set();
  const visit = (node, depth = 0) => {
    if (depth > 40 || !node || typeof node.id !== 'string' || ids.has(node.id) || !COMPONENT_TYPES.includes(node.type) || !Array.isArray(node.children) || !node.props || typeof node.props !== 'object') return false;
    ids.add(node.id);
    if (node.type === 'ProductParameter' && !Object.hasOwn(PRODUCT_PARAMETERS, node.props.parameter)) return false;
    return (CONTAINER_TYPES.has(node.type) || !node.children.length) && node.children.every((child) => visit(child, depth + 1));
  };
  return visit(document.root) && (!document.settings?.presentationSurfaceId || indexDocument(document).nodes.get(document.settings.presentationSurfaceId)?.type === 'BottomSheet');
}
export function updateComponent(document, id, patch) {
  const visit = (node) => node.id === id ? { ...node, ...patch, props: patch.props ? { ...node.props, ...patch.props } : node.props } : { ...node, children: node.children.map(visit) };
  return { ...document, root: visit(document.root) };
}
export function removeComponent(document, id) {
  if (id === document.root.id) return document;
  const visit = (node) => ({ ...node, children: node.children.filter((child) => child.id !== id).map(visit) });
  return { ...document, root: visit(document.root) };
}
export function canContain(parent, child) {
  if (!parent || !CONTAINER_TYPES.has(parent.type)) return false;
  if (['Header', 'Footer'].includes(child.type)) return parent.type === 'Screen' && !parent.children?.some((entry) => entry.type === child.type && entry.id !== child.id);
  if (parent.type === 'Header' && !['Stack', 'Text', 'Image', 'Button', 'Icon'].includes(child.type)) return false;
  if (parent.type === 'ExpressCheckout') return child.type === 'CheckoutState' && (parent.children?.filter((entry)=>entry.id!==child.id).length??0)<3 && (!child.props?.state || !parent.children?.some((entry)=>entry.id!==child.id&&entry.props.state===child.props.state));
  if (parent.type === 'Switch') {
    const states = parent.children?.filter((entry) => entry.type === 'SwitchCase' && entry.id !== child.id) ?? [];
    if (child.type === 'SwitchCase') return states.length < 2 && (child.props?.index === undefined || !states.some((entry) => entry.props.index === child.props.index));
    return !parent.children?.some((entry) => entry.type === 'SwitchCase') && ['Toggle', 'Stack', 'Text'].includes(child.type);
  }
  if (parent.type === 'Countdown') return child.type === 'CountdownState' && (parent.children?.filter((entry)=>entry.id!==child.id).length??0)<3 && (!child.props?.state || !parent.children?.some((entry)=>entry.id!==child.id&&entry.props.state===child.props.state));
  if (parent.type === 'Tabs') return child.type === 'Tab';
  if (parent.type === 'TabControl') return child.type === 'TabButton';
  if (parent.type === 'Carousel') return child.type === 'Slide' || child.type === 'PageControl' && !parent.children?.some((entry)=>entry.type==='PageControl' && entry.id!==child.id);
  if (parent.type === 'PageControl') return child.type === 'Indicators' && !parent.children?.some((entry)=>entry.type==='Indicators' && entry.id!==child.id);
  if (parent.type === 'Timeline') return child.type === 'TimelineItem';
  if (parent.type === 'Flow') return child.type === 'Screen';
  return !['Tab', 'TabButton', 'Slide', 'PageControl', 'Indicators', 'TimelineItem', 'Screen', 'CheckoutState', 'SwitchCase', 'CountdownState'].includes(child.type);
}
export function insertComponent(document, parentId, node, at = Infinity) {
  const index = indexDocument(document), parent = index.nodes.get(parentId);
  if (!canContain(parent, node)) return document;
  const ids = new Set();
  const unique = (entry) => { if (!entry || index.nodes.has(entry.id) || ids.has(entry.id) || !Array.isArray(entry.children)) return false; ids.add(entry.id); return entry.children.every(unique); };
  if (!unique(node)) return document;
  const children = [...parent.children]; children.splice(Math.max(0, Math.min(children.length, at)), 0, node);
  return updateComponent(document, parentId, { children });
}
export function moveComponent(document, id, parentId, at = Infinity) {
  const { nodes } = indexDocument(document), node = nodes.get(id), parent = nodes.get(parentId);
  if (!node || id === document.root.id || !canContain(parent, node)) return document;
  const descendants = new Set(); const visit = (entry) => { descendants.add(entry.id); entry.children.forEach(visit); }; visit(node);
  if (descendants.has(parentId)) return document;
  return insertComponent(removeComponent(document, id), parentId, node, at);
}
export function resolveComponentText(node, document, packageNode, selected = false) {
  if (node.type === 'ProductParameter') return productParameterPreview(node.props.parameter, packageNode, selected);
  const binding = node.props.binding;
  if (!binding) return node.props.runs?.length ? node.props.runs.map((run) => `${run.breakBefore ? '\n' : ''}${run.text ?? ''}`).join('') : node.props.text ?? '';
  return String(packageDisplayFields(document, packageNode, selected, binding.key)[binding.field] ?? '');
}

// Legacy configuration is consumed once. Runtime edits never compile back to it.
export function importComponentDocument(nodes, template = {}, calibrate = true) {
  if(template.id==='ht-free-trial')return buildFreeTrialTemplate();
  const products = {};
  const detailScreens = [];
  const byParent = new Map(), latest = [], byId = new Map(nodes.map((node) => [node.id, node]));
  nodes.forEach((node) => { const depth = node.depth ?? 0; const parent = byId.has(node.parentId) ? node.parentId : depth ? latest[depth - 1] : null; const children = byParent.get(parent ?? null) ?? []; children.push(node); byParent.set(parent ?? null, children); latest[depth] = node.id; latest.length = depth + 1; });
  const dark = ['black', 'night'].includes(template.theme) || [2, 5, 6, 8, 10, 11, 12, 15, 17, 23, 26, 28, 30, 35, 39, 40, 41].includes(template.sourceOrder);
  const accent = template.accent ?? '#0784ff', foreground = dark ? '#ffffff' : '#171717';
  const common = (config = {}) => ({ ...(config.fontSize ? { fontSize: safeNumber(config.fontSize, 14) } : {}), ...(config.fontWeight ? { fontWeight: config.fontWeight } : {}), ...(config.color ? { color: config.color } : {}), ...(config.textAlign ? { textAlign: config.textAlign } : {}), ...(config.backgroundColor ? { background: config.backgroundColor } : {}), ...(config.radius != null ? { radius: config.radius } : {}), ...Object.fromEntries(['Top', 'Right', 'Bottom', 'Left'].filter((side) => config[`margin${side}`] != null).map((side) => [`margin${side}`, Number(config[`margin${side}`])])) });
  const convert = (source, suffix = '', pane = null) => {
    const id = source.id + suffix, config = source.config ?? {}, children = (byParent.get(source.id) ?? []).map((node) => convert(node, suffix, pane));
    const c = (part) => `${id}/${part}`;
    let result;
    if (source.type === 'Page Background') return null;
    if (source.type === 'Screen Flow') return component(id, 'Flow', '多页面流程', { defaultIndex: config.defaultStep ?? 0 }, children.filter(Boolean));
    if (source.type === 'Screen') return component(id, 'Screen', source.content || '页面', { color: foreground, background: dark ? '#10101c' : '#ffffff', ...insets(20), gap: 16 }, children.filter(Boolean));
    if (source.type === 'Tabs') {
      return component(id, 'Tabs', source.label, { defaultIndex: config.defaultTab ?? 0 }, (config.tabs ?? []).map((tab, index) => {
        const context = { id: source.id, index };
        const linked = nodes.filter((node) => node.config?.linkedTabsId === source.id);
        const heading = linked.filter((node) => /Text|Header|Headline/.test(node.type));
        const content = linked.filter((node) => !heading.includes(node));
        return component(c(`tab-${index}`), 'Tab', tab.title, {}, [
          ...heading.map((node) => convert(node, `/pane-${index}`, context)),
          component(c(`buttons-${index}`), 'TabControl', '标签按钮', { axis: 'horizontal', gap: 4, background: dark ? '#24213c' : '#f1f0f6', radius: 6, ...insets(3) }, (config.tabs ?? []).map((button, buttonIndex) => component(c(`button-${index}-${buttonIndex}`), 'TabButton', button.title, { target: indexDocumentId(source.id, suffix), index: buttonIndex, ...insets(8), radius: 4, align: 'center', selectedBackground: accent, selectedColor: '#ffffff' }, [text(c(`button-label-${index}-${buttonIndex}`), button.title, { textAlign: 'center', fontWeight: 600 })]))),
          ...(tab.description ? [text(c(`description-${index}`), tab.description)] : []),
          ...content.map((node) => convert(node, `/pane-${index}`, context)),
        ].filter(Boolean));
      }));
    }
    if (source.type === 'Products') {
      const allRows = productPackageRows(source, template.documentTemplate);
      const groupSize = Number(config.groupSize) || allRows.length;
      const rows = pane && config.linkedTabsId ? allRows.slice(pane.index * groupSize, (pane.index + 1) * groupSize) : allRows;
      const horizontal = ['horizontal', 'standard'].includes(config.packageLayout ?? (template.documentTemplate === 'blue-privilege' ? 'horizontal' : 'vertical'));
      const defaults = HT_PRODUCT_DESIGN_DEFAULTS[config.productTemplate]?.parts ?? {};
      const packages = rows.map((row, index) => {
        if (row.emptySlot) return null;
        const key = c(`data-${index}`); products[key] = { ...row };
        const part = (field, label, extra = {}) => {
          const styleKey = ({ supportingCopy: 'supporting', savingCopy: 'saving', saveCopy: 'save', badgeText: 'badge' })[field] ?? field;
          return { ...text(c(`package-${index}-${field}`), '', { binding: { key, field }, fontSize: defaults[styleKey] ?? (field === 'price' ? 18 : field === 'name' ? 14 : 12), fontWeight: ['name', 'price'].includes(field) ? 700 : 400, ...extra, ...config.productPartStyles?.[styleKey], ...config.packagePartStyles?.[index]?.[styleKey] }), name: label };
        };
        const badge = row.showBadge && row.badgeText ? stack(c(`badge-${index}`), '优惠标签', [part('badgeText', '标签', { fontSize: defaults.badge ?? 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' })], { background: gradient(config.badgeGradient, accent), radius: 5, ...insets(4), minHeight: 28, alignSelf: 'center' }) : null;
        const name = part('name', '商品名称', { textAlign: horizontal ? 'center' : 'left' });
        const price = part('price', '主价格', { textAlign: horizontal ? 'center' : 'right' });
        const reference = part('reference', '参考价', { fontSize: defaults.reference ?? 11, color: '#999999', strike: true, textAlign: horizontal ? 'center' : 'right' });
        const details = [row.showSupportingCopy && row.supportingCopy && part('supportingCopy', '辅助文案'), row.showSavingCopy && row.savingCopy && part('savingCopy', '优惠说明'), row.showSaveCopy && row.saveCopy && part('saveCopy', 'SAVE 文案')].filter(Boolean);
        const body = horizontal ? [stack(c(`package-header-${index}`), '名称与标签', [badge || (rows.some((item) => item.showBadge && item.badgeText) ? stack(c(`badge-space-${index}`), '标签占位', [], { heightMode: 'fixed', height: 28 }) : null), name], { gap: 4 }), stack(c(`price-${index}`), '价格', [reference, price], { gap: 2 }), stack(c(`detail-${index}`), '商品说明', details, { gap: 2, textAlign: 'center' })] : [stack(c(`left-${index}`), '名称与说明', [badge, name, ...details], { gap: 4 }), stack(c(`right-${index}`), '价格', [reference, price], { gap: 2, align: 'end', widthMode: 'fit' })];
        if (config.purchasePerCard) body.push(component(c(`purchase-${index}`), 'Button', '购买', { action: { action: 'Purchase' }, background: accent, radius: 6, ...insets(6), widthMode: 'fit' }, [{ ...part('price', '购买价格', { color: '#ffffff' }), id: c(`purchase-price-${index}`) }]));
        return component(c(`package-${index}`), 'Package', row.name || '商品', { dataKey: key, group: id, defaultSelected: index % groupSize === Math.min(groupSize - 1, config.defaultSelected ?? 1), priceMode: '1', axis: horizontal ? 'vertical' : 'horizontal', justify: horizontal ? 'start' : 'between', gap: 8, ...insets(horizontal ? 8 : 12), paddingTop: horizontal ? 6 : 12, background: config.backgroundColor ?? '#f5f5f5', radius: config.planRadius ?? 12, minHeight: horizontal ? 145 : 72, borderWidth: 2, borderColor: 'transparent', selectedBorder: config.selectedBorderGradient?.[0] ?? accent, selectedBackground: config.selectedBackground ?? '#ffffff', ...(config.linkedToggleId ? { visibleWhen: { id: `${config.linkedToggleId}/control`, value: index >= groupSize } } : {}) }, body);
      }).filter(Boolean);
      return stack(id, '商品选择', packages, { axis: horizontal ? 'horizontal' : 'vertical', gap: horizontal ? 6 : 8, ...insets(8), selectionGroup: true, ...(config.showCards === false ? { hidden: true } : {}) });
    }
    if (source.type === 'Hero Image') {
      const sources = { 'blue-privilege': '/figma-paywall-assets/blue-banner.png', 'payment-recovery': '/figma-paywall-assets/recovery-bg.png', 'sku-sheet': '/figma-paywall-assets/sku-art-alt.png', 'membership-plans': '/figma-paywall-assets/member-hero.png' };
      const src = config.mediaState === 'removed' ? '' : config.mediaSrc || sources[template.documentTemplate] || template.heroAsset || '';
      const visual = image(c('image'), src, { height: config.mediaHeight ? 260 * config.mediaHeight / 100 : template.documentTemplate === 'blue-privilege' ? 280 : 190, objectFit: config.mediaFit ?? (template.documentTemplate === 'blue-privilege' ? 'cover' : 'contain') });
      const title = heroTitleParts(config);
      const copy = template.documentTemplate === 'blue-privilege' ? stack(c('copy'), '主视觉文字', [config.overlayImageEnabled !== false && image(c('vip'), config.overlayImageSrc || '/ht-vip-badge.svg', { widthMode: 'fixed', width: 54, height: 29, marginBottom: 24 }), stack(c('title'), '标题', [text(c('prefix'), title.prefix, { color: '#ffffff', fontSize: config.copyTitleSize ?? 32, fontWeight: 800, widthMode: 'fit' }), text(c('suffix'), title.suffix, { color: '#ffc329', fontSize: config.copyTitleSize ?? 32, fontWeight: 800, widthMode: 'fit' })], { axis: 'horizontal', gap: 0 }), text(c('caption'), config.copyCaption ?? '', { color: '#ffffff', fontSize: config.copyCaptionSize ?? 20, fontWeight: 700 })], { justify: 'center', ...insets(28), paddingLeft: 44, gap: 8 }) : null;
      return stack(id, '主视觉', [visual, copy, ...children], { axis: copy ? 'overlay' : 'vertical', gap: 0 });
    }
    if (['Image', 'Video'].includes(source.type) || /^Image \d+$/.test(source.type)) return component(id, source.type === 'Video' || config.mediaType === 'Video' ? 'Video' : 'Image', source.label, { src: config.mediaState === 'removed' ? '' : config.mediaSrc || '', heightMode: 'fixed', height: safeNumber(config.mediaHeight, 180), objectFit: config.mediaFit ?? 'contain', ...common(config) });
    if (source.type === 'Carousel') {
      const slides = config.slides ?? (source.content ?? '').split('\n---\n').filter(Boolean).map((caption) => ({ caption }));
      return component(id, 'Carousel', source.label, { defaultIndex: config.initialSlide ?? 0, dotColor: config.accentColor ?? accent }, slides.map((slide, index) => component(c(`slide-${index}`), 'Slide', slide.title || `第 ${index + 1} 页`, { gap: 12 }, [slide.image && image(c(`slide-image-${index}`), slide.image, { height: template.documentTemplate ? 280 : 220, objectFit: config.imageFit ?? 'contain' }), slide.title && text(c(`slide-title-${index}`), slide.title, { fontSize: 22, fontWeight: 700, textAlign: 'center' }), slide.caption && text(c(`slide-caption-${index}`), slide.caption, { textAlign: 'center' })].filter(Boolean))));
    }
    if (source.type === 'Feature Table' || (source.type === 'List' && config.bluePrivilege)) {
      const privileged = config.bluePrivilege;
      const columns = privileged ? ['特权名称', '非会员', 'VIP'] : config.columns ?? ['权益', '标准版', '会员'];
      const allRows = privileged ? privilegeRowsFor(source) : config.rows ?? [];
      const rows = allRows;
      const row = (rowId, cells, header = false) => stack(rowId, header ? '表头' : '权益行', cells.map((cell, index) => typeof cell === 'object' ? component(`${rowId}/${index}`, 'Icon', '权益图标', { icon: cell.icon, color: index === 2 ? '#ffb400' : '#bbbbbb', widthMode: 'fill', textAlign: 'center' }) : text(`${rowId}/${index}`, cell, { fontSize: header ? 16 : 14, fontWeight: header ? 700 : 400, widthMode: 'fill', textAlign: index ? 'center' : 'left', color: index === 2 ? '#ffb400' : index === 1 ? '#999999' : foreground })), { axis: 'horizontal', gap: 8, align: 'center', ...insets(10), background: header ? config.headerBackground ?? '#f1f1f1' : 'transparent' });
      return stack(id, '权益对比', [row(c('header'), columns, true), ...rows.map((item, index) => {
        const entry = row(c(`row-${index}`), privileged ? [item.name, item.standardMode === 'icon' ? { icon: item.standardIcon } : item.standard, item.vipMode === 'icon' ? { icon: item.vipIcon } : item.vip] : [item.name, ...(item.values ?? [])]);
        if (privileged && index >= (Number(config.maxVisibleRows) || allRows.length)) entry.props.hidden = true;
        if (privileged && item.detail) {
          const detail = item.detail, target = c(`detail-screen-${index}`);
          entry.type = 'Button'; entry.props.action = { action: 'OpenPage', actionPage: target };
          detailScreens.push(component(target, 'Screen', detail.title || item.name, { background: '#ffffff', color: '#171717', ...insets(20), gap: 16 }, [
            component(`${target}/back`, 'Button', '返回', { widthMode: 'fit', action: { action: 'OpenPage', actionPage: '$main' } }, [text(`${target}/back-text`, '返回')]),
            text(`${target}/title`, detail.title || item.name, { color: detail.titleColor, fontSize: 24, fontWeight: 700, localizationKey: detail.copyKey ?? '' }),
            ...(detail.iconSrc ? [image(`${target}/icon`, detail.iconSrc, { height: 80 })] : []),
            ...(detail.images ?? []).filter((media) => media.src).map((media, i) => ({ ...image(`${target}/image-${i}`, media.src, { height: 240 }), name: `${media.locale || '详情'}图片` })),
            ...(detail.descriptionKey ? [text(`${target}/description`, '', { color: detail.descriptionColor, localizationKey: detail.descriptionKey })] : []),
          ]));
        }
        return entry;
      })], { gap: 0, background: config.backgroundColor ?? '#f5f5f5' });
    }
    if (['List', 'Feature list', 'Features', 'Timeline'].includes(source.type) || /^List \d+$/.test(source.type)) {
      if (config.listVariant === 'testimonials') return stack(id, '用户评价', (config.testimonialRows ?? []).map((row, index) => stack(c(`review-${index}`), '评价', [text(c(`review-title-${index}`), row.title, { fontWeight: 700 }), text(c(`review-stars-${index}`), '★★★★★', { color: '#ffb400' }), text(c(`review-quote-${index}`), row.quote), text(c(`review-author-${index}`), row.author)])), { gap: 12 });
      const rows = pane && config.linkedTabsId ? config.tabListRows?.[pane.index] ?? listRowsFor(source) : listRowsFor(source);
      const timeline = source.type === 'Timeline';
      const items = rows.map((row, index) => component(c(`item-${index}`), timeline ? 'TimelineItem' : 'Stack', row.title, { axis: 'horizontal', gap: 10, align: 'start' }, [row.leadingMode !== 'none' && component(c(`icon-${index}`), 'Icon', '图标', { icon: timeline ? row.marker ?? 'number' : row.leading ?? 'check', number: index + 1, color: config.accentColor ?? accent, widthMode: 'fixed', width: 22 }), stack(c(`copy-${index}`), '文字', [text(c(`title-${index}`), row.title, { fontWeight: 600 }), row.showCaption !== false && row.caption && text(c(`caption-${index}`), row.caption, { fontSize: 12, color: dark ? '#c1bed0' : '#777777' })], { gap: 4 })].filter(Boolean)));
      return component(id, timeline ? 'Timeline' : 'Stack', timeline ? '时间线' : '权益', { gap: 16, ...insets(template.documentTemplate ? 12 : 0), ...common(config), ...(timeline ? { lineColor: config.lineColor ?? '#d6d2e8', hidden: config.enabled === false } : {}) }, [...items, ...children].filter(Boolean));
    }
    if (source.type === 'Links') return stack(id, '页脚链接', visibleLinkLabels(source.content).map((label, index) => component(c(`link-${index}`), 'Button', label, { action: linkActionFor(label, config.linkActions?.[index]), background: 'transparent', color: config.color ?? (dark ? '#bbb8cf' : '#777777'), widthMode: 'fit', ...insets(0) }, [text(c(`label-${index}`), label, { fontSize: 11, textAlign: 'center', color: config.color ?? (dark ? '#bbb8cf' : '#777777') })])), { axis: 'horizontal', gap: config.gap ?? 16, justify: 'center', wrap: true, marginTop: 12 });
    if (source.type === 'Agreement') return stack(id, '同意协议', [config.showCheckbox !== false && component(c('checkbox'), 'Toggle', '同意勾选', { control: 'checkbox', initial: false, required: config.required !== false }), ...agreementSegmentsFor(source).map((part, index) => part.type === 'link' ? component(c(`segment-${index}`), 'Button', part.text, { action: { action: 'OpenURL', actionUrl: part.url }, widthMode: 'fit', background: 'transparent', ...insets(0) }, [text(c(`segment-text-${index}`), part.text, { color: '#167aff', fontSize: 12 })]) : text(c(`segment-${index}`), part.text, { widthMode: 'fit', fontSize: 12, color: '#777777' }))].filter(Boolean), { axis: 'horizontal', gap: 3, align: 'center', wrap: true, marginTop: 8 });
    if (source.type === 'Timer') return component(id, 'Countdown', '倒计时', { start: source.content, prefix: config.prefix ?? '', suffix: config.suffix ?? '', color: config.digitColor ?? accent, prefixColor: config.prefixColor ?? accent, digitBackground: config.digitBackgroundColor ?? 'transparent', fontSize: config.fontSize ?? 24, textAlign: 'center', hidden: config.enabled === false, marginTop: 12, marginBottom: 12 });
    if (source.type === 'Toggle') { const [title, caption] = (source.content ?? '').split('|'); return stack(id, '开关与说明', [stack(c('copy'), '说明', [text(c('title'), title), caption && text(c('caption'), caption, { fontSize: 12 })], { gap: 4 }), component(c('control'), 'Toggle', '开关', { initial: config.defaultState === 'On', widthMode: 'fit' })], { axis: 'horizontal', gap: 12, align: 'center' }); }
    if (source.type === 'Social Proof') return stack(id, '口碑', [config.leftDecorationSrc && image(c('left'), config.leftDecorationSrc, { height: 60, widthMode: 'fixed', width: 40 }), stack(c('copy'), '评分与说明', [text(c('rating'), '★'.repeat(Math.round(config.rating ?? 5)), { color: config.accentColor ?? '#ffb400', textAlign: 'center', fontSize: 22 }), text(c('count'), config.count ?? '50,000+', { textAlign: 'center', fontWeight: 700 }), (config.caption ?? source.content) && text(c('caption'), config.caption ?? source.content, { textAlign: 'center', fontSize: 12 })]), config.rightDecorationSrc && image(c('right'), config.rightDecorationSrc, { height: 60, widthMode: 'fixed', width: 40 })], { axis: 'horizontal', align: 'center', justify: 'center' });
    if (source.type === 'Award') return stack(id, '奖项', [config.leftDecorationSrc && image(c('left'), config.leftDecorationSrc, { height: 70, widthMode: 'fixed', width: 40 }), stack(c('copy'), '奖项文字', [text(c('source'), config.source ?? '编辑推荐', { fontSize: 11, textAlign: 'center' }), text(c('title'), config.title ?? source.content, { fontWeight: 700, textAlign: 'center' }), config.subtitle && text(c('subtitle'), config.subtitle, { textAlign: 'center' })]), config.rightDecorationSrc && image(c('right'), config.rightDecorationSrc, { height: 70, widthMode: 'fixed', width: 40 })], { axis: 'horizontal', align: 'center', justify: 'center' });
    if (['Button', 'Purchase Button', 'Web Paywall Button'].includes(source.type)) {
      const action = config.action ?? (source.type === 'Web Paywall Button' ? 'WebCheckout' : 'Purchase');
      const type = source.type === 'Purchase Button' || template.sourceOrder && action === 'Purchase' ? 'PurchaseButton' : 'Button';
      return component(id, type, source.label || (type === 'PurchaseButton' ? '购买按钮' : '按钮'), { action: { action, actionUrl: config.actionUrl ?? '', actionPage: config.actionPage ?? '' }, background: config.backgroundColor ?? accent, radius: config.radius ?? 16, ...insets(14), marginTop: 8, ...common(config) }, [text(c('label'), source.content, { color: config.color ?? '#ffffff', fontWeight: 600, textAlign: 'center', fontSize: 16 }), ...children].filter(Boolean));
    }
    if (source.type === 'Icon') return component(id, 'Icon', source.label, { icon: config.iconName ?? 'star', fontSize: config.iconSize ?? 22, color: config.color ?? accent });
    if (['Card', 'Stack', 'Footer'].includes(source.type)) {
      if (config.retention) return component(id, 'BottomSheet', '挽留弹窗', { ...insets(24), gap: 16, background: config.backgroundColor ?? '#f7f7f7', presentation: 'overlay', retentionScene: true, hidden: false }, [
        text(c('title'), config.title, { fontSize: 22, fontWeight: 700, textAlign: 'center' }),
        image(c('gift'), config.imageSrc, { height: 150 }),
        component(c('timer'), 'Countdown', '倒计时', { start: config.timerStart, prefix: config.timerLabel, color: config.timerColor }),
        component(c('action'), 'Button', '领取按钮', { action: { action: 'CloseSheet' }, background: config.buttonStartColor ?? accent, ...insets(14), radius: 16 }, [text(c('action-label'), config.buttonText, { color: '#ffffff', textAlign: 'center' })]),
        component(c('cancel'), 'Button', config.cancelText, { action: { action: 'Dismiss' }, background: 'transparent', ...insets(0) }, [text(c('cancel-label'), config.cancelText, { textAlign: 'center' })]),
      ]);
      return stack(id, source.label || (source.type === 'Footer' ? '页脚' : '布局容器'), [...(!children.length && source.content ? [text(c('text'), source.content)] : []), ...children], { axis: config.axis === 'horizontal' ? 'horizontal' : 'vertical', gap: config.gap ?? 8, ...common(config), ...(source.type === 'Card' ? { background: config.backgroundColor ?? '#ffffff', radius: config.radius ?? 24, ...insets(16) } : {}) });
    }
    const value = pane && Array.isArray(config.tabContents) ? config.tabContents[pane.index] : source.content;
    result = text(id, value, { color: foreground, fontSize: /Header|Headline/.test(source.type) || source.variant === 'headline' ? 26 : source.variant === 'legal' ? 11 : 14, fontWeight: /Header|Headline/.test(source.type) || source.variant === 'headline' ? 700 : 400, textAlign: template.documentTemplate ? 'center' : config.textAlign ?? 'center', ...common(config), ...(source.textRuns ? { runs: source.textRuns } : {}) });
    if (children.length) return stack(id, source.label || '内容', [text(c('text'), value, result.props), ...children]);
    return result;
  };
  const rootNodes = (byParent.get(null) ?? []).filter((node) => !node.config?.linkedTabsId && node.type !== 'Page Background').map((node) => convert(node)).filter(Boolean);
  const background = nodes.find((node) => node.type === 'Page Background');
  const sheet = ['sku-sheet', 'payment-recovery'].includes(template.documentTemplate);
  const content = detailScreens.length ? [component('$pages', 'Flow', '付费墙与权益详情', { gap: 0 }, [component('$main', 'Screen', '特权首页', { gap: 0 }, rootNodes), ...detailScreens])] : rootNodes;
  const root = component('$screen', 'Screen', '付费墙页面', { background: dark ? '#10101c' : '#ffffff', color: foreground, gap: template.documentTemplate ? 0 : 18, ...insets(template.documentTemplate ? 0 : 20), backgroundImage: background?.config?.mediaSrc ?? '', backgroundFit: background?.config?.mediaFit ?? 'cover', ...(sheet ? { background: '#e6e6e6', paddingTop: template.documentTemplate === 'sku-sheet' ? 300 : 100 } : {}) }, content);
  const document = { version: DOCUMENT_VERSION, templateId: template.id ?? 'blank', root, products };
  return calibrate ? buildTemplateNavigationHeaders(pruneGeneratedEmptyLayouts(normalizeHtLabelSlots(calibrateTemplateVisuals(document, template, nodes)))) : document;
}
function indexDocumentId(id, suffix) { return id + suffix; }
function gradient(colors, fallback) { return Array.isArray(colors) && colors.length ? `linear-gradient(90deg, ${colors.join(', ')})` : fallback; }

export function createNativeComponent(type, id = crypto.randomUUID()) {
  if (!COMPONENT_TYPES.includes(type)) throw new Error('Unknown component type');
  if (type === 'Text') return text(id, '文字');
  if (type === 'Image' || type === 'Video') return component(id, type, '', { src: '', heightMode: 'fixed', height: 180 });
  if (type === 'Button') return component(id, type, '', { background: '#167aff', radius: 8, ...insets(12), action: { action: 'None' } }, [text(`${id}/text`, '按钮', { color: '#ffffff', textAlign: 'center' })]);
  if (type === 'Package') return component(id, type, '', { dataKey: id, group: id, radius: 8, borderWidth: 2, borderColor: '#dddddd', selectedBorder: '#167aff', ...insets(12) }, [text(`${id}/name`, '商品名称'), text(`${id}/price`, '价格', { fontWeight: 700 })]);
  const childType = { Tabs: 'Tab', TabControl: 'TabButton', Carousel: 'Slide', Timeline: 'TimelineItem', Flow: 'Screen' }[type];
  return component(id, type, '', type === 'Stack' ? { gap: 0, align: 'start' } : {}, childType ? [createNativeComponent(childType, `${id}/item-1`), createNativeComponent(childType, `${id}/item-2`)] : []);
}

export const DOCUMENT_PREFIX = 'paywall-component-document-v3:';
export function readComponentDocument(storage, templateId) {
  const raw = storage.getItem(DOCUMENT_PREFIX + templateId);
  if (!raw) return null;
  const document = JSON.parse(raw);
  if (!validDocument(document) || document.templateId !== templateId) throw new Error('已保存的组件结构无效，原数据仍然保留');
  return document;
}
export function saveComponentDocument(storage, document) {
  if (localSettingsResetting(storage)) return false;
  if (!validDocument(document)) return false;
  try { storage.setItem(DOCUMENT_PREFIX + document.templateId, JSON.stringify(document)); return true; } catch { return false; }
}

export function cloneComponent(node, idMap) {
  const ids=idMap instanceof Map?idMap:new Map();
  const collect = (entry) => { ids.set(entry.id, crypto.randomUUID()); entry.children.forEach(collect); }; collect(node);
  const actionRefs=action=>{const patch={...Object.fromEntries(['actionPage','packageId'].filter(key=>ids.has(action?.[key])).map(key=>[key,ids.get(action[key])])),...(action?.pagePackages?{pagePackages:remapPurchasePages(action.pagePackages,ids)}:{})};return Object.keys(patch).length?{action:{...action,...patch}}:{};};
  const visit = (entry) => ({ ...entry, id: ids.get(entry.id), props: { ...entry.props, ...remapButtonText(entry.props.buttonText,ids), ...(entry.props.comparisonRowId ? {comparisonRowId:ids.get(entry.props.comparisonRowId)} : {}), ...(ids.has(entry.props.target) ? { target: ids.get(entry.props.target) } : {}), ...(ids.has(entry.props.initialStepId)?{initialStepId:ids.get(entry.props.initialStepId)}:{}), ...(ids.has(entry.props.switchTarget) ? { switchTarget: ids.get(entry.props.switchTarget) } : {}), ...actionRefs(entry.props.action), ...(ids.has(entry.props.group) ? { group: ids.get(entry.props.group) } : {}), ...(entry.type === 'Package' && !ids.has(entry.props.group) ? { defaultSelected: false } : {}), ...(entry.props.visibleWhen && ids.has(entry.props.visibleWhen.id) ? { visibleWhen: { ...entry.props.visibleWhen, id: ids.get(entry.props.visibleWhen.id) } } : {}) }, children: entry.children.map(visit) });
  return visit(node);
}

export function captureNativeComponent(document, node) {
  const { nodes, parents } = indexDocument(document);
  let parentPackage = nodes.get(parents.get(node.id));
  while (parentPackage && parentPackage.type !== 'Package') parentPackage = nodes.get(parents.get(parentPackage.id));
  const visit = (entry, parentPackage) => {
    const currentPackage = entry.type === 'Package' ? entry : parentPackage;
    const { binding, dataKey, group, visibleWhen, ...props } = entry.props;
    return { ...entry, props: { ...props, ...(binding ? { text: resolveComponentText(entry, document, currentPackage) } : {}) }, children: entry.children.map((child) => visit(child, currentPackage)) };
  };
  return visit(node, parentPackage);
}
