import observed from "./revenueCatObserved.json" with { type: "json" };
import editorObserved from "./revenueCatEditorObserved.json" with { type: "json" };

// Indices refer to the exact visible lines captured from each Talkin source preview.
// A missing key means that component was not observed, not that every source setting was inspected.
export const sourceBlueprints = [
  { heading: 0, flow: true, products: ["Yearly|$69.99/year|", "Weekly|$2.99/week|"] },
  { heading: 0, copy: [1, 2], cta: 3 },
  { heading: 0, copy: [1, 2, 3], cta: 4 },
  { heading: 0, reviews: [1, 16], reviewStyle: "carousel", products: ["Yearly|$69.99/yr|$5.83/mo billed annually", "Monthly|$9.99/mo|"], cta: 24 },
  { heading: 0, copy: [1, 2, 3, 4], cta: 5 },
  { heading: 0, copy: [1, 2, 3, 4], cta: 5 },
  { heading: 0, reviews: [1, 11], reviewStyle: "carousel", toggle: 11, products: ["Yearly|$5.83/mo|Only $5.83/mo", "Monthly|$9.99/mo|"], cta: 17 },
  { heading: 0, features: [1, 4], toggle: 4, products: ["Monthly|$9.99/mo|", "Yearly|$69.99|$5.83/mo"], cta: 10 },
  { heading: 0, copy: [1, 2, 3], toggle: 4, cta: 5 },
  { heading: 0, products: ["25 credits|$2.99|5 seconds of video", "50 credits|$9.99|10 seconds of video", "100 credits|$17.99|20 seconds of video", "250 credits|$24.99|50 seconds of video", "500 credits|$39.99|100 second of video"] },
  { heading: 0, features: [1, 6], social: [6, 7], products: ["6 Months|$39.99/6mo|Only $6.67/mo", "Month|$9.99/mo|"], cta: 14 },
  { heading: 0, tabs: [1, 2], features: [3, 8], products: ["Yearly|$69.99/yr|Only $5.83/mo", "Monthly|$9.99/mo|Billed at $9.99/mo."], cta: 15 },
  { heading: 0, features: [1, 5], products: ["Annual|$69.99/yr|Full access", "Monthly|$9.99/mo|Full access"], cta: 10, webCta: 11 },
  { heading: 0, copy: [1], reviews: [2, 11], reviewStyle: "carousel", products: ["30 DAYS|$9.99|", "12 MONTHS|$69.99|", "LIFETIME|$119.99|"], cta: 19, webCta: 20 },
  { heading: 0, copy: [1, 2], features: [3, 9], paired: true, cta: 9, webCta: 10, afterCta: [11] },
  { heading: 0, copy: [1, 2], features: [3, 13], paired: true, cta: 13, afterCta: [14] },
  { heading: 0, copy: [1, 2, 7], features: [3, 7], cta: 8 },
  { heading: 0, copy: [1, 2], products: ["Monthly Path|$9.99|month to month", "Seasonal Journey|$24.99|three months", "Annual Reflection|$69.99|full year"], cta: 19, afterCta: [20] },
  { heading: 0, copy: [1], award: [2, 3, 4], reviews: [5, 14], reviewStyle: "carousel", products: ["30 DAYS|$9.99|", "12 MONTHS|$69.99|", "LIFETIME|$119.99|"], cta: 22 },
  { heading: 2, reviews: [0, 10], reviewStyle: "carousel", products: ["Annual|$69.99/year|Only $5.83/mo", "Monthly|$9.99/mo|"], cta: 16 },
  { heading: 0, timeline: [1, 7], products: ["Yearly|$69.99/yr|Only $5.83/mo", "Monthly|$9.99/mo|"], cta: 14 },
  { heading: 0, copy: [1], award: [2, 3, 4], reviews: [5, 14], reviewStyle: "list", products: ["30 DAYS|$9.99|", "12 MONTHS|$69.99|", "LIFETIME|$119.99|"], cta: 22 },
  { heading: 1, copy: [0], products: ["yearly|$5.83|($69.99/yr) per month, billed annually", "monthly|$9.99|"], features: [9, 17], paired: true, cta: 17, afterCta: [18] },
  { heading: 0, copy: [1, 2], features: [6, 13], products: ["Pro Access / year|$69.99|", "Pro Access / month|$9.99|"], cta: 24 },
  { heading: 0, copy: [1], features: [2, 12], paired: true, products: ["Yearly|$69.99/yr|Only $5.83/mo", "Monthly|$9.99/mo|"], cta: 19 },
  { heading: 0, timeline: [1, 7], copy: [7], cta: 8 },
  { heading: 0, products: ["Annual|$69.99/year|Only $5.83/mo", "Monthly|$9.99/month|"], table: [8, 18], cta: 18 },
  { heading: 1, copy: [0, 2], products: ["Annual|$69.99/yr|Only $5.83/mo", "Monthly|$9.99/mo|"], cta: 9 },
  { heading: 0, table: [2, 7], tableColumns: [7, 8], copy: [9], cta: 10 },
  { heading: 0, copy: [1], features: [2, 5], products: ["Monthly|$9.99/mo|", "Annual|$69.99/yr|", "Lifetime|$119.99|"], cta: 12 },
  { heading: 0, features: [1, 5], products: ["Annual|$69.99/yr|Full access", "Monthly|$9.99/mo|Full access"], cta: 10 },
  { heading: 0, copy: [1], products: ["Monthly|$9.99/mo|", "Yearly|$69.99/yr|"], cta: 7, afterCta: [8] },
  { heading: 0, copy: [1], features: [2, 6], products: ["Monthly|$9.99/mo|", "Yearly|$69.99/yr|$5.83/mo"], cta: 11 },
  { heading: 1, copy: [0], features: [2, 8], paired: true, products: ["Monthly|$9.99/mo|", "Annual|$69.99/yr|"], cta: 13 },
  { heading: 0, features: [1, 7], paired: true, products: ["Monthly|$9.99/mo|", "Annual|$69.99/yr|"], cta: 13 },
  { heading: 0, copy: [1, 5, 10], features: [2, 5], products: ["Monthly|$9.99/mo|", "Annual|$69.99/yr|"], cta: 11 },
  { heading: 2, features: [3, 11], paired: true, products: ["Annual|$69.99/yr|$5.83/mo", "Monthly|$9.99/mo|"], cta: 16, afterCta: [17] },
  { heading: 1, copy: [2, 3, 4, 8], features: [5, 8], products: ["Annual|$69.99/year|$5.83/mo", "Monthly|$9.99/month|"], cta: 16 },
  { heading: 0, copy: [1, 2, 8], features: [3, 8], cta: 9 },
  { heading: 1, features: [2, 5], reviews: [5, 7], reviewStyle: "quote", products: ["Monthly|$9.99/mo|", "Annual|$69.99/yr|$5.83/mo"], cta: 12, afterCta: [13] },
  { heading: 2, social: [0, 1], features: [3, 6], copy: [6], cta: 7 },
];

