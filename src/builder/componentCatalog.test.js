import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_CATALOG, CATALOG_NODE_TYPE, catalogFor, createCatalogComponent, createContextualTabComponent, upgradeCanonicalComponents } from './componentCatalog.js';
import { component, validDocument, indexDocument, canContain, updateComponent, insertComponent, cloneComponent } from './componentDocument.js';
import { copyFragment, pasteFragment, copyStyles, pasteStyles, wrapInStack } from './componentOperations.js';
import {patchComponentProperties} from './componentOperations.js';
import {tabButtonTarget,tabControlTarget,pageSequencesFor} from './componentPages.js';
const doc = (children=[]) => ({version:3,templateId:'test',products:{},root:component('root','Screen','页面',{},children)});

test('source catalog categories create real valid trees, not opaque template modules',()=>{
  assert.deepEqual(COMPONENT_CATALOG.map((group)=>group.name),['基础','付费墙','交互','内容','业务组合']);
  for(const [type] of COMPONENT_CATALOG.flatMap((group)=>group.items)) {
    const node=createCatalogComponent(type,`test-${type}`);
    assert.ok(validDocument(doc([node])),type);
    assert.equal(node.type,CATALOG_NODE_TYPE[type]??type);
    if(['SocialProof','FeatureList','Award'].includes(type))assert.ok(node.children.length);
  }
});
test('structural children are contextual; header/footer are unique direct screen sections',()=>{
  const screen=component('screen','Screen','页面',{},[]);
  assert.ok(!catalogFor(screen).flatMap((group)=>group.items).some(([key])=>['Tab','Slide','CheckoutState','SwitchCase','CountdownState','Screen'].includes(key)));
  const tabs=createCatalogComponent('Tabs','tabs');
  assert.deepEqual(catalogFor(tabs)[0].items,[['Tab','标签页面']]);
  const footer=createCatalogComponent('Footer','footer');
  assert.ok(canContain(screen,footer));
  assert.ok(!canContain({...screen,children:[footer]},createCatalogComponent('Footer','another-footer')));
  assert.ok(!canContain(component('stack','Stack','容器'),footer));
  assert.ok(!canContain(createCatalogComponent('Header','head'),createCatalogComponent('Package','product')));
});

test('canonical Switch exposes only missing state slots, not generic children outside both states', () => {
  const toggle = createCatalogComponent('Switch', 'switch');
  assert.deepEqual(catalogFor(toggle), []);
  assert.ok(!canContain(toggle, createCatalogComponent('Text', 'wrong')));
  assert.ok(!canContain(toggle, createCatalogComponent('SwitchCase', 'third')));
  const single = { ...toggle, children: [toggle.children[0]] };
  assert.deepEqual(catalogFor(single)[0].items, [['SwitchCase', '状态内容']]);
  assert.ok(!canContain(single, { ...toggle.children[0], id: 'copy' }));
  assert.ok(canContain(single, toggle.children[1]));
  const legacy = component('agreement', 'Switch', '', {}, [component('copy', 'Text')]);
  assert.ok(canContain(legacy, component('control', 'Toggle')), 'legacy HT agreement controls remain compatible');
});

test('generic selectors can be added to any ordinary container and accept more labels',()=>{
  for(const type of ['Screen','Stack','Header','Footer','Tab','Slide']){
    const parent=component(`owner-${type}`,type,'');
    assert.equal(catalogFor(parent).flatMap(group=>group.items).filter(([type])=>type==='TabControl').length,1,type);
  }
  assert.deepEqual(catalogFor(createCatalogComponent('TabControl','control'))[0].items,[['TabButton','标签按钮']]);
});

test('generic page switch configuration binds complete screens, preserves labels and style, and supports extra unbound labels',()=>{
  let source=doc([component('flow','Flow','任意页面集合',{},[component('a','Screen','个人版'),component('b','Screen','团队版'),component('c','Screen','企业版')])]);
  const control=createContextualTabComponent('TabControl','selector',source,indexDocument(source).nodes.get('a'));
  source=insertComponent(source,'a',control);
  const original=structuredClone(source);
  source=patchComponentProperties(source,control.id,{target:'flow'});
  let nodes=indexDocument(source).nodes;
  assert.equal(nodes.get('flow').props.navigationMode,'tabs');assert.equal(tabControlTarget(nodes.get(control.id)),'flow');
  assert.deepEqual(nodes.get(control.id).children.map(child=>tabButtonTarget(child.props,nodes).page.name),['个人版','团队版']);
  assert.deepEqual(nodes.get(control.id).children.map(child=>child.children),control.children.map(child=>child.children));
  assert.deepEqual(original.root.children[0].props,{});
  const third=createContextualTabComponent('TabButton','third',source,nodes.get(control.id));
  source=insertComponent(source,control.id,third);nodes=indexDocument(source).nodes;
  assert.equal(tabButtonTarget(third.props,nodes).page.id,'c');assert.equal(third.children[0].props.text,'企业版');
  const extra=createContextualTabComponent('TabButton','extra',source,nodes.get(control.id));
  assert.equal(tabButtonTarget(extra.props,nodes),null,'an extra label must not unexpectedly point at page 1');
  const clone=indexDocument({root:cloneComponent(source.root)}).nodes;
  for(const button of clone.values())if(button.type==='TabButton')assert.ok(tabButtonTarget(button.props,clone));
  source=patchComponentProperties(source,control.id,{target:''});nodes=indexDocument(source).nodes;
  assert.ok(nodes.get(control.id).children.every(child=>tabButtonTarget(child.props,nodes)===null));
  assert.equal(nodes.get('flow').props.navigationMode,'tabs','unlinking a selector must not change other screen behavior');
});

