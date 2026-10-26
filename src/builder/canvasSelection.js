export function canvasSelectionTarget(node, selectedId, nodes, parents) {
  if (!node) return null;
  let owner = node;
  while (owner && !['Button', 'PurchaseButton', 'Package', 'Screen', 'BottomSheet'].includes(owner.type)) owner = nodes.get(parents.get(owner.id));
  const button = owner && ['Button', 'PurchaseButton', 'Package'].includes(owner.type) ? owner : null;
  return button && selectedId !== button.id && selectedId !== node.id ? button.id : node.id;
}
