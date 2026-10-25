import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component, componentProps, indexDocument, updateComponent, saveComponentDocument, readComponentDocument, COMPONENT_TYPES, cloneComponent, resolveComponentText } from '../src/builder/componentDocument.js';
import { DEMO_SKUS } from '../src/productPricing.js';
import { copyStyles, pasteStyles, patchComponentProperties, togglePageControl } from '../src/builder/componentOperations.js';
import { createCatalogComponent, upgradeCanonicalComponents } from '../src/builder/componentCatalog.js';
import { countdownSeconds, defaultPackagePatch } from '../src/builder/propertyModel.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, validDocument } from '../src/builder/componentDocument.js';
import {workflowEdges} from '../src/builder/workflow.js';

let server, Properties, Preview, Editor;
const mounted = new Set();
before(async () => {
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null } });
  Properties = (await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;
  Preview = (await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;
  Editor = (await server.ssrLoadModule('/src/builder/ComponentEditor.jsx')).default;
});
after(async () => { for (const renderer of mounted) await act(async () => renderer.unmount()); await server?.close(); });
const event = (value) => ({ target: { value }, stopPropagation() {}, preventDefault() {} });
const fixture = (node) => ({ version: 3, templateId: 'audit', products: { sample: { name: '年度', price: '¥100', billingMonths: 12 } }, root: component('page', 'Screen', '页面', {}, [node]) });

async function mount(node, { editing = true, source } = {}) {
  let latest, status;
  function Harness() {
    const [document, setDocument] = React.useState(source ?? fixture(node));
    const [navigation, setNavigation] = React.useState({});
    const selected = indexDocument(document).nodes.get(node.id);
    const { nodes, parents } = indexDocument(document);
    latest = document;
    const patch = (props) => setDocument((current) => patchComponentProperties(current, node.id, props));
    return React.createElement(React.Fragment, null,
      React.createElement(Properties, { selected, p: componentProps(selected), patch, document, nodes, parents, navigation, setNavigation, onStatus: (value) => { status = value; }, demoSkus: DEMO_SKUS, fieldNames: { name: '商品名称', price: '主价格' }, findPackage: () => null, resolveText: resolveComponentText, changeProduct: (key, value) => setDocument((current) => ({ ...current, products: { ...current.products, [selected.props.dataKey ?? selected.id]: { ...current.products[selected.props.dataKey ?? selected.id], [key]: value } } })), onMediaType: (type) => setDocument((current) => updateComponent(current, node.id, { type })), setDefaultPackage: (defaultSelected) => patch({ defaultSelected }) }),
      React.createElement(Preview, { document, selectedId: node.id, onSelect() {}, editing, navigation, onStatus: (value) => { status = value; } }),
    );
  }
  let renderer;
  await act(async () => { renderer = TestRenderer.create(React.createElement(Harness)); });
  mounted.add(renderer);
  const fields = (name, tag) => renderer.root.findAll((item) => typeof item.type === 'string' && (!tag || item.type === tag) && item.props['aria-label'] === name);
  return {
    renderer, document: () => latest, status: () => status,
    node: (id = node.id) => renderer.root.findAll((item) => item.type === 'div' && item.props['data-component-id'] === id)[0],
    async change(name, value, tag = 'input') { if(['文字内容','徽标文字'].includes(name)){const rich=renderer.root.findAll(item=>typeof item.type==='function'&&item.props['aria-label']===name&&typeof item.props.onChange==='function')[0];if(rich){await act(async()=>rich.props.onChange({text:value,runs:null}));return;}} const input = fields(name, tag)[0] ?? renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === name))[0]?.findAllByType(tag)[0]; assert.ok(input, `缺少字段 ${name}`); await act(async () => input.props.onChange(event(value))); },
    async editText(values,name='文字内容') {const rich=renderer.root.findAll(item=>typeof item.type==='function'&&item.props['aria-label']===name&&typeof item.props.onChange==='function')[0];assert.ok(rich);await act(async()=>rich.props.onChange(values));},
    async click(name) { const button = fields(name, 'button')[0] ?? renderer.root.findAll((item) => item.type === 'button' && item.children.join('') === name)[0]; assert.ok(button, `缺少按钮 ${name}`); await act(async () => button.props.onClick(event())); },
    async segment(label, choice) { const field = renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === label))[0]; assert.ok(field, `缺少分段 ${label}`); await act(async () => field.findAllByType('button').find((item) => item.props['aria-label'] === choice).props.onClick()); },
    async optional(title) { const section = renderer.root.findAll((item) => item.type === 'section' && item.findAllByType('strong').some((child) => child.children.join('') === title))[0]; assert.ok(section, `缺少模块 ${title}`); await act(async () => section.findAllByType('button').find((item) => item.props.className?.includes('rc-optional-toggle')).props.onClick()); },
    async select(name, value) { const input = fields(name, 'select')[0]; assert.ok(input, `缺少选择 ${name}`); assert.ok(input.findAllByType('option').some((option)=>String(option.props.value)===String(value)),`选项不存在 ${name}:${value}`); await act(async () => input.props.onChange(event(value))); },
    async check(name, checked) { const input=fields(name,'input')[0];assert.ok(input,`缺少复选框 ${name}`);assert.equal(input.props.type,'checkbox');assert.ok(!input.props.disabled,`复选框已禁用 ${name}`);await act(async()=>input.props.onChange({target:{checked}})); },
    async limit(axis, bound) { await this.click(`添加${axis}约束`); await this.click(`添加${bound}${axis}`); },
    async close() { await act(async () => renderer.unmount()); mounted.delete(renderer); },
  };
}

