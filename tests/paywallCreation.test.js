import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { PAYWALL_STYLE_TYPES, freshPaywallDraft, paywallMetadata, paywallMetadataError } from '../src/paywallMetadata.js';

let server, CreatePaywall;
before(async () => {
  server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null } });
  CreatePaywall = (await server.ssrLoadModule('/src/CreatePaywall.jsx')).default;
});
after(async () => server?.close());

test('creation metadata has exactly the eight supplied types and no legacy product configuration', () => {
  assert.deepEqual(PAYWALL_STYLE_TYPES, ['会员套餐页', '入门价格页', '注册引导免费试用页', '免费试用页', '蓝色特权页', '支付未完成页', 'SKU半窗', '赠送礼物页']);
  assert.deepEqual(freshPaywallDraft(), { styleType: '会员套餐页', name: '', enabled: false });
  assert.deepEqual(paywallMetadata(null), freshPaywallDraft());
  const legacy = { name: ' 保留名称 ', styleType: '蓝色特权页', enabled: true, businessType: '旧业务', offerRows: [{ id: 'obsolete' }], defaultProductId: 'obsolete', products: ['obsolete'] };
  assert.deepEqual(paywallMetadata(legacy), { name: '保留名称', styleType: '蓝色特权页', enabled: true });
  assert.deepEqual(legacy.offerRows, [{ id: 'obsolete' }]);
  assert.ok(paywallMetadataError({ ...freshPaywallDraft(), name: '   ' }));
  assert.ok(paywallMetadataError({ name: '有效名称', styleType: '不存在' }));
  assert.equal(paywallMetadataError({ name: '有效名称', styleType: 'SKU半窗' }), '');
});

test('simple creation validates both entry methods and preserves independent category and enabled metadata', async () => {
  let app, latest, method = null, modal = null;
  function Harness() {
    const [draft, setDraft] = React.useState(freshPaywallDraft()); latest = draft;
    return React.createElement(CreatePaywall, { draft, setDraft, setView: (value) => { method = value; }, setModal: (value) => { modal = value; }, onStartBlank: () => { method = 'builder'; } });
  }
  const text = (node) => typeof node === 'string' ? node : node.children?.map(text).join('') ?? '';
  const click = async (label) => act(async () => app.root.findAll((node) => node.type === 'button' && text(node).trim() === label)[0].props.onClick());
  try {
    await act(async () => { app = TestRenderer.create(React.createElement(Harness)); });
    assert.equal(app.root.findAllByType('input').length, 1);
    assert.equal(app.root.findAllByType('select').length, 1);
    assert.equal(app.root.findAllByType('table').length, 0);
    assert.equal(app.root.findAllByType('textarea').length, 0);
    assert.deepEqual(app.root.findAllByType('option').map(text), PAYWALL_STYLE_TYPES);
    await click('选择模板'); assert.equal(modal, null); assert.ok(app.root.findByProps({ role: 'alert' }));
    await click('从空白开始'); assert.equal(method, null);
    await act(async () => app.root.findByProps({ 'aria-label': 'paywall 样式名称' }).props.onChange({ target: { value: '新的样式' } }));
    await act(async () => app.root.findByProps({ 'aria-label': 'paywall 样式类型' }).props.onChange({ target: { value: '免费试用页' } }));
    await click('禁用'); assert.equal(latest.enabled, true);
    await click('选择模板'); assert.deepEqual(modal, { kind: 'templates' });
    assert.deepEqual(latest, { styleType: '免费试用页', name: '新的样式', enabled: true });
    await click('从空白开始'); assert.equal(method, 'builder');
    await click('启用'); assert.equal(latest.enabled, false);
  } finally { if (app) await act(async () => app.unmount()); }
});
