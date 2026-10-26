import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postcss from 'postcss';
import { component, componentLayerLabel, indexDocument, COMPONENT_TYPES, COMPONENT_NAMES } from '../src/builder/componentDocument.js';
import { dimensionModePatch, hasBoundedHeight, mainAxisFillStyle } from '../src/builder/propertyModel.js';

test('fixed size starts from measured design pixels and does not replace an existing fixed size', () => {
  assert.equal(dimensionModePatch('width','fixed',{widthMode:'fill',width:160},350).width,350);
  assert.equal(dimensionModePatch('height','fixed',{heightMode:'fit'},398.4).height,398);
  assert.equal(dimensionModePatch('width','fixed',{widthMode:'fixed',width:280},300).width,undefined);
  assert.equal(dimensionModePatch('width','fixed',{widthMode:'fill'},0).width,undefined);
});

test('fill does not claim a definite height through auto-sized ancestors', () => {
  const doc={root:component('page','Screen','页面',{},[component('outer','Stack','容器',{heightMode:'fit'},[component('middle','Stack','容器',{heightMode:'fill'},[component('inner','Stack','容器',{heightMode:'fill'})])])])};
  const {nodes,parents}=indexDocument(doc);
  assert.equal(hasBoundedHeight(nodes.get('middle'),nodes,parents),false);
  assert.equal(hasBoundedHeight(nodes.get('inner'),nodes,parents,node=>node.id==='outer'?{...node.props,heightMode:'fixed'}:node.props),true,'effective selected-state dimensions must participate in ancestor bounds');
  nodes.get('outer').props.heightMode='fixed';nodes.get('outer').props.height=300;
  assert.equal(hasBoundedHeight(nodes.get('inner'),nodes,parents),true);
  assert.deepEqual(mainAxisFillStyle({heightMode:'fill'},{axis:'vertical',heightMode:'fit'}),{height:'auto',flexGrow:0});
  assert.deepEqual(mainAxisFillStyle({heightMode:'fill'},{axis:'horizontal',heightMode:'fit'}),{height:'auto',alignSelf:'stretch'});
});

test('component layers use type names, text uses resolved copy and screens retain scene identity', () => {
  for(const type of COMPONENT_TYPES.filter(type=>!['Screen','Text'].includes(type))) assert.equal(componentLayerLabel(component('id',type,'自定义别名')),COMPONENT_NAMES[type]);
  assert.equal(componentLayerLabel(component('id','Text','旧标题'),'真实正文'),'真实正文');
  assert.equal(componentLayerLabel(component('id','Text','旧标题'),'   '),'文字');
  assert.equal(componentLayerLabel(component('id','Screen','权益介绍')),'权益介绍');
});

test('floating modal CSS no longer overrides configured geometry', () => {
  const css=postcss.parse(fs.readFileSync(new URL('../src/builder/componentEditor.css',import.meta.url),'utf8'));
  css.walkRules(rule=>{
    if (rule.selector.includes('nc-floating') || rule.selector === '.nc-overlay') rule.walkDecls(decl=>{
      assert.ok(!(decl.prop==='width' && (decl.important || rule.selector.includes('nc-bottomsheet'))),`${rule.selector}: ${decl.toString()}`);
      assert.ok(!(decl.prop==='position' && decl.important),`${rule.selector}: ${decl.toString()}`);
    });
  });
});

test('selection uses an edit-only high-contrast overlay without changing component geometry or intercepting input', () => {
  const css=postcss.parse(fs.readFileSync(new URL('../src/builder/componentEditor.css',import.meta.url),'utf8'));
  const selected={};
  css.walkRules('.nc-inspected::after',rule=>rule.walkDecls(decl=>{selected[decl.prop]=decl.value;}));
  assert.equal(selected.position,'absolute');
  assert.equal(selected.inset,'0');
  assert.equal(selected['pointer-events'],'none');
  assert.equal(selected.border,'3px solid #245cff');
  assert.equal(selected['box-shadow'],'inset 0 0 0 1px #ffffff,0 0 0 1px #ffffff');
  assert.equal(selected['border-radius'],'inherit');
  assert.ok(!['width','height','padding','margin','transform'].some(prop=>prop in selected));
  let hover;
  css.walkRules('.nc-hovered:not(.nc-inspected)',rule=>rule.walkDecls('outline',decl=>{hover=decl.value;}));
  assert.match(hover,/dashed/);
});
