import { resolveProductPrice } from '../productPricing.js';
import { productLayout } from '../products/productStyleModel.js';
import { contentRegions, PRODUCT_REGIONS } from '../productContentOrder.js';
import { linkActionFor } from '../linkActions.js';

export const LAYER_SCHEMA_VERSION = 2;
export const TYPE_NAMES = { Text: '文字', Header: '文字', Headline: '文字', Footer: '页脚', 'Hero Image': '主视觉容器', Image: '图片', 'Page Background': '页面背景', Video: '视频', Icon: '图标', Card: '卡片容器', Stack: '布局容器', 'Screen Flow': '多页面流程', Screen: '页面', 'Web Paywall Button': '网页购买按钮', Button: '按钮', 'Purchase Button': '购买按钮', List: '内容列表', 'Feature Table': '权益表格', Timeline: '时间线', 'Social Proof': '口碑展示', Award: '奖项展示', Tabs: '标签页', Toggle: '开关', Links: '链接组', Agreement: '同意协议', Timer: '倒计时', Carousel: '轮播容器', Products: '商品套餐' };
export const NATIVE_CONTAINERS = new Set(['Card', 'Stack', 'Screen', 'Screen Flow']);
Object.assign(TYPE_NAMES, { Package: '商品', Tab: '标签页面', 'Tab Button': '标签按钮', 'Tab Buttons': '标签按钮组', 'Timeline Item': '时间节点', 'Table Row': '表格行', 'Inline Segment': '协议片段', Slide: '轮播页', 'Toggle Control': '开关控件', URL: '链接地址', Rating: '评分', 'Timer Value': '时间' });

export function indexNodes(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const parent = new Map();
  const children = new Map();
  const stack = [];
  for (const node of nodes) {
    const depth = Math.max(0, node.depth ?? 0);
    const parentId = byId.has(node.parentId) ? node.parentId : depth ? stack[depth - 1] : null;
    parent.set(node.id, parentId ?? null);
    if (!children.has(parentId ?? null)) children.set(parentId ?? null, []);
    children.get(parentId ?? null).push(node);
    stack[depth] = node.id;
    stack.length = depth + 1;
  }
  return { byId, parent, children };
}

export function readPath(value, path) { return path.reduce((item, key) => item?.[key], value); }
export function writePath(value, path, next) {
  if (!path.length) return next;
  const [key, ...rest] = path;
  const copy = Array.isArray(value) || (value === undefined && Number.isInteger(key)) ? [...(value ?? [])] : { ...value };
  copy[key] = writePath(value?.[key], rest, next);
  return copy;
}

export function writeLayerField(node, binding, value) {
  if (!binding || binding.readOnly) return node;
  let base = node;
  if (binding.seed && readPath(base, binding.seed.path) === undefined) base = writePath(base, binding.seed.path, binding.seed.value);
  if (binding.codec === 'links') {
    const labels = (base.content ?? '').split(/\s*[·•]\s*/u).filter(Boolean);
    labels[binding.index] = value;
    return { ...base, content: labels.join(' · ') };
  }
  if (binding.codec === 'pipe') {
    const values = (base.content ?? '').split('|');
    values[binding.index] = value;
    return { ...base, content: values.join('|') };
  }
  return writePath(base, binding.path, value);
}

export function editLayerArray(node, operation, targetIndex, remove = false) {
  const values = [...(readPath(node, operation.path) ?? operation.seed ?? [])];
  if (operation.index < 0 || operation.index >= values.length || (remove && values.length <= 1)) return node;
  if (remove) values.splice(operation.index, 1);
  else {
    if (targetIndex < 0 || targetIndex >= values.length) return node;
    const [moving] = values.splice(operation.index, 1);
    values.splice(targetIndex, 0, moving);
  }
  return writePath(node, operation.path, values);
}

