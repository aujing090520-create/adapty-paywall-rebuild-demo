import assert from "node:assert/strict";
import test from "node:test";
import { revenueCatGallery } from "./revenueCatGallery.js";

test("Talkin RevenueCat gallery keeps all 41 distinct source templates in order", () => {
  assert.equal(revenueCatGallery.length, 41);
  assert.equal(new Set(revenueCatGallery.map((template) => template.id)).size, 41);
  assert.deepEqual(revenueCatGallery.map((template) => template.sourceOrder), Array.from({ length: 41 }, (_, index) => index + 1));
  assert.equal(revenueCatGallery[0].title, "Multi-step Paywall");
  assert.equal(revenueCatGallery[40].title, "Boxer");
  assert.ok(revenueCatGallery.every((template) => template.sourceTemplate === template.title && template.isGallery));
});
