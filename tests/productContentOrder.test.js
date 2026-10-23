import test from 'node:test';
import assert from 'node:assert/strict';
import { contentRegions, moveContentPart, contentSlot } from '../src/productContentOrder.js';

const inventory = { badge: { region: 'body', sequence: 0 }, name: { region: 'body', sequence: 20 }, price: { region: 'body', sequence: 40 }, saving: { region: 'body', sequence: 60 } };
test('stacked content lists only actual elements in current visual order', () => {
  assert.deepEqual(contentRegions('horizontal', inventory), { body: ['badge', 'name', 'price', 'saving'] });
  assert.deepEqual(contentRegions('standard', { name: inventory.name, price: inventory.price }, { body: ['saving', 'price', 'name', 'price'] }), { body: ['price', 'name'] });
});
test('every element can be reordered without changing font or SKU configuration', () => {
  const source = contentRegions('horizontal', inventory);
  const result = moveContentPart(source, 'price', 'body', 1);
  assert.deepEqual(result.body, ['badge', 'price', 'name', 'saving']);
  assert.deepEqual(source.body, ['badge', 'name', 'price', 'saving']);
  assert.deepEqual(contentSlot(result, 'price', 'horizontal'), { gridColumn: 1, gridRow: 2, justifySelf: 'center', textAlign: 'center' });
});
test('two-column layouts move elements between bounded regions exactly once', () => {
  const source = { heading: ['badge'], left: ['name', 'supporting'], right: ['reference', 'price', 'saving'] };
  const moved = moveContentPart(source, 'saving', 'left', 1);
  assert.deepEqual(moved.left, ['name', 'saving', 'supporting']);
  assert.deepEqual(moved.right, ['reference', 'price']);
  assert.equal(contentSlot(moved, 'saving', 'compact').gridColumn, 1);
  assert.equal(contentSlot(moved, 'saving', 'compact').gridRow, 3);
});
test('information-row marker spans the content rather than consuming name width', () => {
  assert.deepEqual(contentSlot({ marker: ['marker'], left: ['name', 'secondaryName', 'supporting'], right: ['price', 'billing'] }, 'marker', 'info-row'), { gridColumn: 1, gridRow: '1 / span 3', alignSelf: 'center' });
});

test('selection-marker region cannot accept price text or move into a text column', () => {
  const source = { marker: ['marker'], left: ['name'], right: ['price'] };
  assert.equal(moveContentPart(source, 'marker', 'left', 0), source);
  assert.equal(moveContentPart(source, 'price', 'marker', 0), source);
});
