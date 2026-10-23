import assert from "node:assert/strict";
import test from "node:test";
import { clearLocalDemoSettings, protectedTemplateIds, readTemplateNodes, writeTemplateNodes } from "./templateStorage.js";

function storage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("four protected templates keep independent node trees", () => {
  const store = storage();
  for (const [index, id] of [...protectedTemplateIds].entries()) {
    assert.equal(writeTemplateNodes(store, id, [{ id: `node-${index}`, type: "Text", content: `edit-${index}` }]), true);
  }
  for (const [index, id] of [...protectedTemplateIds].entries()) {
    assert.deepEqual(readTemplateNodes(store, id), [{ id: `node-${index}`, type: "Text", content: `edit-${index}` }]);
  }
});

test("local reset removes only this demo's saved templates and component library", () => {
  const store = storage();
  writeTemplateNodes(store, "ht-blue-privilege", [{ id: "edited", type: "Text" }]);
  store.setItem("paywall-template-source-image-repair-v1:ht-blue-privilege", "done");
  store.setItem("paywall-component-library-v1", "[]");
  store.setItem("another-site-setting", "keep");
  assert.equal(clearLocalDemoSettings(store), true);
  assert.equal(readTemplateNodes(store, "ht-blue-privilege"), null);
  assert.equal(store.getItem("paywall-template-source-image-repair-v1:ht-blue-privilege"), null);
  assert.equal(store.getItem("paywall-component-library-v1"), null);
  assert.equal(store.getItem("another-site-setting"), "keep");
});

test("unprotected templates and invalid records do not override defaults", () => {
  const store = storage();
  assert.equal(writeTemplateNodes(store, "knowledge", []), false);
  assert.equal(readTemplateNodes(store, "knowledge"), null);
  const id = [...protectedTemplateIds][0];
  store.setItem(`paywall-template-v1:${id}`, '{"version":1,"nodes":[{"id":"same","type":"Text"},{"id":"same","type":"Image"}]}');
  assert.equal(readTemplateNodes(store, id), null);
});

test("source image repair is one-time and preserves uploaded images and other settings", () => {
  const store = storage();
  const id = "ht-blue-privilege";
  writeTemplateNodes(store, id, [
    { id: "hero-image", type: "Hero Image", config: { mediaState: "removed", copyTitleSize: 28 } },
    { id: "products", type: "Products", config: { productPartStyles: { name: { fontSize: 15 } } } },
  ]);
  const repaired = readTemplateNodes(store, id);
  assert.equal(repaired[0].config.mediaState, "source");
  assert.equal(repaired[0].config.copyTitleSize, 28);
  assert.equal(repaired[1].config.productPartStyles.name.fontSize, 15);
  writeTemplateNodes(store, id, [{ id: "hero-image", type: "Hero Image", config: { mediaState: "removed" } }]);
  assert.equal(readTemplateNodes(store, id)[0].config.mediaState, "removed");

  const custom = "ht-membership-plans";
  writeTemplateNodes(store, custom, [{ id: "hero-image", type: "Hero Image", config: { mediaState: "custom", mediaSrc: "data:image/png;base64,AA==" } }]);
  assert.equal(readTemplateNodes(store, custom)[0].config.mediaSrc, "data:image/png;base64,AA==");

  const unverified = "ht-payment-recovery";
  writeTemplateNodes(store, unverified, [{ id: "hero-image", type: "Hero Image", config: { mediaState: "removed" } }]);
  assert.equal(readTemplateNodes(store, unverified)[0].config.mediaState, "removed");
});
