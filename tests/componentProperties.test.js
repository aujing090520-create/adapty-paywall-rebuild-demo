import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component, componentProps, indexDocument, updateComponent, saveComponentDocument, readComponentDocument, COMPONENT_TYPES, cloneComponent, resolveComponentText } from '../src/builder/componentDocument.js';
import { DEMO_SKUS } from '../src/productPricing.js';
import { copyStyles, pasteStyles } from '../src/builder/componentOperations.js';
import { createCatalogComponent, upgradeCanonicalComponents } from '../src/builder/componentCatalog.js';
import { textPropertyPatch, countdownSeconds, defaultPackagePatch } from '../src/builder/propertyModel.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument, validDocument } from '../src/builder/componentDocument.js';

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
    const patch = (props) => setDocument((current) => updateComponent(current, node.id, { props: textPropertyPatch(indexDocument(current).nodes.get(node.id), props) }));
    return React.createElement(React.Fragment, null,
      React.createElement(Properties, { selected, p: componentProps(selected), patch, document, nodes, parents, setNavigation, onStatus: (value) => { status = value; }, demoSkus: DEMO_SKUS, fieldNames: { name: '商品名称', price: '主价格' }, findPackage: () => null, resolveText: resolveComponentText, changeProduct: (key, value) => setDocument((current) => ({ ...current, products: { ...current.products, [selected.props.dataKey ?? selected.id]: { ...current.products[selected.props.dataKey ?? selected.id], [key]: value } } })), onMediaType: (type) => setDocument((current) => updateComponent(current, node.id, { type })), setDefaultPackage: (defaultSelected) => patch({ defaultSelected }) }),
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
    async change(name, value, tag = 'input') { const input = fields(name, tag)[0] ?? renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === name))[0]?.findAllByType(tag)[0]; assert.ok(input, `缺少字段 ${name}`); await act(async () => input.props.onChange(event(value))); },
    async click(name) { const button = fields(name, 'button')[0] ?? renderer.root.findAll((item) => item.type === 'button' && item.children.join('') === name)[0]; assert.ok(button, `缺少按钮 ${name}`); await act(async () => button.props.onClick(event())); },
    async segment(label, choice) { const field = renderer.root.findAll((item) => item.type === 'label' && item.children.some((child) => typeof child === 'object' && child.type === 'span' && child.children.join('') === label))[0]; assert.ok(field, `缺少分段 ${label}`); await act(async () => field.findAllByType('button').find((item) => item.props['aria-label'] === choice).props.onClick()); },
    async optional(title) { const section = renderer.root.findAll((item) => item.type === 'section' && item.findAllByType('strong').some((child) => child.children.join('') === title))[0]; assert.ok(section, `缺少模块 ${title}`); await act(async () => section.findAllByType('button').find((item) => item.props.className?.includes('rc-optional-toggle')).props.onClick()); },
    async select(name, value) { const input = fields(name, 'select')[0]; assert.ok(input, `缺少选择 ${name}`); assert.ok(input.findAllByType('option').some((option)=>String(option.props.value)===String(value)),`选项不存在 ${name}:${value}`); await act(async () => input.props.onChange(event(value))); },
    async limit(axis, bound) { await this.click(`添加${axis}约束`); await this.click(`添加${bound}${axis}`); },
    async close() { await act(async () => renderer.unmount()); mounted.delete(renderer); },
  };
}

