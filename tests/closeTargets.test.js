import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { createServer } from 'vite';
import { component as c, indexDocument, validDocument, importComponentDocument, updateComponent } from '../src/builder/componentDocument.js';
import { bindCloseTarget, closeTargetId, canvasCloseTargets, createRetentionModal, importCloseTarget, removeCanvasModal } from '../src/builder/closeTargets.js';
import { exitOfferTarget, exitOfferConnections, workspaceExitOfferIds } from '../src/builder/exitOffers.js';
import { workflowContext } from '../src/builder/workflow.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';

const doc = () => ({ version: 3, templateId: 'blank', products: {}, root: c('root', 'Screen', '页面', {}, [c('flow', 'Flow', '流程', { initialStepId: 'a' }, ['a','b','c'].map((id) => c(id,'Screen',id,{},[c(`${id}-title`,'Text','标题',{text:id})])))]) });
const text = (node) => typeof node === 'string' ? node : node.children?.map(text).join('') ?? '';
const event = () => ({ stopPropagation() {}, preventDefault() {} });
let server, Editor, Presentation, Picker;
const previous = { ResizeObserver: globalThis.ResizeObserver, window: globalThis.window, localStorage: globalThis.localStorage };
const mounted = new Set();
before(async () => {
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.localStorage = { getItem() { return null; } };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, setInterval, clearInterval };
  server = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true, hmr: false, watch: null } });
  Editor = (await server.ssrLoadModule('/src/builder/ComponentEditor.jsx')).default;
  Presentation = (await server.ssrLoadModule('/src/builder/PaywallPresentation.jsx')).default;
  Picker = (await server.ssrLoadModule('/src/builder/CloseTargetPicker.jsx')).default;
});
after(async () => { for (const renderer of mounted) await act(async () => renderer.unmount()); await server?.close(); Object.assign(globalThis, previous); });
async function render(Type, props) { let renderer; await act(async () => { renderer = TestRenderer.create(React.createElement(Type, props)); }); mounted.add(renderer); return renderer; }
const click = async (renderer, name) => { const button = renderer.root.findAll((item) => typeof item.type==='string' && (item.type === 'button'||item.props.role==='button') && (item.props['aria-label'] === name || text(item).trim() === name))[0]; assert.ok(button, name); await act(async () => button.props.onClick(event())); };

test('new retention is a useful centered canvas modal, not a product-dependent separate Offering', () => {
  const original = doc(), result = createRetentionModal(original,'a'), node = indexDocument(result.document).nodes.get(result.id);
  assert.ok(validDocument(result.document)); assert.equal(node.type,'BottomSheet'); assert.equal(node.props.presentation,'overlay'); assert.ok(node.children.some((child)=>child.type==='Image'&&child.props.src));
  assert.equal(closeTargetId(result.document,'a'),result.id); assert.equal(result.document.products,original.products); assert.equal(workflowContext(result.document).steps.length,3);
  assert.equal(exitOfferTarget(result.document,[],undefined,'a')?.local,true); assert.equal(result.document.settings.exitOfferOfferingId,undefined);
  const second = createRetentionModal(result.document,'b'); assert.notEqual(indexDocument(second.document).nodes.get(second.id).name,node.name);
  const blank = createRetentionModal(original,'a',true); assert.deepEqual(indexDocument(blank.document).nodes.get(blank.id).children,[]); assert.ok(exitOfferTarget(blank.document,[],undefined,'a'));
});

test('repeated current-canvas binding and sharing never clone content or product records', () => {
  const created = createRetentionModal(doc(),'a'), before = structuredClone(created.document);
  const repeated = bindCloseTarget(bindCloseTarget(created.document,'a',created.id),'b',created.id);
  assert.equal(repeated.root,created.document.root); assert.equal(repeated.products,created.document.products);
  assert.equal([...indexDocument(repeated).nodes.values()].filter((node)=>node.type==='BottomSheet').length,1);
  assert.deepEqual(exitOfferConnections(repeated,[]).map((edge)=>[edge.source,edge.target,edge.targetOwner]),[['a',created.id,null],['b',created.id,null]]);
  assert.deepEqual(created.document,before);
});

