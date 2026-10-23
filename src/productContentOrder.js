export const PRODUCT_REGIONS = {
  horizontal: [['body', '内容顺序']], standard: [['body', '内容顺序']],
  compact: [['heading', '顶部区域'], ['left', '左侧内容'], ['right', '右侧内容']],
  vertical: [['heading', '顶部区域'], ['left', '左侧内容'], ['right', '右侧内容']],
  'info-row': [['marker', '选择标记'], ['left', '名称与说明'], ['right', '价格与说明']],
};

export function contentRegions(layout, inventory, saved = {}) {
  const regions = Object.fromEntries((PRODUCT_REGIONS[layout] ?? PRODUCT_REGIONS.standard).map(([id]) => [id, []]));
  const seen = new Set();
  for (const region of Object.keys(regions)) {
    for (const part of saved[region] ?? []) {
      if (!inventory[part] || seen.has(part)) continue;
      regions[region].push(part);
      seen.add(part);
    }
  }
  Object.entries(inventory).sort(([, a], [, b]) => (a.sequence ?? 0) - (b.sequence ?? 0)).forEach(([part, info]) => {
    if (seen.has(part)) return;
    const region = regions[info.region] ? info.region : Object.keys(regions)[0];
    regions[region].push(part);
    seen.add(part);
  });
  return regions;
}

export function moveContentPart(regions, part, target, index) {
  if ((part === 'marker' && target !== 'marker') || (part !== 'marker' && target === 'marker')) return regions;
  if (!regions[target] || !Object.values(regions).some((items) => items.includes(part))) return regions;
  const next = Object.fromEntries(Object.entries(regions).map(([key, items]) => [key, items.filter((item) => item !== part)]));
  next[target].splice(Math.max(0, Math.min(index, next[target].length)), 0, part);
  return next;
}

export function contentSlot(regions, part, layout) {
  const entry = Object.entries(regions).find(([, items]) => items.includes(part));
  if (!entry) return {};
  const [region, items] = entry;
  const heading = (regions.heading?.length ?? 0);
  const column = region === 'heading' ? '1 / -1' : region === 'right' ? (layout === 'info-row' ? 3 : 2) : region === 'left' ? (layout === 'info-row' ? 2 : 1) : 1;
  if (region === 'marker') return { gridColumn: 1, gridRow: `1 / span ${Math.max(1, regions.left?.length ?? 0, regions.right?.length ?? 0)}`, alignSelf: 'center' };
  return { gridColumn: column, gridRow: region === 'heading' ? items.indexOf(part) + 1 : heading + items.indexOf(part) + 1, justifySelf: region === 'body' ? 'center' : region === 'right' ? 'end' : 'start', textAlign: region === 'body' ? 'center' : region === 'right' ? 'right' : 'left' };
}
