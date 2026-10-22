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
    assert.ok(nodes.some((item) => item.type === "Header" || item.type === "Carousel"), template.title);
    assert.ok(nodes.every((item) => item.id.startsWith(template.id)), template.title);
    assert.equal(nodes.some((item) => item.type === "Products"), sourcePackageCount(template.sourceOrder) > 0, template.title);
    assert.equal(template.productCount, sourcePackageCount(template.sourceOrder), template.title);
    assert.equal(template.visibleProductCount, sourceBlueprints[template.sourceOrder - 1].products?.length ?? 0, template.title);
    assert.deepEqual(template.sourceSelectionLabels, source.labels, template.title);
    assert.equal(template.media, template.heroAsset ? "image" : "none", template.title);
  }
});

test("Mindful moments uses the observed first carousel page and preserves all three illustrations", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = createSourceTemplateNodes(revenueCatGallery[19], node);
  const slides = tree.find((item) => item.type === "Carousel")?.config.slides;
  assert.deepEqual(slides.map((slide) => slide.title), ["Mindful moments", "Community connection", "Sleep Soundscapes"]);
  assert.deepEqual(slides.map((slide) => slide.image), [observedTemplate(20).assets[2], observedTemplate(20).assets[3], observedTemplate(20).assets[1]]);
  assert.equal(tree[0].type, "Image");
  assert.equal(tree.some((item) => item.type === "Header"), false);
});

test("wide badge review dots are configured below its card without changing other carousels", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const carousel = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node).find((item) => item.type === "Carousel");
  assert.equal(carousel(4).config.dotsPlacement, "below");
  assert.equal(carousel(7).config.dotsPlacement, undefined);
  const products = createSourceTemplateNodes(revenueCatGallery[3], node).find((item) => item.type === "Products");
  assert.equal(products.config.packageLayout, "vertical");
  assert.equal(products.config.cardContentLayout, "split-summary");
});

test("multi-step artwork and restore actions stay on their observed screens", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const flow = createSourceTemplateNodes(revenueCatGallery[0], node);
  const assets = observedTemplate(1).assets;
  assert.deepEqual(flow.filter((item) => item.type === "Image").map((item) => item.config.mediaSrc), [assets[0], assets[2], assets[3]]);
  assert.equal(flow.find((item) => item.id.endsWith("screen-3-timeline")).config.enabled, false);
  const products = flow.find((item) => item.type === "Products");
  assert.equal(products.config.packageLayout, "vertical");
  assert.equal(products.config.cardContentLayout, "radio-stacked");
  assert.equal(products.config.planRadius, 12);
  assert.deepEqual(flow.find((item) => item.id.endsWith("screen-3-features")).config.listRows.map((row) => row.leading), ["moon", "flower", "heart"]);
  assert.deepEqual(flow.filter((item) => item.type === "Button").map((item) => item.config.action), ["NextScreen", "NextScreen", "Purchase"]);
  assert.deepEqual(flow.filter((item) => item.type === "Button").map((item) => item.config.backgroundColor), ["#8b83f8", "#8b82f8", "#8b84f8"]);
  const dark = createSourceTemplateNodes(revenueCatGallery[39], node);
  assert.deepEqual(dark.filter((item) => ["Dismiss", "RestorePurchases"].includes(item.config?.action)).map((item) => item.content), ["×", "Restore"]);
});

test("switch control is not rendered as a second standalone tabs component", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node);
  for (const order of [7, 8, 9]) {
    const nodes = tree(order);
    assert.equal(nodes.some((item) => item.type === "Tabs"), false);
    assert.equal(nodes.some((item) => item.type === "Toggle"), true);
  }
  assert.equal(tree(7).find((item) => item.type === "Products").config.showRadio, true);
  assert.equal(tree(8).find((item) => item.type === "Products").config.cardContentLayout, "split-summary");
  assert.equal(tree(8).find((item) => item.type === "Products").config.packageRows[1].price, "$5.83/mo");
  assert.deepEqual(tree(8).find((item) => item.type === "List").config.listRows.map((row) => row.leading), ["ticket", "activity", "running"]);
  const firstReview = tree(7).find((item) => item.type === "Carousel")?.config.slides[0];
  assert.match(firstReview.title, /brown thumb green/);
});