test('unlink retains popup; delete clears all source references and opener actions without changing source document', () => {
  const created = createRetentionModal(doc(),'a');
  let original = bindCloseTarget(created.document,'b',created.id);
  original.root.children.push(c('opener','Button','打开',{action:{action:'OpenSheet',actionPage:created.id}},[]));
  const before = structuredClone(original), unlinked = bindCloseTarget(original,'a','');
  assert.ok(indexDocument(unlinked).nodes.has(created.id)); assert.equal(exitOfferTarget(unlinked,[],undefined,'a'),null); assert.ok(exitOfferTarget(unlinked,[],undefined,'b'));
  const removed = removeCanvasModal(original,created.id);
  assert.equal(indexDocument(removed).nodes.has(created.id),false); assert.equal(closeTargetId(removed,'a'),''); assert.equal(closeTargetId(removed,'b'),'');
  assert.equal(indexDocument(removed).nodes.get('opener').props.action.action,'None'); assert.deepEqual(original,before);
});

test('current canvas targets include real peer Screens but never source or generated auxiliary details', () => {
  const original=doc(); original.root.children[0].children.push(c('a/detail-screen-0','Screen','样例详情'));
  assert.deepEqual(canvasCloseTargets(original,'a').map((node)=>node.id),['b','c']);
  const linked=bindCloseTarget(original,'a','b'); assert.equal(workflowContext(exitOfferTarget(linked,[],undefined,'a').document).initial.id,'b');
  assert.equal(bindCloseTarget(original,'a','a'),original); assert.equal(bindCloseTarget(original,'a','missing'),original);
  assert.equal(validDocument({...original,settings:{closeTargetsByScreen:{a:[]}}}),false);
});

test('saved-content import is explicitly a copy with new IDs and isolated product data', () => {
  const source=createRetentionModal(doc(),'a').document, original=structuredClone(source), node=[...indexDocument(source).nodes.values()].find((item)=>item.type==='BottomSheet');
  const imported=importCloseTarget(doc(),'b',source,node.id);
  assert.ok(validDocument(imported.document)); assert.notEqual(imported.id,node.id); assert.equal(closeTargetId(imported.document,'b'),imported.id); assert.deepEqual(source,original);
  const again=importCloseTarget(imported.document,'a',source,node.id);
  assert.equal(indexDocument(again.document).nodes.get(again.id).name,'挽留弹窗 2');
  assert.equal(indexDocument(again.document).nodes.get(imported.id).name,'挽留弹窗');
});

test('all current templates can create a centered retention modal without altering their SKU data or main Screen count', () => {
  for(const template of templates){
    const original=importComponentDocument(createBuilderNodes(template.id),template), before=structuredClone(original), source=workflowContext(original).initial;
    const result=createRetentionModal(original,source.id);
    assert.ok(validDocument(result.document),template.id); assert.deepEqual(result.document.products,original.products,template.id); assert.equal(workflowContext(result.document).steps.length,workflowContext(original).steps.length,template.id); assert.deepEqual(original,before,template.id);
  }
});

test('picker defaults to actual canvas targets; three unbound saved historical offers cannot masquerade as canvas content', async () => {
  const original=createRetentionModal(doc(),'a'), offerings=Array.from({length:3},(_,index)=>({id:`local-exit-${index}`,name:'旧退出优惠',document:original.document,packageCount:0}));
  let bound;
  const renderer=await render(Picker,{document:original.document,source:workflowContext(original.document).steps[1],offerings,onBack(){},onCreate(){},onBind(id){bound=id;}});
  assert.equal(text(renderer.root).includes('旧退出优惠'),false); assert.ok(text(renderer.root).includes('当前画布'));
  const choice=renderer.root.findAll((item)=>item.type==='button'&&item.props.className==='ne-target-choice'&&text(item).includes('挽留弹窗'))[0];
  await act(async()=>choice.props.onClick()); assert.equal(bound,undefined);
  await click(renderer,'关联此内容'); assert.equal(bound,original.id);
  await act(async()=>renderer.root.findAll((item)=>item.props.role==='tab'&&text(item)==='已保存内容')[0].props.onClick());
  assert.equal(renderer.root.findAll((item)=>item.type==='button'&&text(item).includes('历史弹窗')).length,3);
});

test('switching predecessor clears a pending choice before it can be associated with the wrong page', async () => {
  const original = createRetentionModal(doc(), 'a'); let sourceId;
  const renderer = await render(Picker, { document: original.document, source: workflowContext(original.document).initial, initialId: original.id, onSourceChange(id) { sourceId = id; }, onBack() {}, onCreate() {}, onBind() {} });
  await act(async () => renderer.root.findByProps({ 'aria-label': '关闭哪个页面' }).props.onChange({ target: { value: 'b' } }));
  assert.equal(sourceId, 'b');
  assert.equal(renderer.root.findAll((item) => item.type === 'button' && item.props.className === 'primary')[0].props.disabled, true);
});

