import test from "node:test";
import assert from "node:assert/strict";
import { PRICE_DISPLAY_MODES, billingMonths, productPriceFields, resolveProductPrice, skuCopy, templateSkuId, verticalProductPriceFields } from "../src/productPricing.js";

test("all six backend mode ids remain available", () => {
  assert.deepEqual(PRICE_DISPLAY_MODES.map((mode) => mode.id), ["0", "1", "3", "4", "6", "7"]);
});

test("subscription price modes use the same product data", () => {
  const row = { name: "12个月", price: "¥488", supportingCopy: "¥40.67/月", referencePrice: "¥698" };
  assert.equal(resolveProductPrice(row, "0").main, "¥40.67/月");
  assert.equal(resolveProductPrice(row, "1").main, "¥488");
  assert.deepEqual(["3", "6", "7"].map((mode) => resolveProductPrice(row, mode).strike), ["¥58.17/月", "¥58.17/月", "¥58.17/月"]);
  assert.equal(resolveProductPrice(row, "4").strike, "¥698");
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

test("all four templates resolve price and period from their SKU IDs", () => {
  for (const [variant, count] of [["blue-privilege", 3], ["membership-plans", 3], ["payment-recovery", 2], ["sku-sheet", 2]]) {
    for (let index = 0; index < count; index++) {
      const row = { skuId: templateSkuId(variant, index), name: "自定义名称", price: "¥9999", billingMonths: 99 };
      assert.ok(row.skuId);
      assert.notEqual(productPriceFields(row).total, "¥9999");
      assert.notEqual(billingMonths(row), 99);
      assert.equal(resolveProductPrice(row, "1").missing, false);
    }
  }
});

test("unknown SKU cannot reuse stale manual price", () => {
  const row = { skuId: "UNKNOWN", name: "12个月", price: "¥488", monthlyPrice: "¥40.67/月" };
  assert.equal(productPriceFields(row).total, "");
  assert.equal(billingMonths(row), null);
  assert.equal(resolveProductPrice(row, "1").missing, true);
});

test("package copy comes from the selected SKU and absent copy stays unavailable", () => {
  assert.deepEqual(skuCopy("DEMO-BLUE-MONTH"), { supportingCopy: "", savingCopy: "", saveCopy: "", badgeText: "" });
  assert.equal(skuCopy("DEMO-BLUE-YEAR").savingCopy, "节省 48%");
  assert.equal(skuCopy("DEMO-BLUE-YEAR").badgeText, "🔥 30% OFF");
  assert.equal(skuCopy("DEMO-MEMBER-YEAR").supportingCopy, "节省48%");
  assert.equal(skuCopy("DEMO-RECOVERY-YEAR").saveCopy, "新用户立省 64%");
  assert.equal(skuCopy("UNKNOWN").badgeText, "");
});

test("vertical products hide saving copy only while a reference total is shown", () => {
  const row = { name: "12个月", totalPrice: "¥488", referenceTotalPrice: "¥698", savingCopy: "节省 48%", showSavingCopy: true };
  assert.deepEqual(verticalProductPriceFields(row), { total: "¥488", monthly: "¥40.67/月", referenceTotal: "¥698", referenceMonthly: "¥58.17/月", months: 12, saving: "" });
  assert.equal(verticalProductPriceFields({ ...row, showReferencePrice: false }).saving, "节省 48%");
  assert.equal(verticalProductPriceFields({ skuId: "DEMO-BLUE-LIFETIME", savingCopy: "立减¥1000", showSavingCopy: true }).saving, "");
});
