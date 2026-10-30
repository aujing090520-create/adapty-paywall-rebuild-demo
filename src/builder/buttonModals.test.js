import test from 'node:test';
import assert from 'node:assert/strict';
import { component, indexDocument, updateComponent, validDocument } from './componentDocument.js';
import { addNavigationButton, attachButtonModal, buttonModalEdges, createButtonModal, modalBindings, upgradeButtonModals } from './buttonModals.js';
import { documentArtboards } from './artboards.js';
import { templates, createBuilderNodes } from '../templates/templateDefinitions.js';
import { importComponentDocument } from './componentDocument.js';
import { activeComponents } from './propertyModel.js';
import { workflowIssues } from './workflow.js';

const fixture = () => ({version:3,products:{sku:{price:'¥488',skuId:'unchanged'}},root:component('screen','Screen','主页面',{},[component('body','Text','正文',{text:'原内容'})])});

test('close/back presets are editable icon buttons inside one fixed navigation Header',()=>{
  const close = addNavigationButton(fixture(),'screen'), back=addNavigationButton(close.document,'screen','back');
  const {nodes}=indexDocument(back.document);
  assert.equal(nodes.get(close.id).props.action.action,'Dismiss');
  assert.equal(nodes.get(back.id).props.action.action,'NavigateBack');
  assert.equal(nodes.get(close.id).children[0].props.icon,'tabler:outline:x');
  assert.equal(back.document.root.children.filter(node=>node.type==='Header').length,1);
  const row=back.document.root.children.find(node=>node.props.navigationRow);
  assert.equal(row.type,'Header');assert.equal(row.children.length,2);
  assert.deepEqual(row.children.map(node=>node.id),[back.id,close.id]);
  assert.ok(validDocument(back.document));
});

test('button action owns modal, board, edge and lifecycle without page-close rules',()=>{
  const added=addNavigationButton(upgradeButtonModals(fixture()),'screen');
  const before=structuredClone(added.document);
  const made=createButtonModal(added.document,added.id), {nodes,parents}=indexDocument(made.document);
  assert.ok(validDocument(made.document));assert.equal(parents.get(made.id),added.id);
  assert.equal(nodes.get(added.id).props.action.actionPage,made.id);
  assert.deepEqual(made.document.products,before.products);
  assert.deepEqual(made.document.settings.closeTargetsByScreen,before.settings.closeTargetsByScreen);
  assert.equal(documentArtboards(made.document).length,2);
  assert.deepEqual(buttonModalEdges(made.document).map(edge=>[edge.id,edge.source,edge.target]),[[added.id,'screen',made.id]]);
  const off=updateComponent(made.document,added.id,{props:{action:{action:'Dismiss',actionPage:made.id}}});
  assert.equal(documentArtboards(off).length,1);assert.equal(modalBindings(off).length,0);
  assert.ok(indexDocument(off).nodes.has(made.id),'inactive content is not deleted');
  const restored=attachButtonModal(off,added.id,made.id);
  assert.equal(documentArtboards(restored).length,2);
  assert.deepEqual(indexDocument(restored).nodes.get(made.id),nodes.get(made.id));
  assert.deepEqual(added.document,before,'create must not mutate original');
  assert.equal(attachButtonModal(restored,`${made.id}/continue`,made.id),restored,'reject ancestor cycle');
});

test('legacy bindings migrate once with unchanged modal IDs, content, SKU and saved source',()=>{
  const source=fixture(), modal=component('old-modal','BottomSheet','原挽留弹窗',{presentation:'overlay'},[component('copy','Text','文字',{text:'原优惠'})]);
  source.root.children.push(modal);source.settings={closeTargetsByScreen:{screen:'old-modal'}};
  const before=structuredClone(source), next=upgradeButtonModals(source),binding=modalBindings(next)[0];
  assert.equal(binding.modal.id,'old-modal');assert.deepEqual(binding.modal,modal);
  assert.deepEqual(next.products,source.products);assert.deepEqual(source,before);
  assert.equal(indexDocument(next).parents.get(modal.id),binding.button.id);
  assert.equal(upgradeButtonModals(next),next);assert.ok(validDocument(next));
});