// Only copy that is visible in the source preview belongs here. Prices remain
// sample preview values until a real SKU is selected in the builder.
const sourcePackageDetails = {
  4: { 0: { badgeText: "BEST VALUE", savingCopy: "(19% off)" } },
  8: { 1: { supportingCopy: "12 mo • $69.99" } },
  11: { 0: { badgeText: "19% OFF" } },
  12: { 0: { badgeText: "SAVE 19%" } },
  13: { 0: { supportingCopy: "Full access for just $69.99/yr", badgeText: "19% OFF" }, 1: { supportingCopy: "Full access for just $9.99/mo" } },
  18: {
    0: { name: "一月 · Monthly Path", supportingCopy: "月から月へ · month to month" },
    1: { name: "季節 · Seasonal Journey", supportingCopy: "月から月へ · three months" },
    2: { name: "一年 · Annual Reflection", supportingCopy: "月から月へ · full year" },
  },
  20: { 0: { badgeText: "19% OFF" } },
  21: { 0: { badgeText: "19% OFF" }, 1: { supportingCopy: "Billed at $9.99/mo." } },
  23: { 0: { supportingCopy: "($69.99/yr)", badgeText: "SAVE 19%" } },
  24: { 0: { supportingCopy: "/year", badgeText: "19% OFF" }, 1: { supportingCopy: "/month" } },
  25: { 0: { badgeText: "19% OFF" }, 1: { supportingCopy: "Billed at $9.99/mo." } },
  27: { 0: { badgeText: "19%" } },
  28: { 0: { badgeText: "19% OFF" } },
  30: { 1: { badgeText: "19% OFF" } },
  31: { 0: { supportingCopy: "Full access for just $69.99/yr", badgeText: "19% OFF" }, 1: { supportingCopy: "Full access for just $9.99/mo" } },
  32: { 1: { badgeText: "19% OFF" } },
  33: { 1: { supportingCopy: "$69.99/yr ($5.83/mo)", badgeText: "SAVE 19%" } },
  34: { 1: { badgeText: "SAVE 19%" } },
  35: { 0: { supportingCopy: "Cancel anytime" }, 1: { badgeText: "Save 19%" } },
  37: { 0: { supportingCopy: "$69.99/yr ($5.83/mo)", badgeText: "SAVE 19%" } },
  40: { 1: { supportingCopy: "$69.99/yr ($5.83/mo)", badgeText: "Save 19% (only $5.83/mo)" } },
};

