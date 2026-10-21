import assert from "node:assert/strict";
import test from "node:test";
import { protectedTemplateIds, readTemplateNodes, writeTemplateNodes } from "./templateStorage.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
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

test("unprotected templates and invalid records do not override defaults", () => {
  const store = storage();
  assert.equal(writeTemplateNodes(store, "knowledge", []), false);
  assert.equal(readTemplateNodes(store, "knowledge"), null);
  const id = [...protectedTemplateIds][0];
  store.setItem(`paywall-template-v1:${id}`, '{"version":1,"nodes":[{"id":"same","type":"Text"},{"id":"same","type":"Image"}]}');
  assert.equal(readTemplateNodes(store, id), null);
});