for (const type of COMPONENT_TYPES.filter((type) => !['Timeline', 'TimelineItem', 'Carousel', 'PageControl', 'Indicators','Wallet','Countdown','Custom'].includes(type))) {
  test(`${type}: configuration size, spacing, border and persistence map to the live component`, async () => {
    const node = type === 'BottomSheet' ? component('sample', 'BottomSheet', '底部弹层') : createCatalogComponent(type, 'sample');
    assert.equal(node.type, type);
    if (node.props.presentation) delete node.props.presentation;
    node.props.hidden = false;
    if (type === 'Text') node.props.text = '文字';
    const h = await mount(node);
    if(type === 'Icon') await h.optional('图标背景');
    if(!['Text','Screen'].includes(type)) {
    if(type !== 'Icon') {
    await h.select(['Image','Video'].includes(type) ? '遮罩' : '形状', 'rectangle');
    }
    await h.change('圆角', '9');
    assert.equal(h.node().props.style.borderRadius, 9);
    if (['Image','Video'].includes(type)) { await h.select('遮罩', 'circle'); assert.equal(h.node().props.style.borderRadius, '50%'); await h.select('遮罩', 'rectangle'); }
    else if(type !== 'Icon') { await h.select('形状', 'pill'); assert.equal(h.node().props.style.borderRadius, 999); await h.select('形状', 'rectangle'); }
    }
    if(type !== 'Icon') await h.segment('宽度', '固定'); await h.change(type === 'Icon' ? '宽度' : '固定宽度', '120');
    assert.equal(h.node().props.style.width, '120px');
    if(type !== 'Icon') await h.segment('高度', '固定'); await h.change(type === 'Icon' ? '高度' : '固定高度', '80');
    assert.equal(h.node().props.style.height, '80px');
    if(type !== 'Icon') {
    if(type !== 'Screen') {
    if(h.renderer.root.findAll((item)=>item.type==='button'&&item.props['aria-label']==='外边距切换为轴向配置').length)await h.click('外边距切换为轴向配置');
    await h.segment('宽度', '填满'); await h.limit('宽度', '最小'); await h.limit('宽度', '最大'); await h.change('最小宽度', '20'); await h.change('最大宽度', '180');
    assert.equal(h.node().props.style.minWidth, 20); assert.equal(h.node().props.style.maxWidth, 180);
    }
    await h.segment('高度', '填满'); await h.limit('高度', '最小'); await h.limit('高度', '最大'); await h.change('最小高度', '30'); await h.change('最大高度', '160');
    assert.equal(h.node().props.style.minHeight, 30); assert.equal(h.node().props.style.maxHeight, 160);
    }
    await h.change('内边距纵向', '7');
    await h.change('内边距横向', '11');
    assert.equal(h.node().props.style.padding, '7px 11px');
    await h.click('内边距切换为四边配置');
    await h.change('内边距上', '13');
    assert.equal(h.node().props.style.padding, '13px 11px 7px 11px');
    await h.click('内边距切换为轴向配置');
    assert.equal(h.node().props.style.padding, '13px 11px');
    if(type !== 'Screen') {
    await h.change('外边距纵向', '-7'); await h.change('外边距横向', '9');
    assert.equal(h.node().props.style.margin, '-7px 9px');
    await h.click('外边距切换为四边配置'); await h.change('外边距右', '14');
    assert.equal(h.node().props.style.margin, '-7px 14px -7px 9px');
    await h.click('外边距切换为轴向配置'); assert.equal(h.node().props.style.margin, '-7px 14px');
    }
    if(!['Text','Screen'].includes(type)) {
    assert.equal(h.renderer.root.findAll((item) => item.type === 'input' && item.props['aria-label'] === '透明度').length, 0);
    if (!Number(indexDocument(h.document()).nodes.get('sample').props.borderWidth)) await h.optional('边框');
    await h.change('边框宽度', '3'); await h.change('边框颜色值', '#456789');
    assert.equal(h.node().props.style.border, '3px solid #456789');
    await h.optional('边框'); assert.equal(h.node().props.style.border, undefined);
    {
    if(!node.props.shadowBlur&&!node.props.shadowX&&!node.props.shadowY)await h.optional('阴影'); await h.change('X 偏移', '-4'); await h.change('Y 偏移', '6'); await h.change('模糊', '12'); await h.change('阴影颜色值', '#123456');
    assert.equal(h.node().props.style.boxShadow, '-4px 6px 12px color-mix(in srgb, #123456 20%, transparent)');
    await h.optional('阴影'); assert.equal(h.node().props.style.boxShadow, undefined);
    }
    }
    const store = new Map();
    const storage = { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
    assert.ok(saveComponentDocument(storage, h.document()));
    assert.deepEqual(readComponentDocument(storage, 'audit'), h.document());
    await h.close();
  });
}

test('text: global style fields and rich editor updates reach preview without fragment forms', async () => {
  const node = component('sample', 'Text', '文字', { text: '甲乙', runs: [{ text: '甲', color: '#ff0000', fontSize: 30, fontWeight: 800 }, { text: '乙' }], fontWeight: 700 });
  const h = await mount(node);
  await h.change('字号', '19');
  await h.change('文字颜色值', '#123456');
  assert.ok(indexDocument(h.document()).nodes.get('sample').props.runs.every((run) => run.fontSize === 19 && run.color === '#123456'));
  const runs=indexDocument(h.document()).nodes.get('sample').props.runs.map((run,index)=>({...run,text:index===0?'丙':run.text,bold:false,fontWeight:400,underline:true,strikethrough:true}));
  await h.editText({text:'丙乙',runs});
  assert.ok(h.node().findAllByType('span').every(span=>span.props.style.fontWeight===400&&span.props.style.textDecoration.includes('underline')&&span.props.style.textDecoration.includes('line-through')));
  assert.equal(h.renderer.root.findAll(item=>item.props['aria-label']==='片段 1').length,0);
  assert.equal(resolveComponentText(indexDocument(h.document()).nodes.get('sample'), h.document()), '丙乙');
  await h.close();
});

test('new text uses observed source defaults without rewriting an existing component',()=>{
  const fresh=createCatalogComponent('Text','fresh');
  assert.equal(fresh.props.widthMode,'fit');assert.equal(fresh.props.heightMode,'fit');assert.equal(fresh.props.fontSize,14);assert.equal(fresh.props.color,'#000000');
  const previous=component('old','Text','旧模板',{fontSize:32,color:'#ffb400',widthMode:'fill'});assert.equal(previous.props.fontSize,32);assert.equal(previous.props.widthMode,'fill');
});

test('rich text links render real safe anchors, remain inert while editing and retain neighboring text',async()=>{
  const h=await mount(component('sample','Text','链接',{runs:[{text:'条款',link:'https://example.com/terms'},{text:'其余',link:'javascript:alert(1)'}]}));
  const link=h.node().findByType('a');assert.equal(link.props.href,'https://example.com/terms');assert.equal(link.props.rel,'noopener noreferrer');assert.equal(link.props.tabIndex,-1);
  let prevented=false;link.props.onClick({preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(h.node().findAllByType('a').length,1);assert.equal(h.node().findByType('span').children[0],'其余');await h.close();
});

test('package: selected style uses the same field set and can remove the default border and shadow', async () => {
  const node = createCatalogComponent('Package', 'sample');
  node.props.borderColor = '#111111'; node.props.shadowBlur = 8;
  const h = await mount(node);
  await h.click('选中');
  await h.change('边框颜色值', '#abcdef');
  await h.change('边框颜色不透明度', '40');
  assert.match(h.node().props.style.border, /#abcdef/);
  assert.equal(h.node().props.style.opacity, 1);
  assert.match(h.node().props.style.border, /40%/);
  assert.equal(h.node().props['data-axis'], 'vertical');
  await h.click('横向');
  assert.equal(h.node().props['data-axis'], 'horizontal');
  const selectedProps = indexDocument(h.document()).nodes.get('sample').props;
  assert.equal(selectedProps.selectedAxis, 'horizontal');
  assert.equal(selectedProps.axis, undefined);
  await h.optional('边框'); await h.optional('阴影');
  assert.equal(h.node().props.style.border, undefined); assert.equal(h.node().props.style.boxShadow, undefined);
  await h.click('默认'); assert.match(h.node().props.style.border, /#111111/); assert.match(h.node().props.style.boxShadow, /8px/);
  await h.close();
});

test('fill: changing type hides stale images, background fit maps to valid CSS, video fill renders a video', async () => {
  const h = await mount(component('sample', 'Stack', '容器', { backgroundImage: '/old.png' }));
  assert.ok(h.node().props.style.backgroundImage.includes('/old.png'));
  await h.select('形状', 'rectangle');
  const group = h.renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === '背景类型'))[0];
  await act(async () => group.findAllByType('button')[0].props.onClick());
  assert.equal(h.node().props.style.backgroundImage, undefined);
  await act(async () => group.findAllByType('button')[2].props.onClick());
  const address = h.renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === '素材地址'))[0];
  await act(async () => address.findByType('input').props.onChange(event('/background.mp4')));
  assert.equal(h.renderer.root.findAll((item) => item.type === 'video' && item.props['data-background-video']).length, 1);
  await h.close();
});

test('carousel: automatic advance, loop and manual page changes execute in interaction preview', async () => {
  const node = createCatalogComponent('Carousel', 'sample');
  node.props = { ...node.props, autoPlay: true, autoPlayInterval: 250, loop: false };
  const h = await mount(node, { editing: false });
  assert.ok(h.node('sample/slide-0'));
  const active = (renderer) => renderer.root.findAll((item) => item.type === 'div' && item.props['data-carousel-page'] !== undefined && item.props['aria-hidden'] === false)[0].props['data-carousel-page'];
  assert.equal(active(h.renderer), 0);
  await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
  assert.ok(h.node('sample/slide-1'));
  assert.equal(active(h.renderer), 1);
  await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
  assert.ok(h.node('sample/slide-2'));
  assert.equal(active(h.renderer), 2);
  await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
  assert.equal(active(h.renderer), 2);
  await h.click('第 1 页');
  assert.ok(h.node('sample/slide-0'));
  assert.equal(active(h.renderer), 0);
  await h.close();
  node.props.loop = true;
  node.props.defaultIndex = 2;
  const loop = await mount(node, { editing: false });
  await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
  assert.ok(loop.node('sample/slide-0'));
  assert.equal(active(loop.renderer), 0);
  await loop.close();
});

test('countdown: malformed values use fallback; zero duration uses ended state', async () => {
  const node = createCatalogComponent('Countdown', 'sample'); node.props.start = 'invalid';node.props.fallbackEnabled=true; delete node.props.deadline;
  const h = await mount(node);
  assert.ok(h.node('sample/fallback'));
  assert.equal(countdownSeconds('00:61:00'), null);
  assert.equal(countdownSeconds('71:49:28'), 258568);
  await h.close();
  const ended = await mount({ ...node, props: { ...node.props, start: '00:00:00' } });
  assert.ok(ended.node('sample/ended')); assert.equal(ended.node('sample/active'), undefined);
  assert.equal(ended.renderer.root.findAll((item)=>item.props['aria-label']==='预览状态').length,0);
  await ended.close();
});

test('default package selection and toggle initial state are not masked by previous interaction', async () => {
  const pack = createCatalogComponent('Package', 'sample');
  const h = await mount(pack, { editing: false });
  await act(async () => h.node().props.onClick(event()));
  await h.select('默认选中', 'no');
  assert.equal(h.node().props['aria-pressed'], false);
  await h.close();
  const toggle = component('sample', 'Toggle', '同意', { initial: false });
  const t = await mount(toggle, { editing: false });
  const input = () => t.renderer.root.findAll((item) => item.type === 'input' && item.props.role === 'switch')[0];
  await act(async () => input().props.onChange({ target: { checked: true } }));
  await t.segment('初始状态', '开启');
  assert.equal(input().props.checked, true);
  await t.segment('初始状态', '关闭');
  assert.equal(input().props.checked, false);
  await t.close();
});

test('switch default state owns the initial branch; checkout has no second right-side preview selector', async () => {
  const h=await mount(createCatalogComponent('Switch','sample'));await h.select('默认状态','1');assert.ok(h.node('sample/on'));assert.equal(h.node('sample/off'),undefined);await h.close();
  const checkout=await mount(createCatalogComponent('ExpressCheckout','sample'));assert.equal(checkout.renderer.root.findAll((item)=>item.props['aria-label']==='预览状态').length,0);await checkout.close();
});

test('text content, font family, alignment and background reach the rendered text', async () => {
  const h = await mount(component('sample', 'Text', '标题', { text: '旧内容', textBackground: '#ff0000', fillEnabled: false, fontFamily:'serif' }));
  assert.equal(h.node().props.style.background, 'transparent');
  await h.change('文字内容', '新内容', 'textarea');
  assert.ok(h.node().children.includes('新内容'));
  assert.equal(h.node().props.style.fontFamily, 'Georgia, serif');await h.select('字体','system');assert.equal(h.node().props.style.fontFamily,undefined);
  await h.segment('文字对齐', '右对齐'); assert.equal(h.node().props.style.textAlign, 'right');
  await h.change('背景颜色值', '#123456'); assert.equal(h.node().props.style.background, '#123456');
  await h.close();
});

test('icon dimensions affect the SVG and radius is not a second conflicting configuration', async () => {
  const h = await mount(component('sample', 'Icon', '图标', { icon: 'check', iconRadius: 8 }));
  assert.equal(h.node().props.style.borderRadius, 8);
  await h.change('宽度', '32');
  await h.change('高度', '24');
  const svg = h.node().findByType('svg'); assert.equal(svg.props.width, 32); assert.equal(svg.props.height, 24);
  await h.change('背景颜色值', '#ff00ff'); assert.equal(h.node().props.style.background, '#ff00ff');
  await h.change('圆角', '0'); assert.equal(h.node().props.style.borderRadius, 0);
  await h.close();
});

test('image and video sources, fit, masks and image overlays reach media output', async () => {
  const h = await mount(component('sample', 'Image', '图片', { src: '/first.png' }));
  await h.change('素材地址', '/next.png'); assert.equal(h.node().findByType('img').props.src, '/next.png');
  await h.select('素材适配', 'contain'); assert.equal(h.node().findByType('img').props.style.objectFit, 'contain');
  await h.select('遮罩', 'rectangle'); await h.change('圆角','12'); assert.equal(h.node().props.style.overflow, 'hidden'); assert.equal(h.node().props.style.borderRadius, 12);
  await h.optional('叠加层'); await h.change('叠加层颜色值', '#ff0000'); await h.change('叠加层颜色不透明度', '100'); assert.equal(h.node().findAllByType('span').at(-1).props.style.background, '#ff0000');
  await h.close();
  const v = await mount(component('sample', 'Video', '视频', { src: '/a.mp4' }));
  await v.change('素材地址', '/b.mp4'); await v.select('素材适配', 'cover');
  assert.equal(v.node().findByType('video').props.src, '/b.mp4'); assert.equal(v.node().findByType('video').props.style.objectFit, 'cover');
  await v.close();
});

test('package SKU and pricing mode use centralized data rather than stale manual values', async () => {
  const h = await mount(createCatalogComponent('Package', 'sample'));
  await h.select('商品 SKU', 'DEMO-BLUE-YEAR');
  assert.ok(h.node('sample/price').children.join('').includes('488'));
  await h.select('价格显示', '0'); assert.ok(h.node('sample/price').children.join('').includes('40.67'));
  await h.close();
});

test('all container axes and alignment fields map to flex/grid without pretending stretch is center', async () => {
  const h = await mount(component('sample', 'Stack', '容器', {wrap:true}, [component('a', 'Text', '', { text: 'A' }), component('b', 'Text', '', { text: 'B' })]));
  await h.click('横向'); assert.equal(h.node().props.style.flexDirection, 'row');
  await h.click('居中'); assert.equal(h.node().props.style.alignItems, 'center');
  await h.select('分布', 'between'); assert.equal(h.node().props.style.justifyContent, 'space-between');
  await h.change('子项间距', '17'); assert.equal(h.node().props.style.gap, '17px');
  assert.equal(h.node().props.style.flexWrap, 'wrap'); await h.segment('换行（旧模板）', '不换行'); assert.equal(h.node().props.style.flexWrap, 'nowrap');
  await h.select('分布', 'around'); assert.equal(h.node().props.style.justifyContent, 'space-around');
  await h.select('分布', 'evenly'); assert.equal(h.node().props.style.justifyContent, 'space-evenly');
  await h.click('叠放'); await h.click('末尾'); assert.equal(h.node().props.style.display, 'grid'); assert.equal(h.node().props.style.justifyItems, 'end');
  await h.close();
});

test('paint alpha belongs to its color and never fades icon background or children', async () => {
  const h = await mount(component('sample', 'Icon', '图标', {icon:'check',color:'#112233',iconBackground:'#ffffff',opacity:40}));
  assert.equal(h.node().props.style.opacity,1);
  assert.equal(h.node().props.style.color,'color-mix(in srgb, #112233 40%, transparent)');
  await h.change('颜色不透明度','25');
  assert.equal(h.node().props.style.color,'color-mix(in srgb, #112233 25%, transparent)');
  assert.equal(h.node().props.style.background,'#ffffff');
  await h.change('背景颜色不透明度','60');
  assert.equal(h.node().props.style.background,'color-mix(in srgb, #ffffff 60%, transparent)');
  assert.equal(h.node().props.style.color,'color-mix(in srgb, #112233 25%, transparent)');
  await h.close();
});

test('text paint alpha reaches rich text spans without fading its background', async () => {
  const h=await mount(component('sample','Text','文字',{text:'A',background:'#ffffff',runs:[{text:'A',color:'#123456'}]}));
  await h.change('文字颜色不透明度','50');
  assert.equal(h.node().findByType('span').props.style.color,'color-mix(in srgb, #123456 50%, transparent)');
  assert.equal(h.node().props.style.background,'#ffffff');
  await h.change('背景颜色不透明度','20');
  assert.equal(h.node().props.style.background,'color-mix(in srgb, #ffffff 20%, transparent)');
  assert.equal(h.node().props.style.opacity,1);
  await h.close();
});

test('four corners map to CSS independently, survive state changes, copy and save', async () => {
  const h=await mount(component('sample','Package','商品',{radius:6,background:'#ffffff',defaultSelected:false}));
  await h.click('圆角切换为四角配置');
  await h.change('圆角左上','10');await h.change('圆角右上','20');await h.change('圆角右下','30');await h.change('圆角左下','40');
  assert.equal(h.node().props.style.borderRadius,'10px 20px 30px 40px');
  await h.click('选中');await h.change('圆角左上','15');
  assert.equal(h.node().props.style.borderRadius,'15px 20px 30px 40px');
  await h.click('默认');assert.equal(h.node().props.style.borderRadius,'10px 20px 30px 40px');
  const styles=copyStyles(indexDocument(h.document()).nodes.get('sample'));
  assert.equal(styles.selectedRadiusTopLeft,15);
  assert.equal(styles.radiusBottomLeft,40);
  const store=new Map();const storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
  assert.ok(saveComponentDocument(storage,h.document()));assert.deepEqual(readComponentDocument(storage,'audit'),h.document());
  await h.click('圆角切换为统一配置');assert.equal(h.node().props.style.borderRadius,10);
  await h.close();
});

test('image overlay is optional, has its own alpha, clips all corners and never adds a second fill', async()=>{
  const h=await mount(component('sample','Image','图片',{src:'/first.png'}));
  assert.equal(h.renderer.root.findAll((item)=>item.type==='strong'&&item.children.join('')==='填充').length,0);
  await h.optional('叠加层');await h.change('叠加层颜色值','#ff0000');await h.change('叠加层颜色不透明度','35');
  assert.equal(h.node().findAllByType('span').at(-1).props.style.background,'color-mix(in srgb, #ff0000 35%, transparent)');
  await h.click('圆角切换为四角配置');await h.change('圆角右下','28');
  assert.equal(h.node().props.style.borderRadius,'0px 0px 28px 0px');assert.equal(h.node().props.style.overflow,'hidden');
  await h.optional('叠加层');assert.equal(h.node().findAllByType('span').length,0);
  await h.optional('叠加层');assert.equal(h.node().findAllByType('span').at(-1).props.style.background,'color-mix(in srgb, #ff0000 35%, transparent)');
  await h.close();
});

test('timeline parent owns icon alignment and exactly three spacings, items own connectors',async()=>{
  const timeline=createCatalogComponent('Timeline','sample');
  const h=await mount(timeline);
  await h.change('节点间距','32');assert.equal(h.node().props.style.gap,32);
  await h.change('标题与描述','9');await h.change('列间距','21');
  assert.equal(h.node('sample/item-0').props.style.rowGap,9);assert.equal(h.node('sample/item-0').props.style.columnGap,21);
  await h.select('图标对齐','content');
  assert.equal(h.node('sample/item-0').findAll((item)=>item.type==='div'&&item.props['data-timeline-marker']!==undefined)[0].props.style.gridRow,'1 / span 2');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='label'&&item.children.some(child=>typeof child==='object'&&child.type==='span'&&child.children.join('')==='子项间距')).length,0);
  await h.segment('宽度','固定');await h.change('固定宽度','240');assert.equal(h.node().props.style.width,'240px');
  await h.change('内边距纵向','6');await h.change('内边距横向','9');assert.equal(h.node().props.style.padding,'6px 9px');
  await h.close();
  const item=await mount(createCatalogComponent('TimelineItem','sample'));
  await item.change('连接线宽度','5');await item.change('连接线纵向留白','7');await item.change('连接线颜色值','#abcdef');await item.change('连接线颜色不透明度','45');
  const props=indexDocument(item.document()).nodes.get('sample').props;
  assert.equal(props.connectorWidth,5);assert.equal(props.connectorMarginVertical,7);assert.equal(props.connectorColor,'#abcdef');assert.equal(props.connectorOpacity,45);
  await item.click('切换连接线上下留白');await item.change('连接线留白下','12');
  assert.equal(indexDocument(item.document()).nodes.get('sample').props.connectorMarginBottom,12);
  await item.optional('连接线');assert.equal(indexDocument(item.document()).nodes.get('sample').props.connectorEnabled,false);
  assert.equal(item.renderer.root.findAll((node)=>node.type==='strong'&&['尺寸','外观','布局'].includes(node.children.join(''))).length,0);
  await item.close();
});

