import {createMemberComparisonButton} from './memberComparison.js';

// Editable scene composition from the three original HT Figma preview frames.
const node = (id, type, name, props = {}, children = []) => ({ id, type, name, props, children });
const stack = (id, name, children, props = {}) => node(id, 'Stack', name, { gap: 0, ...props }, children.filter(Boolean));
const text = (id, name, value, props = {}) => node(id, 'Text', name, { text: value, ...props });
const padding = (vertical, horizontal = vertical) => ({ paddingMode: 'individual', paddingTop: vertical, paddingBottom: vertical, paddingLeft: horizontal, paddingRight: horizontal });
const margin = (vertical = 0, horizontal = 0) => ({ marginMode: 'individual', marginTop: vertical, marginBottom: vertical, marginLeft: horizontal, marginRight: horizontal });
const image = (id, name, src, height, props = {}) => node(id, 'Image', name, { src, heightMode: 'fixed', height, objectFit: 'contain', ...props });
const close = (id) => node(id, 'Button', '关闭', { widthMode: 'fixed', width: 24, heightMode: 'fixed', height: 24, action: { action: 'Dismiss' }, background: 'transparent', align: 'center', justify: 'center' }, [node(`${id}/icon`, 'Icon', '关闭图标', { icon: 'tabler:outline:x', iconSize: 20 })]);
const closeRow = (id, children = [], height = 40) => stack(id, '弹层标题栏', [...children, close(`${id}/close`)], { axis: 'horizontal', justify: 'end', align: 'center', heightMode: 'fixed', height, ...padding(0, 8) });
const home = () => stack('$home', '底部安全区', [stack('$home/indicator', 'Home Indicator', [], { widthMode: 'fixed', width: 130, heightMode: 'fixed', height: 5, background: '#151515', radius: 100 })], { heightMode: 'fixed', height: 36, align: 'center', justify: 'end', paddingBottom: 7 });