export function reparentNode(nodes, id, parentId, beforeId = null) {
  const graph = indexNodes(nodes);
  const source = graph.byId.get(id);
  const target = parentId ? graph.byId.get(parentId) : null;
  if (!source || (parentId && (!target || !NATIVE_CONTAINERS.has(target.type)))) return nodes;
  if (source.type === 'Page Background' && parentId) return nodes;
  if (target?.type === 'Screen Flow' && source.type !== 'Screen') return nodes;
  const descendantIds = new Set();
  const visit = (key) => { descendantIds.add(key); (graph.children.get(key) ?? []).forEach((child) => visit(child.id)); };
  visit(id);
  if (descendantIds.has(parentId) || descendantIds.has(beforeId)) return nodes;
  const rest = nodes.filter((node) => !descendantIds.has(node.id));
  const depth = target ? (target.depth ?? 0) + 1 : 0;
  const delta = depth - (source.depth ?? 0);
  const moved = nodes.filter((node) => descendantIds.has(node.id)).map((node) => ({ ...node, depth: (node.depth ?? 0) + delta, ...(node.id === id ? { parentId: parentId ?? undefined } : {}) }));
  let at = beforeId ? rest.findIndex((node) => node.id === beforeId && graph.parent.get(node.id) === parentId) : -1;
  if (at < 0 && target) {
    at = rest.findIndex((node) => node.id === parentId) + 1;
    while (at < rest.length && (rest[at].depth ?? 0) > (target.depth ?? 0)) at++;
  }
  if (at < 0) at = rest.length;
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}

const textTypes = /^(Text|Header|Headline|Subhead|Caption|Legal|Top Text|Title|Subtitle)( \d+)?$/;
const clip = (value) => String(value ?? '').replace(/\s+/g, ' ').slice(0, 70);

