import test from 'node:test';
import assert from 'node:assert/strict';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {importComponentDocument,indexDocument,validDocument,updateComponent} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {upgradeTemplateBilling} from '../src/builder/templateBilling.js';
import {logicMatches,logicNode} from '../src/builder/paywallLogic.js';
import {localizedDocument} from '../src/builder/contentLocalization.js';
import {previewCommerceContexts} from '../src/builder/propertyModel.js';

const load=id=>upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(id),templates.find(t=>t.id===id)));
const copy=(document,id,pack,platform='ios')=>logicNode(indexDocument(document).nodes.get(id),localizedDocument(document,{contentPlatform:platform}),{},pack).props.text;

for(const [id,legal,cancel] of [
  ['ht-blue-privilege','legal'],['ht-membership-plans','legal','member/cancel-note'],
  ['ht-sku-sheet','legal'],['ht-vip-tiers','tiers/vip/legal/text'],
]) test(`${id}: subscription/lifetime copy switches both directions without changing layout or product fields`,()=>{
  const doc=load(id),nodes=[...indexDocument(doc).nodes.values()],lifetime=nodes.find(n=>n.type==='Package'&&n.props.productType==='lifetime'),subscription=nodes.find(n=>n.type==='Package'&&n.props.productType==='subscription');
  assert.ok(lifetime);assert.ok(subscription);assert.ok(validDocument(doc));
  const before=structuredClone(doc);
  assert.match(copy(doc,legal,subscription),/续订/);
  assert.match(copy(doc,legal,lifetime),/一次性付费.*永久/);
  assert.doesNotMatch(copy(doc,legal,lifetime),/自动续订|iTunes|随时取消/);
  assert.match(copy(doc,legal,subscription),/续订/);
  if(cancel){assert.equal(copy(doc,cancel,lifetime),'一次性付费，永久权益');assert.equal(copy(doc,cancel,subscription),'可随时取消');}
  assert.deepEqual(doc,before);assert.equal(upgradeTemplateBilling(doc),doc);
});

for(const id of ['ht-blue-privilege','ht-membership-plans','ht-payment-recovery']) test(`${id}: Android default explanation no longer promises iTunes and iOS stays intact`,()=>{
  const doc=load(id),pack=[...indexDocument(doc).nodes.values()].find(n=>n.type==='Package'&&n.props.defaultSelected);
  assert.match(copy(doc,'legal',pack,'ios'),/iTunes/);
  assert.match(copy(doc,'legal',pack,'android'),/Google Play/);
  assert.doesNotMatch(copy(doc,'legal',pack,'android'),/iTunes|App Store/);
  assert.match(copy(doc,'legal',pack,'ios'),/iTunes/);
});

test('trial platform rule preserves the existing page condition and monthly subscription branch',()=>{
  const doc=load('ht-free-trial'),{nodes}=indexDocument(doc),monthly=nodes.get('trial/monthly');
  const android=localizedDocument(doc,{contentPlatform:'android'});
  assert.equal(logicNode(nodes.get('trial/cancel-note'),android,{'trial/pages':2},monthly).props.text,'可随时在Google Play取消');
  assert.equal(logicNode(nodes.get('trial/cancel-note'),android,{'trial/pages':0},monthly).props.text,'订阅可随时取消，无需支付任何费用');
  assert.equal(logicNode(nodes.get('trial/cancel-note'),localizedDocument(doc,{contentPlatform:'ios'}),{'trial/pages':2},monthly).props.text,'可随时在App Store取消');
  assert.match(logicNode(nodes.get('trial/legal'),android,{},monthly).props.text,/自动续订/);
});

test('generic conditions require a selected package for billing type and use actual content platform',()=>{
  const doc=load('ht-vip-tiers'),lifetime=indexDocument(doc).nodes.get('tiers/vip/lifetime');
  const condition={conditions:[{type:'billingType',value:'lifetime'}]};
  assert.equal(logicMatches(condition,doc,{},null),false);
  assert.equal(logicMatches(condition,doc,{},lifetime),true);
  assert.equal(logicMatches({conditions:[{type:'platform',value:'android'}]},localizedDocument(doc,{contentPlatform:'android'}),{}),true);
  assert.equal(logicMatches({conditions:[{type:'platform',value:'android'}]},doc,{}),false);
  const runtime={'tiers/flow':1,selectedPackage:lifetime.id};
  const selected=previewCommerceContexts(doc,runtime).background.selectedPackage;
  assert.equal(selected.id,'tiers/plus/year');
  assert.match(copy(doc,'tiers/plus/legal/text',selected),/续订/);
});

test('legacy default copy upgrades without modifying source, custom text, rich text, translations or custom rules',()=>{
  const original=load('ht-membership-plans');delete original.billingContentVersion;
  original.logic.rules=original.logic.rules.filter(r=>!r.id.startsWith('billing/'));
  const before=structuredClone(original),upgraded=upgradeTemplateBilling(original);
  assert.ok(upgraded.logic.rules.length>0);assert.deepEqual(original,before);
  for(const custom of [
    updateComponent(original,'legal',{props:{text:'我的计费约定'}}),
    updateComponent(original,'legal',{props:{runs:[{text:'我的富文本约定'}]}}),
    {...original,localization:{translations:{en:{legal:{text:'My contract'}}}}},
    {...original,logic:{rules:[{id:'mine',conditions:[{type:'package',value:'products/package-0'}],effects:[{target:'legal',kind:'text',value:'我的规则'}]}]}},
  ])assert.equal(upgradeTemplateBilling(custom).logic.rules.filter(r=>r.effects.some(e=>e.target==='legal')).length,custom.logic.rules.filter(r=>r.effects.some(e=>e.target==='legal')).length);
});

test('all first eleven HT templates preserve their product contexts, parameter placeholders and tree identity',()=>{
  for(const template of templates.filter(t=>t.id.startsWith('ht-')).slice(0,11)){
    const raw=importComponentDocument(createBuilderNodes(template.id),template),doc=upgradeCanonicalComponents(raw);
    assert.ok(validDocument(doc),template.id);
    assert.deepEqual(doc.products,raw.products);
    assert.deepEqual(indexDocument(upgradeTemplateBilling(doc)).nodes.size,indexDocument(doc).nodes.size);
  }
});