test('actual Editor creates, unlinks, deletes and undoes the same modal without independent records', async () => {
  let latest;
  const renderer=await render(Editor,{template:{id:'blank'},initialNodes:[],initialDocument:doc(),persistence:'session',onDocumentChange(value){latest=value;}});
  await click(renderer,'新建挽留弹窗');
  const id=closeTargetId(latest,'a'); assert.ok(id); assert.equal(Object.keys(latest.products).length,0);
  await click(renderer,'选择画板：a'); await click(renderer,'设置关闭后显示'); await click(renderer,'解除关联');
  assert.ok(indexDocument(latest).nodes.has(id)); assert.equal(closeTargetId(latest,'a'),'');
  await click(renderer,'撤销移除'); assert.equal(closeTargetId(latest,'a'),id);
  await click(renderer,'选择画板：挽留弹窗'); await click(renderer,'删除弹窗'); assert.equal(indexDocument(latest).nodes.has(id),false);
  await click(renderer,'撤销移除'); assert.ok(indexDocument(latest).nodes.has(id)); assert.equal(closeTargetId(latest,'a'),id);
});

test('zero-SKU retention opens on close, Continue returns to source, and repeated close cannot trap the user', async () => {
  const original=createRetentionModal(doc(),'a');
  const renderer=await render(Presentation,{document:original.document,editing:false,onSelect(){},onStatus(){}});
  await click(renderer,'关闭付费墙预览'); assert.ok(text(renderer.root).includes('离开前，看看这份专属优惠'));
  await click(renderer,'继续了解'); assert.equal(text(renderer.root).includes('离开前，看看这份专属优惠'),false); assert.ok(text(renderer.root).includes('页面预览'));
  await click(renderer,'关闭付费墙预览'); assert.ok(text(renderer.root).includes('付费墙已关闭'));
  await click(renderer,'重新预览'); await click(renderer,'关闭付费墙预览'); await click(renderer,'暂时离开'); assert.ok(text(renderer.root).includes('付费墙已关闭'));
});

test('NavigateBack in a linked popup resumes the source instead of leaving an empty foreground', async () => {
  const created = createRetentionModal(doc(), 'a');
  const document = updateComponent(created.document, `${created.id}/continue`, { props: { action: { action: 'NavigateBack' } } });
  const renderer = await render(Presentation, { document, editing: false, onSelect() {}, onStatus() {} });
  await click(renderer, '关闭付费墙预览'); await click(renderer, '继续了解');
  assert.ok(text(renderer.root).includes('页面预览')); assert.equal(text(renderer.root).includes('离开前，看看这份专属优惠'), false);
});

test('saved Screen import is a native editable popup, with original products isolated', () => {
  const source = doc(), before = structuredClone(source), imported = importCloseTarget(doc(), 'a', source, 'b');
  assert.equal(imported.error, undefined); assert.ok(validDocument(imported.document));
  const modal = indexDocument(imported.document).nodes.get(imported.id);
  assert.equal(modal.type, 'BottomSheet'); assert.equal(modal.children[0].props.text, 'b'); assert.notEqual(modal.children[0].id, 'b-title'); assert.deepEqual(source, before);
});

test('legacy independent popup unlink remains in the canvas after reopen; delete and undo preserve its saved source', async () => {
  const original = doc(); original.settings = { exitOffersByScreen: { a: 'old' } };
  const content = createRetentionModal(doc(), 'a');
  const presentation = exitOfferTarget(content.document, [], undefined, 'a').document;
  const offerings = [{ id: 'old', name: '旧挽留弹窗', document: presentation, packageCount: 0 }];
  let latest;
  const props = { template: { id: 'blank' }, initialNodes: [], initialDocument: original, persistence: 'session', offerings, onDocumentChange(value) { latest = value; } };
  const first = await render(Editor, props);
  await click(first, '付费墙设置'); await click(first, '解除关联');
  assert.deepEqual(workspaceExitOfferIds(latest), ['old']); assert.equal(exitOfferTarget(latest, offerings, undefined, 'a'), null);
  const reopened = await render(Editor, { ...props, initialDocument: structuredClone(latest) });
  await click(reopened, '选择画板：挽留弹窗'); await click(reopened, '删除弹窗');
  assert.deepEqual(workspaceExitOfferIds(latest), []); assert.equal(offerings[0].document, presentation);
  await click(reopened, '撤销移除'); assert.deepEqual(workspaceExitOfferIds(latest), ['old']);
});
