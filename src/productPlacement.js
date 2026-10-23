export function productOffset(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(-1000, Math.min(1000, parsed)) : 0;
}

export function productTranslation({ alignment, offsetX, offsetY, card, element, unitScale = 1, cssScale = 1 }) {
  const anchors = { left: card.left, center: card.left + (card.width - element.width) / 2, right: card.left + card.width - element.width };
  const alignedX = anchors[alignment] === undefined ? 0 : (anchors[alignment] - element.left) / cssScale;
  return { x: alignedX + productOffset(offsetX) * unitScale / cssScale, y: productOffset(offsetY) * unitScale / cssScale };
}
