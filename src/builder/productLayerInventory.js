export function collectProductLayerInventory(root) {
  const result = {};
  root.querySelectorAll('[data-product-card]').forEach((card) => {
    const layout = card.dataset.productLayout ?? 'compact';
    const frame = card.getBoundingClientRect();
    const parts = {};
    card.querySelectorAll('[data-inspector-area^="product-"]').forEach((element) => {
      const part = element.dataset.inspectorArea.slice(8);
      if (parts[part] || !element.getClientRects().length) return;
      const box = element.getBoundingClientRect();
      const region = ['horizontal', 'standard'].includes(layout) ? 'body' : part === 'marker' ? 'marker' : part === 'badge' && layout !== 'info-row' ? 'heading' : element.closest('.ht-info-row-main, .ht-vertical-main, .ht-split-summary-copy') || element.classList.contains('ht-compact-name') ? 'left' : 'right';
      parts[part] = { region, sequence: Math.round(box.top - frame.top) * 10000 + Math.round(box.left - frame.left), text: element.textContent };
    });
    (result[card.dataset.productNodeId] ??= {})[card.dataset.productIndex] = parts;
  });
  return result;
}