test('screen has mandatory fill, no margin or appearance modules, and no new width constraint',async()=>{
  const node=component('sample','Screen','页面',{background:'#ffffff',marginTop:5,radius:7,backgroundOpacity:100});
  const h=await mount(node);
  const labels=h.renderer.root.findAll((item)=>item.type==='input').map((item)=>item.props['aria-label']);
  assert.ok(!labels.includes('圆角'));assert.ok(!labels.includes('外边距纵向'));
  assert.equal(h.renderer.root.findAll((item)=>item.type==='button'&&item.props['aria-label']==='添加宽度约束').length,0);
  const alpha=h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='背景颜色不透明度')[0];assert.equal(alpha.props.disabled,true);
  assert.deepEqual(indexDocument(h.document()).nodes.get('sample').props,node.props);
  await h.change('背景颜色值','#123456');assert.equal(h.node().props.style.background,'#123456');
  assert.equal(h.node().props.style.margin,'5px 0px 0px 0px');assert.equal(h.node().props.style.borderRadius,7);
  await h.close();
});

test('icon background owns rectangle/circle, with border and shadow independently optional',async()=>{
  const h=await mount(component('sample','Icon','图标',{icon:'check'}));
  await h.optional('图标背景');await h.change('背景颜色值','transparent');assert.equal(indexDocument(h.document()).nodes.get('sample').props.iconBackgroundEnabled,true);
  await h.select('形状','circle');assert.equal(h.node().props.style.borderRadius,'50%');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='圆角').length,0);
  await h.optional('边框');await h.change('边框宽度','2');await h.change('边框颜色值','#123456');await h.change('边框颜色不透明度','30');
  assert.equal(h.node().props.style.border,'2px solid color-mix(in srgb, #123456 30%, transparent)');
  await h.optional('阴影');assert.equal(h.node().props.style.boxShadow,'0px 2px 6px color-mix(in srgb, #000000 20%, transparent)');
  await h.optional('图标背景');assert.equal(h.node().props.style.background,'transparent');assert.equal(h.node().props.style.border,undefined);assert.equal(h.node().props.style.boxShadow,undefined);
  await h.close();
});

test('video uses checkbox interactions and media mask/overlay, not a second generic fill',async()=>{
  const video=createCatalogComponent('Video','sample');video.props.src='/video.mp4';
  const h=await mount(video);
  assert.deepEqual(h.renderer.root.findAll((item)=>item.type==='input'&&item.props.type==='checkbox').map((item)=>[item.props['aria-label'],item.props.checked,item.props.disabled]),[['循环播放',true,false],['静音',true,false],['自动播放',true,true],['播放控件',false,false]]);
  assert.equal(h.renderer.root.findAll((item)=>item.type==='strong'&&item.children.join('')==='填充').length,0);
  await h.select('遮罩','circle');assert.equal(h.node().props.style.borderRadius,'50%');
  await h.optional('叠加层');await h.change('叠加层颜色值','#0000ff');await h.change('叠加层颜色不透明度','15');
  assert.equal(h.node().findByType('span').props.style.background,'color-mix(in srgb, #0000ff 15%, transparent)');
  await h.optional('叠加层');assert.equal(h.node().findAllByType('span').length,0);
  await h.close();
});

test('legacy timeline spacing fields display the same effective values as its rendered children',async()=>{
  const timeline=component('sample','Timeline','时间线',{gap:17,lineColor:'#123456'},[component('item','TimelineItem','节点',{gap:11},[component('icon','Icon','图标',{icon:'check'}),component('copy','Stack','内容',{gap:8},[component('title','Text','标题',{text:'标题'}),component('description','Text','描述',{text:'说明'})])])]);
  const h=await mount(timeline);
  const values=Object.fromEntries(h.renderer.root.findAll((item)=>item.type==='input'&&item.props.type==='number').map((item)=>[item.props['aria-label'],item.props.value]));
  assert.equal(values['节点间距'],'17');assert.equal(values['标题与描述'],'8');assert.equal(values['列间距'],'11');
  assert.equal(h.node().props.style.gap,17);assert.equal(h.node('item').props.style.columnGap,11);assert.equal(h.node('copy').props.style.rowGap,8);
  assert.deepEqual(indexDocument(h.document()).nodes.get('sample'),timeline);
  await h.close();
});

test('package descendants have independent standard state properties but shared text and typography',async()=>{
  const text=component('sample','Text','子文字',{text:'原文字',fontSize:14});
  const h=await mount(text,{source:fixture(component('product','Package','商品',{group:'plans',defaultSelected:false},[text]))});
  await h.click('选中');await h.change('内边距纵向','12');await h.change('字号','18');await h.change('文字内容','共用文字','textarea');
  assert.equal(h.node().props.style.padding,'12px 0px');assert.equal(h.node().props.style.fontSize,18);
  await h.click('默认');assert.equal(h.node().props.style.padding,'0px 0px');assert.equal(h.node().props.style.fontSize,18);assert.equal(h.node().children.join(''),'共用文字');
  const changed=indexDocument(h.document()).nodes.get('sample').props;
  assert.equal(changed.selectedPaddingVertical,12);assert.equal(changed.paddingVertical,undefined);assert.equal(changed.selectedFontSize,undefined);
  const source=h.document();await h.close();
  const interaction=await mount(text,{source,editing:false});
  assert.equal(interaction.node().props.style.padding,'0px 0px');
  await act(async()=>interaction.node('product').props.onClick(event()));assert.equal(interaction.node().props.style.padding,'12px 0px');
  await interaction.close();
});

test('selected child stacks render their own axis and spacing instead of the base layout',async()=>{
  const stack=component('sample','Stack','子容器',{gap:5},[component('label','Text','文字',{text:'A'})]);
  const h=await mount(stack,{source:fixture(component('product','Package','商品',{defaultSelected:false},[stack]))});
  await h.click('选中');await h.click('横向');await h.change('子项间距','19');
  assert.equal(h.node().props.style.flexDirection,'row');assert.equal(h.node().props.style.gap,'19px');
  await h.click('默认');assert.equal(h.node().props.style.flexDirection,'column');assert.equal(h.node().props.style.gap,'5px');
  await h.close();
});

test('selected child media masks and overlays map to the actual media rather than hidden selected keys',async()=>{
  const image=component('sample','Image','图片',{src:'/image.png'});
  const h=await mount(image,{source:fixture(component('product','Package','商品',{defaultSelected:false},[image]))});
  await h.click('选中');await h.select('遮罩','circle');await h.optional('叠加层');await h.change('叠加层颜色值','#00ff00');await h.change('叠加层颜色不透明度','30');
  assert.equal(h.node().props.style.borderRadius,'50%');assert.equal(h.node().findByType('span').props.style.background,'color-mix(in srgb, #00ff00 30%, transparent)');
  await h.click('默认');assert.equal(h.node().props.style.borderRadius,0);assert.equal(h.node().findAllByType('span').length,0);
  assert.equal(indexDocument(h.document()).nodes.get('sample').props.src,'/image.png');
  await h.close();
});

test('zero border and shadow values keep their modules editable until explicitly removed',async()=>{
  const h=await mount(component('sample','Stack','容器',{background:'#ffffff',borderWidth:1,shadowY:2,shadowBlur:6}));
  await h.change('边框宽度','0');assert.equal(h.node().props.style.border,undefined);await h.change('边框宽度','2');assert.match(h.node().props.style.border,/^2px/);
  await h.change('X 偏移','0');await h.change('Y 偏移','0');await h.change('模糊','0');assert.equal(h.node().props.style.boxShadow,undefined);
  await h.change('Y 偏移','-4');assert.match(h.node().props.style.boxShadow,/0px -4px 0px/);
  await h.change('背景颜色值','transparent');assert.equal(indexDocument(h.document()).nodes.get('sample').props.fillEnabled,true);
  await h.change('背景颜色值','#abcdef');assert.equal(h.node().props.style.background,'#abcdef');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='button'&&item.props.className==='rc-prop-heading').length,0);
  await h.close();
});

test('new headers and footers are empty, with source defaults rather than invented title and purchase children',async()=>{
  for(const type of ['Header','Footer']) {
    const node=createCatalogComponent(type,'sample');assert.equal(node.children.length,0);assert.equal(node.props.gap,0);
    const h=await mount(node);assert.equal(h.node().props.style.boxShadow,`0px ${type==='Header'?4:-4}px 16px color-mix(in srgb, #000000 20%, transparent)`);
    assert.equal(h.node().props.style.position,'sticky');assert.equal(h.node().props.style[type==='Header'?'top':'bottom'],0);
    const alpha=h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='背景颜色不透明度')[0];assert.equal(alpha.props.disabled,type==='Header');
    await h.close();
  }
});

test('copied switch targets and selected styles remain independent and complete', () => {
  const original = createCatalogComponent('Switch', 'switch'), copy = cloneComponent(original);
  assert.equal([...indexDocument({ root: copy }).nodes.values()].find((node) => node.type === 'Toggle').props.switchTarget, copy.id);
  const a = component('a', 'Stack', '', { lineHeight: 1.2, selectedOpacity: 50, selectedBackgroundVideo: '/video.mp4', paddingVertical: 12, paddingHorizontal: 8 });
  const doc = fixture(component('b', 'Stack', '', {}));
  const styles = copyStyles(a), result = pasteStyles(doc, 'b', styles);
  assert.equal(indexDocument(result).nodes.get('b').props.selectedOpacity, 50);
  assert.equal(indexDocument(result).nodes.get('b').props.lineHeight, 1.2);
  assert.equal(indexDocument(result).nodes.get('b').props.selectedBackgroundVideo, '/video.mp4');
});

test('contradictory min/max bounds are normalized in the stored configuration', async () => {
  const h = await mount(component('sample', 'Stack', '', { minWidth: 80, maxWidth: 120 }));
  await h.change('最大宽度', '40'); assert.equal(h.node().props.style.minWidth, 40);
  await h.change('最小宽度', '90'); assert.equal(h.node().props.style.maxWidth, 90);
  await h.change('最大宽度', '0'); assert.equal(h.node().props.style.maxWidth, undefined);
  await h.close();
});

test('fixed width is not constrained by inactive fill bounds; page height is not forced to 844', async () => {
  const h = await mount(component('sample', 'Screen', '页面', { minWidth: 80, maxWidth: 120 }, [component('footer', 'Footer')]));
  await h.segment('宽度', '固定'); await h.change('固定宽度', '250');
  assert.equal(h.node().props.style.width, '250px'); assert.equal(h.node().props.style.maxWidth, undefined);
  await h.segment('高度', '固定'); await h.change('固定高度', '400');
  assert.equal(h.node().props.style.minHeight, 0);
  await h.segment('高度','填满'); await h.limit('高度','最小'); await h.change('最小高度', '100'); assert.equal(h.node().props.style.minHeight, 100);
  await h.close();
});

test('a screen with header and footer renders its background video exactly once', async () => {
  const h = await mount(component('sample', 'Screen', '页面', { fillType: 'video', backgroundVideo: '/bg.mp4' }, [component('header', 'Header'), component('footer', 'Footer')]));
  assert.equal(h.node().findAll((item) => item.type === 'video' && item.props['data-background-video']).length, 1);
  await h.close();
});

test('numeric input permits an empty draft and clamps invalid values on blur only', async () => {
  const h = await mount(component('sample', 'Text', '', { text: 'A', fontSize: 18 }));
  await h.change('字号', ''); assert.equal(h.node().props.style.fontSize, 18);
  await h.change('字号', '4'); assert.equal(h.node().props.style.fontSize, 18);
  await act(async () => h.renderer.root.findAll((item) => item.type === 'input' && item.props['aria-label'] === '字号')[0].props.onBlur());
  assert.equal(h.node().props.style.fontSize, 8);
  await h.close();
});

