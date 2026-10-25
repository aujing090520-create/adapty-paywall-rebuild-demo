import { zhCopy } from './builder/fieldModels.js';

const enCopy = { ...Object.fromEntries(Object.entries(zhCopy).map(([english, chinese]) => [chinese, english])), '特权列表': 'List', '商品套餐': 'Products' };
const insensitiveCopy = new Map(Object.entries(zhCopy).map(([key, value]) => [key.toLowerCase(), value]));
const editorLabels = '.ne-layers, .ne-properties, .ne-workflow-connections, .ne-artboard > header, .ne-surface-context, .ne-presentation-tools, .ne-library';
const content = 'script, style, [contenteditable], .phone, .native-phone, [data-user-content]';

export function translateInterfaceText(value, locale, editor = false) {
  const dictionary = locale === 'zh-CN' ? zhCopy : enCopy;
  const translate = (label) => {
    if (dictionary[label]) return dictionary[label];
    if (locale !== 'zh-CN' || !editor) return label;
    const known = insensitiveCopy.get(label.toLowerCase());
    if (known) return known;
    const numbered = label.match(/^(Screen|Step|Title|Description|Button|Image|Slide|Tab)\s+(\d+)$/i);
    if (numbered) return `${insensitiveCopy.get(numbered[1].toLowerCase()) ?? numbered[1]} ${numbered[2]}`;
    const control = label.match(/^(展开|收起|向)(.+?)(添加组件)?$/);
    if (control) return control[1] + translate(control[2]) + (control[3] ?? '');
    if (label.endsWith('的更多操作')) return translate(label.slice(0, -5)) + '的更多操作';
    const parts = label.split(/([：\n])/);
    if (parts.length > 1) return parts.map((part) => /[：\n]/.test(part) ? part : translate(part)).join('');
    return label.replace(/「([^」]+)」/g, (_, name) => `「${translate(name)}」`);
  };
  return value.replace(/^(\s*)(.*?)(\s*)$/s, (_, leading, core, trailing) => leading + translate(core) + trailing);
}

export function matchesInterfaceText(value, query) {
  const needle = query.toLowerCase();
  return value.toLowerCase().includes(needle) || translateInterfaceText(value, 'zh-CN', true).toLowerCase().includes(needle);
}

function interfaceElement(element, attributes = false) {
  if (!element || element.closest(content) || !attributes && element.closest('input, textarea')) return false;
  const excluded = element.closest('[data-no-translate]');
  if (!excluded) return true;
  const panel = element.closest(editorLabels);
  return excluded.classList.contains('native-editor') && panel && excluded.contains(panel);
}

export function localizeInterface(root, locale) {
  if (!root) return;
  const document = root.ownerDocument;
  const walker = document.createTreeWalker(root, 4, { acceptNode: (node) => interfaceElement(node.parentElement) ? 1 : 2 });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const next = translateInterfaceText(node.nodeValue, locale, Boolean(node.parentElement.closest('.native-editor')));
    if (next !== node.nodeValue) node.nodeValue = next;
  }
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach((element) => {
    if (!interfaceElement(element, true)) return;
    for (const attribute of ['placeholder', 'aria-label', 'title']) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const next = translateInterfaceText(value, locale, Boolean(element.closest('.native-editor')));
      if (next !== value) element.setAttribute(attribute, next);
    }
  });
}
