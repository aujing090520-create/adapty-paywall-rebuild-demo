import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFreeTrialTemplate} from '../src/builder/freeTrialTemplate.js';
import {component,indexDocument,removeComponent} from '../src/builder/componentDocument.js';
import {purchaseTarget} from '../src/builder/purchaseTarget.js';
import {purchaseSelection,consolidateTrialPurchase} from '../src/builder/purchaseSelection.js';
import {buttonTextResolution} from '../src/builder/buttonText.js';

test('one trial purchase button keeps fixed trial purchase on early pages and follows selection on the plan page',()=>{
  const document=buildFreeTrialTemplate(),{nodes}=indexDocument(document),button=nodes.get('trial/purchase'),monthly=nodes.get('trial/monthly'),text=nodes.get('trial/purchase/text');
  assert.equal([...nodes.values()].filter(node=>node.type==='PurchaseButton').length,1);
  for(const page of [0,1,2,0]){
    const runtime={'trial/pages':page,'package:trial/packages':monthly.id};
    assert.equal(purchaseTarget(document,button,monthly,runtime)?.id,page===2?monthly.id:'trial/annual');
    assert.match(buttonTextResolution(text,document,runtime).props.text,page===2?/^继续$/:/0元领取/);
  }
  assert.equal(purchaseTarget(removeComponent(document,'trial/annual'),button,monthly,{'trial/pages':0}),null);
});

test('page purchase configuration rejects deleted or foreign sequences instead of silently buying another package',()=>{
  const document=buildFreeTrialTemplate(),{nodes}=indexDocument(document),button=nodes.get('trial/purchase');
  assert.equal(purchaseTarget(removeComponent(document,'trial/pages'),button,nodes.get('trial/monthly')),null);
  const foreign=component('foreign','Screen','另一屏',{},[component('foreign-pages','Carousel','轮播',{},[component('foreign-page','Slide','页')])]);
  const split={...document,root:component('root','Screen','根',{},[component('flow','Flow','步骤',{},[document.root,foreign])])};
  const changed={...button,props:{...button.props,action:{...button.props.action,pagePackages:{source:'foreign-pages',pages:[]}}}};
  assert.equal(purchaseSelection(changed,split).invalid,true);assert.equal(purchaseTarget(split,changed,nodes.get('trial/monthly')),null);
});

function legacy(){
  const document=buildFreeTrialTemplate(),{nodes}=indexDocument(document),button=nodes.get('trial/purchase'),footer=nodes.get('trial/footer');
  const first=structuredClone(button);first.id='trial/confirm';first.children[0].id='trial/confirm/text';first.props.action={action:'Purchase',packageId:'trial/annual'};delete first.props.buttonText;
  button.props.hidden=true;button.props.action={action:'Purchase'};
  footer.children.splice(1,0,first);document.logic.rules[0].effects.push({target:first.id,kind:'hide'},{target:button.id,kind:'show'});
  button.props.buttonText.variants[0].text='自定义月套餐';return document;
}
test('known two-button trial records consolidate without losing package copy, style, ids or unrelated rules',()=>{
  const document=legacy(),before=structuredClone(document),merged=consolidateTrialPurchase(document),{nodes}=indexDocument(merged);
  assert.equal([...nodes.values()].filter(node=>node.type==='PurchaseButton').length,1);assert.equal(nodes.get('trial/confirm'),undefined);
  assert.equal(nodes.get('trial/purchase').props.hidden,false);assert.equal(nodes.get('trial/purchase').props.buttonText.variants[0].text,'自定义月套餐');
  assert.equal(nodes.get('trial/purchase').props.action.pagePackages.source,'trial/pages');
  assert.equal(merged.logic.rules.some(rule=>rule.effects.some(effect=>['trial/confirm','trial/purchase'].includes(effect.target))),false);
  assert.equal(merged.logic.rules.at(-1).effects[0].target,'trial/legal');assert.deepEqual(document,before);assert.equal(consolidateTrialPurchase(merged),merged);
});
test('divergent custom buttons are not silently removed by the compatibility migration',()=>{
  const document=legacy();indexDocument(document).nodes.get('trial/confirm').children[0].props.text='我自定义的入口';
  assert.equal(consolidateTrialPurchase(document),document);
});
