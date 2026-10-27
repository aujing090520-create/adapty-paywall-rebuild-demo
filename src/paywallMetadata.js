export const PAYWALL_STYLE_TYPES = ['会员套餐页', '入门价格页', '注册引导免费试用页', '免费试用页', '蓝色特权页', '支付未完成页', 'SKU半窗', '赠送礼物页'];

export const freshPaywallDraft = () => ({ styleType: PAYWALL_STYLE_TYPES[0], name: '', enabled: false });

// Creation metadata never contains product rows or changes a template's SKU slots.
export function paywallMetadata(source = {}) {
  return {
    styleType: PAYWALL_STYLE_TYPES.includes(source?.styleType) ? source.styleType : PAYWALL_STYLE_TYPES[0],
    name: String(source?.name ?? '').trim(),
    enabled: source?.enabled === true,
  };
}

export function paywallMetadataError(draft) {
  if (!PAYWALL_STYLE_TYPES.includes(draft.styleType)) return '请选择 paywall 样式类型';
  if (!draft.name.trim()) return '请填写 paywall 样式名称';
  return '';
}
