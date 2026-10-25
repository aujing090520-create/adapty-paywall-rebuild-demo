import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { localizeInterface, translateInterfaceText, matchesInterfaceText } from '../src/interfaceLocalization.js';
import { templates } from '../src/templates/templateDefinitions.js';

test('Chinese editor labels cover mixed-case action names and numbered pages without changing values', () => {
  const dom = new JSDOM('<div class="app"><div class="native-editor" data-no-translate><aside class="ne-layers"><select><option value="terms">Terms of Service</option><option value="privacy">Privacy Policy</option><option value="restore">Restore Purchase</option><option value="cta">purchase</option></select><span>Screen 2</span></aside></div></div>');
  const root = dom.window.document.querySelector('.app');
  localizeInterface(root, 'zh-CN');
  assert.deepEqual([...root.querySelectorAll('option')].map((node) => [node.value, node.textContent]), [['terms','服务条款'],['privacy','隐私政策'],['restore','恢复购买'],['cta','购买']]);
  assert.equal(root.querySelector('span').textContent, '页面 2');
  assert.equal(translateInterfaceText('连接到「Paywall screen」的按钮', 'zh-CN', true), '连接到「付费墙页面」的按钮');
  assert.equal(translateInterfaceText('按钮：purchase', 'zh-CN', true), '按钮：购买');
  assert.equal(translateInterfaceText('purchase的更多操作', 'zh-CN', true), '购买的更多操作');
  assert.equal(translateInterfaceText('向trial timeline添加组件', 'zh-CN', true), '向试用时间线添加组件');
});

test('phone previews, editable copy, SKU/input values and custom names remain source content', () => {
  const dom = new JSDOM('<div class="app"><div class="native-editor" data-no-translate><aside class="ne-properties"><input value="purchase" placeholder="Search"><textarea>Terms of Service</textarea><div contenteditable="true">Privacy Policy</div><span>My custom launch</span><code>DEMO-BLUE-YEAR</code></aside><div class="phone"><button title="Continue">Continue</button><p>Terms of Service</p></div></div><div data-no-translate><span>Privacy Policy</span></div><span>test</span></div>');
  const root = dom.window.document.querySelector('.app');
  localizeInterface(root, 'zh-CN');
  assert.equal(root.querySelector('input').value, 'purchase'); assert.equal(root.querySelector('input').placeholder, '搜索');
  assert.equal(root.querySelector('textarea').value, 'Terms of Service'); assert.equal(root.querySelector('[contenteditable]').textContent, 'Privacy Policy');
  assert.equal(root.querySelector('.phone').textContent, 'ContinueTerms of Service'); assert.equal(root.querySelector('.phone button').title, 'Continue');
  assert.ok(root.textContent.includes('My custom launch')); assert.ok(root.textContent.includes('DEMO-BLUE-YEAR')); assert.ok(root.textContent.endsWith('test'));
  assert.equal(root.children[1].querySelector('span').textContent, 'Privacy Policy');
});

test('dynamic options and locale switching use the same interface-only boundary', () => {
  const dom = new JSDOM('<div class="app"><div class="native-editor" data-no-translate><aside class="ne-layers"><select><option>Privacy Policy</option></select></aside></div></div>');
  const root = dom.window.document.querySelector('.app');
  localizeInterface(root, 'zh-CN'); assert.equal(root.querySelector('option').textContent, '隐私政策');
  localizeInterface(root, 'en'); assert.equal(root.querySelector('option').textContent, 'Privacy Policy');
  const added = dom.window.document.createElement('option'); added.value = 'saved-id'; added.textContent = 'Restore Purchases'; root.querySelector('select').append(added);
  localizeInterface(root, 'zh-CN'); assert.equal(added.textContent, '恢复购买'); assert.equal(added.value, 'saved-id');
  localizeInterface(root, 'zh-CN'); assert.equal(added.textContent, '恢复购买');
});

test('all template display titles have Chinese labels and remain searchable by their original or Chinese title', () => {
  for (const template of templates) {
    const label = translateInterfaceText(template.title, 'zh-CN', true);
    assert.ok(/[\u3400-\u9fff]/.test(label), template.title);
    assert.ok(matchesInterfaceText(template.title, label), template.title);
    assert.ok(matchesInterfaceText(template.title, template.title), template.title);
  }
});