test("testimonial, library, and concert layouts keep their observed first-screen hierarchy", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node);
  assert.equal(tree(4).find((item) => item.type === "Carousel").config.slides[0].title, "Best cat photo app");
  assert.deepEqual(tree(9).slice(0, 3).map((item) => item.type), ["Image", "Header", "Image"]);
  assert.equal(tree(9)[0].config.mediaSrc, observedTemplate(9).assets[1]);
  assert.equal(tree(9)[2].config.mediaSrc, observedTemplate(9).assets[0]);
  const concert = tree(17);
  assert.match(concert.find((item) => item.type === "Header").content, /ConcertBuddy Ultra/);
  assert.ok(concert.findIndex((item) => item.type === "List") < concert.findIndex((item) => item.id.endsWith("-copy-2")));
  assert.deepEqual(concert.find((item) => item.type === "List").config.listRows.map((row) => row.leading), ["ticket", "seat", "shirt", "group"]);
  assert.deepEqual(tree(21).find((item) => item.type === "Timeline").config.listRows.map((row) => row.marker), ["lock", "bell", "star"]);
  assert.deepEqual(tree(26).find((item) => item.type === "Timeline").config.listRows.map((row) => row.marker), ["lock", "bell", "star"]);
  assert.deepEqual(tree(24).filter((item) => item.type === "Image").map((item) => item.config.mediaSrc), observedTemplate(24).assets);
  assert.equal(tree(27).find((item) => item.type === "Feature Table").config.tableVariant, "feature-list");
  assert.equal(tree(18).find((item) => item.type === "Products").config.packageLayout, "info-row");
  assert.equal(tree(25).find((item) => item.type === "Products").config.packageLayout, "horizontal");
  assert.equal(tree(12).find((item) => item.type === "Products").config.packageLayout, "horizontal");
  assert.deepEqual(tree(11).find((item) => item.type === "Products").config.badgeGradient, ["#d279de", "#d279de", "#d279de"]);
  assert.equal(tree(13).find((item) => item.type === "Products").config.showMainPrice, false);
  assert.equal(tree(13).find((item) => item.type === "Products").config.showRadio, true);
  assert.equal(tree(14).find((item) => item.type === "Products").config.cardContentLayout, "duration-grid");
  assert.equal(tree(14).find((item) => item.type === "Carousel").config.dotsPlacement, "below");
  assert.equal(tree(14).find((item) => item.type === "Products").config.defaultSelected, 1);
  for (const order of [19, 22]) {
    const award = tree(order).find((item) => item.type === "Award");
    assert.equal(award.config.leftDecorationSrc, observedTemplate(order).assets[1]);
    assert.equal(award.config.rightDecorationSrc, observedTemplate(order).assets[2]);
    assert.equal(tree(order).find((item) => item.type === "Products").config.cardContentLayout, "duration-grid");
  }
  assert.ok(tree(28).some((item) => item.id.endsWith("-copy-0") && /PREMIUM/.test(item.content)));
  assert.equal(tree(22).find((item) => item.id.endsWith("-reviews")).config.listVariant, "testimonials");
  assert.equal(tree(22).find((item) => item.id.endsWith("-reviews")).config.testimonialRows[0].author, "CatMomSarah");
  assert.deepEqual(tree(34).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["weight", "running", "clock"]);
  assert.deepEqual(tree(35).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["scan", "map", "help"]);
  assert.deepEqual(tree(36).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["arrow", "arrow", "arrow"]);
  assert.deepEqual(tree(37).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["blocks", "activity", "archive", "download"]);
  assert.equal(tree(41).find((item) => item.id.endsWith("-social")).config.accentColor, "#ffe479");
  assert.match(tree(41).find((item) => item.id.endsWith("-social")).config.leftDecorationSrc, /1181742_1734623909\.webp/);
  assert.match(tree(41).find((item) => item.id.endsWith("-social")).config.rightDecorationSrc, /1181742_1734623881\.webp/);
  assert.deepEqual(tree(34).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["weight", "running", "clock"]);
  assert.deepEqual(tree(40).find((item) => item.id.endsWith("-features")).config.listRows.map((row) => row.leading), ["access", "noads", "running"]);
  assert.ok(tree(40).find((item) => item.id.endsWith("-features")).config.listRows.every((row) => row.showCaption === false && row.caption === ""));
  assert.deepEqual(tree(29).find((item) => item.type === "Feature Table").config.rows.map((row) => row.values), [["✓", "✓"], ["—", "✓"], ["—", "✓"], ["—", "✓"], ["—", "✓"]]);
  assert.deepEqual(tree(36).slice(0, 5).map((item) => item.type), ["Header", "Text", "Image", "List", "Text"]);
  assert.ok(tree(39).findIndex((item) => item.type === "List") < tree(39).findIndex((item) => item.id.endsWith("-copy-2")));
  assert.equal(tree(39).find((item) => item.type === "Products").config.showCards, false);
});

