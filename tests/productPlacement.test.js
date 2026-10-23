import assert from "node:assert/strict";
import test from "node:test";
import { productOffset, productTranslation } from "../src/productPlacement.js";

test("drag offsets use design pixels at different phone scales", () => {
  const geometry = { card: { left: 100, width: 90 }, element: { left: 125, width: 40 } };
  assert.deepEqual(productTranslation({ ...geometry, offsetX: 20, offsetY: -10, unitScale: .8 }), { x: 16, y: -8 });
  assert.deepEqual(productTranslation({ ...geometry, offsetX: 20, offsetY: -10, unitScale: .8, cssScale: .8 }), { x: 20, y: -10 });
});

test("alignment translates the original element without changing its dimensions", () => {
  const card = Object.freeze({ left: 100, width: 120 });
  const element = Object.freeze({ left: 130, width: 40, height: 20 });
  assert.deepEqual(productTranslation({ alignment: "left", card, element }), { x: -30, y: 0 });
  assert.deepEqual(productTranslation({ alignment: "center", card, element }), { x: 10, y: 0 });
  assert.deepEqual(productTranslation({ alignment: "right", card, element }), { x: 50, y: 0 });
  assert.deepEqual(element, { left: 130, width: 40, height: 20 });
});

test("invalid offsets cannot create invalid CSS coordinates", () => {
  assert.equal(productOffset("invalid"), 0);
  assert.equal(productOffset(Infinity), 0);
  assert.equal(productOffset(-2000), -1000);
  assert.equal(productOffset("12.5"), 12.5);
});
