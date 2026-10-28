export const PRODUCT_PARAMETERS = {
  skuDuration: { label: 'SKU时长', preview: '{SKU时长}' },
  totalPrice: { label: '总价', preview: '¥{总价}' },
  monthlyPrice: { label: '月价', preview: '¥{月价}/月', lifetime: 'totalPrice' },
  totalReferencePrice: { label: '划线总价', preview: '{总价}', strike: true },
  monthlyReferencePrice: { label: '划线月价', preview: '{月价}/月', strike: true, lifetime: 'totalReferencePrice' },
  productLabel: { label: '商品标签', preview: '{商品标签}', selectedPreview: '{选中商品标签}' },
  productInfo: { label: '商品信息', preview: '{商品信息}' },
  savings: { label: '节省比例', preview: '节省{节省比例}%', lifetime: null },
  supportingCopy: { label: '辅助文案', preview: '{辅助文案}' },
};
export const PRODUCT_PARAMETER_OPTIONS = Object.entries(PRODUCT_PARAMETERS).map(([key, value]) => [key, value.label]);
export function effectiveProductParameter(parameter, packageNode) {
  const definition = PRODUCT_PARAMETERS[parameter];
  if (!definition) return null;
  if (packageNode?.props.productType !== 'lifetime' || !('lifetime' in definition)) return parameter;
  const hasTotal = node => node.type !== 'Package' && !node.props.hidden && (node.type === 'ProductParameter' && node.props.parameter === definition.lifetime || node.children?.some(hasTotal));
  // A separate total-price element already supplies the lifetime value; never duplicate it.
  if (definition.lifetime && packageNode.children?.some(hasTotal)) return null;
  return definition.lifetime;
}
export function productParameterPreview(parameter, packageNode, selected = false) {
  const key = effectiveProductParameter(parameter, packageNode), definition = PRODUCT_PARAMETERS[key];
  if (!definition || key === 'productLabel' && packageNode?.props.productLabelEnabled === false) return '';
  return selected && definition.selectedPreview ? definition.selectedPreview : definition.preview;
}
export function parameterFromBinding(field, packageNode) {
  const mode = String(packageNode?.props.priceMode ?? '1');
  return ({ name: 'skuDuration', price: ['0', '4'].includes(mode) ? 'monthlyPrice' : 'totalPrice', reference: ['0', '3'].includes(mode) ? 'monthlyReferencePrice' : 'totalReferencePrice', monthlyPrice: 'monthlyPrice', referencePrice: 'totalReferencePrice', badgeText: 'productLabel', productInfo: 'productInfo', saveCopy: 'productInfo', savingCopy: 'savings', supportingCopy: 'supportingCopy' })[field];
}

// Only declared product bindings migrate. Arbitrary text and legacy business data stay intact.
export function upgradeProductParameters(document, inferProductType = () => 'subscription') {
  let changed = document.productParameterVersion !== 1;
  const visit = (node, owner = null) => {
    let next = node;
    if (node.type === 'Package') {
      if (!['subscription', 'lifetime'].includes(node.props.productType)) {
        changed = true;
        next = { ...node, props: { ...node.props, productType: inferProductType(document.products[node.props.dataKey] ?? {}) } };
      }
      owner = next;
    }
    const parameter = node.type === 'Text' && node.props.binding && parameterFromBinding(node.props.binding.field, owner);
    if (parameter) {
      const { binding, text, runs, ...styles } = node.props;
      next = { ...node, type: 'ProductParameter', name: '商品参数', props: { ...styles, parameter, ...(PRODUCT_PARAMETERS[parameter].strike ? { strike: true } : {}) } };
      changed = true;
    }
    const children = next.children.map(child => visit(child, owner));
    return children.some((child, index) => child !== next.children[index]) ? { ...next, children } : next;
  };
  const root = visit(document.root);
  return changed ? { ...document, root, productParameterVersion: 1 } : document;
}