export function sourceProductRows(order) {
  return (sourceBlueprints[order - 1].products ?? []).map((line, index) => {
    const [name = "", price = "", supportingCopy = ""] = line.split("|");
    const override = sourcePackageDetails[order]?.[index] ?? {};
    const row = { name, price, supportingCopy, ...override };
    return {
      ...row,
      skuId: "",
      showSupportingCopy: Boolean(row.supportingCopy),
      showBadge: Boolean(row.badgeText),
      showSavingCopy: Boolean(row.savingCopy),
    };
  });
}

export const observedTemplate = (order) => observed[order - 1];
export const observedEditor = (order) => editorObserved.find((item) => item.order === order);
export const observedLayerCount = (order, type) => observedEditor(order)?.layers.filter((layer) => layer.type === type).length;
export const sourcePackageCount = (order) => observedLayerCount(order, "package") ?? sourceBlueprints[order - 1].products?.length ?? 0;

export function sourceFeatureLines(order) {
  const plan = sourceBlueprints[order - 1];
  const lines = observedTemplate(order).text.split("\n");
  if (!plan.features) return [];
  const section = lines.slice(...plan.features);
  if (!plan.paired) return section;
  return Array.from({ length: Math.ceil(section.length / 2) }, (_, index) => section.slice(index * 2, index * 2 + 2).join("|"));
}

export function sourceComponentNames(order) {
  const plan = sourceBlueprints[order - 1];
  return [plan.flow && "多步骤页面", observedTemplate(order).assets.length > 0 && "图片", order !== 20 && "标题", (plan.flow || plan.copy) && "文案", (plan.flow || plan.features) && "特权列表", plan.award && "奖项", plan.reviews && (plan.reviewStyle === "list" ? "评价列表" : plan.reviewStyle === "quote" ? "引述评价" : "轮播评价"), plan.social && "口碑数据", (plan.timeline || observedLayerCount(order, "timeline")) && "时间线", plan.tabs && "档位切换", plan.toggle !== undefined && "开关", plan.table && "权益表格", sourcePackageCount(order) && (order === 10 ? "点数档位" : plan.products ? "商品套餐" : "商品套餐（仅绑定）"), (plan.flow || plan.cta !== undefined) && "按钮", plan.webCta !== undefined && "网页购买入口", "协议链接"].filter(Boolean);
}