for (const type of COMPONENT_TYPES) {
  test(`${type}: configuration size, spacing, opacity, border and persistence map to the live component`, async () => {
    const node = type === 'BottomSheet' ? component('sample', 'BottomSheet', '底部弹层') : createCatalogComponent(type, 'sample');
    assert.equal(node.type, type);
    if (node.props.presentation) delete node.props.presentation;
    node.props.hidden = false;
    if (type === 'Text') node.props.text = '文字';
    const h = await mount(node);
    if(type === 'Icon') await h.optional('图标背景');
    if(type !== 'Text') {
    if(type !== 'Icon') {
    await h.select(type === 'Image' ? '遮罩' : '形状', 'rectangle');
    }
    await h.change('圆角', '9');
    assert.equal(h.node().props.style.borderRadius, 9);
    if (type === 'Image') { await h.select('遮罩', 'circle'); assert.equal(h.node().props.style.borderRadius, '50%'); await h.select('遮罩', 'rectangle'); }
    else if(type !== 'Icon') { await h.select('形状', 'pill'); assert.equal(h.node().props.style.borderRadius, 999); await h.select('形状', 'rectangle'); }
    }
    if(type !== 'Icon') await h.segment('宽度', '固定'); await h.change(type === 'Icon' ? '宽度' : '固定宽度', '120');
    assert.equal(h.node().props.style.width, '120px');
    if(type !== 'Icon') await h.segment('高度', '固定'); await h.change(type === 'Icon' ? '高度' : '固定高度', '80');
    assert.equal(h.node().props.style.height, '80px');
    if(type !== 'Icon') {
    await h.segment('宽度', '填满'); await h.limit('宽度', '最小'); await h.limit('宽度', '最大'); await h.change('最小宽度', '20'); await h.change('最大宽度', '180');
    assert.equal(h.node().props.style.minWidth, 20); assert.equal(h.node().props.style.maxWidth, 180);
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
    await h.change('外边距纵向', '-7'); await h.change('外边距横向', '9');
    assert.equal(h.node().props.style.margin, '-7px 9px');
    await h.click('外边距切换为四边配置'); await h.change('外边距右', '14');
    assert.equal(h.node().props.style.margin, '-7px 14px -7px 9px');
    await h.click('外边距切换为轴向配置'); assert.equal(h.node().props.style.margin, '-7px 14px');
    if(type !== 'Text') {
    await h.change('透明度', '35');
    assert.equal(h.node().props.style.opacity, .35);
    if (type !== 'Icon' && !Number(indexDocument(h.document()).nodes.get('sample').props.borderWidth)) await h.optional('边框');
    await h.change('边框宽度', '3'); await h.change('边框颜色值', '#456789');
    assert.equal(h.node().props.style.border, '3px solid #456789');
    if(type === 'Icon') await h.change('边框宽度','0'); else await h.optional('边框'); assert.equal(h.node().props.style.border, undefined);
    if(type !== 'Icon') {
    await h.optional('阴影'); await h.change('X 偏移', '-4'); await h.change('Y 偏移', '6'); await h.change('模糊', '12'); await h.change('阴影颜色值', '#123456');
    assert.equal(h.node().props.style.boxShadow, '-4px 6px 12px #123456');
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

test('text: font, rich-run overrides, bold reset and combined decorations are effective', async () => {
  const node = component('sample', 'Text', '文字', { text: '甲乙', runs: [{ text: '甲', color: '#ff0000', fontSize: 30, fontWeight: 800 }, { text: '乙' }], fontWeight: 700 });
  const h = await mount(node);
  await h.change('字号', '19');
  await h.change('文字颜色值', '#123456');
  assert.ok(indexDocument(h.document()).nodes.get('sample').props.runs.every((run) => run.fontSize === 19 && run.color === '#123456'));
  await h.click('粗体');
  assert.equal(h.node().props.style.fontWeight, 400);
  await h.click('下划线'); await h.click('删除线');
  assert.ok(h.node().props.style.textDecoration.includes('underline'));
  assert.ok(h.node().props.style.textDecoration.includes('line-through'));
  await h.change('片段 1', '丙');
  assert.equal(h.renderer.root.findByType('textarea').props.value, '丙乙');
  assert.equal(resolveComponentText(indexDocument(h.document()).nodes.get('sample'), h.document()), '丙乙');
  await h.close();
});

test('package: selected style uses the same field set and can remove the default border and shadow', async () => {
  const node = createCatalogComponent('Package', 'sample');
  node.props.borderColor = '#111111'; node.props.shadowBlur = 8;
  const h = await mount(node);
  await h.click('选中');
  await h.change('边框颜色值', '#abcdef');
  await h.change('透明度', '40');
  assert.match(h.node().props.style.border, /#abcdef/);
  assert.equal(h.node().props.style.opacity, .4);
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
  assert.ok(h.node('sample/slide-1'));
  assert.equal(active(h.renderer), 1);
  await h.click('第 1 页');
  assert.ok(h.node('sample/slide-0'));
  assert.equal(active(h.renderer), 0);
  await h.close();
  node.props.loop = true;
  node.props.defaultIndex = 1;
  const loop = await mount(node, { editing: false });
  await act(async () => new Promise((resolve) => setTimeout(resolve, 280)));
  assert.ok(loop.node('sample/slide-0'));
  assert.equal(active(loop.renderer), 0);
  await loop.close();
});

test('countdown: malformed values use fallback; zero duration uses ended state', async () => {
  const node = createCatalogComponent('Countdown', 'sample'); node.props.start = 'invalid'; delete node.props.deadline;
  const h = await mount(node);
  assert.ok(h.node('sample/fallback'));
  assert.equal(countdownSeconds('00:61:00'), null);
  assert.equal(countdownSeconds('71:49:28'), 258568);
  await h.close();
  const ended = await mount({ ...node, props: { ...node.props, start: '00:00:00' } });
  assert.ok(ended.node('sample/ended')); assert.equal(ended.node('sample/active'), undefined);
  await ended.select('预览状态', 'active'); assert.ok(ended.node('sample/active'));
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

test('switch and checkout preview states expose only the selected real child branch', async () => {
  for (const [type, state, visible, hidden] of [['Switch', '1', 'sample/on', 'sample/off'], ['ExpressCheckout', 'loading', 'sample/loading', 'sample/available']]) {
    const h = await mount(createCatalogComponent(type, 'sample'));
    await h.select('预览状态', state);
    assert.ok(h.node(visible)); assert.equal(h.node(hidden), undefined);
    await h.close();
  }
});

test('text content, font family, alignment and background reach the rendered text', async () => {
  const h = await mount(component('sample', 'Text', '标题', { text: '旧内容', textBackground: '#ff0000', fillEnabled: false }));
  assert.equal(h.node().props.style.background, 'transparent');
  await h.change('文字内容', '新内容', 'textarea');
  assert.ok(h.node().children.includes('新内容'));
  await h.select('字体', 'serif'); assert.equal(h.node().props.style.fontFamily, 'Georgia, serif');
  await h.select('文字对齐', 'right'); assert.equal(h.node().props.style.textAlign, 'right');
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
  await h.change('叠加层颜色值', '#ff0000'); assert.equal(h.node().findAllByType('span').at(-1).props.style.background, '#ff0000');
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
  const h = await mount(component('sample', 'Stack', '容器', {}, [component('a', 'Text', '', { text: 'A' }), component('b', 'Text', '', { text: 'B' })]));
  await h.click('横向'); assert.equal(h.node().props.style.flexDirection, 'row');
  await h.click('居中'); assert.equal(h.node().props.style.alignItems, 'center');
  await h.select('分布', 'between'); assert.equal(h.node().props.style.justifyContent, 'space-between');
  await h.change('子项间距', '17'); assert.equal(h.node().props.style.gap, '17px');
  await h.segment('换行', '换行'); assert.equal(h.node().props.style.flexWrap, 'wrap');
  await h.click('叠放'); await h.click('末尾'); assert.equal(h.node().props.style.display, 'grid'); assert.equal(h.node().props.style.justifyItems, 'end');
  await h.close();
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
  const button = component('sample', 'TabButton', '标签', { target: 'tabs', index: 1 }, [component('label', 'Text', '文字', { text: '第二页' })]);
  const source = fixture(component('row', 'Stack', '', {}, [button, tabs]));
  const h = await mount(button, { source, editing: false });
  await h.click('选中'); await h.change('背景颜色值', '#ff00ff'); await h.change('文字颜色值', '#123456');
  await act(async () => h.node().props.onKeyDown({ ...event(), key: 'Enter' }));
  assert.ok(h.node('tabs/tab-1')); assert.equal(h.node('tabs/tab-0'), undefined);
  assert.equal(h.node().props.style.color, '#123456'); assert.equal(h.node().props.style.background, '#ff00ff');
  assert.equal(h.node('label').props.style.color, 'inherit');
  await h.select('对应页面', '0'); await act(async () => h.node().props.onClick(event()));
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
    await act(async () => h.node().props.onKeyDown({ ...event(), key: ' ' }));
    assert.deepEqual(opened, [['https://example.com/path', '_blank', 'noopener,noreferrer']]);
    await h.change('链接地址', 'javascript:alert(1)'); await act(async () => h.node().props.onClick(event()));
    assert.equal(opened.length, 1); assert.match(h.status(), /有效/);
    await h.close();
  } finally { globalThis.window = previous; }
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
  const source = fixture(component('flow', 'Flow', '', {}, [component('p1', 'Screen', '', {}, [purchase, toggle, component('hidden', 'Toggle', '', { required: true, hidden: true })]), component('p2', 'Screen', '', {}, [component('other-page', 'Toggle', '', { required: true })])]));
  const h = await mount(purchase, { source, editing: false });
  await act(async () => h.node().props.onClick(event())); assert.equal(h.status(), '请先勾选同意协议');
  await act(async () => h.node('agreement').findByType('input').props.onChange({ target: { checked: true } }));
  await act(async () => h.node().props.onClick(event())); assert.equal(h.status(), '购买预览：未发起真实交易');
  await h.close();
  const sw = createCatalogComponent('Switch', 'sw'); sw.props.defaultIndex = 1;
  const linked = await mount(sw, { editing: false });
  assert.equal(linked.node('sw/control').findByType('input').props.checked, true);
  await act(async () => linked.node('sw/control').findByType('input').props.onChange({ target: { checked: false } }));
  assert.ok(linked.node('sw/off')); assert.equal(linked.node('sw/on'), undefined);
  await linked.close();
});

test('timer field selection removes incompatible rich text and SKU binding', async () => {
  const node = component('sample', 'Text', '', { text: '原文', runs: [{ text: '遮挡计时值' }], binding: { field: 'price', key: 'sample' } });
  const source = fixture(component('timer', 'Countdown', '', { start: '02:03:04' }, [component('active', 'CountdownState', '', { state: 'active' }, [node])]));
  const h = await mount(node, { source });
  await h.select('倒计时字段', 'hours');
  assert.deepEqual(h.node().children, ['02']); assert.equal(indexDocument(h.document()).nodes.get('sample').props.binding, null);
  await h.select('倒计时字段', 'minutes'); assert.deepEqual(h.node().children, ['03']);
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
    const change = async (label, value, type = 'input') => act(async () => editor.root.findAll((item) => item.type === type && item.props['aria-label'] === label)[0].props.onChange(event(value)));
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
  await h.segment('自动播放','开启'); await h.segment('循环播放','开启'); await h.segment('静音','关闭'); await h.segment('播放控件','关闭');
  let video=h.node().findByType('video'); assert.equal(video.props.autoPlay,true);assert.equal(video.props.loop,true);assert.equal(video.props.muted,false);assert.equal(video.props.controls,false);
  await h.segment('自动播放','关闭'); video=h.node().findByType('video'); assert.equal(video.props.autoPlay,false);assert.equal(video.props.controls,true);
  await h.segment('播放控件','关闭'); assert.equal(h.node().findByType('video').props.autoPlay,true);
  await h.close();
});

test('font weight selection and bold shortcut cannot leave two conflicting effective weights', async () => {
  const h=await mount(component('sample','Text','文字',{text:'A',bold:true,fontWeight:700,runs:[{text:'A',bold:true,fontWeight:700}]}));
  await h.select('字重','500');assert.equal(h.node().props.style.fontWeight,500);assert.equal(h.node().findByType('span').props.style.fontWeight,500);
  await h.click('粗体');assert.equal(h.node().props.style.fontWeight,700);
  await h.click('粗体');assert.equal(h.node().props.style.fontWeight,400);
  await h.close();
});

test('tab button selected state has full standard styling without a second selected-color form', async () => {
  const button=component('sample','TabButton','标签',{target:'tabs',index:0,background:'#ffffff'},[component('label','Text','文字',{text:'标签'})]);
  const h=await mount(button,{source:fixture(component('row','Stack','',{},[button,createCatalogComponent('Tabs','tabs')]))});
  await h.click('选中');await h.change('透明度','60');await h.optional('边框');await h.change('边框宽度','3');await h.change('边框颜色值','#abcdef');
  assert.equal(h.node().props.style.opacity,.6);assert.equal(h.node().props.style.border,'3px solid #abcdef');
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='选中背景值').length,0);
  await h.click('默认');assert.equal(h.node().props.style.border,undefined);assert.equal(h.node().props.style.opacity,1);
  await h.close();
});

test('carousel spacing, peek and page-control fields change the actual rail, slide and controller', async () => {
  const h=await mount(createCatalogComponent('Carousel','sample'));
  await h.change('页面间距','18');await h.change('邻页露出','24');await h.select('分页器位置','top');await h.change('分页指示器颜色值','#123456');await h.change('当前分页颜色值','#abcdef');
  const track=h.node().findAll((item)=>item.type==='div'&&item.props.className==='nc-carousel-track')[0];
  assert.equal(track.props.style.gap,18);assert.equal(track.findAll((item)=>item.type==='div'&&item.props['data-carousel-page']===0)[0].props.style.flex,'0 0 calc(100% - 48px)');
  const direct=h.node().children.filter((item)=>typeof item==='object'&&typeof item.type==='string');assert.equal(direct[0].props.className,'nc-pagination');
  const buttons=direct[0].findAllByType('button');assert.equal(buttons[0].props.style.color,'#abcdef');assert.equal(buttons[1].props.style.color,'#123456');
  await h.segment('循环播放','开启');assert.equal(indexDocument(h.document()).nodes.get('sample').props.loop,true);
  assert.equal(h.renderer.root.findAll((item)=>item.type==='input'&&item.props['aria-label']==='子项间距').length,0);
  await h.close();
});

test('countdown date, count-from units and padded variables update the configured branches', async () => {
  const original=Date.now;const now=Date.parse('2026-10-24T00:00:00Z');Date.now=()=>now;
  try{
    const timer=createCatalogComponent('Countdown','sample');timer.props.deadline='2026-10-26T03:04:05Z';
    const h=await mount(timer);await h.select('计时单位','days');assert.deepEqual(h.node('sample/hours').children,['03']);
    await h.select('计时单位','hours');assert.deepEqual(h.node('sample/hours').children,['51']);
    await h.select('计时单位','minutes');assert.deepEqual(h.node('sample/minutes').children,['3064']);
    await h.change('目标时间（UTC）','2026-10-23T00:00:00Z');assert.ok(h.node('sample/ended'));
    await h.change('目标时间（UTC）','invalid');assert.ok(h.node('sample/fallback'));
    await h.close();
  }finally{Date.now=original;}
});

test('product variables refer to the owning package inside and the selected package outside', async () => {
  const variable=component('sample','Text','价格',{text:'{{ product.price }} · {{ product.price_per_month }}'});
  const first=component('p1','Package','年付',{dataKey:'sample',group:'plans',defaultSelected:true},[component('inside','Text','价格',{text:'{{ product.price }}'})]);
  const second=component('p2','Package','终身',{dataKey:'lifetime',group:'plans'});
  const source=fixture(component('row','Stack','',{},[variable,first,second]));source.products.lifetime={name:'终身',price:'¥200',billingMonths:0};
  const h=await mount(variable,{source,editing:false});assert.ok(h.node().children.join('').includes('¥100'));assert.deepEqual(h.node('inside').children,['¥100']);
  await act(async()=>h.node('p2').props.onClick(event()));assert.deepEqual(h.node().children,['¥200 · ¥200']);assert.deepEqual(h.node('inside').children,['¥100']);
  assert.equal(h.renderer.root.findByType('textarea').props.value,'{{ product.price }} · {{ product.price_per_month }}');
  await h.change('文字内容','', 'textarea');await h.click('插入变量');await h.click('商品总价');assert.deepEqual(h.node().children,['¥200']);
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

test('ordinary button navigation and purchase checkout use separate property flows', async () => {
  const b=await mount(component('sample','Button','按钮',{action:{action:'None'}}),{editing:false});
  const select=b.renderer.root.findAll((item)=>item.type==='select'&&item.props['aria-label']==='点击动作')[0];
  assert.deepEqual(select.findAllByType('option').map((option)=>option.props.value),['None','RestorePurchases','NavigateBack','NavigateTo']);
  await b.select('点击动作','NavigateTo');await b.select('导航目标','OpenSheet');
  assert.equal(indexDocument(b.document()).nodes.get('sample').props.action.action,'OpenSheet');await b.close();
  const purchase=await mount(createCatalogComponent('PurchaseButton','sample'),{editing:false});
  assert.equal(purchase.renderer.root.findAll((item)=>item.type==='select'&&item.props['aria-label']==='点击动作').length,0);
  await purchase.select('打开方式','WebCheckout');await act(async()=>purchase.node().props.onClick(event()));assert.equal(purchase.status(),'网页结账预览');await purchase.close();
});

test('navigate back returns within the current flow before falling back to the mock close action', async () => {
  const button=component('sample','Button','返回',{action:{action:'NavigateBack'}});
  const source=fixture(component('flow','Flow','',{defaultIndex:1},[component('p1','Screen'),component('p2','Screen','',{},[button])]));
  const h=await mount(button,{source,editing:false});await act(async()=>h.node().props.onClick(event()));assert.ok(h.node('p1'));assert.equal(h.node('p2'),undefined);await h.close();
});
