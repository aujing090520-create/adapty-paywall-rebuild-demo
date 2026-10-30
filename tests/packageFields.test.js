import test from 'node:test';
import assert from 'node:assert/strict';
import { productPeriod, productSavings, packageDisplayFields } from '../src/products/packageFields.js';
import { productPriceFields, resolveProductPrice } from '../src/productPricing.js';
import { component, importComponentDocument, indexDocument, validDocument } from '../src/builder/componentDocument.js';
import { buildHtPackageFields } from '../src/builder/htPackageFields.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';

const row = (totalPrice, unit, count = 1, name = '周期商品') => ({ totalPrice, period: { unit, count }, name });
const packageNode = (id, group = 'plans') => component(id, 'Package', '', { dataKey: id, group });
const doc = (products, children = Object.keys(products).map((id) => packageNode(id))) => ({ version: 3, products, root: component('screen', 'Screen', '', {}, children) });

test('savings normalize to the shortest SKU using exact 12 month / 52 week years and floor percentages', () => {
  const month = row('¥78', 'month'), year = row('¥488', 'year');
  assert.equal(productSavings(year, [month, year]), '节省47%');
  assert.equal(productSavings(month, [month, year]), '');
  const week = row('¥10', 'week');
  assert.equal(productSavings(row('¥260', 'year'), [week]), '节省50%');
  assert.equal(productSavings(row('¥26', 'month'), [week]), '节省40%');
  assert.equal(productSavings(row('¥0.24', 'year'), [row('¥0.10', 'month')]), '节省80%');
  assert.equal(productPeriod(row('¥26', 'year')).units, productPeriod(row('¥26', 'month', 12)).units);
  assert.equal(productPriceFields(row('¥26', 'week')).monthly, '¥112.67/月');
});

test('missing, free, conflicting, foreign-currency and non-saving baselines never produce misleading savings', () => {
  const year = row('¥488', 'year');
  for (const candidates of [[], [row('¥0', 'month')], [row('$78', 'month')], [row('¥78', 'month'), row('¥68', 'month')]]) assert.equal(productSavings(year, candidates), '');
  assert.equal(productSavings(row('¥1200', 'year'), [row('¥78', 'month')]), '');
  assert.equal(productSavings({ skuId: 'DEMO-BLUE-LIFETIME' }, [row('¥78', 'month')]), '');
  assert.equal(productSavings({ skuId: 'UNKNOWN', price: '¥1' }, [row('¥78', 'month')]), '');
});

test('product label is configured copy, not discount math; each selection state has its configured value and fallback', () => {
  const p = packageNode('annual');
  let document = doc({ annual: { skuId: 'DEMO-SKU-YEAR', badgeText: '运营原文7折', selectedBadgeText: '选中原文30% OFF' } });
  assert.equal(packageDisplayFields(document, p).badgeText, '运营原文7折');
  assert.equal(packageDisplayFields(document, p, true).badgeText, '选中原文30% OFF');
  document = doc({ annual: { skuId: 'DEMO-SKU-YEAR' } });
  assert.equal(packageDisplayFields(document, p).badgeText, '最受欢迎');
  assert.equal(packageDisplayFields(doc({ annual: { skuId: 'DEMO-MEMBER-LIFETIME' } }), p).badgeText, '物有所值');
  assert.equal(packageDisplayFields(doc({ annual: { skuId: 'DEMO-BLUE-MONTH' } }), p).badgeText, '');
  assert.equal(packageDisplayFields(doc({ annual: { skuId: 'DEMO-SKU-YEAR', showBadge: false } }), p).badgeText, '');
  assert.equal(packageDisplayFields(doc({ annual: { skuId: 'DEMO-CREDIT-25' } }), p).productInfo, '');
});

test('bound periods and prices cannot be overridden and savings are isolated by group, screen and hidden state', () => {
  const products = { month: { skuId: 'DEMO-BLUE-MONTH' }, annual: { skuId: 'DEMO-BLUE-YEAR', name: '伪造周期', price: '¥1', savingCopy: '伪造节省99%' }, other: row('¥100', 'week') };
  const document = doc(products, [packageNode('month'), packageNode('annual'), component('other-screen', 'Screen', '', {}, [packageNode('other')])]);
  const before = structuredClone(document), annual = document.root.children[1];
  const fields = packageDisplayFields(document, annual);
  assert.equal(fields.name, '12个月'); assert.equal(fields.price, '¥488'); assert.equal(fields.productInfo, '节省47%');
  assert.equal(packageDisplayFields(doc({ lifetime: { skuId: 'DEMO-BLUE-LIFETIME' } }), packageNode('lifetime')).productInfo, '永久会员权益');
  const hidden = structuredClone(document); hidden.root.children[0].props.hidden = true;
  assert.equal(packageDisplayFields(hidden, hidden.root.children[1]).productInfo, '');
  const separate = structuredClone(document); separate.root.children[0].props.group = 'unrelated';
  assert.equal(packageDisplayFields(separate, separate.root.children[1]).productInfo, '');
  assert.deepEqual(document, before);
});

test('reference prices must be greater than the matched selling price, including equality and US-style same-price data', () => {
  for (const referenceTotalPrice of ['$9.99', '$8.99', '¥19.99', 'bad']) {
    const fields = productPriceFields({ ...row('$9.99', 'month'), referenceTotalPrice });
    assert.equal(fields.referenceTotal, '');
    for (const mode of ['0','1','3','4','6','7']) assert.equal(resolveProductPrice({ ...row('$9.99', 'month'), referenceTotalPrice }, mode).strike, '');
  }
  assert.equal(resolveProductPrice({ ...row('$9.99', 'month'), referenceTotalPrice: '$12.99' }, '1').strike, '$12.99');
});

test('four HT defaults contain live label and information nodes without changing SKU data or duplicating on rebuild', () => {
  for (const id of ['ht-blue-privilege','ht-membership-plans','ht-payment-recovery','ht-sku-sheet']) {
    const template = templates.find((entry) => entry.id === id), document = importComponentDocument(createBuilderNodes(id), template);
    assert.ok(validDocument(document));
    const { nodes } = indexDocument(document);
    for (const p of [...nodes.values()].filter((node) => node.type === 'Package')) {
      const descendants = []; const visit = (node) => { descendants.push(node); node.children.forEach(visit); }; visit(p);
      if(id==='ht-payment-recovery'&&p.id==='products/package-1'){
        assert.equal(descendants.some(node=>node.props.productField==='badgeText'),false);
        assert.equal(descendants.some(node=>node.props.binding?.field==='productInfo'),false);
        continue;
      }
      assert.ok(descendants.some((node) => node.props.productField === 'badgeText'));
      assert.equal(descendants.filter((node) => node.type === 'Text' && node.props.binding?.field === 'productInfo' && !node.props.hidden).length, 1);
    }
    assert.deepEqual(buildHtPackageFields(document, template.documentTemplate), document);
  }
});