test('generic selector also binds local Tabs and Carousel and excludes unrelated screen collections',()=>{
  const tabs=createCatalogComponent('Tabs','local-tabs'),carousel=createCatalogComponent('Carousel','local-carousel'),control=createCatalogComponent('TabControl','selector');
  let source=doc([component('outer','Flow','外层',{},[component('a','Screen','A',{},[tabs,carousel,control]),component('b','Screen','B',{},[component('inner','Flow','内层',{},[component('x','Screen','X')])])])]);
  assert.deepEqual(pageSequencesFor(control.id,indexDocument(source).nodes,indexDocument(source).parents).map(node=>node.id),['outer','local-tabs','local-carousel']);
  assert.equal(patchComponentProperties(source,control.id,{target:'inner'}),source);
  for(const sequence of [tabs,carousel]){
    source=patchComponentProperties(source,control.id,{target:sequence.id});const nodes=indexDocument(source).nodes;
    const button=nodes.get(control.id).children[0];
    assert.equal(tabButtonTarget(button.props,nodes).sequence.id,sequence.id);
    const reversed=updateComponent(source,sequence.id,{children:[...sequence.children].reverse()});
    assert.equal(tabButtonTarget(button.props,indexDocument(reversed).nodes).page.id,button.props.pageId);
    const deleted=updateComponent(source,sequence.id,{children:sequence.children.filter(page=>page.id!==button.props.pageId)});
    assert.equal(tabButtonTarget(button.props,indexDocument(deleted).nodes),null);
  }
});

test('deleted wallet and switch controls can be recreated only from their contextual picker', () => {
  const checkout = createCatalogComponent('ExpressCheckout', 'checkout');
  const available = { ...checkout.children[0], children: [] };
  const items = (node) => catalogFor(node).flatMap((group) => group.items.map(([type]) => type));
  assert.ok(items(available).includes('Wallet'));
  assert.ok(!items(checkout.children[0]).includes('Wallet'));
  assert.ok(!items(checkout.children[1]).includes('Wallet'));
  const toggle = createCatalogComponent('Switch', 'switch'), state = { ...toggle.children[0], children: [] };
  assert.ok(items(state).includes('Toggle'));
  assert.ok(!items(toggle.children[0]).includes('Toggle'));
  const control = createCatalogComponent('Toggle', 'restored', { switchTarget: toggle.id, index: state.props.index });
  assert.equal(control.props.switchTarget, 'switch');
  assert.equal(control.props.switchControl, true);
  assert.ok(!items(component('plain', 'Stack')).includes('Toggle'));
  assert.ok(!items(component('plain', 'Stack')).includes('Wallet'));
});