export function rebuildHtTemplateScene(document, template) {
  const variant = template.documentTemplate;
  if (!['membership-plans', 'payment-recovery', 'sku-sheet'].includes(variant)) return document;
  const nodes = new Map();
  const visit = (entry) => { nodes.set(entry.id, entry); entry.children.forEach(visit); };
  visit(document.root);
  const take = (id, props = {}) => { const entry = nodes.get(id); return entry && { ...entry, props: { ...entry.props, ...props } }; };
  const member = variant === 'membership-plans', recovery = variant === 'payment-recovery';
  const products = take('products', { background: '#ffffff', radius: 16, ...padding(0), ...margin(), gap: recovery ? 12 : 0 });
  const binding = (id, label, key, field, props = {}) => text(id, label, '', { binding: { key, field }, ...props });
  products.children = products.children.map((entry, index) => {
    const key = entry.props.dataKey, row = document.products[key];
    const name = take(`products/package-${index}-name`, { fontSize: member ? 12 : recovery ? 17 : 12, fontWeight: 500, color: 'inherit' });
    const price = take(`products/package-${index}-price`, { fontSize: member ? 18 : 17, fontWeight: 700, color: 'inherit' });
    const badge = take(`products/badge-${index}`, { heightMode: 'fixed', height: recovery ? 18 : 26, minHeight: 0, widthMode: recovery ? 'fit' : 'fill', alignSelf: recovery ? 'start' : 'center', radiusMode: 'individual', radiusTopLeft: recovery ? 6 : 14, radiusTopRight: recovery ? 6 : 14, radiusBottomLeft: recovery ? 6 : 0, radiusBottomRight: recovery ? 6 : 0, ...padding(recovery ? 2 : 4, recovery ? 10 : 2) });
    const details = take(`products/detail-${index}`, { minHeight: 28, ...padding(0), gap: 0 });
    if (member && details) details.children = details.children.map((child) => ({ ...child, props: { ...child.props, selectedColor: '#2e89ff' } }));
    if (recovery) {
      const annual = index === 0;
      if(badge)badge.props={...badge.props,productField:'badgeText',height:20,radius:10,radiusMode:'uniform',background:'#ff9000'};
      name.props = {...name.props,widthMode:'fit',fontSize:16,textAlign:'left'};
      price.props = {...price.props,widthMode:'fit',textAlign:'right'};
      const reference = annual && binding(`products/reference-${index}`, '划线原价', key, 'referencePrice', {widthMode:'fit',fontSize:14,color:'#aaaaaa',strike:true});
      const identity = annual ? stack(`products/identity-${index}`, '周期与原价', [name,reference], {axis:'horizontal',align:'center',gap:6}) : name;
      const info = annual && binding(`products/package-${index}-productInfo`, '商品信息', key, 'productInfo', {fontSize:12,color:'#151515',textAlign:'left'});
      const left = stack(`products/left-${index}`, '套餐左侧信息', [identity,info], {justify:'center',gap:2});
      const right = stack(`products/right-${index}`, '标签与月均价', [annual && badge,price], {widthMode:'fit',align:'end',gap:2,justify:'center'});
      return {...entry,props:{...entry.props,priceMode:annual?'4':'0',productLabelEnabled:annual,minHeight:76,...padding(10,12),...margin(),borderWidth:1,borderColor:'transparent',selectedBorderColor:'#ff8600',selectedBorder:'#ff8600',background:'#f0f0f0',selectedBackground:'#ffebe7',color:'#151515',selectedColor:'#151515',axis:'horizontal',align:'center',gap:8},children:[left,right]};
    }
    const monthly = binding(`products/monthly-${index}`, '月均价', key, 'monthlyPrice', { fontSize: 14, color: 'inherit', textAlign: 'center' });
    const reference = binding(`products/reference-${index}`, '参考价', key, 'referencePrice', { fontSize: 14, color: '#bdbdbd', strike: true, textAlign: 'center' });
    const slots = [
      badge || stack(`products/badge-space-${index}`, '标签占位', [], { heightMode: 'fixed', height: 26 }),
      stack(`products/identity-${index}`, '名称与价格', [name, price], { gap: 2, ...padding(6, 0), minHeight: 54, justify: 'center' }),
      details,
      stack(`products/billing-${index}`, '计费信息', [member && index < 2 ? monthly : reference], { minHeight: 27, justify: 'center' }),
    ];
    return { ...entry, props: { ...entry.props, minHeight: 147, background: '#ffffff', axis: 'vertical', gap: 0, ...padding(0), ...margin(), borderWidth: 1, borderColor: 'transparent', selectedBorderWidth: 2, selectedBorderColor: member ? 'linear-gradient(90deg, #003bec, #3ed6ea, #bbff62)' : 'linear-gradient(90deg, #ff6a00, #ffaf02, #ffcc00)', radius: 16 }, children: slots.filter(Boolean) };
  });
  const purchase = take('purchase', { heightMode: 'fixed', height: 55, ...padding(0, 20), ...margin(), align: 'center', justify: 'center', gap: 0 });
  purchase.type = 'PurchaseButton';
  purchase.children = purchase.children.map((entry) => ({ ...entry, props: { ...entry.props, fontSize: 17, lineHeight: 22 / 17, fontWeight: 700 } }));
  const timer = take('timer', { fontSize: 12, minHeight: 30, ...margin(), ...padding(0), justify: 'center' });
  const children = [];
  let sheet;
  if (member) {
    const slide = take('carousel/slide-0', { gap: 0 });
    const art = stack('carousel/art', '轮播主视觉', [image('carousel/decoration', 'Figma 背景图标', '/figma-paywall-assets/member-decoration.png', 260, { decorative: true }), take('carousel/slide-image-0', { widthMode: 'fixed', width: 220, height: 260, objectFit: 'none', ...margin(), marginLeft: 85 }), closeRow('member/header')], { axis: 'overlay', background: '#e2f0ff' });
    slide.children = [art, stack('carousel/copy', '轮播文案', [take('carousel/slide-title-0', { fontSize: 20, lineHeight: 1.25, color: '#2e89ff', paddingTop: 0 }), take('carousel/slide-caption-0', { fontSize: 16, lineHeight: 1.3125, paddingTop: 0, color: '#8f8f8f' })], { gap: 4, ...padding(12, 16) })];
    const carousel = take('carousel', { background: 'linear-gradient(#e2f0ff 20%, #ffffff)', radius: 0, gap: 0, dotColor: '#dedede', activeDotColor: '#151515' });
    carousel.props.pageControlVersion = 1;
    carousel.children = [slide, node('carousel/page-control', 'PageControl', '分页控件', { gap: 8, heightMode: 'fixed', height: 16 }, [node('carousel/indicators', 'Indicators', '分页指示器', { widthMode: 'fixed', width: 8, heightMode: 'fixed', height: 8, background: '#dedede', selectedBackground: '#151515' })])];
    const heading = stack('member/plans-heading', '套餐标题', [text('member/plans-title', '标题', '选择套餐', { fontSize: 14, fontWeight: 600 }), createMemberComparisonButton(text('member/compare-label', '特权对比', '特权对比', { widthMode: 'fit', color: '#8f8f8f' }))], { axis: 'horizontal', justify: 'between', align:'center', heightMode: 'fixed', height: 24 });
    sheet = stack('member/sheet', '会员套餐半窗', [carousel, stack('member/purchase-area', '套餐与购买', [heading, products, purchase, text('member/cancel-note','取消说明','可随时取消',{fontSize:11,color:'#aaaaaa',textAlign:'center'}), take('legal', { textAlign: 'left', ...margin() }), take('links', { ...margin() })], { ...padding(16), gap: 12, background: '#f7f7f7' }), home()], { background: '#f7f7f7', radiusMode: 'individual', radiusTopLeft: 20, radiusTopRight: 20, gap: 0 });
  } else if (recovery) {
    children.push(image('recovery/backdrop', '来源页面背景', '/figma-paywall-assets/recovery-art.png', 844, { overlayColor: '#000000', overlayOpacity: 48, objectFit: 'cover' }));
    const header = closeRow('recovery/header', [], 36);
    header.type = 'Header'; header.props.justify = 'start';
    header.children[0].props = {...header.children[0].props,width:36,height:36};
    children.push(header);
    purchase.props.background='linear-gradient(90deg, #ff8600, #ffb000)';
    const renewal = text('recovery/renewal', '当前套餐续订说明', '首年 ¥{首年价}，次年按 ¥{续订价}/年自动续订，可随时取消。', {fontSize:11,lineHeight:1.35,color:'#999999',textAlign:'center'});
    const legal = take('legal', {...margin(),fontSize:10,lineHeight:1.35,textAlign:'left'});
    sheet = stack('offer-card', '支付恢复半窗', [take('headline', { fontSize: 24, lineHeight: 28 / 24, ...margin(), ...padding(0) }), take('hero-image', { ...margin() }), take('caption', { fontSize: 14, lineHeight: 20 / 14, ...margin(), ...padding(0) }), products, renewal, timer, purchase, legal, take('links', { ...margin() }), {...home(),props:{...home().props,height:24}}], { background: '#ffffff', radiusMode: 'individual', radiusTopLeft: 24, radiusTopRight: 24, ...padding(0, 20), gap: 12, minHeight: 0 });
    const hero = sheet.children.find((entry) => entry.id === 'hero-image');
    hero.children = [take('hero-image/image', { widthMode: 'fixed', width: 266.24, height: 195.52, alignSelf: 'center', objectFit: 'contain' })];
  } else {
    const header = closeRow('sku/header', [stack('sku/titles', '标题与副标题', [take('headline', { fontSize: 16, fontWeight: 500, textAlign: 'left' }), take('caption', { fontSize: 12, lineHeight: 16 / 12, textAlign: 'left' })], { gap: 0 })], 72);
    header.props.paddingLeft = 16; header.props.paddingRight = 16;
    sheet = stack('sku-card', 'SKU 半窗', [header, stack('sku/content', '优惠与套餐', [take('hero-image'), timer, products, purchase, take('legal', { textAlign: 'center', fontSize: 12, lineHeight: 16 / 12, ...margin(), ...padding(0) }), take('links', { ...margin() })], { ...padding(8, 16), gap: 12 }), home()], { background: '#f7f7f7', radiusMode: 'individual', radiusTopLeft: 24, radiusTopRight: 24, gap: 0 });
    const hero = sheet.children[1].children[0];
    hero.children = [take('hero-image/image', { height: 156, objectFit: 'contain' })];
  }
  const top = member ? 129 : recovery ? 170 : 289;
  children.push(stack('$scene', '弹层场景', [sheet], { ...padding(0), paddingTop: top, minHeight: 844 }));
  const renewalRules = recovery ? products.children.map((entry,index)=>({id:`recovery/renewal-${index}`,name:index===0?'年套餐续订说明':'月套餐续订说明',enabled:true,conditions:[{type:'sku',operator:'equals',value:document.products[entry.props.dataKey].skuId}],effects:[{target:'recovery/renewal',kind:'text',value:index===0?'首年 ¥{首年价}，次年按 ¥{续订价}/年自动续订，可随时取消。':'每月 ¥{月价} 自动续订，可随时取消。'}]})) : [];
  const annualKey=recovery?products.children[0].props.dataKey:null;
  return { ...document, ...(recovery?{products:{...document.products,[annualKey]:{...document.products[annualKey],showReferencePrice:true}},logic:{...document.logic,rules:[...document.logic?.rules??[],...renewalRules]}}:{}), htSceneVersion: 1, root: { ...document.root, props: { ...document.root.props, axis: 'overlay', background: '#8f8f8f', backgroundImage: '', ...padding(0), gap: 0 }, children } };
}