test('all templates upgrade without losing product records or component IDs',()=>{
  for (const template of templates) {
    const source=importComponentDocument(createBuilderNodes(template.id),template), oldIds=[...indexDocument(source).nodes.keys()];
    const next=upgradeButtonModals(source), {nodes}=indexDocument(next);
    assert.ok(validDocument(next),template.id);assert.deepEqual(next.products,source.products,template.id);
    for (const id of oldIds) assert.ok(nodes.has(id),`${template.id}: ${id}`);
    assert.equal(upgradeButtonModals(next),next);
  }
});

test('nested modal edges originate at the actual parent popup and deactivate with its opener',()=>{
  const nav=addNavigationButton(upgradeButtonModals(fixture()),'screen'), outer=createButtonModal(nav.document,nav.id);
  const inner=createButtonModal(outer.document,`${outer.id}/continue`);
  assert.equal(documentArtboards(inner.document).length,3);
  assert.equal(buttonModalEdges(inner.document).find(edge=>edge.target===inner.id).source,outer.id);
  const off=updateComponent(inner.document,nav.id,{props:{action:{action:'Dismiss'}}});
  assert.equal(documentArtboards(off).length,1);assert.equal(buttonModalEdges(off).length,0);
  assert.ok(indexDocument(off).nodes.has(inner.id));
  const active=activeComponents(inner.document,{overlay:inner.id});
  assert.ok(active.some(node=>node.id===inner.id));assert.ok(!active.some(node=>node.id===outer.id||node.id==='body'));
});

test('modal commerce and required controls are isolated from the background screen',()=>{
  let source=upgradeButtonModals(fixture());
  source.root.children.push(component('agreement','Toggle','背景协议',{required:true}),component('page-package','Package','背景套餐'));
  const added=addNavigationButton(source,'screen'), made=createButtonModal(added.document,added.id);
  const modal=indexDocument(made.document).nodes.get(made.id);
  source=updateComponent(made.document,made.id,{children:[...modal.children,component('modal-package','Package','弹窗套餐'),component('modal-agreement','Toggle','弹窗协议',{required:true})]});
  assert.deepEqual(activeComponents(source,{overlay:made.id}).filter(node=>node.type==='Package'||node.type==='Toggle').map(node=>node.id),['modal-package','modal-agreement']);
  assert.ok(activeComponents(source,{}).some(node=>node.id==='page-package'));
  assert.ok(!activeComponents(source,{}).some(node=>node.id==='modal-package'));
  source={...source,root:component('root','Screen','流程',{},[component('flow','Flow','步骤',{},[source.root,component('final','Screen','最终')])])};
  assert.ok(workflowIssues(source).some(message=>message.startsWith('主页面')),'normal page commerce remains final-only');
  source=updateComponent(source,'page-package',{type:'Stack'});
  assert.ok(!workflowIssues(source).some(message=>message.includes('商品和购买按钮')),'popup commerce is a separate surface');
});

test('shared legacy page targets become independent button-owned copies, not missing or stolen children',()=>{
  const modal=component('shared','BottomSheet','共享弹窗',{presentation:'overlay'},[component('message','Text','文字',{text:'原内容'})]);
  const source={...fixture(),root:component('root','Screen','流程',{},[component('flow','Flow','步骤',{},[component('a','Screen','A'),component('b','Screen','B')]),modal]),settings:{closeTargetsByScreen:{a:'shared',b:'shared'}}};
  const next=upgradeButtonModals(source), bindings=modalBindings(next), {parents}=indexDocument(next);
  assert.equal(bindings.length,2);assert.equal(new Set(bindings.map(binding=>binding.modal.id)).size,2);
  for (const binding of bindings) assert.equal(parents.get(binding.modal.id),binding.button.id);
  assert.deepEqual(next.settings.closeTargetsByScreen,source.settings.closeTargetsByScreen);
  assert.deepEqual(next.products,source.products);assert.ok(validDocument(next));
});