test('source draft purchase migration changes only the native type, preserving action, content, IDs and manual styles', () => {
  const source = { ...doc([component('purchase', 'Button', '自定义', { action: { action: 'Purchase', open: 'native' }, radius: 31 }, [component('copy', 'Text', '', { text: '原有文案' })])]), templateId: 'rc-source-40' };
  const before = structuredClone(source), next = upgradeCanonicalComponents(source);
  assert.equal(next.root.children[0].type, 'PurchaseButton');
  assert.deepEqual({ ...next.root.children[0], type: 'Button' }, source.root.children[0]);
  assert.deepEqual(source, before);
  assert.equal(upgradeCanonicalComponents(next), next);
  assert.equal(upgradeCanonicalComponents({ ...source, templateId: 'custom' }).root.children[0].type, 'Button');
});
test('business components retain editable states and native commerce stays outside custom web content',()=>{
  const checkout=createCatalogComponent('ExpressCheckout','checkout');
  assert.deepEqual(checkout.children.map((node)=>node.props.state),['available','unavailable','loading']);
  assert.equal(checkout.children[0].children[0].type,'Wallet');
  const toggle=createCatalogComponent('Switch','switch');
  assert.equal(toggle.children[0].children[0].props.switchTarget,'switch');
  assert.equal(toggle.children[1].children[0].props.switchTarget,'switch');
  assert.deepEqual(toggle.children.filter((node)=>node.type==='SwitchCase').map((node)=>node.props.index),[0,1]);
  const countdown=createCatalogComponent('Countdown','countdown');
  assert.deepEqual(countdown.children.map((node)=>node.props.state),['active','ended','fallback']);
  assert.equal(countdown.children[0].children[0].props.text,'{{ count_days_with_zero }} : {{ count_hours_with_zero }} : {{ count_minutes_with_zero }} : {{ count_seconds_with_zero }}');
  assert.equal(countdown.props.fallbackEnabled,false);
  const launch=createCatalogComponent('BottomSheet','launch');
  assert.equal(launch.props.action.actionPage,launch.children[1].id);
  assert.equal(launch.children[1].type,'BottomSheet');
  assert.ok(!canContain(createCatalogComponent('Custom','custom'),createCatalogComponent('PurchaseButton','purchase')));
});
test('wrapping preserves IDs, copy/paste rekeys subtree and independent product records',()=>{
  const packageNode=createCatalogComponent('Package','product');
  let document={...doc([packageNode]),products:{product:{name:'年度',price:'¥88',skuId:''}}};
  const before=JSON.stringify(packageNode);
  const wrapped=wrapInStack(document,'product');
  assert.equal(indexDocument(wrapped.document).parents.get('product'),wrapped.id);
  assert.equal(JSON.stringify(indexDocument(wrapped.document).nodes.get('product')),before);
  const fragment=copyFragment(document,'product');
  const result=pasteFragment(document,'root',fragment);
  assert.ok(validDocument(result.document));
  const copied=indexDocument(result.document).nodes.get(result.ids[0]);
  assert.notEqual(copied.props.dataKey,'product');
  assert.equal(copied.children[0].children.find(child=>child.props.parameter==='skuDuration').type,'ProductParameter');
  assert.ok(copied.children[0].children.every(child=>!child.props.binding));
  result.document.products[copied.props.dataKey].name='月度';
  assert.equal(document.products.product.name,'年度');
  assert.equal(pasteFragment(document,'product',copyFragment(document,'root')).ids.length,0);
});
test('copy styles includes defaults but cannot overwrite content, actions or SKU bindings',()=>{
  const a=component('a','Text','文字',{text:'原文'}), b=component('b','Text','文字',{text:'目标',fontSize:42,binding:{key:'key',field:'price'}});
  const styles=copyStyles(a);
  assert.equal(styles.fontSize,14);
  const document=pasteStyles(doc([b]),'b',{...styles,text:'错误',binding:null,action:{action:'Purchase'}});
  const target=indexDocument(document).nodes.get('b');
  assert.equal(target.props.fontSize,14);
  assert.equal(target.props.text,'目标');
  assert.equal(target.props.binding.key,'key');
  assert.ok(!target.props.action);
});
test('copied sheet launchers and tab buttons target their copied descendants',()=>{
  const fragment=copyFragment(doc([createCatalogComponent('BottomSheet','launch'),createCatalogComponent('Tabs','tabs')]),'root',true);
  const result=pasteFragment(doc(),'root',fragment);
  const nodes=indexDocument(result.document).nodes;
  for(const node of nodes.values()) {
    if(node.props.action?.actionPage)assert.ok(nodes.has(node.props.action.actionPage));
    if(node.type==='TabButton')assert.equal(nodes.get(node.props.target).type,'Tabs');
  }
  assert.ok(!nodes.has('launch'));
  assert.ok(!nodes.has('tabs'));
});
test('old countdown capabilities become real editable children without changing timer or SKU data',()=>{
  const original=doc([component('timer','Countdown','倒计时',{start:'18:32:25',prefix:'倒计时',prefixColor:'#303487',digitBackground:'#8ced75',fontSize:24})]);
  const before=JSON.stringify(original),next=upgradeCanonicalComponents(original);
  assert.ok(validDocument(next));
  assert.equal(JSON.stringify(original),before);
  assert.equal(next.root.children[0].props.start,'18:32:25');
  assert.equal(next.products,original.products);
  const active=next.root.children[0].children[0];
  assert.equal(active.children.length,1);
  assert.equal(active.children[0].props.text,'倒计时 {{ count_hours_with_zero }} : {{ count_minutes_with_zero }} : {{ count_seconds_with_zero }}');
  assert.equal(active.children[0].props.runs.find(run=>run.text==='{{ count_hours_with_zero }}').inlineBox.background,'#8ced75');
  assert.equal(upgradeCanonicalComponents(next),next);
});

test('plain imported countdown defaults also use one variable text',()=>{
  const original=doc([component('plain','Countdown','倒计时',{start:'02:03:04',prefix:'剩余',suffix:'结束',color:'#123456',prefixColor:'#654321',fontSize:19})]),before=structuredClone(original);
  const result=upgradeCanonicalComponents(original),timer=result.root.children[0],active=timer.children[0];
  assert.equal(active.children.length,1);assert.equal(active.children[0].props.text,'剩余 {{ count_hours_with_zero }} : {{ count_minutes_with_zero }} : {{ count_seconds_with_zero }} 结束');
  assert.equal(active.children[0].props.runs[0].color,'#654321');assert.equal(timer.props.fallbackEnabled,false);assert.deepEqual(original,before);
  assert.equal(upgradeCanonicalComponents(result),result);
});
