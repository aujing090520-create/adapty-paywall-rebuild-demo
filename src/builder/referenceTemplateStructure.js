// Boundaries read from the live template trees, not inferred from visual position.
// This runs only when creating/reapplying defaults; saved drafts are not reparented.
export const REFERENCE_STRUCTURE_VERSION = 1;
export const REFERENCE_FOOTER_PARTS = {
  2: ['products', 'action', 'links'], 3: ['products', 'action', 'links'],
  5: ['products', 'action', 'links'], 6: ['products', 'action', 'links'],
  7: ['switch', 'links'], 8: ['switch', 'links'], 9: ['switch', 'links'],
  11: ['products', 'action', 'links'], 12: ['action', 'links'],
  13: ['products', 'action', 'web-action', 'links'], 14: ['products', 'action', 'web-action', 'links'],
  15: ['action', 'web-action', 'products', 'links'], 16: ['action', 'products', 'links'],
  18: ['action', 'after-action-0', 'links'], 19: ['products', 'action', 'links'],
  20: ['products', 'action', 'links'], 21: ['products', 'action', 'links'],
  22: ['products', 'action', 'links'], 23: ['action', 'after-action-0', 'links'],
  24: ['action', 'links'], 25: ['products', 'action', 'links'],
  26: ['products', 'action', 'links'], 27: ['action', 'links'],
  28: ['title', 'copy-1', 'products', 'action', 'links'],
  29: ['products', 'copy-0', 'action', 'links'],
  30: ['title', 'copy-0', 'features', 'products', 'action', 'links'],
  31: ['products', 'action', 'links'], 33: ['products', 'action', 'links'],
  34: ['action', 'links'], 39: ['products', 'action', 'links'],
};
const NAVIGATION = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 28, 31, 32, 33, 34, 35, 36, 39]);
const MEDIA_NAVIGATION = new Set([7, 8, 13, 15, 16, 31, 32, 33, 34]);
const node = (id, type, children = [], props = {}, name = '') => ({ id, type, name: name || ({ Stack: '布局容器', Text: '文字', Icon: '图标' })[type] || type, props, children });
const group = (id, children, props = {}) => node(id, 'Stack', children, { axis: 'vertical', gap: 18, ...props });
const walk = (root, transform) => transform({ ...root, children: root.children.map((child) => walk(child, transform)) });
const clone = (root, suffix) => walk(root, (entry) => ({ ...entry, id: `${entry.id}${suffix}`, props: { ...entry.props } }));

function closeRow(prefix, color) {
  const icon = node(`${prefix}/icon`, 'Icon', [], { icon: 'tabler:outline:x', iconSize: 20, color, widthMode: 'fixed', width: 20, heightMode: 'fixed', height: 20 }, '图标');
  const button = node(`${prefix}/button`, 'Button', [icon], { action: { action: 'Dismiss' }, widthMode: 'fixed', width: 32, heightMode: 'fixed', height: 32, align: 'center', justify: 'center', background: 'transparent', paddingVertical: 6, paddingHorizontal: 6 }, '关闭');
  return group(prefix, [button], { navigationRow: true, axis: 'overlay', overlayAlignment: 'top-right', gap: 0, paddingVertical: 8, paddingHorizontal: 8 });
}

function addNavigation(screen, prefix, { media = false, fixed = false } = {}) {
  const row = closeRow(`${prefix}-navigation`, screen.props.color ?? '#171717');
  if (fixed) return { ...screen, children: [node(`${prefix}-header`, 'Header', [row], { background: 'transparent', gap: 0, shadowOpacity: 0 }, '页头'), ...screen.children] };
  if (media) {
    let inserted = false;
    const next = walk(screen, (entry) => {
      if (!inserted && entry.id === `${prefix}-image`) {
        inserted = true;
        return group(`${prefix}-hero`, [row, entry], { axis: 'overlay', gap: 0 });
      }
      return entry;
    });
    if (inserted) return next;
  }
  return { ...screen, children: [row, ...screen.children] };
}

function groupFooter(screen, prefix, parts, footerId = `${prefix}-footer`) {
  const wanted = parts.map((part) => `${prefix}-${part}`);
  const selected = wanted.map((id) => screen.children.find((child) => child.id === id)).filter(Boolean);
  if (!selected.length) return screen;
  const content = selected.map((entry) => entry.props.summaryPackage ? entry.children[0] : entry);
  return { ...screen, children: [...screen.children.filter((child) => !wanted.includes(child.id)), node(footerId, 'Footer', content, { axis: 'vertical', gap: screen.props.gap ?? 18, background: 'transparent', shadowOpacity: 0 }, '页脚')] };
}