export function buildLayerTree(nodes, context = {}) {
  const graph = indexNodes(nodes);
  const linked = new Set(nodes.filter((node) => node.config?.linkedTabsId).map((node) => node.id));
  const build = (node, suffix = '', pane = null) => {
    const config = node.config ?? {};
    const baseId = node.id + suffix;
    const item = { id: baseId, ownerId: node.id, type: node.type, label: node.label || TYPE_NAMES[node.type] || node.type, children: [], native: !suffix, pane };
    const bind = (path, extra = {}) => ({ path, ...extra });
    const field = (role, type, value, binding, extra = {}) => ({ id: `${baseId}::${role}`, ownerId: node.id, type, role: extra.role ?? TYPE_NAMES[type] ?? type, label: clip(value) || TYPE_NAMES[type] || ({ URL: '链接地址', Rating: '评分', 'Timer Value': '时间' }[type]) || '内容', value, binding, pane, children: [], ...extra });
    const group = (role, type, label, children, extra = {}) => ({ id: `${baseId}::${role}`, ownerId: node.id, type, label, children: children.filter(Boolean), pane, ...extra });
    const cfg = (role, type, key, fallback = '') => field(role, type, config[key] ?? fallback, bind(['config', key]));
    const arrayRows = (rows, key, make, type = 'Stack') => rows.map((row, index) => {
      const path = ['config', ...(Array.isArray(key) ? key : [key])];
      const rowBind = (name) => bind([...path, index, name], { seed: { path, value: rows } });
      return group(`${key}-${index}`, type, row.title || row.name || row.text || `项目 ${index + 1}`, make(row, index, rowBind), { operation: { path, seed: rows, index }, rowIndex: index });
    });
    if (textTypes.test(node.type)) {
      item.label = clip(node.content) || '文字';
      if (Array.isArray(node.textRuns)) item.children = node.textRuns.map((run, index) => field(`run-${index}`, 'Text', run.text, bind(['textRuns', index, 'text'])));
      if (pane && Array.isArray(config.tabContents)) { item.label = clip(config.tabContents[pane.index]); item.binding = bind(['config', 'tabContents', pane.index]); item.value = config.tabContents[pane.index]; }
    } else if (node.type === 'Products') {
      const rows = context.productRows?.(node) ?? config.packageRows ?? [];
      const start = pane && config.linkedTabsId ? pane.index * (Number(config.groupSize) || rows.length) : 0;
      const shown = pane && config.linkedTabsId ? rows.slice(start, start + Number(config.groupSize)) : rows;
      item.children = shown.map((row, localIndex) => {
        const index = start + localIndex;
        const price = resolveProductPrice(row, context.priceMode ?? '1');
        const values = { name: row.name, price: price.main, reference: price.strike, supporting: row.showSupportingCopy && row.supportingCopy, saving: row.showSavingCopy && row.savingCopy, save: row.showSaveCopy && row.saveCopy, badge: row.showBadge && row.badgeText };
        const names = { name: '商品名称', price: '主价格', reference: '参考价', supporting: '辅助文案', saving: '优惠信息', save: 'SAVE 文案', badge: '商品角标' };
        const inventory = context.productInventory?.[node.id]?.[index];
        const layout = productLayout(config);
        const partField = (part) => field(`package-${index}-${part}`, 'Text', inventory?.[part]?.text ?? values[part], bind([], { readOnly: true }), { role: names[part] ?? '商品字段', productPart: part, rowIndex: index });
        if (inventory && Object.keys(inventory).length) {
          const sharedInventory = Object.assign({}, ...Object.values(context.productInventory[node.id]));
          const regions = contentRegions(layout, sharedInventory, config.productContentOrders?.[layout]);
          const groups = (PRODUCT_REGIONS[layout] ?? PRODUCT_REGIONS.standard).filter(([region]) => regions[region].some((part) => inventory[part])).map(([region, label]) => group(`package-${index}-${region}`, 'Stack', label, regions[region].filter((part) => inventory[part]).map((part) => ({ ...partField(part), productOrder: { layout, regions, part, region } }))));
          return group(`package-${index}`, 'Package', row.name || `商品 ${index + 1}`, groups, { rowIndex: index });
        }
        const children = Object.entries(values).filter(([, value]) => value).map(([part]) => partField(part));
        return group(`package-${index}`, 'Package', row.name || `商品 ${index + 1}`, [group(`package-${index}-content`, 'Stack', '商品内容', children)], { rowIndex: index });
      });
    } else if (node.type === 'List' || node.type === 'Timeline') {
      const privileged = node.id === 'benefits' && config.bluePrivilege;
      const reviews = config.listVariant === 'testimonials';
      const key = privileged ? 'privilegeRows' : reviews ? 'testimonialRows' : 'listRows';
      const sourceRows = privileged ? context.privilegeRows?.(node) ?? [] : reviews ? config.testimonialRows ?? [] : context.listRows?.(node) ?? config.listRows ?? [];
      const rows = pane && config.linkedTabsId ? config.tabListRows?.[pane.index] ?? sourceRows : sourceRows;
      const rowKey = pane && config.linkedTabsId ? ['tabListRows', pane.index] : key;
      const privilegeCell = (row, index, column, rb) => {
        const icon = (row[`${column}Mode`] ?? (['受限', '✓'].includes(row[column]) ? 'icon' : 'text')) === 'icon';
        return field(`benefit-${index}-${column}`, icon ? 'Icon' : 'Text', icon ? row[`${column}Icon`] ?? (column === 'standard' ? 'lock' : 'check') : row[column], rb(icon ? `${column}Icon` : column), { role: column === 'standard' ? '非会员权益' : '会员权益', iconOptions: icon ? [['lock', '锁'], ['check', '勾选']] : undefined });
      };
      item.children = arrayRows(rows, rowKey, (row, index, rb) => privileged ? [field(`benefit-${index}-name`, 'Text', row.name, rb('name')), privilegeCell(row, index, 'standard', rb), privilegeCell(row, index, 'vip', rb)] : reviews ? [field(`review-${index}-title`, 'Text', row.title, rb('title')), field(`review-${index}-quote`, 'Text', row.quote, rb('quote')), field(`review-${index}-author`, 'Text', row.author, rb('author'))] : [row.leadingMode !== 'none' && field(`row-${index}-icon`, 'Icon', node.type === 'Timeline' ? row.marker ?? 'number' : row.leading ?? 'check', rb(node.type === 'Timeline' ? 'marker' : 'leading')), field(`row-${index}-title`, 'Text', row.title, rb('title')), row.showCaption !== false && field(`row-${index}-caption`, 'Text', row.caption, rb('caption'))], node.type === 'Timeline' ? 'Timeline Item' : privileged ? 'Table Row' : 'Stack');
      item.children.forEach((row) => { row.children = row.children.filter((child) => !child.id.endsWith('-caption') || Boolean(child.value)); });
      if (privileged) item.children = item.children.slice(0, Math.max(1, Number(config.maxVisibleRows ?? rows.length) || 1));
    } else if (node.type === 'Carousel') {
      item.children = arrayRows(config.slides ?? [], 'slides', (row, index, rb) => [field(`slide-${index}-image`, 'Image', row.image, rb('image'), { rowIndex: index, area: 'media' }), field(`slide-${index}-title`, 'Text', row.title, rb('title'), { rowIndex: index, area: 'headline' }), field(`slide-${index}-caption`, 'Text', row.caption, rb('caption'), { rowIndex: index, area: 'caption' })], 'Slide');
    } else if (node.type === 'Tabs') {
      item.children = (config.tabs ?? []).map((tab, index) => {
        const tabContext = { tabsId: node.id, index };
        const linkedNodes = nodes.filter((candidate) => candidate.config?.linkedTabsId === node.id);
        const buildLinked = (candidate) => build(candidate, `@${node.id}-${index}`, tabContext);
        const buttons = (config.tabs ?? []).map((button, buttonIndex) => group(`tab-${index}-button-${buttonIndex}`, 'Tab Button', button.title, [field(`tab-${index}-button-${buttonIndex}-title`, 'Text', button.title, bind(['config', 'tabs', buttonIndex, 'title']), { pane: tabContext })], { pane: tabContext }));
        const description = tab.description ? field(`tab-${index}-description`, 'Text', tab.description, bind(['config', 'tabs', index, 'description']), { pane: tabContext }) : null;
        return group(`tab-${index}`, 'Tab', tab.title || `标签页 ${index + 1}`, [...linkedNodes.filter((candidate) => textTypes.test(candidate.type)).map(buildLinked), group(`tab-${index}-buttons`, 'Tab Buttons', '标签按钮', buttons, { pane: tabContext }), description, ...linkedNodes.filter((candidate) => !textTypes.test(candidate.type)).map(buildLinked)], { pane: tabContext });
      });
    } else if (node.type === 'Feature Table') {
      item.children = [group('columns', 'Table Row', '表头', (config.columns ?? []).map((value, index) => field(`column-${index}`, 'Text', value, bind(['config', 'columns', index])))), ...arrayRows(config.rows ?? [], 'rows', (row, index, rb) => [field(`table-${index}-name`, 'Text', row.name, rb('name')), ...(row.values ?? []).map((value, column) => field(`table-${index}-${column}`, 'Text', value, bind(['config', 'rows', index, 'values', column])))], 'Table Row')];
    } else if (node.type === 'Agreement') {
      const rows = context.agreementSegments?.(node) ?? config.segments ?? [];
      const segments = arrayRows(rows, 'segments', (row, index, rb) => [field(`segment-${index}-text`, 'Text', row.text, rb('text'))], 'Inline Segment').map((entry, index) => rows[index].type === 'link' ? { ...entry, role: '链接地址', controlType: 'URL', value: rows[index].url, binding: bind(['config', 'segments', index, 'url'], { seed: { path: ['config', 'segments'], value: rows } }) } : entry);
      item.children = [config.showCheckbox !== false && group('check', 'Toggle', '同意勾选框', []), ...segments].filter(Boolean);
    } else if (node.type === 'Links') {
      item.children = (node.content ?? '').split(/\s*[·•]\s*/u).filter(Boolean).map((text, index) => {
        const action = linkActionFor(text, config.linkActions?.[index]);
        return group(`link-${index}`, 'Button', text, [field(`link-${index}-label`, 'Text', text, { codec: 'links', index })], action.action === 'OpenURL' ? { role: '链接地址', controlType: 'URL', value: action.actionUrl ?? '', binding: bind(['config', 'linkActions', index, 'actionUrl'], { seed: { path: ['config', 'linkActions', index], value: action } }) } : {});
      });
    } else if (node.type === 'Timer') {
      item.children = [config.prefix && cfg('prefix', 'Text', 'prefix'), field('digits', 'Timer Value', node.content, bind(['content'])), config.suffix && cfg('suffix', 'Text', 'suffix')].filter(Boolean);
    } else if (node.type === 'Toggle') {
      const [title, caption] = (node.content ?? '').split('|');
      item.children = [field('title', 'Text', title, { codec: 'pipe', index: 0 }), field('caption', 'Text', caption, { codec: 'pipe', index: 1 }), group('toggle', 'Toggle Control', '开关控件', [])];
    } else if (node.type === 'Social Proof') {
      item.children = [config.leftDecorationSrc && cfg('left', 'Image', 'leftDecorationSrc'), cfg('rating', 'Rating', 'rating', 5), cfg('count', 'Text', 'count', '50,000+'), (config.caption ?? node.content) && cfg('caption', 'Text', 'caption', node.content), config.rightDecorationSrc && cfg('right', 'Image', 'rightDecorationSrc')].filter(Boolean);
    } else if (node.type === 'Award') {
      item.children = [config.leftDecorationSrc && cfg('left', 'Image', 'leftDecorationSrc'), group('copy', 'Stack', '奖项文字', [cfg('title', 'Text', 'title', node.content), config.subtitle && cfg('subtitle', 'Text', 'subtitle'), cfg('source', 'Text', 'source', '编辑推荐')]), config.rightDecorationSrc && cfg('right', 'Image', 'rightDecorationSrc')].filter(Boolean);
    } else if (['Button', 'Purchase Button', 'Web Paywall Button'].includes(node.type)) {
      item.children = [field('button-label', 'Text', node.content, bind(['content']))];
    } else if (node.type === 'Hero Image') {
      item.children = config.mediaSrc ? [cfg('media', 'Image', 'mediaSrc')] : [group('media', 'Image', '主视觉图片', [])];
      if (config.copyPrefix !== undefined || config.copyTitle !== undefined || config.copySuffix !== undefined) {
        const legacyPrefix = config.copyTitle?.startsWith('VIP') ? 'VIP' : '';
        item.children.push(group('title-combination', 'Stack', '主标题组合', [cfg('prefix', 'Text', 'copyPrefix', legacyPrefix), cfg('title', 'Text', 'copySuffix', legacyPrefix ? config.copyTitle.slice(3).trimStart() : config.copyTitle)]), cfg('caption', 'Text', 'copyCaption'));
      }
    }
    item.children.push(...(graph.children.get(node.id) ?? []).filter((child) => !linked.has(child.id)).map((child) => build(child, suffix, pane)));
    return item;
  };
  const root = { id: '$screen', type: 'Screen', label: '付费墙页面', native: false, children: (graph.children.get(null) ?? []).filter((node) => !linked.has(node.id)).map((node) => build(node)) };
  const entries = new Map();
  const visit = (item, parentId = null) => { entries.set(item.id, { ...item, parentId }); item.children.forEach((child) => visit(child, item.id)); };
  visit(root);
  return { version: LAYER_SCHEMA_VERSION, root, entries, graph };
}
