import test from 'node:test';
import assert from 'node:assert/strict';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {importComponentDocument,indexDocument,validDocument} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {logicNode} from '../src/builder/paywallLogic.js';
import {productPriceFields} from '../src/productPricing.js';
import {screenChromeLayout} from '../src/builder/screenLayout.js';
import {pageFrame} from '../src/builder/pagePresentation.js';

const load=()=>upgradeCanonicalComponents(importComponentDocument(createBuilderNodes('ht-payment-recovery'),templates.find(item=>item.id==='ht-payment-recovery')));
test('recovery annual card has two explicit information groups and no decorative wrapper ladder',()=>{
  const document=load(),{nodes,parents}=indexDocument(document);
  assert.ok(validDocument(document));
  assert.deepEqual(nodes.get('products/package-0').children.map(node=>node.id),['products/left-0','products/right-0']);
  assert.deepEqual(nodes.get('products/identity-0').children.map(node=>node.id),['products/package-0-name','products/reference-0']);
  assert.equal(parents.get('products/package-0-productInfo'),'products/left-0');
  assert.deepEqual(nodes.get('products/right-0').children.map(node=>node.id),['products/badge-0','products/package-0-price']);
  assert.equal(nodes.get('products/reference-0').props.parameter,'totalReferencePrice');
  assert.equal(nodes.get('products/reference-0').props.strike,true);
  assert.equal(nodes.get('products/package-0-price').props.parameter,'monthlyPrice');
  assert.equal(nodes.get('products/package-0').props.priceMode,'4');
  assert.equal(productPriceFields(document.products[nodes.get('products/package-0').props.dataKey]).referenceTotal,'¥488');
  assert.equal(nodes.has('products/tag-0'),false);
  assert.equal(nodes.get('products/package-1').props.productLabelEnabled,false);
  assert.deepEqual(nodes.get('products/right-1').children.map(node=>node.id),['products/package-1-price']);
});
test('recovery renewal follows package selection in both directions without changing full legal copy',()=>{
  const document=load(),{nodes}=indexDocument(document),copy=nodes.get('recovery/renewal'),legal=nodes.get('legal');
  const annual=nodes.get('products/package-0'),month=nodes.get('products/package-1');
  const before=structuredClone(document);
  assert.match(logicNode(copy,document,{},annual).props.text,/首年.*续订价.*年/);
  assert.match(logicNode(copy,document,{},month).props.text,/每月.*月价/);
  assert.match(logicNode(copy,document,{},annual).props.text,/首年/);
  assert.match(legal.props.text,/24小时.*iTunes.*服务条款及隐私政策/);
  assert.equal(nodes.get('links').children.filter(node=>node.type==='Button').length,2);
  assert.deepEqual(document,before);
});
test('recovery screen owns fixed header and footer across presentation sizes; blue placement is unchanged',()=>{
  const document=load(),chrome=screenChromeLayout(document.root);
  assert.equal(chrome.header.id,'recovery/header');
  assert.equal(chrome.footer.children[0].id,'products');
  assert.ok(!chrome.content.some(node=>node.id===chrome.header.id||node.id===chrome.footer.id));
  for(const mode of ['fullscreen','sheet','window'])for(const height of [600,674,844]){
    assert.ok(pageFrame({...document.root.props,pagePresentation:mode,windowHeight:height}).height<=844);
    assert.equal(screenChromeLayout(document.root).header,chrome.header);
  }
  const blue=upgradeCanonicalComponents(importComponentDocument(createBuilderNodes('ht-blue-privilege'),templates.find(item=>item.id==='ht-blue-privilege')));
  assert.equal(indexDocument(blue).parents.get('products'),'$main');
});
