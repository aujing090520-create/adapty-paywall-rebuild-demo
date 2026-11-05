const lifetimeLegal = '一次性付费，永久享有当前套餐权益，不会产生后续订阅扣费。有关详细信息，请查看服务条款及隐私政策。';
const platformCopy = value => value
  .replace(/iTunes\s*商店的设置界面/g, 'Google Play 的订阅设置')
  .replace(/iTunes\s*账户/g, 'Google Play 账户')
  .replace(/App Store/g, 'Google Play');

const defaults = {
  'ht-blue-privilege': {
    legal: '如果当前缴费期前 24 小时没有取消续订，系统会自动续订，费用将从你的 iTunes 账户收取，你可随时前往 iTunes 商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的服务条款 · 隐私政策',
  },
  'ht-membership-plans': {
    legal: '如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的iTunes账户收取，你可随时前往iTunes商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的服务条款及隐私政策。',
    'member/cancel-note': '可随时取消',
  },
  'ht-payment-recovery': {
    legal: '如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的iTunes账户收取，你可随时前往iTunes商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的服务条款及隐私政策。',
  },
  'ht-sku-sheet': {
    legal: '订阅会在当前周期结束前 24 小时自动续订，可随时在账户设置中取消。',
  },
  'ht-vip-tiers': Object.fromEntries(['vip','plus'].map(tier => [`tiers/${tier}/legal/text`, '如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的账户收取。可随时前往账户设置管理订阅。'])),
  'ht-free-trial': {
    'trial/cancel-note': '订阅可随时取消，无需支付任何费用',
  },
};

// Migrate only shipped defaults; authored copy, translations and existing rules remain owned by the user.
export function upgradeTemplateBilling(document) {
  const configured = defaults[document.templateId];
  if (!configured || document.billingContentVersion === 1) return document;
  const nodes = new Map();
  const visit = node => { nodes.set(node.id,node); node.children.forEach(visit); };
  visit(document.root);
  const existing = document.logic?.rules ?? [], additions = [];
  const condition = (type,value) => ({type,operator:'equals',value});
  const rule = (id,name,conditions,target,value) => ({id,name,enabled:true,conditions,effects:[{target,kind:'text',value}]});
  for (const [id,value] of Object.entries(configured)) {
    const node = nodes.get(id);
    const shippedBlueRuns = document.templateId === 'ht-blue-privilege' && id === 'legal' &&
      JSON.stringify(node?.props.runs) === JSON.stringify([
        {text:value.slice(0,value.indexOf('服务条款'))}, {text:'服务条款',link:''}, {text:' · '}, {text:'隐私政策',link:''},
      ]);
    if (node?.type !== 'Text' || node.props.text !== value || node.props.runs?.length && !shippedBlueRuns || node.props.binding) continue;
    if (Object.values(document.localization?.translations ?? {}).some(locale => locale[id]?.text)) continue;
    const overrides = existing.filter(item => item.effects?.some(effect => effect.target === id && effect.kind === 'text'));
    if (overrides.length) {
      // The trial's existing page-specific cancellation copy keeps its page condition.
      if (document.templateId === 'ht-free-trial' && overrides.every(item => item.id === '确认套餐页提示')) {
        for (const source of overrides) for (const effect of source.effects.filter(effect => effect.target === id && effect.value === '可随时在App Store取消')) {
          additions.push(rule(`billing/${id}/android`, 'Android 取消订阅说明', [...source.conditions,condition('platform','android')], id,platformCopy(effect.value)));
        }
      }
      continue;
    }
    additions.push(rule(`billing/${id}/lifetime`, '一次性付费说明', [condition('billingType','lifetime')], id, id.endsWith('cancel-note') ? '一次性付费，永久权益' : lifetimeLegal));
    const android = platformCopy(value);
    if (android !== value) additions.push(rule(`billing/${id}/android`, 'Android 订阅说明', [condition('billingType','subscription'),condition('platform','android')], id,android));
  }
  return {...document,billingContentVersion:1,...(additions.length ? {logic:{...document.logic,rules:[...existing,...additions]}} : {})};
}