test('tabs: target, page index, selected colors and inherited child text follow clicks and keyboard', async () => {
  const tabs = createCatalogComponent('Tabs', 'tabs');
  const button = component('sample', 'TabButton', '标签', { target: 'tabs', index: 1, selectedColor:'#123456' }, [component('label', 'Text', '文字', { text: '第二页' })]);
  const source = fixture(component('row', 'Stack', '', {}, [button, tabs]));
  const h = await mount(button, { source, editing: false });
  await h.click('选中'); await h.change('背景颜色值', '#ff00ff');
  await act(async () => h.node().props.onKeyDown({ ...event(), key: 'Enter' }));
  assert.ok(h.node('tabs/tab-1')); assert.equal(h.node('tabs/tab-0'), undefined);
  assert.equal(h.node().props.style.color, '#123456'); assert.equal(h.node().props.style.background, '#ff00ff');
  assert.equal(h.node('label').props.style.color, 'inherit');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='select'&&['对应页面','目标标签页'].includes(item.props['aria-label'])).length,0);
  await act(async () => h.node('tabs/tab-button-1-0').props.onClick(event()));
  assert.ok(h.node('tabs/tab-0'));
  await h.close();
});

test('actions: no-op, safe URL and invalid URL use the configured behavior', async () => {
  const opened = [], previous = globalThis.window;
  globalThis.window = { open: (...args) => opened.push(args) };
  try {
    const h = await mount(component('sample', 'Button', '', { action: { action: 'None' } }), { editing: false });
    await act(async () => h.node().props.onClick(event())); assert.equal(h.status(), undefined);
    await h.select('点击动作', 'NavigateTo'); await h.select('导航目标','OpenURL'); await h.change('链接地址', 'https://example.com/path');
    await h.select('链接打开方式','external_browser');
    await act(async () => h.node().props.onKeyDown({ ...event(), key: ' ' }));
    assert.deepEqual(opened, [['https://example.com/path', '_blank', 'noopener,noreferrer']]);
    await h.change('链接地址', 'javascript:alert(1)'); await act(async () => h.node().props.onClick(event()));
    assert.equal(opened.length, 1); assert.match(h.status(), /有效/);
    await h.close();
  } finally { globalThis.window = previous; }
});

test('privacy, terms and URL destinations use the configured in-app, external and deep-link flow',async()=>{
  const previous=globalThis.window,opened=[],assigned=[];
  globalThis.window={open:(...args)=>opened.push(args),location:{assign:(url)=>assigned.push(url)}};
  try {
    const h=await mount(createCatalogComponent('Button','sample'),{editing:false});
    await h.select('导航目标','OpenPrivacy');await h.change('链接地址','https://example.com/privacy');
    await act(async()=>h.node().props.onClick(event()));
    assert.equal(h.renderer.root.findByType('iframe').props.src,'https://example.com/privacy');assert.equal(opened.length,0);
    await h.click('关闭网页预览');assert.equal(h.renderer.root.findAllByType('iframe').length,0);
    await h.select('导航目标','OpenTerms');await h.select('链接打开方式','external_browser');await h.change('链接地址','https://example.com/terms');
    await act(async()=>h.node().props.onClick(event()));assert.deepEqual(opened,[['https://example.com/terms','_blank','noopener,noreferrer']]);
    await h.select('导航目标','OpenURL');await h.select('链接打开方式','deep_link');await h.change('链接地址','hellotalk://vip');
    await act(async()=>h.node().props.onClick(event()));assert.deepEqual(assigned,['hellotalk://vip']);
    await h.change('链接地址','javascript:alert(1)');await act(async()=>h.node().props.onClick(event()));assert.equal(assigned.length,1);assert.match(h.status(),/有效/);
    await h.select('点击动作','Dismiss');await act(async()=>h.node().props.onClick(event()));assert.equal(h.status(),'关闭预览');
    await h.close();
  } finally {globalThis.window=previous;}
});

test('actions: open/close sheet and navigate out of a sheet do not leave stale overlays', async () => {
  const button = component('sample', 'Button', '', { action: { action: 'OpenSheet', actionPage: 'sheet' } });
  const exit = component('exit', 'Button', '', { action: { action: 'OpenPage', actionPage: 'p2' } });
  const close = component('close', 'Button', '', { action: { action: 'CloseSheet' } });
  const source = fixture(component('flow', 'Flow', '', {}, [component('p1', 'Screen', '', {}, [button, component('sheet', 'BottomSheet', '', { presentation: 'sheet' }, [exit, close])]), component('p2', 'Screen', '', {}, [component('done', 'Text', '', { text: '已跳转' })])]));
  const h = await mount(button, { source, editing: false });
  assert.equal(h.node('sheet'), undefined);
  await act(async () => h.node().props.onClick(event())); assert.ok(h.node('sheet'));
  await act(async () => h.node('close').props.onClick(event())); assert.equal(h.node('sheet'), undefined);
  await act(async () => h.node().props.onClick(event()));
  await act(async () => h.node('exit').props.onClick(event()));
  assert.ok(h.node('done')); assert.equal(h.node('sheet'), undefined); assert.equal(h.node('p1'), undefined);
  await h.close();
});

test('next page action belongs to its nearest flow rather than another flow in the document', async () => {
  const button = component('sample', 'Button', '', { action: { action: 'NextScreen' } });
  const source = fixture(component('outer', 'Flow', '', {}, [component('outer1', 'Screen', '', {}, [component('inner', 'Flow', '', {}, [component('inner1', 'Screen', '', {}, [button]), component('inner2', 'Screen')])]), component('outer2', 'Screen')]));
  const h = await mount(button, { source, editing: false });
  await act(async () => h.node().props.onClick(event())); assert.ok(h.node('inner2')); assert.ok(h.node('outer1')); assert.equal(h.node('outer2'), undefined);
  await h.close();
});

test('purchase checks only visible agreements and a linked switch follows its default state', async () => {
  const purchase = component('sample', 'PurchaseButton', '', { action: { action: 'Purchase' } });
  const toggle = component('agreement', 'Toggle', '同意协议', { initial: false, required: true });
  const source = fixture(component('flow', 'Flow', '', {defaultIndex:1}, [component('p2', 'Screen', '', {}, [component('other-page', 'Toggle', '', { required: true })]),component('p1', 'Screen', '', {}, [purchase, toggle, component('hidden', 'Toggle', '', { required: true, hidden: true })])]));
  const h = await mount(purchase, { source, editing: false });
  await act(async () => h.node().props.onClick(event())); assert.equal(h.status(), '请先勾选同意协议');
  await act(async () => h.node('agreement').findByType('input').props.onChange({ target: { checked: true } }));
  await act(async () => h.node().props.onClick(event())); assert.equal(h.status(), '购买预览：未发起真实交易');
  await h.close();
  const sw = createCatalogComponent('Switch', 'sw'); sw.props.defaultIndex = 1;
  const linked = await mount(sw, { editing: false });
  assert.equal(linked.node('sw/control-1').findByType('button').props['aria-checked'], true);
  await act(async () => linked.node('sw/control-1').findByType('button').props.onClick(event()));
  assert.ok(linked.node('sw/off')); assert.equal(linked.node('sw/on'), undefined);
  await linked.close();
});

test('timer field selection removes incompatible rich text and SKU binding', async () => {
  const node = component('sample', 'Text', '', { text: '原文',timerField:'hours', runs: [{ text: '遮挡计时值' }], binding: { field: 'price', key: 'sample' } });
  const source = fixture(component('timer', 'Countdown', '', { start: '02:03:04' }, [component('active', 'CountdownState', '', { state: 'active' }, [node])]));
  const h = await mount(node, { source });
  await h.select('倒计时字段（旧模板）', 'hours');
  assert.deepEqual(h.node().children, ['02']); assert.equal(indexDocument(h.document()).nodes.get('sample').props.binding, null);
  await h.select('倒计时字段（旧模板）', 'minutes'); assert.deepEqual(h.node().children, ['03']);
  await h.close();
});

test('media upload validates type and size, updates preview, changes node type and clears source', async () => {
  const old = globalThis.FileReader;
  globalThis.FileReader = class { readAsDataURL(file) { this.result = `data:${file.type};base64,AAAA`; this.onload(); } };
  try {
    const h = await mount(component('sample', 'Image', '图片', { src: '/old.png' }));
    const upload = async (file) => act(async () => h.renderer.root.findAll((item) => item.type === 'input' && item.props.type === 'file')[0].props.onChange({ target: { files: [file], value: 'upload' } }));
    await upload({ type: 'image/png', size: 10 * 1024 * 1024 + 1 }); assert.match(h.status(), /10 MB/); assert.equal(h.node().findByType('img').props.src, '/old.png');
    await upload({ type: 'text/html', size: 100 }); assert.match(h.status(), /请选择/);
    await upload({ type: 'image/png', size: 100 }); assert.match(h.node().findByType('img').props.src, /^data:image\/png/);
    await upload({ type: 'video/mp4', size: 100 }); assert.equal(h.node().props['data-component-type'], 'Video'); assert.match(h.node().findByType('video').props.src, /^data:video\/mp4/);
    await h.click('删除素材'); assert.equal(h.node().findAllByType('video').length, 0);
    await h.close();
    const bg = await mount(component('sample', 'Stack', '', { fillType: 'video' }));
    const input = bg.renderer.root.findAll((item) => item.type === 'input' && item.props.type === 'file')[0];
    assert.equal(input.props.accept, 'video/mp4');
    await act(async () => input.props.onChange({ target: { files: [{ type: 'image/png', size: 100 }], value: 'upload' } }));
    assert.equal(bg.status(), '请选择 MP4 视频'); assert.equal(bg.node().findAllByType('video').length, 0);
    await bg.close();
  } finally { globalThis.FileReader = old; }
});

test('default package selection is exclusive within its group, not across unrelated ungrouped products', () => {
  const doc = fixture(component('row', 'Stack', '', {}, [component('a', 'Package', '', { defaultSelected: false }), component('b', 'Package', '', { defaultSelected: true }), component('c', 'Package', '', { group: 'shared', defaultSelected: true }), component('d', 'Package', '', { group: 'shared' })]));
  const first = defaultPackagePatch(doc, 'a', true), second = defaultPackagePatch(first, 'd', true);
  const { nodes } = indexDocument(second);
  assert.equal(nodes.get('a').props.defaultSelected, true); assert.equal(nodes.get('b').props.defaultSelected, true);
  assert.equal(nodes.get('c').props.defaultSelected, false); assert.equal(nodes.get('d').props.defaultSelected, true);
  assert.equal(indexDocument(doc).nodes.get('c').props.defaultSelected, true);
});

test('layer tree uses one readable label, explicit indentation and inline expansion without changing template data',async()=>{
  const previousStorage=globalThis.localStorage,previousWindow=globalThis.window,records=new Map();let editor;
  globalThis.localStorage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};globalThis.window={addEventListener(){},removeEventListener(){}};
  const source=fixture(component('hero','Stack','主视觉',{},[component('copy','Stack','内容',{axis:'horizontal'},[component('body','Text','文字',{text:'会员专属权益长文案'}),component('heading','Text','标题',{text:'实际标题正文',hidden:true}),component('image','Image','图片',{src:'/original.png'})])]));
  saveComponentDocument(localStorage,source);
  try {
    await act(async()=>{editor=TestRenderer.create(React.createElement(Editor,{template:{id:'audit'},initialNodes:[]}));});mounted.add(editor);
    const row=id=>editor.root.findAll(item=>item.type==='div'&&item.props['data-layer-id']===id)[0];
    const label=id=>row(id).findAll(item=>item.type==='button'&&item.props.className==='ne-tree-select')[0];
    const expand=id=>row(id).findAll(item=>item.type==='button'&&item.props.className==='ne-icon ne-expand')[0];
    assert.deepEqual(label('hero').findByProps({className:'ne-tree-label'}).children,['主视觉']);assert.equal(row('hero').findAllByType('small').length,0);
    assert.equal(row('hero').props.style.paddingLeft,28);assert.equal(expand('hero').props['aria-expanded'],false);
    await act(async()=>expand('hero').props.onClick());assert.equal(expand('hero').props['aria-expanded'],true);assert.equal(row('copy').props.style.paddingLeft,48);
    await act(async()=>expand('copy').props.onClick());assert.equal(row('body').props.style.paddingLeft,68);assert.equal(label('body').props['aria-label'],'会员专属权益长文案');assert.equal(expand('body'),undefined);
    assert.equal(label('heading').findByProps({className:'ne-tree-label'}).children.join(''),'标题');assert.match(label('heading').props.title,/实际标题正文/);assert.equal(label('heading').props['aria-label'],'标题（隐藏）');
    assert.equal(label('image').props['aria-label'],'图片');assert.equal(label('hero').findAllByType('svg')[0].props.className.includes('lucide-rows2'),true);assert.equal(label('copy').findAllByType('svg')[0].props.className.includes('lucide-columns2'),true);
    await act(async()=>label('body').props.onClick());
    assert.equal(editor.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='所在容器').length,0);
    assert.equal(row('body').props.draggable,true);assert.equal(typeof row('hero').props.onDrop,'function');
    const tree=editor.root.findByProps({'aria-label':'组件图层'});assert.equal(tree.findAllByType('small').length,0);assert.equal(tree.findAll(item=>item.props.className==='ne-grip').length,0);
    await act(async()=>expand('hero').props.onClick());assert.equal(row('copy'),undefined);assert.equal(editor.root.findAll(item=>item.props['data-component-id']==='body').length,1);
    await act(async()=>editor.unmount());mounted.delete(editor);editor=null;assert.deepEqual(readComponentDocument(localStorage,'audit').root,source.root);
  } finally {if(editor){await act(async()=>editor.unmount());mounted.delete(editor);}globalThis.localStorage=previousStorage;globalThis.window=previousWindow;}
});

