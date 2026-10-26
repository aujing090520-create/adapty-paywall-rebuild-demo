import test from 'node:test';
import assert from 'node:assert/strict';
import { component, importComponentDocument, indexDocument, removeComponent, updateComponent, validDocument } from './componentDocument.js';
import { upgradeNavigationRows } from './navigationRows.js';
import { addNavigationButton, createButtonModal } from './buttonModals.js';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { createCatalogComponent } from './componentCatalog.js';
import { copyStyles, pasteStyles } from './componentOperations.js';
import { OVERLAY_ALIGNMENTS, overlayAlignmentStyle, stateStyleProps } from './propertyModel.js';

const template=templates.find(entry=>entry.id==='ht-blue-privilege');
const load=()=>importComponentDocument(createBuilderNodes(template.id),template);

test('Blue default is hero > overlay navigation Stack > Back Button > editable Icon without changing hero height or SKU',()=>{
  const document=load(),{nodes,parents}=indexDocument(document);
  assert.ok(validDocument(document));
  assert.equal(parents.get('hero-image/navigation'),'hero-image');
  assert.equal(nodes.get('hero-image/navigation').type,'Stack');
  assert.equal(nodes.get('hero-image/navigation').props.axis,'overlay');
  assert.equal(nodes.get('hero-image/navigation').props.overlayAlignment,'top-left');
  assert.equal(parents.get('hero-image/back'),'hero-image/navigation');
  assert.equal(nodes.get('hero-image/back').props.action.action,'NavigateBack');
  assert.equal(nodes.get('hero-image/back/icon').props.icon,'tabler:outline:arrow-left');
  assert.equal(nodes.get('hero-image/image').props.height,226.2);
  assert.equal(Object.keys(document.products).length,3);
  const removed=removeComponent(document,'hero-image/back');assert.equal(upgradeNavigationRows(removed),removed,'do not restore deliberately deleted navigation');
});

test('adding a Close button reuses Blue hero navigation and never creates a fixed Header or shifts content',()=>{
  const before=load(),result=addNavigationButton(before,'$main'),{nodes,parents}=indexDocument(result.document);
  assert.equal(parents.get(result.id),'hero-image/navigation');
  assert.equal(nodes.get('hero-image/navigation').props.axis,'horizontal');
  assert.equal(nodes.get('hero-image/navigation').children[0].id,'hero-image/back');
  assert.equal(nodes.get('hero-image/navigation').props.justify,'between');
  assert.equal([...nodes.values()].filter(node=>node.type==='Header').length,0);
  assert.deepEqual(result.document.products,before.products);
});

test('only generated navigation Header fingerprints are repaired, preserving configured action, IDs and modal subtree',()=>{
  const close=createCatalogComponent('CloseButton','close');
  let source={version:3,products:{},root:component('screen','Screen','页面',{},[component('generated','Header','页头',{axis:'horizontal',paddingHorizontal:16,paddingVertical:8,background:'transparent',shadowOpacity:0},[close]),component('custom','Stack','用户内容')])};
  const bound=createButtonModal(source,close.id);source=bound.document;
  const next=upgradeNavigationRows(source),{nodes}=indexDocument(next);
  assert.equal(nodes.get('generated').type,'Stack');assert.equal(nodes.get('generated').props.overlayAlignment,'top-right');
  assert.deepEqual(nodes.get(close.id),indexDocument(source).nodes.get(close.id));
  assert.deepEqual(nodes.get(bound.id),indexDocument(source).nodes.get(bound.id));
  assert.equal(upgradeNavigationRows(next),next);
  const custom=updateComponent(source,'generated',{name:'自定义固定页头'});
  assert.equal(indexDocument(upgradeNavigationRows(custom)).nodes.get('generated').type,'Header');
});

test('missing old Blue default is added once while existing custom navigation is preserved',()=>{
  const source=load();delete source.navigationRowsVersion;
  const old=removeComponent(source,'hero-image/navigation'),next=upgradeNavigationRows(old);
  assert.equal([...indexDocument(next).nodes.values()].filter(node=>node.id==='hero-image/back').length,1);
  const configured=addNavigationButton(old,'$main','close');
  const nextConfigured=upgradeNavigationRows(configured.document);
  assert.ok(!indexDocument(nextConfigured).nodes.has('hero-image/back'));
  assert.deepEqual(indexDocument(nextConfigured).nodes.get(configured.id),indexDocument(configured.document).nodes.get(configured.id));
});

test('nine-position alignment preserves legacy layout and survives style copying and selected-state resolution',()=>{
  assert.equal(Object.keys(OVERLAY_ALIGNMENTS).length,9);
  assert.deepEqual(overlayAlignmentStyle({align:'stretch'}),{alignItems:'stretch',justifyItems:'stretch'});
  assert.deepEqual(overlayAlignmentStyle({overlayAlignment:'top-right'}),{alignItems:'start',justifyItems:'end'});
  const source=load(),node=indexDocument(source).nodes.get('hero-image/navigation');
  const updated=pasteStyles(source,node.id,copyStyles({...node,props:{...node.props,overlayAlignment:'bottom-right'}}));
  assert.equal(indexDocument(updated).nodes.get(node.id).props.overlayAlignment,'bottom-right');
  assert.equal(stateStyleProps({overlayAlignment:'top-left',selectedOverlayAlignment:'bottom-right'},true).overlayAlignment,'bottom-right');
});
