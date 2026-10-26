import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import postcss from 'postcss';
import { component } from '../src/builder/componentDocument.js';

let server, Preview;
const oldObserver = globalThis.ResizeObserver;
before(async () => {
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null } });
  Preview = (await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;
});
after(async () => { await server?.close(); globalThis.ResizeObserver = oldObserver; });

for (const zoom of [0.3, 0.5, 0.75, 1, 1.5]) {
  test(`selection reveal uses layout scroll units at ${zoom * 100}% canvas zoom`, async () => {
    const document = { version: 3, products: {}, root: component('screen', 'Screen', 'Page', {}, [component('text', 'Text', 'Text', { text: 'Content' })]) };
    const viewport = {
      clientWidth: 376, clientHeight: 830, scrollTop: 0,
      getBoundingClientRect: () => ({ top: 100, bottom: 100 + 830 * zoom, height: 830 * zoom }),
      querySelectorAll: () => [
        { dataset: { componentId: 'screen' }, matches: () => true },
        { dataset: { componentId: 'text' }, matches: () => false, getBoundingClientRect: () => ({ top: 100 + (1250 - viewport.scrollTop) * zoom, bottom: 100 + (1280 - viewport.scrollTop) * zoom }) },
      ],
    };
    let app;
    const props = { document, editing: true, navigation: { flow: 0, overlay: null }, onSelect() {}, onStatus() {} };
    const update = async (patch) => act(async () => app.update(React.createElement(Preview, { ...props, ...patch })));
    try {
      await act(async () => { app = TestRenderer.create(React.createElement(Preview, props), { createNodeMock: (element) => element.props.className === 'nc-viewport' ? viewport : null }); });
      await update({ selectedId: 'text' });
      assert.equal(viewport.scrollTop, 450);
      viewport.scrollTop = 100;
      await update({ selectedId: 'text', navigation: { overlay: null, flow: 0 }, document: { ...document } });
      assert.equal(viewport.scrollTop, 100, 'equivalent navigation and property rerenders must not override manual scrolling');
      await update({ selectedId: 'screen' });
      assert.equal(viewport.scrollTop, 100, 'selecting the whole screen must not pull content to the top');
      await update({ selectedId: 'text', editing: false });
      assert.equal(viewport.scrollTop, 100, 'interactive preview must not focus editor selections');
      viewport.scrollTop = 1300;
      await update({ selectedId: 'text' });
      assert.equal(viewport.scrollTop, 1250, 'upward reveal also compensates for canvas zoom');
    } finally { if (app) await act(async () => app.unmount()); }
  });
}

test('editing scroll can chain vertically while modal and interactive preview keep their own boundaries', () => {
  const css = postcss.parse(readFileSync(new URL('../src/builder/componentEditor.css', import.meta.url), 'utf8'));
  const declarations = (selector) => {
    const values = {};
    css.walkRules(selector, (rule) => rule.walkDecls((decl) => { values[decl.prop] = decl.value; }));
    return values;
  };
  assert.equal(declarations('.ne-artboard-scale .nc-viewport')['overscroll-behavior'], 'auto');
  assert.equal(declarations('.native-editor .ne-artboard-scroll')['overscroll-behavior'], 'contain');
  assert.equal(declarations('.native-editor .ne-artboard-scroll')['overscroll-behavior-x'], 'contain');
  assert.equal(declarations('.nc-floating-design>.nc-node')['overscroll-behavior'], 'contain');
  assert.equal(declarations('.ne-artboard-scale .nc-modal-surface')['overscroll-behavior'], 'auto');
  assert.equal(declarations('.nc-viewport')['overscroll-behavior'], 'contain');
  assert.equal(declarations('html:has(.native-editor),body:has(.native-editor)')['overscroll-behavior-x'],'none');
  assert.equal(declarations('.native-editor .ne-artboard-scroll')['scroll-behavior'],'auto');
});

test('desktop panels and canvas have independent bounded scroll areas', () => {
  const css=postcss.parse(readFileSync(new URL('../src/builder/componentEditor.css',import.meta.url),'utf8'));
  const rules=[];css.walkRules(rule=>{if(rule.selector==='.native-editor .ne-builder'&&rule.parent.type==='atrule')rules.push(rule);});
  assert.ok(rules.some(rule=>rule.nodes.some(decl=>decl.prop==='height'&&decl.value==='var(--ne-workbench-height,calc(100dvh - 100px))')));
  assert.ok(rules.filter(rule=>rule.nodes.some(decl=>decl.prop==='height'&&decl.value.includes('--ne-workbench-height'))).every(rule=>rule.parent.params==='paywall-workbench (min-width:761px)'),'the nested preview size container must not intercept desktop workbench queries');
  const anchoring=[];css.walkRules('.native-editor',rule=>rule.walkDecls('overflow-anchor',decl=>anchoring.push(decl.value)));
  assert.ok(anchoring.includes('none'),'switching screens and modal wrappers must not anchor-scroll the document');
  const bound=[];css.walkRules('.ne-properties',rule=>rule.walkDecls('overflow',decl=>bound.push(decl.value)));
  assert.ok(bound.includes('auto'));
});

test('interactive preview fits the full phone and only its content scrolls, without moving the workbench', () => {
  const css=postcss.parse(readFileSync(new URL('../src/builder/componentEditor.css',import.meta.url),'utf8'));
  const declarations=(selector)=>{const values={};css.walkRules(selector,rule=>rule.walkDecls(decl=>{values[decl.prop]=decl.value;}));return values;};
  const preview=declarations('.ne-interactive-board');
  assert.equal(preview.flex,'1 1 auto');
  assert.equal(preview['min-height'],'0');
  assert.equal(preview.overflow,'hidden');
  assert.equal(preview['container-type'],'size');
  assert.equal(preview['overscroll-behavior'],'contain');
  assert.equal(declarations('.ne-interactive-board>.ne-presentation').width,'min(100%,calc((100cqh - 36px)*390/844))');
  assert.equal(declarations('.ne-interactive-board .phone.native-phone')['min-height'],'0');
  assert.equal(declarations('.ne-interactive-board .nc-viewport')['overscroll-behavior'],'contain');
  assert.equal(declarations('.nc-floating-design>.nc-modal-surface')['overscroll-behavior'],'contain','scrolling a popup must not move its backdrop');
});

test('left chooser keeps actions outside a single bounded scroll list',()=>{
  const css=postcss.parse(readFileSync(new URL('../src/builder/componentEditor.css',import.meta.url),'utf8'));
  const declarations=selector=>{const values={};css.walkRules(selector,rule=>rule.walkDecls(decl=>{values[decl.prop]=decl.value;}));return values;};
  assert.equal(declarations('.ne-step-picker').overflow,'hidden');
  assert.equal(declarations('.ne-step-picker>:not(.ne-step-screens):not(.ne-step-sources)')['flex-shrink'],'0');
  const list=declarations('.ne-step-screens,.ne-step-sources');
  assert.equal(list.flex,'1');assert.equal(list['min-height'],'0');assert.equal(list.overflow,'auto');assert.equal(list['overscroll-behavior'],'contain');
  assert.equal(declarations('.ne-creation-footer').position,'static');
  assert.equal(declarations('.ne-tree,.ne-catalog').overflow,'auto');
});
