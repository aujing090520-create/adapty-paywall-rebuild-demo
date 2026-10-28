import test from 'node:test';
import assert from 'node:assert/strict';
import {component,cloneComponent,indexDocument,importComponentDocument,updateComponent} from './componentDocument.js';
import {buildBlueVipColumn,comparisonRowProps} from './htVipColumn.js';
import {patchComponentProperties} from './componentOperations.js';
import {upgradeCanonicalComponents} from './componentCatalog.js';
import {templates,createBuilderNodes} from '../templates/templateDefinitions.js';

const load=()=>upgradeCanonicalComponents(importComponentDocument(createBuilderNodes('ht-blue-privilege'),templates.find(t=>t.id==='ht-blue-privilege')));
const tableOf=document=>indexDocument(document).nodes.get('benefits');
function legacy() {
  const cells=(id,header=false)=>[0,1,2].map(i=>component(`${id}/${i}`,'Text','文字',{text:`${id}-${i}`,flexGrow:[1.85,.82,.76][i],background:header&&i<2?'#f1f1f1':'transparent',fontSize:17}));
  const rows=['benefits/header','benefits/row-0'].map((id,i)=>component(id,i?'Button':'Stack','行',{heightMode:'fixed',height:46.8,paddingLeft:16,paddingRight:16,gap:0,...(i?{action:{action:'OpenURL',actionUrl:'https://example.com'},hidden:true}:{})},cells(id,!i)));
  const background=component('benefits/column-background','Stack','背景',{},[
    component('benefits/non-vip-space','Stack'),
    component('benefits/vip-background','Stack','VIP背景',{background:'#fffacd'}),
  ]);
  const table=component('benefits','Stack','权益对比',{axis:'overlay'},[background,component('benefits/rows','Stack','行',{},rows)]);
  return {version:3,templateId:'ht-blue-privilege',products:{test:{label:'保留'}},root:component('$main','Screen','页面',{},[table])};
}

test('Blue comparison is three real columns with no decorative empty underlay',()=>{
  const document=load(),table=tableOf(document),{nodes,parents}=indexDocument(document);
  assert.equal(table.props.axis,'horizontal');assert.equal(table.children.length,3);
  assert.deepEqual(table.children.map(c=>c.props.flexGrow),[1.85,.82,.76]);
  assert.ok(table.children.every(c=>c.props.axis==='vertical'&&c.children.length===table.children[0].children.length));
  assert.ok(!nodes.has('benefits/column-background'));assert.ok(!nodes.has('benefits/non-vip-space'));
  assert.equal(parents.get('benefits/header/2/cell'),'benefits/vip-background');
  assert.equal(nodes.get('benefits/header/2/cell').props.background,'transparent');
  assert.equal(nodes.get('benefits/row-1/1').type,'Icon');
  assert.equal(nodes.get('benefits/row-0/0').props.flexGrow,1);
  assert.deepEqual(buildBlueVipColumn(document),document);
});

test('legacy rows transpose without losing content, actions, hidden states or business data',()=>{
  const before=legacy(),copy=structuredClone(before),after=buildBlueVipColumn(before),a=indexDocument(after).nodes,b=indexDocument(before).nodes;
  assert.deepEqual(before,copy);assert.deepEqual(after.products,before.products);
  for(const old of b.values())if(old.type==='Text')assert.deepEqual(a.get(old.id).props.text,old.props.text);
  assert.equal(a.get('benefits/vip-background').props.background,'#fffacd');
  for(const column of tableOf(after).children){const cell=column.children[1];assert.equal(cell.props.hidden,true);assert.deepEqual(cell.props.action,b.get('benefits/row-0').props.action);assert.equal(cell.props.height,46.8);}
  assert.deepEqual(upgradeCanonicalComponents(after),upgradeCanonicalComponents(upgradeCanonicalComponents(after)));
});

test('row height, visibility and action edits stay aligned, while cell color remains independent',()=>{
  let document=load();
  const row=tableOf(document).children.map(col=>col.children[2]);
  document=patchComponentProperties(document,row[2].id,{height:61,hidden:true,action:{action:'OpenURL',actionUrl:'https://example.com'}});
  const nodes=indexDocument(document).nodes;
  for(const cell of row){assert.equal(nodes.get(cell.id).props.height,61);assert.equal(nodes.get(cell.id).props.hidden,true);assert.equal(nodes.get(cell.id).props.action.action,'OpenURL');}
  document=patchComponentProperties(document,row[1].id,{background:'#ff0000'});
  assert.notEqual(indexDocument(document).nodes.get(row[0].id).props.background,'#ff0000');
  assert.equal(tableOf(document).children[0].children[1].props.height,46.8);
});

test('runtime row conditions reach all columns and table copies do not retain original row links',()=>{
  const document=load(),table=tableOf(document),nodes=indexDocument(document).nodes,peer=table.children[2].children[2];
  const effective=comparisonRowProps(peer,nodes,node=>({...node,props:{...node.props,hidden:true,height:99}}));
  assert.equal(effective.props.hidden,true);assert.equal(effective.props.height,99);
  const copied=cloneComponent(table),copyNodes=indexDocument({root:copied}).nodes;
  for(const col of copied.children)for(const cell of col.children)assert.ok(copyNodes.has(cell.props.comparisonRowId));
  assert.equal(cloneComponent(peer).props.comparisonRowId,undefined);
});

test('complex custom layouts and referenced removed wrappers are not destructively migrated',()=>{
  const document=legacy();document.logic={rules:[{effects:[{target:'benefits/rows',kind:'hidden',value:true}]}]};
  assert.deepEqual(buildBlueVipColumn(document),document);
  const custom=updateComponent(legacy(),'benefits/row-0',{props:{radius:20}});
  assert.deepEqual(buildBlueVipColumn(custom),custom);
  for(const [id,props] of [['benefits/vip-background',{radius:16}],['benefits/column-background',{paddingHorizontal:24}],['benefits/non-vip-space',{background:'#eeeeee'}],['benefits/rows',{opacity:70}]]){
    const edited=updateComponent(legacy(),id,{props});
    assert.deepEqual(buildBlueVipColumn(edited),edited);
  }
});
