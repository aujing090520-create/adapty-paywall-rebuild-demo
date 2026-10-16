import test from "node:test";
import assert from "node:assert/strict";
import { PRICE_DISPLAY_MODES, productPriceFields, resolveProductPrice } from "../src/productPricing.js";

test("all six backend mode ids remain available", () => {
  assert.deepEqual(PRICE_DISPLAY_MODES.map((mode) => mode.id), ["0", "1", "3", "4", "6", "7"]);
});

test("subscription price modes use the same product data", () => {
  const row = { name: "12个月", price: "¥488", supportingCopy: "¥40.67/月", referencePrice: "¥698" };
  assert.equal(resolveProductPrice(row, "0").main, "¥40.67/月");
  assert.equal(resolveProductPrice(row, "1").main, "¥488");
  assert.deepEqual(["3", "6", "7"].map((mode) => resolveProductPrice(row, mode).strike), ["¥40.67/月", "¥40.67/月", "¥40.67/月"]);
  assert.equal(resolveProductPrice(row, "4").strike, "¥488");
  assert.equal(resolveProductPrice(row, "7").prominent, true);
});

test("lifetime products never display a monthly price", () => {
  const row = { name: "终身", price: "¥698", referencePrice: "¥1698" };
  for (const mode of PRICE_DISPLAY_MODES) assert.equal(resolveProductPrice(row, mode.id).main, "¥698");
  assert.equal(resolveProductPrice(row, "7").strike, "¥1698");
});

test("legacy monthly prices stay monthly and missing totals are explicit", () => {
  const row = { name: "1年会员", price: "¥28.17/月" };
  assert.equal(productPriceFields(row).monthly, "¥28.17/月");
  assert.equal(resolveProductPrice(row, "1").missing, true);
  assert.equal(resolveProductPrice({ ...row, totalPrice: "¥338" }, "1").main, "¥338");
});

test("edited total prices update derived monthly previews", () => {
  assert.equal(productPriceFields({ name: "12个月", totalPrice: "¥600" }).monthly, "¥50/月");
});
