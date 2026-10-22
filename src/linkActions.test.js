import assert from "node:assert/strict";
import test from "node:test";
import { linkActionFor, visibleLinkLabels } from "./linkActions.js";

test("link labels retain their order and visible copy", () => {
  assert.deepEqual(visibleLinkLabels("Restore Purchases · Terms · Privacy"), ["Restore Purchases", "Terms", "Privacy"]);
});

test("restore is recognized while unknown destinations remain unconfigured", () => {
  assert.deepEqual(linkActionFor("Restore Purchases"), { action: "RestorePurchases" });
  assert.deepEqual(linkActionFor("恢复购买"), { action: "RestorePurchases" });
  assert.deepEqual(linkActionFor("Terms"), { action: "OpenURL", actionUrl: "" });
  assert.deepEqual(linkActionFor("Terms", { action: "OpenURL", actionUrl: "https://example.com/terms" }), { action: "OpenURL", actionUrl: "https://example.com/terms" });
});
