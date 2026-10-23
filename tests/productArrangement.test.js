import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_ARRANGEMENTS, productArrangement, updateProductArrangement } from '../src/productArrangement.js';

test('five layouts expose distinct bounded configuration without numeric coordinates', () => {
  assert.equal(Object.keys(PRODUCT_ARRANGEMENTS).length, 5);
  for (const fields of Object.values(PRODUCT_ARRANGEMENTS)) {
    for (const field of fields) {
      assert.ok(!/offset|padding|gap|order$/i.test(field.key) || ['priceOrder', 'referenceOrder'].includes(field.key));
      assert.ok(field.options.some(([value]) => value === 'source'));
    }
  }
});

test('untouched templates keep their source arrangement and legacy configuration', () => {
  const config = { cardContentLayout: 'split-summary', productPartStyles: { price: { fontSize: 18, offsetX: 7 } }, packageRows: [{ name: '12个月' }] };
  const original = JSON.stringify(config);
  assert.deepEqual(productArrangement(config, 'compact'), { priceSide: 'source', referenceOrder: 'source' });
  assert.equal(JSON.stringify(config), original);
  assert.equal(updateProductArrangement(config, 'compact', 'offsetX', 70), config);
});

test('layout settings stay independent and do not modify SKU data or typography', () => {
  const config = { productPartStyles: { price: { fontSize: 18, color: '#111111' } }, packageRows: [{ price: '¥488' }] };
  const next = updateProductArrangement(updateProductArrangement(config, 'horizontal', 'priceOrder', 'offer-first'), 'compact', 'priceSide', 'left');
  assert.equal(productArrangement(next, 'horizontal').priceOrder, 'offer-first');
  assert.equal(productArrangement(next, 'compact').priceSide, 'left');
  assert.equal(next.packageRows, config.packageRows);
  assert.equal(next.productPartStyles, config.productPartStyles);
  assert.equal(productArrangement({ productArrangements: { compact: { priceSide: 'invalid' } } }, 'compact').priceSide, 'source');
});