test("source background images missing from the text inventory remain editable image nodes", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  for (const [order, assetId] of [[30, "1181742_1738081702"], [35, "1181742_1734689045"]]) {
    const template = revenueCatGallery[order - 1];
    const image = createSourceTemplateNodes(template, node).find((item) => item.id.endsWith("-image"));
    assert.match(template.heroAsset, new RegExp(`${assetId}\\.webp`));
    assert.equal(template.media, "image");
    assert.equal(image?.config.mediaSrc, template.heroAsset);
  }
});

test("source-specific commerce structures do not revert to generic packages", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const tree = (order) => createSourceTemplateNodes(revenueCatGallery[order - 1], node);
  assert.match(tree(1).find((item) => item.type === "Products").content, /Yearly\|\$69\.99\/year/);
  assert.match(tree(1).find((item) => item.type === "Products").content, /Weekly\|\$2\.99\/week/);
  assert.equal(tree(2).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(3).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(8).find((item) => item.type === "Products").config.defaultSelected, 1);
  assert.equal(tree(5).find((item) => item.type === "Products").config.showCards, false);
  assert.equal(tree(10).find((item) => item.type === "Products").content.split("\n").length, 5);
  for (const order of [10, 11]) assert.deepEqual(tree(order).slice(0, 2).map((item) => item.type), ["Image", "Header"]);
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

test("offer-code templates retain their distinct source artwork and nested layouts", () => {
  const node = (id, type, content, depth, options = {}) => ({ id, type, content, depth, ...options });
  const first = createSourceTemplateNodes(revenueCatGallery[4], node);
  const second = createSourceTemplateNodes(revenueCatGallery[5], node);
  assert.match(revenueCatGallery[4].heroAsset, /1181742_1756111093\.webp$/);
  assert.equal(first[0].type, "Stack");
  assert.equal(first.find((item) => item.id.endsWith("-offer-card"))?.depth, 1);
  assert.equal(first.find((item) => item.id.endsWith("-gift"))?.depth, 2);
  assert.equal(second[0].id, "rc-source-6-dismiss");
  assert.equal(second.find((item) => item.id.endsWith("-image"))?.config.mediaSrc, revenueCatGallery[5].heroAsset);
  for (const tree of [first, second]) {
    const product = tree.find((item) => item.type === "Products");
    assert.equal(product.config.showCards, false);
    assert.equal(product.config.priceSummary, true);
    assert.equal(product.config.sourceCurrentPrice, "$44.99/yr");
    assert.equal(tree.find((item) => item.type === "Button")?.config.action, "OfferCodeRedemption");
  }
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
    leftDecorationSrc: observedTemplate(19).assets[1], rightDecorationSrc: observedTemplate(19).assets[2],
  });
  assert.equal(tree(27).find((item) => item.type === "Feature Table").config.title, "WHAT'S INCLUDED");
  assert.equal(tree(27).find((item) => item.type === "Feature Table").config.accentColor, "#25328d");
  assert.equal(tree(18).find((item) => item.id.endsWith("-action")).content, "続ける Continue");
  const devToolsTree = tree(24);
  assert.equal(devToolsTree.find((item) => item.type === "List")?.depth, 1);
  assert.equal(devToolsTree.findIndex((item) => item.type === "List"), devToolsTree.findIndex((item) => item.type === "Products") + 1);
  assert.ok(tree(26).findIndex((item) => item.id.endsWith("-copy-0")) > tree(26).findIndex((item) => item.type === "Timeline"));
  assert.ok(tree(29).findIndex((item) => item.id.endsWith("-copy-0")) > tree(29).findIndex((item) => item.type === "Feature Table"));
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
    assert.equal(nodes.some((item) => item.type === "Tabs"), Boolean(observedLayerCount(order, "tabs")), template.title);
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