test('editor keeps sheets on peer artboards, previews the selected sheet and switches directly without rewriting content',async()=>{
  const previousStorage=globalThis.localStorage,previousWindow=globalThis.window,records=new Map();let editor;
  globalThis.localStorage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};globalThis.window={addEventListener(){},removeEventListener(){}};
  const sheet=component('retention','Stack','挽留弹窗',{presentation:'overlay',paddingTop:24,background:'#f7f7f7'},[component('offer','Text','优惠',{text:'原优惠内容',fontSize:22}),component('close-sheet','Button','返回',{action:{action:'CloseSheet'}},[component('close-copy','Text','文字',{text:'返回'})])]);
  const source=fixture(component('launch','Button','查看优惠',{action:{action:'OpenSheet',actionPage:'retention'}},[component('label','Text','文字',{text:'查看优惠'}),sheet]));
  saveComponentDocument(localStorage,source);
  try {
    await act(async()=>{editor=TestRenderer.create(React.createElement(Editor,{template:{id:'audit'},initialNodes:[]}));});mounted.add(editor);
    const select=async(id)=>act(async()=>editor.root.findAll(item=>item.type==='div'&&item.props['data-layer-id']===id)[0].findAll(item=>item.type==='button'&&item.props.className==='ne-tree-select')[0].props.onClick());
    const componentNode=id=>editor.root.findAll(item=>item.type==='div'&&item.props['data-component-id']===id)[0];
    const clickLabel=async(label)=>act(async()=>editor.root.findAll(item=>item.type==='button'&&(item.props['aria-label']===label||item.children.some(child=>child===label)))[0].props.onClick(event()));
    const main=editor.root.findByProps({'aria-label':'组件图层'}),surfaces=editor.root.findByProps({'aria-label':'弹层图层'});
    assert.equal(main.findAll(item=>item.props['data-layer-id']==='retention').length,0);
    assert.equal(surfaces.findAll(item=>item.props['data-layer-id']==='retention').length,1);assert.ok(componentNode('retention'));
    assert.equal(editor.root.findAll(item=>item.type==='section'&&item.props.className?.startsWith('ne-artboard')).length,2);
    await select('retention');assert.ok(componentNode('retention'));assert.equal(componentNode('retention').props['data-component-type'],'BottomSheet');
    assert.ok(editor.root.findByProps({'aria-label':'当前弹层'}).findAllByType('button').some(button=>button.props.title==='定位触发按钮：查看优惠'));
    await clickLabel('交互预览');assert.ok(componentNode('retention'));await act(async()=>componentNode('close-sheet').props.onClick(event()));assert.equal(componentNode('retention'),undefined);
    await clickLabel('返回编辑');assert.ok(componentNode('retention'));
    await clickLabel('选择画板：页面');assert.ok(componentNode('retention'));assert.ok(componentNode('launch'));
    assert.equal(editor.root.findAll(item=>item.type==='button'&&item.props['aria-label']==='返回主页面').length,0);
    await act(async()=>editor.unmount());mounted.delete(editor);editor=null;
    const saved=readComponentDocument(localStorage,'audit');assert.deepEqual(saved.products,source.products);assert.deepEqual(saved.root,upgradeCanonicalComponents(source).root);
  } finally {if(editor){await act(async()=>editor.unmount());mounted.delete(editor);}globalThis.localStorage=previousStorage;globalThis.window=previousWindow;}
});

test('opening a saved standalone exit popup shows its real layer tree once without another page picker',async()=>{
  const previousStorage=globalThis.localStorage,previousWindow=globalThis.window,records=new Map();let editor;
  globalThis.localStorage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};globalThis.window={addEventListener(){},removeEventListener(){}};
  const source={...fixture(component('offer','BottomSheet','挽留弹窗',{presentation:'overlay'},[])),settings:{presentationSurfaceId:'offer'}};
  saveComponentDocument(localStorage,source);
  try {
    await act(async()=>{editor=TestRenderer.create(React.createElement(Editor,{template:{id:'audit'},initialNodes:[]}));});
    assert.equal(editor.root.findAll(item=>item.type==='div'&&item.props['data-layer-id']==='offer').length,1);
    assert.equal(editor.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='编辑页面').length,0);
    assert.equal(editor.root.findAll(item=>item.type==='section'&&item.props.className?.startsWith('ne-artboard')).length,1);
  } finally {if(editor)await act(async()=>editor.unmount());globalThis.localStorage=previousStorage;globalThis.window=previousWindow;}
});

test('alignment always has three standard options while legacy stretch stays unchanged until explicitly replaced',async()=>{
  const h=await mount(component('sample','Stack','旧容器',{align:'stretch'},[component('child','Icon','图标',{widthMode:'fixed',heightMode:'fixed',width:26,height:26})]));
  const alignment=()=>h.renderer.root.findAll(item=>item.type==='label'&&item.props.className==='rc-field'&&item.children.some(child=>typeof child==='object'&&child.type==='span'&&child.children.join('')==='对齐'))[0];
  assert.equal(alignment().findAllByType('button').length,3);
  assert.equal(h.node().props.style.alignItems,'stretch');
  assert.equal(h.document().root.children[0].props.align,'stretch');
  for(const [choice,value] of [['末尾','flex-end'],['居中','center'],['起始','flex-start']]){
    await h.segment('对齐',choice);assert.equal(alignment().findAllByType('button').length,3);assert.equal(h.node().props.style.alignItems,value);
  }
  await h.close();
});

test('all six distribution choices map to separate main-axis CSS values, not cross-axis alignment',async()=>{
  const h=await mount(component('sample','Stack','布局',{heightMode:'fixed',height:300,widthMode:'fixed',width:300,align:'start'},[component('a','Icon','图标',{width:26,height:26}),component('b','Icon','图标',{width:26,height:26})]));
  for(const [value,css] of [['start','flex-start'],['center','center'],['end','flex-end'],['between','space-between'],['around','space-around'],['evenly','space-evenly']]){
    await h.select('分布',value);assert.equal(h.node().props.style.justifyContent,css);assert.equal(h.node().props.style.alignItems,'flex-start');
  }
  await h.segment('轴向','横向');assert.equal(h.node().props.style.flexDirection,'row');
  await h.segment('轴向','叠放');assert.equal(h.node().props.style.display,'grid');assert.equal(h.renderer.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='分布').length,0);
  await h.close();
});

test('vertical Fill uses remaining flex space only under a bounded main axis and never rewrites saved dimensions',async()=>{
  const sample=component('sample','Stack','父容器',{heightMode:'fixed',height:300,gap:10},[
    component('fixed','Stack','固定子项',{heightMode:'fixed',height:26}),
    component('fill','Stack','填满子项',{heightMode:'fill',minHeight:30,maxHeight:280}),
  ]);
  const h=await mount(sample);
  assert.equal(h.node('fill').props.style.height,0);assert.equal(h.node('fill').props.style.flexGrow,1);assert.equal(h.node('fill').props.style.flexShrink,1);
  assert.equal(h.node('fill').props.style.minHeight,30);assert.equal(h.node('fill').props.style.maxHeight,280);
  assert.equal(h.document().root.children[0].children[1].props.heightMode,'fill');
  await h.segment('高度','适应内容');assert.equal(h.node('fill').props.style.height,'100%');assert.equal(h.node('fill').props.style.flexGrow,undefined);
  await h.segment('高度','固定');await h.segment('轴向','横向');assert.equal(h.node('fill').props.style.height,'100%');
  await h.close();
});

test('existing fit-width constraints remain effective while new constraints are added only through Fill',async()=>{
  const h=await mount(component('sample','Text','文字',{text:'短文案',widthMode:'fit',minWidth:80,maxWidth:200}));
  assert.equal(h.node().props.style.minWidth,80);assert.equal(h.node().props.style.maxWidth,200);
  await h.change('最小宽度',100);assert.equal(h.node().props.style.minWidth,100);
  await h.close();
});

test('image overlay accepts a gradient as a background paint, not an invalid CSS foreground color',async()=>{
  const previousCSS=globalThis.CSS;globalThis.CSS={supports:(property,value)=>!String(value).includes('gradient(')||property==='background'};
  let h;
  try{h=await mount(component('sample','Image','图片',{src:'/test.png',overlayEnabled:true,overlayColor:'#000000'}));
    const gradient='linear-gradient(90deg, #ffffff 0%, #000000 100%)';await h.change('叠加层颜色值',gradient);
    assert.equal(h.document().root.children[0].props.overlayColor,gradient);assert.equal(h.node().findAll(item=>item.type==='span'&&String(item.props['aria-hidden'])==='true')[0].props.style.background,gradient);
  }finally{if(h)await h.close();globalThis.CSS=previousCSS;}
});

test('actual editor selection, configuration, auto-save and reopen keep the same text and layout values', async () => {
  const previousStorage = globalThis.localStorage, previousWindow = globalThis.window;
  const records = new Map();
  globalThis.localStorage = { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  const source = fixture(component('sample', 'Text', '标题', { text: '原标题', fontSize: 18 }));
  saveComponentDocument(localStorage, source);
  let editor;
  try {
    const open = async () => { await act(async () => { editor = TestRenderer.create(React.createElement(Editor, { template: { id: 'audit' }, initialNodes: [] })); }); mounted.add(editor); };
    await open();
    const selectText = async () => act(async () => editor.root.findAll((item) => item.type === 'div' && item.props['data-layer-id'] === 'sample')[0].findAll((item) => item.type === 'button' && item.props.className === 'ne-tree-select')[0].props.onClick());
    await selectText();
    const change = async (label, value, type = 'input') => act(async () => {
      if(label==='文字内容'){const rich=editor.root.findAll(item=>typeof item.type==='function'&&item.props['aria-label']===label&&typeof item.props.onChange==='function')[0];assert.ok(rich);rich.props.onChange({text:value,runs:null});return;}
      editor.root.findAll((item) => item.type === type && item.props['aria-label'] === label)[0].props.onChange(event(value));
    });
    await change('文字内容', '已保存标题', 'textarea'); await change('字号', '23'); await change('内边距纵向', '12');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
    const saved = readComponentDocument(localStorage, 'audit'), node = indexDocument(saved).nodes.get('sample');
    assert.equal(node.props.fontSize, 23); assert.equal(node.props.text, '已保存标题'); assert.equal(node.props.paddingTop, 12);
    await act(async () => editor.unmount()); mounted.delete(editor);
    await open(); await selectText();
    const preview = editor.root.findAll((item) => item.type === 'div' && item.props['data-component-id'] === 'sample')[0];
    assert.deepEqual(preview.children, ['已保存标题']); assert.equal(preview.props.style.fontSize, 23); assert.equal(preview.props.style.padding, '12px 0px');
  } finally {
    if (editor) { await act(async () => editor.unmount()); mounted.delete(editor); }
    globalThis.localStorage = previousStorage; globalThis.window = previousWindow;
  }
});

test('selecting a checkout state in the actual layer tree previews that branch without persisting a second default',async()=>{
  const oldStorage=globalThis.localStorage,oldWindow=globalThis.window,records=new Map();let editor;
  globalThis.localStorage={getItem:(key)=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};globalThis.window={addEventListener(){},removeEventListener(){}};
  try{
    const source=fixture(createCatalogComponent('ExpressCheckout','checkout'));saveComponentDocument(localStorage,source);
    await act(async()=>{editor=TestRenderer.create(React.createElement(Editor,{template:{id:'audit'},initialNodes:[]}));});mounted.add(editor);
    const select=async(id)=>act(async()=>editor.root.findAll((item)=>item.type==='div'&&item.props['data-layer-id']===id)[0].findAll((item)=>item.type==='button'&&item.props.className==='ne-tree-select')[0].props.onClick());
    await select('checkout');await select('checkout/loading');
    const visible=(id)=>editor.root.findAll((item)=>item.type==='div'&&item.props['data-component-id']===id).length;
    assert.equal(visible('checkout/loading'),1);assert.equal(visible('checkout/available'),0);
    await select('checkout/unavailable');assert.equal(visible('checkout/unavailable'),1);assert.equal(visible('checkout/loading'),0);
    await act(async()=>editor.unmount());mounted.delete(editor);editor=null;
    assert.deepEqual(indexDocument(readComponentDocument(localStorage,'audit')).nodes.get('checkout').props,indexDocument(source).nodes.get('checkout').props);
  }finally{if(editor){await act(async()=>editor.unmount());mounted.delete(editor);}globalThis.localStorage=oldStorage;globalThis.window=oldWindow;}
});

test('tab selector changes affect the actual peer preview after switching pages', async () => {
  const tabs = createCatalogComponent('Tabs', 'tabs');
  const source = fixture(tabs);
  const control = tabs.children[0].children[0];
  const h = await mount(control, { source, editing: false });
  await h.change('子项间距', '15');
  await h.change('内边距横向', '9');
  assert.equal(h.node(control.id).props.style.gap, '15px');
  await act(async () => h.node('tabs/tab-button-0-1').props.onClick(event()));
  assert.equal(h.node('tabs/controls-1').props.style.gap, '15px');
  assert.equal(h.node('tabs/controls-1').props.style.padding, '2px 9px');
  assert.deepEqual(h.node('tabs/tab-content-1').children, ['文字']);
  await h.close();

  const button = tabs.children[0].children[0].children[1];
  const selected = await mount(button, { source, editing: false });
  await selected.segment('状态', '选中');
  await selected.change('背景颜色值', '#243546');
  await selected.change('圆角', '12');
  await act(async () => selected.node(button.id).props.onClick(event()));
  assert.equal(selected.node('tabs/tab-button-1-1').props.style.background, '#243546');
  assert.equal(selected.node('tabs/tab-button-1-1').props.style.borderRadius, 12);
  assert.notEqual(selected.node('tabs/tab-button-1-0').props.style.background, '#243546');
  await selected.close();
});

test('editing descendant state properties cannot reset the current editor page',async()=>{
  const oldStorage=globalThis.localStorage,oldWindow=globalThis.window,records=new Map();
  globalThis.localStorage={getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)};
  globalThis.window={addEventListener(){},removeEventListener(){}};
  const source=fixture(component('flow','Flow','流程',{},[component('first','Screen','第一页'),component('second','Screen','第二页',{},[component('product','Package','商品',{},[component('sample','Text','标题',{text:'第二页文字'})])])]));
  saveComponentDocument(localStorage,source);
  let editor;
  try {
    await act(async()=>{editor=TestRenderer.create(React.createElement(Editor,{template:{id:'audit'},initialNodes:[]}));});mounted.add(editor);
    const page=()=>editor.root.findAll((item)=>item.type==='section'&&item.props.className==='ne-artboard active')[0];
    await act(async()=>editor.root.findAll((item)=>item.type==='button'&&item.props['aria-label']==='选择画板：第二页')[0].props.onClick());assert.equal(page().props['aria-label'],'画板：第二页');
    await act(async()=>editor.root.findAll((item)=>item.type==='div'&&item.props['data-component-id']==='sample')[0].props.onClick(event()));
    assert.equal(page().props['aria-label'],'画板：第二页');
    await act(async()=>editor.root.findAll((item)=>item.type==='button'&&item.props['aria-label']==='选中')[0].props.onClick());
    assert.equal(page().props['aria-label'],'画板：第二页');
    await act(async()=>editor.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='内边距纵向')[0].props.onChange(event('12')));
    assert.equal(page().props['aria-label'],'画板：第二页');
    assert.equal(editor.root.findAll((item)=>item.type==='div'&&item.props['data-component-id']==='sample')[0].props.style.padding,'12px 0px');
  } finally {
    if(editor){await act(async()=>editor.unmount());mounted.delete(editor);}globalThis.localStorage=oldStorage;globalThis.window=oldWindow;
  }
});

