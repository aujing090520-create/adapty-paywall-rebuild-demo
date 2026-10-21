import assert from "node:assert/strict";
import test from "node:test";
import { revenueCatGallery } from "./revenueCatGallery.js";
import { createSourceTemplateNodes, observedEditor, observedLayerCount, observedTemplate, sourceBlueprints, sourcePackageCount, sourceProductRows } from "./revenueCatSourceBlueprints.js";

test("Talkin RevenueCat gallery keeps all 41 distinct source templates in order", () => {
  assert.equal(revenueCatGallery.length, 41);
  assert.equal(new Set(revenueCatGallery.map((template) => template.id)).size, 41);
  assert.deepEqual(revenueCatGallery.map((template) => template.sourceOrder), Array.from({ length: 41 }, (_, index) => index + 1));
  assert.equal(revenueCatGallery[0].title, "Multi-step Paywall");
  assert.equal(revenueCatGallery[40].title, "Boxer");
  assert.ok(revenueCatGallery.every((template) => template.sourceTemplate === template.title && template.isGallery));
});

test("every editable gallery tree is backed by the matching source preview", () => {
  assert.equal(sourceBlueprints.length, 41);
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  for (const template of revenueCatGallery) {
    const source = observedTemplate(template.sourceOrder);
    assert.equal(source.name, template.title);
    assert.ok(source.labels.length > 0);
    const nodes = createSourceTemplateNodes(template, node);
    assert.ok(nodes.some((item) => item.type === "Header"), template.title);
    assert.ok(nodes.every((item) => item.id.startsWith(template.id)), template.title);
    assert.equal(nodes.some((item) => item.type === "Products"), sourcePackageCount(template.sourceOrder) > 0, template.title);
    assert.equal(template.productCount, sourcePackageCount(template.sourceOrder), template.title);
    assert.equal(template.visibleProductCount, sourceBlueprints[template.sourceOrder - 1].products?.length ?? 0, template.title);
    assert.deepEqual(template.sourceSelectionLabels, source.labels, template.title);
    assert.equal(template.media, source.assets.length ? "image" : "none", template.title);
  }
});

test("source-specific commerce structures do not revert to generic packages", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node);
  assert.match(tree(1).find((item) => item.type === "Products").content, /Yearly\|\$69\.99\/year/);
  assert.match(tree(1).find((item) => item.type === "Products").content, /Weekly\|\$2\.99\/week/);
  assert.equal(tree(2).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(3).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(5).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(10).find((item) => item.type === "Products").content.split("\n").length, 5);
  assert.equal(tree(10).find((item) => item.type === "Products").config.purchasePerCard, true);
  assert.equal(tree(13).find((item) => item.type === "Products").config.purchasePerCard, false);
  assert.deepEqual(tree(13).filter((item) => ["Button", "Web Paywall Button"].includes(item.type)).map((item) => item.content), ["Continue in-app", "Or, save 30%"]);
  for (const order of [13, 14, 15]) {
    assert.equal(tree(order).find((item) => item.type === "Web Paywall Button").config.action, "WebCheckout");
  }
  for (const order of [5, 6]) {
    assert.equal(tree(order).find((item) => item.type === "Button").config.action, "OfferCodeRedemption");
  }
  assert.equal(tree(29).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(revenueCatGallery[1].productCount, 1);
  assert.equal(revenueCatGallery[28].productCount, 1);
});

test("observed package badges, subtitles, and bilingual labels stay with their packages", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node);
  assert.equal(sourceProductRows(13)[0].badgeText, "19% OFF");
  assert.equal(sourceProductRows(13)[1].supportingCopy, "Full access for just $9.99/mo");
  assert.equal(sourceProductRows(18)[0].name, "一月 · Monthly Path");
  assert.equal(sourceProductRows(18)[2].supportingCopy, "月から月へ · full year");
  assert.equal(sourceProductRows(40)[1].badgeText, "Save 19% (only $5.83/mo)");
  assert.deepEqual(tree(19).find((item) => item.type === "Award").config, {
    title: "App of the Year", source: "The Download", subtitle: "for 2025", accentColor: revenueCatGallery[18].accent,
  });
  assert.equal(tree(27).find((item) => item.type === "Feature Table").config.title, "WHAT'S INCLUDED");
  assert.equal(tree(18).find((item) => item.id.endsWith("-action")).content, "続ける Continue");
  assert.deepEqual(tree(37).filter((item) => ["Dismiss", "RestorePurchases"].includes(item.config?.action)).map((item) => item.content), ["BACK", "RESTORE"]);
});

test("40 source editor layer inventories remain distinct from the unverified template", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  assert.equal(revenueCatGallery.filter((template) => template.editorVerified).length, 40);
  assert.equal(observedEditor(38), undefined);
  for (const template of revenueCatGallery.filter((item) => item.editorVerified)) {
    const order = template.sourceOrder;
    const nodes = createSourceTemplateNodes(template, node);
    assert.equal(nodes.find((item) => item.type === "Products")?.config.sourcePackageCount, observedLayerCount(order, "package"), template.title);
    assert.equal(nodes.some((item) => item.type === "Timeline"), Boolean(observedLayerCount(order, "timeline")), template.title);
    assert.equal(nodes.some((item) => item.type === "Toggle"), Boolean(observedLayerCount(order, "toggle")), template.title);
    assert.equal(nodes.some((item) => item.type === "Tabs"), Boolean(observedLayerCount(order, "tabs") || observedLayerCount(order, "tab_control")), template.title);
    assert.equal(nodes.some((item) => item.type === "Carousel"), Boolean(observedLayerCount(order, "carousel")), template.title);
  }
});

test("all visible preview copy from verified source templates has a mapped node field", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  for (const template of revenueCatGallery.filter((item) => item.editorVerified)) {
    const serialized = JSON.stringify(createSourceTemplateNodes(template, node));
    for (const line of observedTemplate(template.sourceOrder).text.split("\n").filter(Boolean)) {
      const escaped = JSON.stringify(line).slice(1, -1);
      assert.ok(serialized.includes(line) || serialized.includes(escaped), `${template.title}: ${line}`);
    }
  }
});
