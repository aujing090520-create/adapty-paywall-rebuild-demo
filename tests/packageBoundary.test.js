import test from 'node:test';
import assert from 'node:assert/strict';
import { component, indexDocument, validDocument, componentLayerLabel } from '../src/builder/componentDocument.js';
import { createCatalogComponent } from '../src/builder/componentCatalog.js';
import { insertPackageComponent, packageSelectionGroups, changePackageSelectionGroup } from '../src/builder/componentOperations.js';
import { defaultPackagePatch } from '../src/builder/propertyModel.js';
import { canvasSelectionTarget } from '../src/builder/canvasSelection.js';

const doc = children => ({ version:3, templateId:'audit', products:{}, root:component('page','Screen','页面',{},children) });
const pack = id => createCatalogComponent('Package',id);

test('Package owns product binding and selection while its child Stack owns editable content layout', () => {
  const product=pack('plan'), content=product.children[0];
  assert.equal(componentLayerLabel(product),'商品套餐');
  assert.equal(product.type,'Package'); assert.equal(content.type,'Stack');
  assert.equal(content.props.dataKey,undefined); assert.equal(content.props.group,undefined);
  assert.deepEqual(content.children.filter(node=>node.type==='ProductParameter').map(node=>node.props.parameter),['skuDuration','totalReferencePrice','totalPrice','productInfo']);
  assert.equal(content.children[0].children[0].props.parameter,'productLabel');
  const source=doc([product]),{nodes,parents}=indexDocument(source),label=nodes.get('plan/price');
  assert.equal(canvasSelectionTarget(label,'page',nodes,parents),'plan');
  assert.equal(canvasSelectionTarget(label,'plan',nodes,parents),'plan/price');
  assert.equal(canvasSelectionTarget(content,'page',nodes,parents),'plan');
});

test('new packages automatically share one selection group across layout wrappers without altering existing SKU data', () => {
  const source=doc([component('row','Stack','布局容器',{},[component('left','Stack'),component('right','Stack')])]);
  const before=structuredClone(source);
  const first=insertPackageComponent(source,'left',pack('a'));
  const second=insertPackageComponent(first,'right',pack('b'));
  const {nodes}=indexDocument(second);
  assert.equal(nodes.get('a').props.group,'page'); assert.equal(nodes.get('b').props.group,'page');
  assert.equal(nodes.get('a').props.defaultSelected,true); assert.equal(nodes.get('b').props.defaultSelected,false);
  const changed=indexDocument(defaultPackagePatch(second,'b',true)).nodes;
  assert.equal(changed.get('a').props.defaultSelected,false); assert.equal(changed.get('b').props.defaultSelected,true);
  assert.ok(validDocument(second)); assert.deepEqual(source,before);
  assert.notEqual(second.products.a,second.products.b);
});

test('adding packages respects existing explicit groups and isolates pages, sheets and tabs', () => {
  const existing=pack('old'); existing.props.group='legacy-group';
  const source=doc([
    component('row','Stack','布局容器',{},[existing]),
    component('sheet','BottomSheet','弹窗',{presentation:'overlay'}),
    component('tabs','Tabs','标签页',{},[component('tab-a','Tab'),component('tab-b','Tab')]),
  ]);
  source.products.old={skuId:'keep-this-sku',price:'¥100'};
  let next=insertPackageComponent(source,'row',pack('new'));
  next=insertPackageComponent(next,'sheet',pack('sheet-plan'));
  next=insertPackageComponent(next,'tab-a',pack('tab-a-plan'));
  next=insertPackageComponent(next,'tab-b',pack('tab-b-plan'));
  const {nodes}=indexDocument(next);
  assert.equal(nodes.get('new').props.group,'legacy-group');
  assert.equal(nodes.get('sheet-plan').props.group,'sheet');
  assert.equal(nodes.get('tab-a-plan').props.group,'tab-a');
  assert.equal(nodes.get('tab-b-plan').props.group,'tab-b');
  assert.deepEqual(next.products.old,source.products.old);
  assert.deepEqual(nodes.get('old'),existing);
  assert.equal(insertPackageComponent(next,'missing',pack('invalid')),next);
});

test('selection group choices show same-surface package membership and preserve legacy ids', () => {
  const a=pack('a'),b=pack('b'),c=pack('c'),d=pack('d');
  a.props.group=b.props.group='products';c.props.group=d.props.group='other';
  const source=doc([a,b,component('sheet','BottomSheet','弹窗',{presentation:'overlay'},[pack('sheet-plan')]),c,d]);
  assert.deepEqual(packageSelectionGroups(source,'a'),[
    {key:'products',members:[1,2],first:1},
    {key:'other',members:[3,4],first:3},
  ]);
  assert.deepEqual(packageSelectionGroups(source,'sheet-plan'),[{key:'sheet-plan',members:[1],first:1}]);
  assert.equal(changePackageSelectionGroup(source,'missing','__new__'),source);
  assert.equal(changePackageSelectionGroup(source,'a','sheet-plan'),source);
});

test('moving a package between groups keeps one default per affected group', () => {
  const a=pack('a'),b=pack('b'),c=pack('c');
  a.props.group=b.props.group='products';c.props.group='other';
  a.props.defaultSelected=true;b.props.defaultSelected=false;c.props.defaultSelected=true;
  const source=doc([a,b,c]);
  const moved=changePackageSelectionGroup(source,'a','other');
  const {nodes}=indexDocument(moved);
  assert.equal(nodes.get('a').props.group,'other');
  assert.equal(nodes.get('a').props.defaultSelected,false);
  assert.equal(nodes.get('b').props.defaultSelected,true);
  assert.equal(nodes.get('c').props.defaultSelected,true);
  assert.deepEqual(indexDocument(source).nodes.get('a'),a);
  const isolated=changePackageSelectionGroup(moved,'a','__new__');
  const isolatedNodes=indexDocument(isolated).nodes;
  assert.match(isolatedNodes.get('a').props.group,/^package-group:a:/);
  assert.equal(isolatedNodes.get('a').props.defaultSelected,true);
  assert.equal(isolatedNodes.get('b').props.defaultSelected,true);
  assert.equal(isolatedNodes.get('c').props.defaultSelected,true);
});