test('actual editor saves synchronized selector styles and reopens them on the second tab', async () => {
  const previousStorage = globalThis.localStorage, previousWindow = globalThis.window;
  const records = new Map();
  globalThis.localStorage = { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  const source = fixture(createCatalogComponent('Tabs', 'tabs'));
  saveComponentDocument(localStorage, source);
  let editor;
  try {
    const open = async () => { await act(async () => { editor = TestRenderer.create(React.createElement(Editor, { template: { id: 'audit' }, initialNodes: [] })); }); mounted.add(editor); };
    const preview = (id) => editor.root.findAll((item) => item.type === 'div' && item.props['data-component-id'] === id)[0];
    const change = async (label, value) => act(async () => editor.root.findAll((item) => item.type === 'input' && item.props['aria-label'] === label)[0].props.onChange(event(value)));
    await open();
    await act(async () => preview('tabs/controls-0').props.onClick(event()));
    await change('子项间距', '17');
    await change('内边距横向', '8');
    await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
    const saved = readComponentDocument(localStorage, 'audit');
    for (const id of ['tabs/controls-0', 'tabs/controls-1']) {
      const control = indexDocument(saved).nodes.get(id);
      assert.equal(control.props.gap, 17);
      assert.equal(control.props.paddingHorizontal, 8);
    }
    assert.deepEqual(saved.products, source.products);
    await act(async () => editor.unmount()); mounted.delete(editor);
    await open();
    const interact = editor.root.findAll((item) => item.type === 'button' && item.children.includes('交互预览'))[0];
    assert.ok(interact, '缺少交互预览入口');
    await act(async () => interact.props.onClick());
    await act(async () => preview('tabs/tab-button-0-1').props.onClick(event()));
    assert.equal(preview('tabs/controls-1').props.style.gap, '17px');
    assert.equal(preview('tabs/controls-1').props.style.padding, '2px 8px');
    assert.deepEqual(preview('tabs/tab-content-1').children, ['文字']);
  } finally {
    if (editor) { await act(async () => editor.unmount()); mounted.delete(editor); }
    globalThis.localStorage = previousStorage; globalThis.window = previousWindow;
  }
});

test('invalid color drafts are marked and cannot overwrite the previous effective color', async () => {
  const previous = globalThis.CSS;
  globalThis.CSS = { supports: (_property, value) => /^#[a-f\d]{6}$/i.test(value) || ['transparent', 'inherit'].includes(value) };
  try {
    const h = await mount(component('sample', 'Text', '', { text: 'A', color: '#123456' }));
    await h.change('文字颜色值', 'not-a-color'); assert.equal(h.node().props.style.color, '#123456');
    const input = () => h.renderer.root.findAll((item) => item.type === 'input' && item.props['aria-label'] === '文字颜色值')[0];
    assert.equal(input().props['aria-invalid'], true);
    await act(async () => input().props.onBlur()); assert.equal(input().props.value, '#123456');
    await h.change('文字颜色值', '#abcdef'); assert.equal(h.node().props.style.color, '#abcdef');
    await h.close();
  } finally { globalThis.CSS = previous; }
});

test('reference panels: text and icon do not expose redundant generic appearance or duplicate size controls', async () => {
  const text = await mount(component('sample','Text','文字',{text:'A'}));
  assert.equal(text.renderer.root.findAll((item)=>item.type==='select'&&item.props['aria-label']==='形状').length,0);
  assert.equal(text.renderer.root.findAll((item)=>item.type==='strong'&&['外观','填充','边框','阴影'].includes(item.children.join(''))).length,0);
  assert.equal(text.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='背景颜色值').length,1);
  await text.close();
  const icon = await mount(component('sample','Icon','图标',{icon:'check'}));
  assert.equal(icon.renderer.root.findAll((item)=>item.type==='input'&&['宽度','高度'].includes(item.props['aria-label'])).length,2);
  assert.equal(icon.renderer.root.findAll((item)=>item.type==='label'&&item.props.className==='rc-field'&&item.findAllByType('button').some((button)=>button.props['aria-label']==='填满')).length,0);
  assert.equal(icon.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='背景颜色值').length,0);
  await icon.optional('图标背景'); await icon.change('背景颜色值','#abcdef'); assert.equal(icon.node().props.style.background,'#abcdef');
  await icon.optional('图标背景'); assert.equal(icon.node().props.style.background,'transparent');
  await icon.close();
});

test('fill limits: adding, removing, reloading and leaving Fill preserve one canonical limit', async () => {
  const h = await mount(component('sample','Stack'));
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='最小宽度').length,0);
  await h.limit('宽度','最小'); await h.change('最小宽度','35'); await h.limit('宽度','最大'); await h.change('最大宽度','240');
  assert.equal(indexDocument(h.document()).nodes.get('sample').props.minWidthEnabled,true);
  await h.click('移除最小宽度'); assert.equal(h.node().props.style.minWidth,0);
  await h.segment('宽度','固定'); assert.equal(indexDocument(h.document()).nodes.get('sample').props.maxWidth,0);
  await h.segment('宽度','填满'); assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='最大宽度').length,0);
  await h.close();
});

test('optional fill can disable an image without deleting its source and re-enable the exact source', async () => {
  const h=await mount(component('sample','Stack','容器',{backgroundImage:'/background.png',background:'#123456'}));
  await h.optional('填充'); assert.equal(h.node().props.style.backgroundImage,undefined); assert.equal(h.node().props.style.background,'transparent');
  assert.equal(indexDocument(h.document()).nodes.get('sample').props.backgroundImage,'/background.png');
  await h.optional('填充'); assert.ok(h.node().props.style.backgroundImage.includes('/background.png'));
  await h.close();
});

test('video configuration maps all playback flags and prevents a video with no way to start', async () => {
  const h=await mount(component('sample','Video','视频',{src:'/video.mp4'}));
  await h.check('自动播放',true); await h.check('循环播放',true); await h.check('静音',false); await h.check('播放控件',false);
  let video=h.node().findByType('video'); assert.equal(video.props.autoPlay,true);assert.equal(video.props.loop,true);assert.equal(video.props.muted,false);assert.equal(video.props.controls,false);
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='自动播放')[0].props.disabled,true);
  await h.check('播放控件',true); await h.check('自动播放',false); video=h.node().findByType('video'); assert.equal(video.props.autoPlay,false);assert.equal(video.props.controls,true);
  await h.check('播放控件',false); assert.equal(h.node().findByType('video').props.autoPlay,true);
  await h.close();
});

test('font weight selection and bold shortcut cannot leave two conflicting effective weights', async () => {
  const h=await mount(component('sample','Text','文字',{text:'A',bold:true,fontWeight:700,runs:[{text:'A',bold:true,fontWeight:700}]}));
  await h.select('字重','500');assert.equal(h.node().props.style.fontWeight,500);assert.equal(h.node().findByType('span').props.style.fontWeight,500);
  await h.editText({runs:[{text:'A',bold:true,fontWeight:700}]});assert.equal(h.node().findByType('span').props.style.fontWeight,700);
  await h.editText({runs:[{text:'A',bold:false,fontWeight:400}]});assert.equal(h.node().findByType('span').props.style.fontWeight,400);
  await h.close();
});

test('tab button selected state has full standard styling without a second selected-color form', async () => {
  const button=component('sample','TabButton','标签',{target:'tabs',index:0,background:'#ffffff'},[component('label','Text','文字',{text:'标签'})]);
  const h=await mount(button,{source:fixture(component('row','Stack','',{},[button,createCatalogComponent('Tabs','tabs')]))});
  await h.click('选中');await h.change('背景颜色不透明度','60');await h.optional('边框');await h.change('边框宽度','3');await h.change('边框颜色值','#abcdef');
  assert.equal(h.node().props.style.background,'color-mix(in srgb, #167aff 60%, transparent)');assert.equal(h.node().props.style.opacity,1);assert.equal(h.node().props.style.border,'3px solid #abcdef');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='选中背景值').length,0);
  await h.click('默认');assert.equal(h.node().props.style.border,undefined);assert.equal(h.node().props.style.opacity,1);
  await h.close();
});

test('carousel spacing, peek and page-control fields change the actual rail, slide and controller', async () => {
  const h=await mount(createCatalogComponent('Carousel','sample'));
  await h.change('页面间距','18');await h.change('邻页露出','24');await h.select('分页器位置','top');await h.select('页面纵向对齐','bottom');
  const track=h.node().findAll((item)=>item.type==='div'&&item.props.className==='nc-carousel-track')[0];
  assert.equal(track.props.style.gap,18);assert.equal(track.findAll((item)=>item.type==='div'&&item.props['data-carousel-page']===0)[0].props.style.flex,'0 0 calc(100% - 48px)');
  const dom=h.node().findAll((item)=>typeof item.type==='string');assert.ok(dom.indexOf(h.node('sample/page-control'))<dom.findIndex((item)=>item.props.className==='nc-carousel-viewport'));assert.equal(track.props.style.alignItems,'flex-end');
  await h.check('循环播放',true);assert.equal(indexDocument(h.document()).nodes.get('sample').props.loop,true);
  await h.check('自动切换',true);await h.change('每页停留时间','1800');await h.change('过渡时间','700');await h.select('过渡动画','fade');
  assert.equal(indexDocument(h.document()).nodes.get('sample').props.transitionTime,700);assert.equal(indexDocument(h.document()).nodes.get('sample').props.transitionAnimation,'fade');
  await h.change('内边距纵向','9');await h.click('内边距切换上下配置');await h.change('内边距上','13');assert.equal(h.node().props.style.padding,'13px 0px 9px 0px');
  await h.optional('外观');await h.change('圆角','11');assert.equal(h.node().props.style.borderRadius,11);await h.optional('外观');assert.equal(h.node().props.style.borderRadius,0);
  for(const label of ['宽度','高度','内边距横向','分页指示器颜色值','当前分页颜色值'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='子项间距').length,0);
  await h.close();
});