function copyPackage(screen, prefix, copyParts, priceSummary) {
  const productGroup = screen.children.find((entry) => entry.id === `${prefix}-products`);
  const product = productGroup?.children.find((entry) => entry.type === 'Package');
  if (!product) return screen;
  const ids = copyParts.map((part) => `${prefix}-${part}`);
  let copy = ids.map((id) => screen.children.find((entry) => entry.id === id)).filter(Boolean);
  if (priceSummary) copy = [
    node(`${prefix}-reference-price`, 'Text', [], { text: priceSummary.sourceComparePrice, strike: true, color: '#999999', textAlign: 'center' }),
    node(`${prefix}-current-price`, 'Text', [], { text: priceSummary.sourceCurrentPrice, textAlign: 'center', fontWeight: 700 }),
  ];
  if (!copy.length) return screen;
  const nextProduct = { ...product, children: copy, props: { ...product.props, axis: 'vertical', hidden: false, background: 'transparent', selectedBackground: 'transparent', borderWidth: 0, selectedBorder: 'transparent', minHeight: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } };
  return { ...screen, children: screen.children.filter((entry) => !ids.includes(entry.id)).map((entry) => entry === productGroup ? { ...entry, props: { ...entry.props, hidden: false, summaryPackage: true, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }, children: [nextProduct] } : entry) };
}

function stateSwitch(screen, prefix, order, sources) {
  const toggle = screen.children.find((entry) => entry.id === `${prefix}-toggle`);
  const products = screen.children.find((entry) => entry.id === `${prefix}-products`);
  const action = screen.children.find((entry) => entry.id === `${prefix}-action`);
  if (!toggle || !products || !action) return screen;
  const switchId = `${prefix}-switch`;
  const legacyControl = `${prefix}-toggle/control`;
  const config = sources.find((entry) => entry.id === `${prefix}-toggle`)?.config ?? {};
  const actionConfig = sources.find((entry) => entry.id === `${prefix}-action`)?.config ?? {};
  const states = [0, 1].map((index) => {
    const suffix = index ? '/on' : '';
    const row = index ? clone(toggle, suffix) : toggle;
    const controlRow = walk(row, (entry) => entry.type === 'Toggle'
      ? { ...entry, props: { switchTarget: switchId, switchControl: true, thumbColor: '#ffffff', trackColor: index ? '#34c759' : '#e5e5ea' } }
      : index && config.onContent && entry.id === `${prefix}-toggle/title${suffix}` ? { ...entry, props: { ...entry.props, text: config.onContent } } : entry);
    const selected = order === 9 ? products.children.map((entry) => index ? clone(entry, suffix) : entry) : products.children.slice(index * 2, index * 2 + 2);
    const packageContent = selected.map((entry) => ({ ...entry, props: { ...entry.props, group: `${switchId}/${index}`, visibleWhen: undefined } }));
    const packageGroup = { ...products, id: `${products.id}/state-${index}`, props: { ...products.props, hidden: false }, children: packageContent };
    let purchase = index ? clone(action, suffix) : action;
    if (index && actionConfig.onContent) purchase = walk(purchase, (entry) => entry.type === 'Text' && entry.id === `${action.id}/label${suffix}` ? { ...entry, props: { ...entry.props, text: actionConfig.onContent } } : entry);
    const stateCopy = order === 9 ? screen.children.filter((entry) => entry.id === `${prefix}-copy-1`).map((entry) => index ? clone(entry, suffix) : entry) : [];
    return node(`${switchId}/${index ? 'on' : 'off'}`, 'SwitchCase', order === 9 ? [packageGroup, ...stateCopy, controlRow, purchase] : [controlRow, packageGroup, purchase], { index, axis: 'vertical', gap: 12 }, index ? '开启内容' : '关闭内容');
  });
  const remove = new Set([toggle.id, products.id, action.id, ...(order === 9 ? [`${prefix}-copy-1`] : [])]);
  const result = { ...screen, children: [...screen.children.filter((entry) => !remove.has(entry.id)), node(switchId, 'Switch', states, { defaultIndex: toggle.children.find((entry) => entry.id === legacyControl)?.props.initial ? 1 : 0 }, '开关')] };
  return result;
}

