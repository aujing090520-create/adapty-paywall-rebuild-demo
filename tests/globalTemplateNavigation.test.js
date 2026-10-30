import test from 'node:test';
import assert from 'node:assert/strict';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {component,importComponentDocument,indexDocument,removeComponent} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {buildTemplateNavigationHeaders,pinScreenNavigation} from '../src/builder/templateNavigationHeaders.js';
import {addNavigationButton,createButtonModal} from '../src/builder/buttonModals.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';

const catalog=templates.filter(template=>template.documentTemplate||template.isGallery);
const load=template=>upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id),template));
const isNavigation=node=>node.type==='Button'&&node.children.some(child=>child.type==='Icon'&&['tabler:outline:x','tabler:outline:arrow-left'].includes(child.props.icon));
test('all catalog templates are valid; every existing page navigation is in fixed screen chrome',()=>{
  assert.equal(catalog.length,46);
  let navigation=0,headers=0;
  for(const template of catalog){
    const document=load(template),{nodes,parents}=indexDocument(document);
    assert.deepEqual(structureIssues(document),[],template.id);
    for(const node of nodes.values()){
      if(node.type==='Header'){headers++;assert.equal(nodes.get(parents.get(node.id)).type,'Screen');}
      if(!isNavigation(node))continue;
      let owner=nodes.get(parents.get(node.id)),header;
      while(owner&&!['Screen','BottomSheet'].includes(owner.type)){if(owner.type==='Header')header=owner;owner=nodes.get(parents.get(owner.id));}
      if(owner?.type!=='Screen')continue;
      navigation++;assert.ok(header,`${template.id}:${node.id} scrolls with content`);
      assert.equal(parents.get(header.id),owner.id);
      assert.ok(owner.props.pagePresentation,`${template.id}: missing viewport owner`);
    }
    assert.equal(buildTemplateNavigationHeaders(document),document,template.id);
  }
  assert.equal(navigation,37);assert.equal(headers,37);
});
test('pinning preserves button IDs/actions/modal ownership and does not mutate its input',()=>{
  const button=component('close','Button','关闭',{action:{action:'OpenSheet',actionPage:'sheet'}},[component('icon','Icon','图标',{icon:'tabler:outline:x'}),component('sheet','BottomSheet','弹窗',{presentation:'overlay'})]);
  const nav=component('nav','Stack','导航栏',{navigationRow:true,axis:'overlay'},[button]);
  const screen=component('page','Screen','页面',{},[component('hero','Stack','主视觉',{axis:'overlay'},[nav,component('image','Image')])]);
  const before=structuredClone(screen),pinned=pinScreenNavigation(screen);
  assert.deepEqual(screen,before);assert.deepEqual(pinned.children[0].children,[button]);
  assert.equal(pinned.children[0].id,'nav');assert.equal(pinned.children[0].props.overlapContent,true);
  assert.equal(pinned.children[1].children[0].id,'image');
  assert.equal(pinScreenNavigation(pinned),pinned);
});
test('new navigation uses one Header; normal reads never reinsert deleted navigation or reparent saved user trees',()=>{
  const source={version:3,templateId:'custom',products:{},root:component('page','Screen','页面',{},[component('copy','Text','正文',{text:'保持文案'})])};
  const first=addNavigationButton(source,'page'),second=addNavigationButton(first.document,'page','back');
  const {nodes,parents}=indexDocument(second.document);
  assert.equal([...nodes.values()].filter(node=>node.type==='Header').length,1);
  assert.equal(parents.get(first.id),parents.get(second.id));
  const bound=createButtonModal(second.document,first.id);
  assert.equal(indexDocument(bound.document).parents.get(bound.id),first.id);
  const removed=removeComponent(bound.document,first.id);
  assert.equal(upgradeCanonicalComponents(removed).root.children.some(node=>node.id===first.id),false);
  const saved={...source,root:component('page','Screen','页面',{},[component('old','Stack','旧导航',{navigationRow:true},[component('close','Button','关闭')])])};
  const before=structuredClone(saved);
  const reopened=upgradeCanonicalComponents(saved);
  assert.deepEqual(saved,before);assert.equal(indexDocument(reopened).parents.get('close'),'old');
  assert.equal(indexDocument(reopened).nodes.get('old').type,'Stack');
});
test('template-specific purchase boundaries and optional content remain independent of fixed navigation',()=>{
  for(const [id,inFooter] of [['ht-blue-privilege',false],['ht-membership-plans',true],['ht-payment-recovery',true]]){
    const document=load(templates.find(item=>item.id===id)),{nodes,parents}=indexDocument(document);
    assert.equal(nodes.get(parents.get('products')).type==='Footer',inFooter,id);
    assert.equal([...nodes.values()].some(node=>node.type==='Countdown'),id!=='ht-membership-plans',id);
  }
  const multi=load(templates.find(item=>item.id==='rc-source-1')),{nodes}=indexDocument(multi);
  assert.equal(nodes.get('rc-source-1-screen-1').children.some(node=>node.type==='Header'),false);
  assert.equal(nodes.get('rc-source-1-screen-2').children.some(node=>node.type==='Header'),false);
  assert.equal(nodes.get('rc-source-1-screen-3').children.some(node=>node.type==='Header'),true);
});
