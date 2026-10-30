import test from 'node:test';
import assert from 'node:assert/strict';
import {component,indexDocument,removeComponent,updateComponent} from '../src/builder/componentDocument.js';
import {buttonPackages,buttonTextResolution,upgradeTrialButtonText,buttonTextPreviewNavigation,buttonTextLayerInfo} from '../src/builder/buttonText.js';
import {buildFreeTrialTemplate} from '../src/builder/freeTrialTemplate.js';

test('layer summaries expose package overrides and inheritance without changing content or adding layers',()=>{
  const document=buildFreeTrialTemplate(),before=structuredClone(document),index=indexDocument(document),button=index.nodes.get('trial/purchase'),label=index.nodes.get('trial/purchase/text');
  const parent=buttonTextLayerInfo(button,document,{},index);
  assert.equal(parent.suffix,' · 套餐文案');assert.match(parent.title,/12个月（沿用默认）/);assert.match(parent.title,/1个月（单独配置）：继续/);
  assert.equal(buttonTextLayerInfo(label,document,{},index).prefix,'默认文案');
  const monthly=buttonTextLayerInfo(label,document,{[`button-text:${button.id}`]:'trial/monthly'},index);
  assert.equal(monthly.prefix,'1个月（单独配置）');assert.equal(monthly.props.text,'继续');
  assert.equal(buttonTextLayerInfo(label,document,{[`button-text:${button.id}`]:'trial/annual'},index).prefix,'12个月（沿用默认）');
  assert.equal(buttonTextLayerInfo(label,document,{[`button-text:${button.id}`]:''},index).prefix,'默认文案');
  assert.equal(buttonTextLayerInfo(label,document,{[`button-text:${button.id}`]:'deleted'},index).prefix,'默认文案');
  assert.equal(buttonTextLayerInfo(index.nodes.get('trial/legal'),document,{},index),null);
  assert.deepEqual(document,before);
  button.props.buttonText.mode='default';assert.equal(buttonTextLayerInfo(button,document,{},index),null);
});

test('button label selection is confined to its group and screen and tolerates deleted packages',()=>{
  const document=buildFreeTrialTemplate(),button=indexDocument(document).nodes.get('trial/purchase'),label=indexDocument(document).nodes.get(button.props.buttonText.target);
  assert.equal(buttonTextResolution(label,document,{'trial/pages':2,'package:trial/packages':'trial/monthly'}).props.text,'继续');
  assert.match(buttonTextResolution(label,document,{selectedPackage:'foreign','package:other':'foreign'}).props.text,/0元领取/);
  const without=removeComponent(document,'trial/monthly');assert.match(buttonTextResolution(label,without,{'package:trial/packages':'trial/monthly'}).props.text,/0元领取/);
  const modal=document.root.children[0].children[0].children.at(-1).children.at(-1);
  modal.children.push(component('modal-package','Package','弹窗商品',{group:'trial/packages'}));
  assert.equal(buttonPackages(document,button).some(node=>node.id==='modal-package'),false);
});

test('component-owned label translations fall back and selecting a hidden page button reveals its page',()=>{
  const document=buildFreeTrialTemplate(),button=indexDocument(document).nodes.get('trial/purchase'),label=indexDocument(document).nodes.get(button.props.buttonText.target);
  button.props.buttonText.variants[0].translations={en:{text:'Continue',runs:null}};
  document.previewContentLocale='en';assert.equal(buttonTextResolution(label,document,{'trial/pages':2,'package:trial/packages':'trial/monthly'}).props.text,'Continue');
  document.previewContentLocale='ar';assert.equal(buttonTextResolution(label,document,{'trial/pages':2,'package:trial/packages':'trial/monthly'}).props.text,'继续');
  assert.deepEqual(buttonTextPreviewNavigation(document,button),{'trial/pages':2});
  assert.deepEqual(buttonTextPreviewNavigation(document,{props:{}}),{});
});

test('old free trial label rules migrate once into button content while retaining legal text and customization',()=>{
  let document=buildFreeTrialTemplate();const nodes=indexDocument(document).nodes,button=nodes.get('trial/purchase');delete button.props.buttonText;
  const legal=document.logic.rules.find(rule=>rule.conditions[0].type==='package');legal.effects.unshift({target:'trial/purchase/text',kind:'text',value:'我的月度文案'});
  const before=structuredClone(document),migrated=upgradeTrialButtonText(document),config=indexDocument(migrated).nodes.get(button.id).props.buttonText;
  assert.equal(config.variants[0].text,'我的月度文案');assert.equal(migrated.logic.rules.at(-1).effects.length,1);assert.equal(migrated.logic.rules.at(-1).effects[0].target,'trial/legal');
  assert.deepEqual(document,before);assert.equal(upgradeTrialButtonText(migrated),migrated);
  const custom=updateComponent(migrated,button.id,{props:{buttonText:{...config,variants:[{packageId:'trial/monthly',text:'组件新文案'}]}}});
  custom.logic.rules.at(-1).effects.unshift({target:'trial/purchase/text',kind:'text',value:'旧规则'});
  assert.equal(indexDocument(upgradeTrialButtonText(custom)).nodes.get(button.id).props.buttonText.variants[0].text,'组件新文案');
});