function rebuildFeatureStructure(screen, prefix, order, sources) {
  if (![27, 29].includes(order)) return screen;
  const config = sources.find((entry) => entry.id === `${prefix}-table`)?.config;
  if (!config) return screen;
  return walk(screen, (table) => {
    if (table.id !== `${prefix}-table`) return table;
    const header = table.children[0];
    const rows = table.children.slice(1);
    if (order === 27) return { ...table, props: { ...table.props, background: 'transparent', gap: 16 }, children: [
      { ...header.children[0], props: { ...header.children[0].props, text: config.title } },
      ...rows.map((row, index) => group(row.id, [
        node(`${row.id}/icon`, 'Icon', [], { icon: `tabler:outline:${config.rows[index].icon}`, iconSize: 24, color: config.accentColor }, '图标'),
        group(`${row.id}/copy`, row.children, { gap: 4 }),
      ], { axis: 'horizontal', gap: 16, align: 'start' })),
    ] };
    const columns = [0, 1, 2].map((column) => group(`${table.id}/column-${column}`, [
      column === 0 ? node(`${table.id}/feature-heading`, 'Text', [], { text: config.firstColumnLabel, fontWeight: 700 }) : header.children[column - 1],
      ...rows.map((row) => {
        const cell = row.children[column];
        if (column === 0) return { ...cell, props: { ...cell.props, heightMode: 'fixed', height: 44 } };
        return group(`${cell.id}/cell`, [node(cell.id, 'Icon', [], { icon: cell.props.text === '✓' ? 'tabler:outline:check' : 'tabler:outline:x', iconSize: 20, color: column === 2 ? '#171717' : '#777777' }, '图标')], { heightMode: 'fixed', height: 44, align: 'center', justify: 'center' });
      }),
    ], { gap: 8, flexGrow: column === 0 ? 2 : 1 }));
    return { ...table, props: { ...table.props, axis: 'horizontal', gap: 8 }, children: columns };
  });
}

export function rebuildReferenceTemplateStructure(document, template, sources) {
  const order = template.sourceOrder;
  if (!order || order === 38 || document.referenceStructureVersion === REFERENCE_STRUCTURE_VERSION) return document;
  const prefix = template.id;
  let screen = document.root;
  if (order === 1) {
    screen = walk(screen, (entry) => {
      if (entry.type !== 'Screen' || entry.id === '$screen') return entry;
      const at = Number(entry.id.match(/screen-(\d+)$/)?.[1]);
      let next = at === 3 ? addNavigation(entry, `${prefix}-screen-3`, { media: true }) : entry;
      return groupFooter(next, prefix, at === 1 ? ['screen-1-proof', 'screen-1-next'] : at === 2 ? ['screen-2-copy', 'screen-2-next'] : ['products', 'screen-3-action', 'links'], `${entry.id}-footer`);
    });
  } else {
    // Single-SKU packages often own only renewal/price copy, not a selectable card.
    const copyParts = { 2: ['copy-1'], 3: ['copy-2'], 9: ['copy-0'], 15: ['after-action-0'], 16: ['after-action-0'], 26: ['copy-0'], 29: ['copy-0'], 39: ['copy-2'] }[order];
    if (copyParts || [5, 6].includes(order)) screen = copyPackage(screen, prefix, copyParts ?? [], [5, 6].includes(order) ? sources.find((entry) => entry.id === `${prefix}-products`)?.config : null);
    if ([7, 8, 9].includes(order)) screen = stateSwitch(screen, prefix, order, sources);
    screen = rebuildFeatureStructure(screen, prefix, order, sources);
    if (order === 30) {
      const media = screen.children.find((entry) => entry.id === `${prefix}-image`);
      if (media) screen = { ...screen, props: { ...screen.props, backgroundImage: media.props.src, backgroundFit: 'cover' }, children: screen.children.filter((entry) => entry !== media) };
    }
    // Replace the old decorative multiplication-sign Text with a real action/icon.
    screen = walk(screen, (entry) => ({ ...entry, children: entry.children.filter((child) => child.id !== `${prefix}-dismiss`) }));
    if (NAVIGATION.has(order)) screen = addNavigation(screen, prefix, { media: MEDIA_NAVIGATION.has(order) || [5, 28].includes(order), fixed: order === 4 });
    if (order === 28) {
      const badge = screen.children.find((entry) => entry.id === `${prefix}-copy-0`);
      screen = walk({ ...screen, children: screen.children.filter((entry) => entry !== badge) }, (entry) => {
        if (entry.id !== `${prefix}-hero`) return entry;
        return { ...entry, children: [...entry.children.map((child) => child.type === 'Image' ? { ...child, props: { ...child.props, heightMode: 'fixed', height: 300 } } : child), ...(badge ? [{ ...badge, props: { ...badge.props, alignSelf: 'end', marginBottom: 16 } }] : [])] };
      });
    }
    if (REFERENCE_FOOTER_PARTS[order]) screen = groupFooter(screen, prefix, REFERENCE_FOOTER_PARTS[order]);
  }
  screen = walk(screen, (entry) => entry.type === 'Package' && entry.props.background === '#f5f5f5' && !entry.props.color
    ? { ...entry, props: { ...entry.props, color: '#171717', selectedColor: '#171717' } } : entry);
  return { ...document, root: screen, referenceStructureVersion: REFERENCE_STRUCTURE_VERSION };
}