test('page control spacing and indicator Default/Active fields each have exactly one preview owner',async()=>{
  const carousel=createCatalogComponent('Carousel','rail'),source=fixture(carousel),control=carousel.children.find((node)=>node.type==='PageControl'),indicator=control.children[0];
  const h=await mount(control,{source});await h.change('指示器间距','15');assert.equal(h.node().props.style.gap,15);await h.change('内边距纵向','10');assert.equal(h.node().props.style.padding,'10px 8px');
  for(const label of ['轴向','宽度','高度'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);await h.close();
  const dots=await mount(indicator,{source});const buttons=()=>dots.renderer.root.findAll((item)=>item.type==='button'&&item.props['data-indicator-index']!==undefined);
  assert.equal(buttons().length,3);await dots.change('宽度','12');await dots.change('高度','6');await dots.change('背景颜色值','#123456');await dots.change('背景颜色不透明度','40');
  assert.equal(buttons()[1].props.style.width,'12px');assert.equal(buttons()[1].props.style.background,'color-mix(in srgb, #123456 40%, transparent)');
  await dots.click('当前');await dots.change('宽度','18');await dots.change('背景颜色值','#abcdef');await dots.optional('描边');await dots.change('边框宽度','2');
  assert.equal(buttons()[0].props.style.width,'18px');assert.equal(buttons()[1].props.style.width,'12px');assert.equal(buttons()[0].props.style.border,'2px solid #000000');
  for(const label of ['形状','字号','内边距纵向','X 偏移'])assert.equal(dots.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);
  const store=new Map(),storage={getItem:(key)=>store.get(key),setItem:(key,value)=>store.set(key,value)};assert.ok(saveComponentDocument(storage,dots.document()));assert.deepEqual(readComponentDocument(storage,'audit'),dots.document());await dots.close();
});

test('countdown date, count-from units and padded variables update the configured branches', async () => {
  const original=Date.now;const now=Date.parse('2026-10-24T00:00:00Z');Date.now=()=>now;
  try{
    const timer=createCatalogComponent('Countdown','sample');timer.props.deadline='2026-10-26T03:04:05Z';
    const h=await mount(timer);await h.select('计时单位','days');assert.deepEqual(h.node('sample/countdown-text').children,['02 : 03 : 04 : 05']);
    await h.select('计时单位','hours');assert.deepEqual(h.node('sample/countdown-text').children,['02 : 51 : 04 : 05']);
    await h.select('计时单位','minutes');assert.deepEqual(h.node('sample/countdown-text').children,['02 : 51 : 3064 : 05']);
    await h.change('目标时间（UTC）','2026-10-23T00:00:00Z');assert.ok(h.node('sample/ended'));
    await h.change('目标时间（UTC）','invalid');assert.equal(h.node('sample/fallback'),undefined);await h.check('自定义兜底内容',true);assert.ok(h.node('sample/fallback'));
    for(const label of ['宽度','高度','轴向','内边距纵向','形状','预览状态'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);
    await h.close();
  }finally{Date.now=original;}
});

test('countdown displays offset dates in UTC without changing the stored deadline until edited',async()=>{
  const timer=createCatalogComponent('Countdown','sample');timer.props.deadline='2026-10-26T11:04:05+08:00';
  const h=await mount(timer);
  const field=()=>h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='目标时间（UTC）')[0];
  assert.equal(field().props.value,'2026-10-26T03:04:05');assert.equal(field().props.step,'1');
  assert.equal(indexDocument(h.document()).nodes.get('sample').props.deadline,timer.props.deadline);
  await h.change('目标时间（UTC）','2026-10-26T03:10:15');assert.equal(indexDocument(h.document()).nodes.get('sample').props.deadline,'2026-10-26T03:10:15Z');
  await h.change('目标时间（UTC）','');assert.equal(field().props.value,'');await h.close();
});

test('source switch control owns only thumb and track paints; its cases own layout',async()=>{
  const sw=createCatalogComponent('Switch','sw'),control=sw.children[0].children[0],source=fixture(sw);
  const h=await mount(control,{source,editing:false});await h.change('滑块颜色值','#123456');await h.change('轨道颜色值','#abcdef');await h.change('轨道颜色不透明度','45');
  const button=h.node().findByType('button');assert.equal(button.props.style.background,'color-mix(in srgb, #abcdef 45%, transparent)');assert.equal(button.findByType('span').props.style.background,'#123456');assert.equal(button.props.style.width,51);assert.equal(button.props.style.height,31);
  for(const label of ['宽度','高度','控件类型','内边距纵向','初始状态'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);
  await act(async()=>button.props.onClick(event()));assert.ok(h.node('sw/on'));assert.equal(h.node('sw/off'),undefined);await h.close();
  const root=await mount(sw);assert.equal(root.renderer.root.findAll((item)=>item.props['aria-label']==='轴向').length,0);await root.close();
});

test('wallet styling follows Black, White and White Outline without adding fake device selection',async()=>{
  const h=await mount(createCatalogComponent('Wallet','sample'));await h.select('按钮样式','white');assert.equal(h.node().props.style.background,'#ffffff');assert.equal(h.node().props.style.color,'#000000');
  await h.select('按钮样式','white-outline');assert.equal(h.node().props.style.border,'1px solid #000000');await h.select('按钮样式','black');assert.equal(h.node().props.style.background,'#000000');
  for(const label of ['钱包类型','高度','形状','外边距纵向'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);await h.close();
});

test('custom component exposes ZIP and dimensions only; loading height and fixed size map to its preview',async()=>{
  const h=await mount(createCatalogComponent('Custom','sample'));await h.change('加载时初始高度','240');assert.equal(h.node().findAll((item)=>item.props.className==='nc-empty-custom')[0].props.style.height,240);
  await h.segment('宽度','固定');await h.change('固定宽度','220');await h.segment('高度','固定');await h.change('固定高度','120');assert.equal(h.node().props.style.width,'220px');assert.equal(h.node().props.style.height,'120px');
  for(const label of ['HTML','轴向','内边距纵向','形状','背景颜色值','加载时初始高度'])assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']===label).length,0,label);
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props.type==='file')[0].props.accept,'.zip,application/zip');await h.close();
});

test('text gradient paints its glyphs, not the full text background or wrapper opacity',async()=>{
  const h=await mount(component('sample','Text','文字',{text:'渐变文字',background:'#ffffff'}));
  const gradient='linear-gradient(45deg, #ff5577 0%, #008899 100%)';await h.change('文字颜色值',gradient);
  const span=h.node().findByType('span');assert.equal(span.props.style.backgroundImage,gradient);assert.equal(span.props.style.backgroundClip,'text');assert.equal(span.props.style.color,'transparent');assert.equal(h.node().props.style.background,'#ffffff');assert.equal(h.node().props.style.opacity,1);
  await h.change('文字颜色值','#123456');assert.equal(h.node().findAllByType('span').length,0);assert.equal(h.node().props.style.color,'#123456');await h.close();
});

test('gradient borders preserve the same border box, corners and state owner; shadow remains a solid paint',async()=>{
  const h=await mount(component('sample','Package','商品',{widthMode:'fixed',width:150,heightMode:'fixed',height:100,borderWidth:2,radius:18}));
  const gradient='linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';await h.change('边框颜色值',gradient);
  assert.equal(h.node().props.style.border,'2px solid transparent');assert.equal(h.node().props.style['--nc-border-gradient'],gradient);assert.equal(h.node().props.style.borderRadius,18);assert.equal(h.node().props.style.width,'150px');
  assert.ok(h.renderer.root.findAll(item=>item.type==='input'&&item.props['aria-label']==='边框颜色不透明度')[0].props.disabled);
  await h.segment('状态','选中');await h.change('边框颜色值','#123456');assert.equal(h.node().props.style['--nc-border-gradient'],undefined);assert.equal(h.node().props.style.border,'2px solid #123456');
  await h.segment('状态','默认');assert.equal(h.node().props.style['--nc-border-gradient'],gradient);await h.close();
});

test('badge is one optional parent-owned parameter set; removing it cannot alter card content or dimensions',async()=>{
  const card=component('sample','Stack','卡片',{heightMode:'fixed',height:150},[component('title','Text','标题',{text:'原有标题'})]);
  const h=await mount(card);await h.optional('徽标');await h.change('徽标文字','30% OFF','textarea');await h.change('徽标字号','13');await h.change('徽标背景颜色值','#ff5577');await h.select('徽标对齐','bottom-right');
  const badge=()=>h.renderer.root.findAll((item)=>item.type==='span'&&item.props['data-badge-owner']==='sample')[0];
  assert.equal(badge().props.style.bottom,0);assert.equal(badge().props.style.right,0);assert.equal(badge().props.style.transform,'translate(0,50%)');assert.equal(badge().props.style.fontSize,13);assert.equal(badge().props.style.background,'#ff5577');
  await h.select('徽标样式','nested');assert.equal(badge().props.style.transform,'translate(0,0)');assert.deepEqual(h.node('title').children,['原有标题']);assert.equal(h.node().props.style.height,'150px');
  await h.optional('徽标');assert.equal(badge(),undefined);assert.equal(h.node().props.style.height,'150px');assert.deepEqual(h.document().products,fixture(card).products);await h.close();
});

test('text rules isolate all three offer contents and typography while preserving default layout and data',async()=>{
  const h=await mount(component('sample','Text','文字',{text:'默认文字',fontSize:14,color:'#111111',widthMode:'fixed',width:123}));
  for(const [rule,content,size] of [['introductory','首次优惠',18],['promotional','促销优惠',20],['multiphase','分期优惠',24]]) {
    await h.select('文字规则',rule);await h.change('文字内容',content);await h.change('字号',String(size));
    assert.equal(h.node().children.join(''),content);assert.equal(h.node().props.style.fontSize,size);assert.equal(h.node().props.style.width,'123px');
    assert.equal(h.renderer.root.findAll(item=>item.type==='button'&&item.props['aria-label']==='固定').length,0);
    assert.equal(h.document().root.children[0].props.text,'默认文字');assert.equal(h.document().root.children[0].props.fontSize,14);
  }
  await h.select('文字规则','default');assert.equal(h.node().children.join(''),'默认文字');assert.equal(h.node().props.style.fontSize,14);
  await h.change('文字内容','默认已修改');await h.editText({runs:[{text:'默认已修改',fontWeight:700}]});
  await h.select('文字规则','introductory');assert.equal(h.node().children.join(''),'首次优惠');assert.equal(h.node().props.style.fontSize,18);
  const stored=h.document(),storage=new Map();saveComponentDocument({setItem:(k,v)=>storage.set(k,v)},stored);const restored=readComponentDocument({getItem:k=>storage.get(k)},'audit');assert.deepEqual(restored.root.children[0].props.textRules,stored.root.children[0].props.textRules);assert.deepEqual(stored.products,fixture(component('empty','Text','')).products);await h.close();
});

test('offer typography reaches rich runs without modifying default marks or saved dimensions',async()=>{
  const h=await mount(component('sample','Text','文字',{text:'查看权益',runs:[{text:'查看',fontWeight:700},{text:'权益',fontWeight:400}],fontSize:14}));
  await h.select('文字规则','introductory');await h.change('字号','23');await h.change('文字颜色值','#ff5577');
  const spans=h.node().findAllByType('span');assert.equal(spans[0].props.style.fontSize,23);assert.equal(spans[0].props.style.color,'#ff5577');
  assert.equal(h.document().root.children[0].props.runs[0].fontSize,undefined);
  await h.select('文字规则','default');assert.equal(h.node().props.style.fontSize,14);assert.equal(h.node().findAllByType('span')[0].props.style.fontWeight,700);await h.close();
});

test('shared font family selection reaches plain text, stored rich runs and the preview font-face',async()=>{
  const node=component('sample','Text','文字',{text:'权益',runs:[{text:'权益',fontFamily:'mono'}]}),source=fixture(node);
  source.fonts=[{id:'ht-font-audit',family:'核对字体',faces:[{src:'data:font/otf;base64,AAAA',weight:400,style:'normal'}]}];
  const h=await mount(node,{source});await h.select('字体','ht-font-audit');
  assert.equal(h.node().props.style.fontFamily,'ht-font-audit');assert.equal(h.node().findAllByType('span')[0].props.style.fontFamily,'ht-font-audit');
  assert.ok(h.renderer.root.findAllByType('style')[0].children.join('').includes('font-family:"ht-font-audit"'));
  const stored=h.document(),storage=new Map();saveComponentDocument({setItem:(k,v)=>storage.set(k,v)},stored);assert.deepEqual(readComponentDocument({getItem:k=>storage.get(k)},'audit').fonts,source.fonts);await h.close();
  assert.equal(validDocument({...source,fonts:{broken:true}}),false);
});

test('offer contexts never expose inactive legacy product-binding controls or alter SKU ownership',async()=>{
  const h=await mount(component('sample','Text','商品价格',{binding:{key:'sample',field:'price'}}));
  assert.equal(h.renderer.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='商品字段').length,1);
  await h.select('文字规则','introductory');
  assert.equal(h.renderer.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='商品字段').length,0);
  assert.equal(h.renderer.root.findAll(item=>item.type==='button'&&item.children.join('')==='转为独立文字').length,0);
  await h.change('字号','17');assert.deepEqual(h.document().root.children[0].props.binding,{key:'sample',field:'price'});assert.equal(h.node().props.style.fontSize,17);await h.close();
});

test('an offer may override bound price copy while its default SKU binding and format-only overrides remain intact',async()=>{
  await server.ssrLoadModule('/src/builder/RichTextEditor.jsx');
  const h=await mount(component('sample','Text','商品价格',{binding:{key:'sample',field:'price'}}));
  await h.select('文字规则','introductory');await h.change('字号','17');assert.deepEqual(h.node().children,['¥100']);
  await h.change('文字内容','首次优惠价格');assert.deepEqual(h.node().children,['首次优惠价格']);
  assert.equal(h.document().root.children[0].props.textRules.introductory.contentOverridden,true);assert.deepEqual(h.document().root.children[0].props.binding,{key:'sample',field:'price'});
  await h.select('文字规则','default');assert.deepEqual(h.node().children,['¥100']);assert.equal(h.document().products.sample.price,'¥100');
  await h.select('文字规则','introductory');assert.deepEqual(h.node().children,['首次优惠价格']);await h.close();
});