test('migration preserves Back and uses the actual Close button regardless of tree order',()=>{
  const source=fixture();source.root.children.push(component('back','Button','返回',{action:{action:'NavigateBack'}}),component('close','Button','关闭',{action:{action:'Dismiss'}}),component('modal','BottomSheet','弹窗',{presentation:'overlay'}));
  source.settings={closeTargetsByScreen:{screen:'modal'}};
  const next=upgradeButtonModals(source),{nodes}=indexDocument(next);
  assert.equal(nodes.get('back').props.action.action,'NavigateBack');
  assert.equal(nodes.get('close').props.action.action,'OpenSheet');
  assert.equal(modalBindings(next)[0].button.id,'close');
});

test('shared-header bindings follow the active flow page while disabled countdown fallbacks produce no modal boards',()=>{
  const modal=component('modal','BottomSheet','弹窗',{presentation:'overlay'}), opener=component('open','Button','打开',{action:{action:'OpenSheet',actionPage:'modal'}},[modal]);
  const source={...fixture(),settings:{buttonModalVersion:1},root:component('root','Screen','流程',{},[component('header','Header','页头',{},[opener]),component('flow','Flow','步骤',{},[component('a','Screen','A'),component('b','Screen','B')])])};
  assert.equal(documentArtboards(source,null,{flow:1}).filter(board=>board.node.id==='modal').length,1);
  assert.equal(buttonModalEdges(source,{flow:1})[0].source,'b');
  source.root.children[0].children=[component('timer','Countdown','计时器',{fallbackEnabled:false},[component('fallback','CountdownState','备用内容',{state:'fallback'},[opener])])];
  assert.equal(modalBindings(source).length,0);assert.equal(documentArtboards(source).length,2);
});

test('presentation migration copies cross-sheet destinations together and remaps their actions',()=>{
  const secondary=component('second','BottomSheet','第二弹窗',{presentation:'overlay'},[component('back','Button','返回',{action:{action:'NavigateBack'}})]);
  const primary=component('first','BottomSheet','第一弹窗',{presentation:'overlay'},[component('next','Button','下一弹窗',{action:{action:'OpenSheet',actionPage:'second'}})]);
  const saved={...fixture(),root:component('saved','Screen','旧优惠',{},[primary,secondary]),settings:{presentationSurfaceId:'first'}};
  const source={...fixture(),settings:{exitOfferOfferingId:'saved'}};
  const next=upgradeButtonModals(source,[{id:'saved',name:'旧优惠',document:saved,packageCount:1}]);
  assert.equal(modalBindings(next).length,2);
  const copied=[...indexDocument(next).nodes.values()].find(node=>node.name==='下一弹窗');
  assert.notEqual(copied.props.action.actionPage,'second');
  assert.equal(indexDocument(next).nodes.get(copied.props.action.actionPage).name,'第二弹窗');
  assert.ok(validDocument(next));
});

test('legacy package-ID product ownership survives independent modal copying',()=>{
  const saved={...fixture(),products:{'old-package':{skuId:'original-sku',price:'¥338'}},root:component('saved','Screen','旧优惠',{},[component('old-package','Package','旧套餐')])};
  const source={...fixture(),settings:{exitOfferOfferingId:'saved'}};
  const next=upgradeButtonModals(source,[{id:'saved',name:'旧优惠',document:saved,packageCount:1}]);
  const copied=[...indexDocument(next).nodes.values()].find(node=>node.type==='Package');
  assert.deepEqual(next.products[copied.props.dataKey],saved.products['old-package']);
  assert.deepEqual(next.products.sku,source.products.sku);assert.equal(indexDocument(saved).nodes.get('old-package').props.dataKey,undefined);
});