export function sourceFilterComponents(order) {
  const plan = sourceBlueprints[order - 1];
  return [plan.flow && "Multi-step", plan.reviews && "Reviews", plan.award && "Award", plan.social && "Social Proof", (plan.timeline || observedLayerCount(order, "timeline")) && "Trial timeline", plan.tabs && "Tabs", plan.toggle !== undefined && "Toggle", plan.table && "Feature table", plan.products?.some((row) => row.includes("credits")) && "Credits", plan.webCta !== undefined && "Web purchase", [5, 6].includes(order) && "Offer code"].filter(Boolean);
}

export function createSourceTemplateNodes(template, node) {
  const order = template.sourceOrder;
  const source = observedTemplate(order);
  const plan = sourceBlueprints[order - 1];
  const lines = source.text.split("\n");
  const at = (index) => lines[index] ?? "";
  const id = (part) => `${template.id}-${part}`;
  const add = (part, type, content = "", config = {}, depth = 0) => node(id(part), type, content, depth, { config });
  const listContent = (range, paired = false) => {
    const section = lines.slice(...range);
    return paired ? Array.from({ length: Math.ceil(section.length / 2) }, (_, index) => section.slice(index * 2, index * 2 + 2).join("|")).join("\n") : section.join("\n");
  };
  const media = (part, depth = 0) => add(part, "Image", at(plan.heading), { mediaSrc: template.heroAsset, mediaFit: template.art === "icon" ? "contain" : "cover", mediaBackgroundColor: template.art === "dark" ? "#131421" : "#f6f6f8", mediaWidth: 100, mediaHeight: template.art === "icon" ? 80 : 140 }, depth);
  const header = (part, index, depth = 0) => node(id(part), "Header", at(index), depth, { variant: "headline", ...([13, 37].includes(order) ? { config: { textAlign: "left", fontSize: 19 } } : {}) });
  const button = (part, index, depth = 0) => add(part, "Button", at(index), { action: [5, 6].includes(order) ? "OfferCodeRedemption" : "Purchase", backgroundColor: order === 13 ? "#f2f2f7" : template.accent, ...([5, 13].includes(order) ? { color: "#111111", radius: 99 } : {}) }, depth);
  const products = (depth = 0) => {
    const visibleRows = plan.products ?? [];
    return add("products", "Products", visibleRows.join("\n") || "绑定商品||", { defaultSelected: [8, 19, 22, 30, 32, 33, 34, 35, 36, 40].includes(order) ? 1 : 0, packageLayout: order === 18 ? "info-row" : [4, 14, 19, 22, 25, 30].includes(order) ? "horizontal" : "vertical", showOfferBadge: true, showCards: visibleRows.length > 0, sourcePackageCount: sourcePackageCount(order), purchasePerCard: order === 10, badgeGradient: [template.accent, template.accent, template.accent], selectedBorderGradient: [template.accent, template.accent, template.accent], ...(visibleRows.length ? { packageRows: sourceProductRows(order) } : {}) }, depth);
  };
  const links = (depth = 0) => {
    const policyLines = lines.filter((line) => /^(Restore( Purchases| purchases)?|Terms( of Use| of service)?|Privacy( Policy| policy)?|Privacy policy)$/.test(line));
    return policyLines.length ? add("links", "Links", [...new Set(policyLines)].join(" · "), {}, depth) : null;
  };

  if (order === 5 || order === 6) {
    const price = add("products", "Products", "绑定商品||", {
      showCards: false,
      priceSummary: true,
      sourceComparePrice: at(3),
      sourceCurrentPrice: at(4),
      sourcePackageCount: sourcePackageCount(order),
    });
    const dismiss = add("dismiss", "Text", "×", { color: "#ffffff" }, order === 5 ? 1 : 0);
    const content = order === 5 ? [
      add("offer-stage", "Stack", "", { axis: "vertical", gap: 0 }),
      media("image", 1),
      dismiss,
      add("offer-card", "Card", "", { backgroundColor: "#080808", radius: 16 }, 1),
      add("gift", "Icon", "", { iconName: "gift", iconSize: 20, color: "#101515" }, 2),
      header("title", 0, 2),
      add("subtitle", "Text", at(1), { color: "#b9b9b9" }, 2),
      add("code", "Text", at(2), { color: "#111111", backgroundColor: "#f29da9" }, 2),
    ] : [
      dismiss,
      header("title", 0),
      add("subtitle", "Text", at(1), { color: "#aaaaaa" }),
      add("code", "Text", at(2), { color: "#ffffff", backgroundColor: "#b64d36" }),
      media("image"),
    ];
    return [...content, price, button("action", plan.cta), links()].filter(Boolean);
  }

  if (order === 20) {
    const slides = [
      { id: "mindful", title: at(2), caption: at(3), image: source.assets[2] },
      { id: "community", title: at(4), caption: at(5), image: source.assets[3] },
      { id: "sleep", title: at(0), caption: at(1), image: source.assets[1] },
    ];
    return [media("image"), add("reviews", "Carousel", "", { slides, initialSlide: 0 }), products(), button("action", plan.cta), links()].filter(Boolean);
  }

  if (order === 9) {
    return [
      add("icon", "Image", "", { mediaSrc: source.assets[1], mediaFit: "contain", mediaWidth: 100, mediaHeight: 100, mediaBackgroundColor: "transparent" }),
      header("title", plan.heading),
      media("image"),
      add("copy-0", "Text", `${at(1)} ${at(2)}`),
      add("copy-1", "Text", at(3)),
      add("toggle", "Toggle", at(plan.toggle), { onColor: template.accent }),
      products(),
      button("action", plan.cta),
      links(),
    ].filter(Boolean);
  }

  if (order === 17) {
    return [
      media("image"),
      node(id("title"), "Header", `${at(0)} ${at(1)}`, 0, { variant: "headline" }),
      add("copy-1", "Text", at(2)),
      add("features", "List", listContent(plan.features), { accentColor: template.accent }),
      add("products", "Products", "绑定商品||", { showCards: false, sourcePackageCount: sourcePackageCount(order) }),
      add("copy-2", "Text", at(7)),
      button("action", plan.cta),
      links(),
    ].filter(Boolean);
  }

  if (order === 24) {
    return [
      header("title", plan.heading),
      add("copy-0", "Text", at(1)),
      add("copy-1", "Text", at(2)),
      add("feature-images", "Stack", "", { axis: "horizontal", gap: 6 }),
      add("feature-image-1", "Image", "", { mediaSrc: source.assets[0], mediaFit: "contain", mediaBackgroundColor: "#999999", mediaWidth: 100, mediaHeight: 100 }, 1),
      add("feature-image-2", "Image", "", { mediaSrc: source.assets[1], mediaFit: "contain", mediaBackgroundColor: "#999999", mediaWidth: 100, mediaHeight: 100 }, 1),
      products(),
      add("features", "List", listContent(plan.features, plan.paired), { accentColor: template.accent }),
      button("action", plan.cta),
      links(),
    ].filter(Boolean);
  }

  if (order === 36) {
    return [
      header("title", plan.heading),
      add("copy-0", "Text", at(1)),
      media("image"),
      add("features", "List", listContent(plan.features), { accentColor: template.accent }),
      add("copy-1", "Text", at(5)),
      products(),
      add("copy-2", "Text", at(10)),
      button("action", plan.cta),
      links(),
    ].filter(Boolean);
  }

  if (order === 39) {
    return [
      media("image"),
      header("title", plan.heading),
      add("copy-0", "Text", at(1)),
      add("copy-1", "Text", at(2)),
      add("features", "List", listContent(plan.features), { accentColor: template.accent }),
      add("products", "Products", "绑定商品||", { showCards: false, sourcePackageCount: sourcePackageCount(order) }),
      add("copy-2", "Text", at(8)),
      button("action", plan.cta),
      links(),
    ].filter(Boolean);
  }

  if (plan.flow) {
    return [
      add("flow", "Screen Flow", "", { defaultStep: 0 }),
      node(id("screen-1"), "Screen", "权益介绍", 1),
      add("screen-1-image", "Image", "", { mediaSrc: source.assets[0], mediaFit: "contain", mediaBackgroundColor: "#ffffff", mediaWidth: 100, mediaHeight: 240 }, 2),
      header("screen-1-title", 0, 2),
      add("screen-1-features", "List", listContent([1, 7], true), {}, 2),
      add("screen-1-proof", "Social Proof", "", { count: `${at(7)} · ${at(8)}`, caption: "" }, 2),
      button("screen-1-next", 9, 2),
      node(id("screen-2"), "Screen", "口碑与体验", 1),
      header("screen-2-title", 10, 2),
      add("screen-2-subtitle", "Text", at(11), {}, 2),
      add("screen-2-image", "Image", "", { mediaSrc: source.assets[2], mediaFit: "contain", mediaBackgroundColor: "#ffffff", mediaWidth: 100, mediaHeight: 260 }, 2),
      add("screen-2-copy", "Text", at(12), {}, 2),
      button("screen-2-next", 13, 2),
      node(id("screen-3"), "Screen", "选择套餐", 1),
      add("screen-3-image", "Image", "", { mediaSrc: source.assets[3], mediaFit: "cover", mediaBackgroundColor: "#ffffff", mediaWidth: 100, mediaHeight: 100 }, 2),
      header("screen-3-title", 14, 2),
      add("screen-3-features", "List", listContent([15, 21], true), {}, 2),
      add("screen-3-timeline", "Timeline", "", { enabled: false, accentColor: template.accent, listRows: [{ title: "First item", caption: "" }, { title: "Second item", caption: "" }, { title: "Third item", caption: "" }] }, 2),
      products(2),
      button("screen-3-action", 25, 2),
      links(2),
    ].filter(Boolean).map((item) => item.type === "Button" && item.id.endsWith("-next") ? { ...item, config: { ...item.config, action: "NextScreen" } } : item);
  }

  const result = [];
  if (order === 37) {
    result.push(add("header-actions", "Stack", "", { axis: "horizontal", gap: 8 }));
    result.push(add("back", "Button", at(0), { action: "Dismiss", backgroundColor: "#f1f1f1", color: "#151515", radius: 99 }, 1));
    if (template.heroAsset) result.push(media("image", 1));
    result.push(add("restore", "Button", at(1), { action: "RestorePurchases", backgroundColor: "#f1f1f1", color: "#151515", radius: 99 }, 1));
  } else if (order === 40) {
    result.push(add("header-actions", "Stack", "", { axis: "horizontal", gap: 8 }));
    result.push(add("back", "Button", "×", { action: "Dismiss", backgroundColor: "transparent", color: "#ffffff", radius: 0 }, 1));
    result.push(add("restore", "Button", "Restore", { action: "RestorePurchases", backgroundColor: "transparent", color: "#ffffff", radius: 0 }, 1));
  } else if (template.heroAsset && (["top", "full", "center", "icon"].includes(template.art) || [10, 11].includes(order))) result.push(media("image"));
  result.push(header("title", plan.heading));
  if (order !== 37 && template.heroAsset && !["top", "full", "center", "icon"].includes(template.art) && ![10, 11].includes(order)) result.push(media("image"));
  (plan.copy ?? []).forEach((index, itemIndex) => result.push(add(`copy-${itemIndex}`, "Text", at(index))));
  if (plan.award) result.push(add("award", "Award", "", { title: at(plan.award[1]), source: at(plan.award[0]), subtitle: at(plan.award[2]), accentColor: template.accent }));
  if (plan.tabs) result.push(add("tabs", "Tabs", "", { tabs: plan.tabs.map((index) => ({ id: `tier-${index}`, title: at(index), description: "" })), defaultTab: 1 }));
  if (plan.features) result.push(add("features", "List", listContent(plan.features, plan.paired), { accentColor: template.accent }));
  if (plan.timeline) {
    const section = lines.slice(...plan.timeline);
    const listRows = Array.from({ length: Math.ceil(section.length / 2) }, (_, index) => ({ title: section[index * 2], caption: section[index * 2 + 1] ?? "", ...([21, 26].includes(order) ? { marker: ["lock", "bell", "star"][index] ?? "number" } : {}) }));
    result.push(add("timeline", "Timeline", "", { accentColor: template.accent, listRows }));
  }
  if (plan.reviews) {
    const reviewLines = lines.slice(...plan.reviews);
    if (plan.reviewStyle === "quote") result.push(add("review", "Text", reviewLines.join("\n")));
    else if (plan.reviewStyle === "list") {
      const testimonialRows = Array.from({ length: Math.floor(reviewLines.length / 3) }, (_, index) => {
        const [title, quote, author] = reviewLines.slice(index * 3, index * 3 + 3);
        return { title, quote, author };
      });
      result.push(add("reviews", "List", testimonialRows.map((row) => `${row.title}|${row.quote}|${row.author}`).join("\n"), { listVariant: "testimonials", testimonialRows }));
    }
    else {
      const groupSize = order === 7 ? 2 : order === 20 ? 2 : 3;
      const slides = Array.from({ length: Math.floor(reviewLines.length / groupSize) }, (_, index) => {
        const group = reviewLines.slice(index * groupSize, index * groupSize + groupSize);
        return { id: `source-review-${index + 1}`, image: order === 20 ? source.assets[index + 1] ?? "" : "", title: group[0], caption: group.slice(1).join("\n") };
      });
      if (order === 4) {
        const reviews = [[4, 5, 6], [7, 8, 9], [1, 2, 3]].map(([title, caption, author], index) => ({ id: `source-review-${index + 1}`, image: "", title: at(title), caption: `${at(caption)}\n${at(author)}` }));
        result.push(add("reviews", "Carousel", "", { slides: reviews, initialSlide: 0, hideImageIfEmpty: true }));
      } else if (order === 7) {
        const reviews = [[3, 4], [5, 6], [1, 2]].map(([title, caption], index) => ({ id: `source-review-${index + 1}`, image: "", title: at(title), caption: at(caption) }));
        result.push(add("reviews", "Carousel", "", { slides: reviews, initialSlide: 0, hideImageIfEmpty: true }));
      } else {
      result.push(add("reviews", "Carousel", "", { slides, initialSlide: 0, hideImageIfEmpty: true }));
      }
    }
  }
  if (plan.social) result.push(add("social", "Social Proof", "", { rating: Number.parseFloat(at(plan.social[0])) || 5, count: at(plan.social[1]), caption: at(plan.social[0]), accentColor: template.accent }));
  if (plan.toggle !== undefined) result.push(add("toggle", "Toggle", at(plan.toggle), { onColor: template.accent }));
  if (sourcePackageCount(order)) result.push(products());
  if (plan.table) {
    const tableLines = lines.slice(...plan.table);
    const pairedRows = order === 27 ? Array.from({ length: Math.floor(tableLines.length / 2) }, (_, index) => tableLines.slice(index * 2, index * 2 + 2)) : tableLines.map((line) => [line, ""]);
    result.push(add("table", "Feature Table", "", { title: order === 27 ? at(7) : order === 29 ? at(1) : "", tableVariant: order === 27 ? "feature-list" : "comparison", columns: order === 29 ? [at(7), at(8)] : ["包含"], rows: pairedRows.map(([name, description], index) => ({ name, values: order === 29 ? [index === 0 ? "✓" : "—", "✓"] : [description] })) }));
  }
  if (plan.cta !== undefined) result.push(order === 18 ? add("action", "Button", `${at(18)} ${at(19)}`, { action: "Purchase", backgroundColor: template.accent }) : button("action", plan.cta));
  if (plan.webCta !== undefined) result.push(add("web-action", "Web Paywall Button", at(plan.webCta), { action: "WebCheckout", autoDismiss: true, backgroundColor: order === 13 ? "#b53231" : template.accent, ...(order === 13 ? { color: "#ffffff", radius: 99 } : {}) }));
  (plan.afterCta ?? []).forEach((index, itemIndex) => result.push(add(`after-action-${itemIndex}`, "Text", at(index))));
  const footer = links();
  if (footer) result.push(footer);
  return result;
}