test('badge rich text, text background and frame fill each have one independent configuration owner',async()=>{
  const h=await mount(component('sample','Stack','框体',{heightMode:'fixed',height:100}));await h.optional('徽标');
  await h.editText({text:'SAVE 30%',runs:[{text:'SAVE',bold:true,fontWeight:700,underline:true},{text:' 30%',fontWeight:400}]},'徽标文字');
  await h.change('徽标文字背景值','#ffffff');await h.change('徽标背景颜色值','#ff5577');
  const badge=()=>h.renderer.root.findAll(item=>item.type==='span'&&item.props['data-badge-owner']==='sample')[0];
  assert.equal(badge().props.style.background,'#ff5577');assert.equal(badge().children[0].props.style.background,'#ffffff');assert.equal(badge().findAllByType('span').find(item=>item.children.includes('SAVE')).props.style.fontWeight,700);
  await h.change('徽标字号','12');assert.ok(badge().findAllByType('span').some(item=>item.props.style.fontSize===12));assert.equal(h.node().props.style.height,'100px');
  const gradient='linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';await h.change('徽标文字颜色值',gradient);assert.equal(badge().children[0].props.style.background,'#ffffff');assert.ok(badge().findAllByType('span').some(item=>item.props.style.backgroundImage===gradient));
  assert.equal(h.document().root.children[0].props.badge.textBackground,'#ffffff');assert.equal(h.renderer.root.findAll(item=>item.type==='textarea'&&item.props['aria-label']==='徽标文字').length,0);await h.close();
});

test('product variables refer to the owning package inside and the selected package outside', async () => {
  const variable=component('sample','Text','价格',{text:'{{ product.price }} · {{ product.price_per_month }}'});
  const first=component('p1','Package','年付',{dataKey:'sample',group:'plans',defaultSelected:true},[component('inside','Text','价格',{text:'{{ product.price }}'})]);
  const second=component('p2','Package','终身',{dataKey:'lifetime',group:'plans'});
  const source=fixture(component('row','Stack','',{},[variable,first,second]));source.products.lifetime={name:'终身',price:'¥200',billingMonths:0};
  const h=await mount(variable,{source,editing:false});assert.ok(h.node().children.join('').includes('¥100'));assert.deepEqual(h.node('inside').children,['¥100']);
  await act(async()=>h.node('p2').props.onClick(event()));assert.deepEqual(h.node().children,['¥200 · ¥200']);assert.deepEqual(h.node('inside').children,['¥100']);
  assert.equal(resolveComponentText(indexDocument(h.document()).nodes.get('sample'),h.document()),'{{ product.price }} · {{ product.price_per_month }}');
  await h.change('文字内容','', 'textarea');await h.editText({text:'{{ product.price }}',runs:null});assert.deepEqual(h.node().children,['¥200']);
  await h.close();
});

test('legacy fill icons become real cell stacks with a fixed glyph without losing layout ownership', () => {
  const original=fixture(component('icon','Icon','权益图标',{widthMode:'fill',heightMode:'fill',flexGrow:.76,background:'#ffffff',color:'#ffb400',icon:'check',iconSize:22,fontSize:17}));
  const next=upgradeCanonicalComponents(original),{nodes,parents}=indexDocument(next),icon=nodes.get('icon'),cell=nodes.get(parents.get('icon'));
  assert.equal(cell.type,'Stack');assert.equal(cell.props.widthMode,'fill');assert.equal(cell.props.flexGrow,.76);assert.equal(cell.props.background,'#ffffff');
  assert.equal(icon.props.width,22);assert.equal(icon.props.height,22);assert.equal(icon.props.color,'#ffb400');assert.equal(icon.props.icon,'check');
  assert.equal(upgradeCanonicalComponents(next),next);assert.deepEqual(next.products,original.products);assert.equal(original.root.children[0].type,'Icon');
});

test('all 45 templates preserve original copy, media and product data after fixed-icon migration', () => {
  for(const template of templates){
    const source=importComponentDocument(createBuilderNodes(template.id),template),next=upgradeCanonicalComponents(source),before=indexDocument(source).nodes,after=indexDocument(next).nodes;
    assert.ok(validDocument(next),template.id);assert.deepEqual(next.products,source.products);
    for(const [id,node] of before){
      const current=after.get(id);assert.ok(current,`${template.id}:${id}`);
      if(node.type==='Countdown'&&!node.children.length)continue;
      for(const key of ['text','runs','src','binding','action','dataKey'])assert.deepEqual(current.props[key],node.props[key],`${template.id}:${id}:${key}`);
      if(node.type==='Icon'&&(node.props.widthMode==='fill'||node.props.heightMode==='fill')){
        const parent=after.get(indexDocument(next).parents.get(id));assert.equal(parent.props.widthMode,node.props.widthMode);assert.equal(parent.props.flexGrow,node.props.flexGrow);
      }
    }
    assert.equal(upgradeCanonicalComponents(next),next);
  }
});

test('buttons expose one action selector while checkout modes remain conditional', async () => {
  const b=await mount(component('sample','Button','按钮',{action:{action:'None'}}),{editing:false});
  const select=b.renderer.root.findAll((item)=>item.type==='select'&&item.props['aria-label']==='点击动作')[0];
  assert.deepEqual(select.findAllByType('option').map((option)=>option.props.value),['None','NavigateTo','NextScreen','NavigateBack','RestorePurchases','Dismiss','Purchase']);
  await b.select('点击动作','NavigateTo');await b.select('导航目标','OpenSheet');
  assert.equal(indexDocument(b.document()).nodes.get('sample').props.action.action,'OpenSheet');await b.close();
  const purchase=await mount(createCatalogComponent('PurchaseButton','sample'),{editing:false});
  assert.equal(purchase.renderer.root.findAll((item)=>item.type==='select'&&item.props['aria-label']==='点击动作').length,1);
  await purchase.select('打开方式','WebCheckout');await act(async()=>purchase.node().props.onClick(event()));assert.equal(purchase.status(),'网页结账预览');await purchase.close();
});

for (const buttonType of ['Button','PurchaseButton']) test(`copied checkout CTA can become a step button and navigate using its edge target (${buttonType})`,async()=>{
  const original=createCatalogComponent('PurchaseButton','sample');
  original.type=buttonType;
  original.props.background='#1278ef';original.props.radius=23;
  const source={version:3,templateId:'audit',products:{original:{name:'Original SKU',price:'¥78'}},root:component('root','Screen','根',{},[
    component('flow','Flow','流程',{initialStepId:'intro'},[
      component('intro','Screen','介绍',{},[original]),
      component('final','Screen','已有购买页',{},[component('final-copy','Text','标题',{text:'Destination'})]),
      component('aux/detail-screen-0','Screen','非流程详情',{},[]),
    ]),
  ])};
  const before=structuredClone(source),styles=copyStyles(original);
  const h=await mount(original,{source,editing:false});
  await h.select('点击动作','NextScreen');
  const selected=indexDocument(h.document()).nodes.get('sample');
  assert.equal(selected.type,'Button');assert.equal(selected.props.action.actionPage,'final');
  assert.deepEqual(copyStyles(selected),styles);assert.deepEqual(selected.children,original.children);assert.deepEqual(h.document().products,before.products);
  const targets=h.renderer.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='步骤')[0];
  assert.deepEqual(targets.findAllByType('option').map(item=>item.props.value),['','final']);
  assert.equal(h.renderer.root.findAll(item=>item.type==='select'&&item.props['aria-label']==='打开方式').length,0);
  assert.deepEqual(workflowEdges(h.document()).map(edge=>[edge.source,edge.target]),[['intro','final']]);
  const store={data:new Map(),getItem(key){return this.data.get(key)??null;},setItem(key,value){this.data.set(key,value);}};
  assert.equal(saveComponentDocument(store,h.document()),true);
  assert.equal(indexDocument(readComponentDocument(store,'audit')).nodes.get('sample').props.action.actionPage,'final');
  await act(async()=>h.node().props.onClick(event()));assert.ok(h.node('final-copy'));
  assert.deepEqual(source,before);await h.close();
});

test('canvas first-click selects a button before its label; drill-in and floating sheet text remain editable',async()=>{
  const label=component('label','Text','按钮文字',{text:'Continue'});
  const title=component('sheet-title','Text','弹层标题',{text:'Sheet title'});
  const doc=fixture(component('cta','Button','CTA',{action:{action:'None'}},[label,component('sheet','BottomSheet','Sheet',{presentation:'overlay'},[title])]));
  let selected,renderer;
  function Harness(){const [id,setId]=React.useState('page');selected=id;return React.createElement(Preview,{document:doc,selectedId:id,onSelect:setId,editing:true,navigation:{overlay:'sheet'},onStatus(){}});}
  const click=async id=>{const node=renderer.root.findAll(item=>item.type==='div'&&item.props['data-component-id']===id)[0];assert.ok(node,id);await act(async()=>node.props.onClick(event()));};
  try{
    await act(async()=>{renderer=TestRenderer.create(React.createElement(Harness));});
    await click('label');assert.equal(selected,'cta','first canvas click exposes button Action instead of text typography');
    await click('label');assert.equal(selected,'label','second click drills into editable label');
    await click('sheet-title');assert.equal(selected,'sheet-title','floating title cannot select its enclosing launcher across a sheet boundary');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('ordinary navigation can explicitly become checkout without changing its content or visual properties',async()=>{
  const original=component('sample','Button','Custom label',{action:{action:'None'},paddingHorizontal:31,radius:17},[component('label','Text','标题',{text:'Keep this label'})]);
  const h=await mount(original),styles=copyStyles(original);
  await h.select('点击动作','Purchase');
  assert.equal(indexDocument(h.document()).nodes.get('sample').type,'PurchaseButton');
  assert.deepEqual(copyStyles(indexDocument(h.document()).nodes.get('sample')),styles);
  assert.equal(indexDocument(h.document()).nodes.get('sample').name,'Custom label');
  await h.select('打开方式','WebCheckout');assert.equal(indexDocument(h.document()).nodes.get('sample').type,'PurchaseButton');
  await h.select('点击动作','Dismiss');assert.equal(indexDocument(h.document()).nodes.get('sample').type,'Button');
  assert.equal(indexDocument(h.document()).nodes.get('label').props.text,'Keep this label');await h.close();
});

test('HT flow layers exclude generated sample and empty auxiliary screens without deleting their data or links',async()=>{
  const template=templates.find(item=>item.id==='ht-blue-privilege');
  const initialNodes=createBuilderNodes(template.id),document=importComponentDocument(initialNodes,template),before=structuredClone(document);
  assert.ok([...indexDocument(document).nodes.values()].some(node=>node.name==='中秋月夜 | 谁看了我'));
  let renderer;
  try{
    await act(async()=>{renderer=TestRenderer.create(React.createElement(Editor,{template,initialNodes,initialDocument:document,persistence:'session'}));});
    const layers=renderer.root.findAll(item=>item.type==='div'&&item.props['data-layer-type']==='Screen');
    assert.equal(layers.some(item=>String(item.props['data-layer-id']).includes('/detail-screen-')),false);
    assert.equal(renderer.root.findAll(item=>item.type==='summary'&&item.children.join('')==='未配置详情').length,0);
    assert.deepEqual(document,before,'the correction removes redundant layer output, not user content or routes');
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('purchase checkout modes expose source-specific URL parameters without duplicate ordinary actions',async()=>{
  const original=globalThis.window,opened=[];globalThis.window={open:(...args)=>opened.push(args),location:{assign:(value)=>opened.push([value])}};
  try{
    const button=createCatalogComponent('PurchaseButton','sample');
    const source=fixture(component('content','Stack','',{},[component('plan','Package','年付',{dataKey:'sample',defaultSelected:true}),button]));
    const h=await mount(button,{source,editing:false});
    await h.select('打开方式','WebPaywall');await act(async()=>h.node().props.onClick(event()));assert.equal(h.status(),'网页付费墙预览：未发起真实交易');
    await h.select('打开方式','CustomCheckout');await h.change('结账链接','https://example.com/?campaign=ht');await act(async()=>h.node().props.onClick(event()));
    const url=new URL(opened.at(-1)[0]);assert.equal(url.searchParams.get('rc_package'),'sample');assert.equal(url.searchParams.get('rc_app_user_id'),'demo-preview');assert.equal(url.searchParams.get('rc_env'),'sandbox');
    await h.check('附带商品套餐 ID',false);await h.check('附带应用用户 ID',false);await h.check('附带环境',false);await act(async()=>h.node().props.onClick(event()));assert.equal(opened.at(-1)[0],'https://example.com/?campaign=ht');
    await h.select('链接打开方式','deep_link');await h.change('结账链接','hellotalk://checkout');await act(async()=>h.node().props.onClick(event()));assert.equal(opened.at(-1)[0],'hellotalk://checkout');
    await h.select('打开方式','Purchase');assert.equal(h.renderer.root.findAll((item)=>item.props['aria-label']==='结账链接').length,0);
    assert.equal(indexDocument(h.document()).nodes.get('sample').props.action.actionUrl,'hellotalk://checkout');assert.deepEqual(h.document().products,source.products);await h.close();
  }finally{globalThis.window=original;}
});

test('navigate back returns within the current flow before falling back to the mock close action', async () => {
  const button=component('sample','Button','返回',{action:{action:'NavigateBack'}});
  const source=fixture(component('flow','Flow','',{defaultIndex:1},[component('p1','Screen'),component('p2','Screen','',{},[button])]));
  const h=await mount(button,{source,editing:false});await act(async()=>h.node().props.onClick(event()));assert.ok(h.node('p1'));assert.equal(h.node('p2'),undefined);await h.close();
});
