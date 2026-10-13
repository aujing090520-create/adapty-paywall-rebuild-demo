import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Blocks,
  Clock3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Image as ImageIcon,
  LayoutTemplate,
  MoreVertical,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Upload,
  WandSparkles,
  X,
  Download,
  Eye,
  GripVertical,
  GalleryHorizontal,
  Link2,
  LockKeyhole,
  List,
  MousePointerClick,
  Package,
  Pencil,
  RectangleHorizontal,
  RotateCw,
  Type,
} from "lucide-react";
import "./styles.css";

const privilegeNames = ["解锁谁看了我", "无广告", "更多特权", "隐身访问", "搜索全世界的语伴", "搜索附近的人", "性别搜索", "更多语伴沟通", "增加曝光机会", "无限翻译&字幕", "匹配不同母语语伴", "直播语聊无限时长", "解锁谁赞了我(6140及以后版本废弃)", "发送VIP表情包", "直播语聊房更多语言", "附近帖子"];
const knownPrivilegeValues = { "解锁谁看了我": ["受限", "✓"], "搜索附近的人": ["受限", "✓"], "增加曝光机会": ["受限", "高达 9 倍"], "无限翻译&字幕": ["10次/天", "无限"], "匹配不同母语语伴": ["各 1 门", "各 3 门"] };
const initialPrivilegeOrder = ["无限翻译&字幕", "解锁谁看了我", "搜索附近的人", "增加曝光机会", "匹配不同母语语伴", ...privilegeNames.filter((name) => !["无限翻译&字幕", "解锁谁看了我", "搜索附近的人", "增加曝光机会", "匹配不同母语语伴"].includes(name))];
const referencePrivilegeIcon = "https://ali-global-cdn.hellotalk8.com/testing/vip-manage/8d364b655008356c68732afdcdcd1543.png";
const initialPrivilegeRows = initialPrivilegeOrder.map((name, index) => ({ id: `privilege-${index}`, name: name === "无限翻译&字幕" ? "无限 AI 翻译&字幕" : name === "增加曝光机会" ? "9倍曝光助推" : name, type: name, standard: knownPrivilegeValues[name]?.[0] ?? "", vip: knownPrivilegeValues[name]?.[1] ?? "", standardMode: knownPrivilegeValues[name]?.[0] === "受限" ? "icon" : "text", standardIcon: "lock", vipMode: knownPrivilegeValues[name]?.[1] === "✓" ? "icon" : "text", vipIcon: "check", pageId: "", detail: { positions: ["蓝色特权页"], title: name === "解锁谁看了我" ? "中秋月夜 | 谁看了我" : name, iconSrc: name === "解锁谁看了我" ? referencePrivilegeIcon : "", images: name === "解锁谁看了我" ? [{ locale: "English", src: "" }, { locale: "Chinese", src: referencePrivilegeIcon }] : [{ locale: "Chinese", src: "" }], titleColor: "#F6C85F", copyKey: name === "解锁谁看了我" ? "Unlock_Visitors_page" : "", descriptionColor: "#FFF8E7", descriptionKey: name === "解锁谁看了我" ? "Unlock_Visitors_page_desc" : "" } }));
const privilegeRowsFor = (node) => node?.config?.privilegeRows ?? initialPrivilegeRows;

const originalPaywalls = [
  { id: "test", name: "test", state: "Live", products: 3, startedAt: "3 Apr 2026", icon: false },
  { id: "test-2", name: "test 2", state: "Draft", products: 2, startedAt: "25 Mar 2026", icon: true },
];

const nav = [
  ["Paywalls", Smartphone],
];

const missingItems = [
  {
    id: "M-01",
    feature: "Live 发布与回退",
    known: "Live 的 General 页在有改动时显示 Save & publish；从 Live Duplicate、命名、Save 后会出现 Paywall publishing confirmation，Accept 后副本以 Live 状态打开。Draft 的 Save 不出现发布确认，点击后仍为 Draft；Draft 额外有 Test on Device。",
    unknown: "Draft 直接升 Live、审核、版本快照、Rollback 与 Inactivate 逻辑未实测。",
  },
  {
    id: "M-02",
    feature: "AI 生成提交",
    known: "已见 Chats / Examples、提示词、8 个风格标签与示例入口。提交实际提示词后，当前账号返回：无法检测 App Store 应用，需在 iOS SDK settings 填写 Apple App ID。",
    unknown: "填写有效 Apple App ID 后的生成结果、耗时、额度、覆盖与编辑规则未实测。",
  },
  {
    id: "M-03",
    feature: "模板应用与 Change template",
    known: "选择模板后 Open in Builder 可用，已实际进入 Builder；首次保存会提示 Custom Fonts，并要求 Links 中的 Terms of Service / Privacy Policy URL。",
    unknown: "模板覆盖范围、撤销、与既有节点的合并规则未实测。",
  },
  {
    id: "M-04",
    feature: "Copy a Design 最终复制",
    known: "入口打开 Search 与 Copy Selected Paywall（未选择时禁用）；说明为仅复制视觉 Builder 配置。当前账号没有可选择的其他应用设计候选。",
    unknown: "有来源候选时的最终复制、资产、字体、组件与错误恢复规则未实测。",
  },
  {
    id: "M-05",
    feature: "SDK 与真实交易",
    known: "产品首笔交易后被锁定；Test on Device 会提供二维码与 mobile-app.adapty.io/paywall-preview 链接。",
    unknown: "设备测试、购买、恢复、权益、事件归因与非零报表未实测。",
  },
  {
    id: "G-01",
    feature: "应用切换",
    known: "顶部存在当前应用切换入口。",
    unknown: "应用目录、权限范围、切换后的数据刷新和异常处理未实测。",
  },
  {
    id: "B-01",
    feature: "Builder 属性保存",
    known: "已见 Layout settings、Links 的 Content 字段/开关、Hero Image、Card、Timer、Products 的 Content / Style / Layout 面板、设备预览与语言列表。十个 Add element 入口均已逐项点击：Text 默认 text；Image/Card/List/Carousel/Products 默认空容器；Web Paywall Button 默认 Pay on web；Button 默认 button text；Links 默认 Terms/Privacy/Restore/Login；Timer 默认 04:59:59。Save 会要求 Paywall publishing confirmation，确认后重载仍存在。",
    unknown: "字段校验、多语言覆盖、Discard / Undo 以及未逐项记录的 Card 布局字段未实测。",
  },
  {
    id: "MT-01",
    feature: "Metrics 数据结果与导出",
    known: "已见日期、粒度、State、Product、Audience 与 install date 控件，以及零数据卡片和明细表。",
    unknown: "真实指标口径、归因、筛选结果、非零数据与下载导出未实测。",
  },
];

const templates = [
  { id: "knowledge", title: "Unlock the World of Knowledge", subtitle: "Premium learning library", tags: ["1 product", "Trial timeline", "Reviews"], productCount: 1, media: "image", components: ["Trial timeline", "Reviews"], category: "Popular", theme: "lavender", visual: "knowledge", asset: "/real-adapty-templates/knowledge.png" },
  { id: "trial", title: "What to expect during your free trial", subtitle: "Day-by-day trial guide", tags: ["1 product", "Trial timeline"], productCount: 1, media: "image", components: ["Trial timeline"], category: "Popular", theme: "violet", visual: "timeline", asset: "/real-adapty-templates/trial.png" },
  { id: "connection", title: "Build deeper connections, one conversation at a time", subtitle: "Transform how you communicate and understand each other's needs", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "All", theme: "mist", visual: "connection", asset: "/real-adapty-templates/connection.png" },
  { id: "family", title: "Unlock fluency for the whole family", subtitle: "Speak Easy with Family Plan", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "Popular", theme: "night", visual: "family", asset: "/real-adapty-templates/family.png" },
  { id: "document", title: "Get premium document management at an exclusive price", subtitle: "Exclusive launch offer", tags: ["1 product", "No media"], productCount: 1, media: "none", components: [], category: "All", theme: "paper", visual: "document", asset: "/real-adapty-templates/document.png" },
  { id: "trial-white", title: "How your free trial works", subtitle: "Clear renewal timeline", tags: ["1 product", "Trial timeline"], productCount: 1, media: "none", components: ["Trial timeline"], category: "All", theme: "white", visual: "trial-white", asset: "/real-adapty-templates/trial-white.png" },
  { id: "trial-blue", title: "How your free trial works", subtitle: "7-day renewal timeline", tags: ["1 product", "Trial timeline"], productCount: 1, media: "image", components: ["Trial timeline"], category: "All", theme: "violet", visual: "trial-blue", asset: "/real-adapty-templates/trial-blue.png" },
  { id: "yoga", title: "START YOUR YOGA JOURNEY TODAY!", subtitle: "Personal wellness plan", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "Popular", theme: "peach", visual: "yoga", asset: "/real-adapty-templates/yoga.png" },
  { id: "report", title: "Receive your personalized report", subtitle: "Explore your profile", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "All", theme: "midnight", visual: "report", asset: "/real-adapty-templates/report.png" },
  { id: "avatar", title: "Create your 3D avatar", subtitle: "Try it free for seven days", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "All", theme: "sky", visual: "avatar", asset: "/real-adapty-templates/avatar.png" },
  { id: "access", title: "Get Unlimited Access", subtitle: "Premium wallpaper collection", tags: ["1 product", "No media"], productCount: 1, media: "none", components: [], category: "All", theme: "ocean", visual: "access", asset: "/real-adapty-templates/access.png" },
  { id: "weather", title: "Exclusive Weather Insights: Unlock Premium Forecast", subtitle: "Unlock premium forecasting", tags: ["1 product", "No media"], productCount: 1, media: "none", components: [], category: "All", theme: "black", visual: "weather", asset: "/real-adapty-templates/weather.png" },
  { id: "mindfulness", title: "Mindfulness Unlocked", subtitle: "Experience guided meditations", tags: ["1 product", "Free trial toggle"], productCount: 1, media: "image", components: ["Free trial toggle"], category: "All", theme: "lime", visual: "mindfulness", asset: "/real-adapty-templates/mindfulness.png" },
  { id: "workout", title: "Your Personal First Day Workout is Ready", subtitle: "A plan built for today", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "All", theme: "clean", visual: "workout", asset: "/real-adapty-templates/workout.png" },
  { id: "halloween", title: "BE FEARLESS!", subtitle: "Halloween offer now on", tags: ["1 product", "Reviews"], productCount: 1, media: "image", components: ["Reviews"], category: "Seasonal", theme: "halloween", visual: "halloween", asset: "/real-adapty-templates/fearless.png" },
  { id: "black-friday", title: "BLACK FRIDAY 50% OFF", subtitle: "Weekly Activity Planner", tags: ["1 product"], productCount: 1, media: "none", components: [], category: "Seasonal", theme: "sale", visual: "black-friday", assetParts: ["/real-adapty-templates/black-friday.png", "/real-adapty-templates/black-friday-offer.png"] },
  { id: "new-year", title: "BEGIN THE NEW YEAR", subtitle: "50% OFF", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "Seasonal", theme: "sale", visual: "new-year", asset: "/real-adapty-templates/new-year.png" },
  { id: "christmas", title: "Make the season brighter!", subtitle: "Limited time only", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "Seasonal", theme: "sale", visual: "christmas", asset: "/real-adapty-templates/christmas.png" },
  { id: "black-friday-timer", title: "Lifetime Access", subtitle: "EXPIRES IN: 04:59:59", tags: ["1 product", "Image"], productCount: 1, media: "image", components: [], category: "Seasonal", theme: "sale", visual: "black-friday-timer", asset: "/real-adapty-templates/black-friday-timer.png" },
  { id: "editing-plan", title: "Choose the plan that works best for you!", subtitle: "AI-powered edits", tags: ["1 product"], productCount: 1, media: "video", components: [], category: "All", theme: "clean", visual: "editing-plan", asset: "/real-adapty-templates/editing-plan.png" },
  { id: "audiobooks", title: "Get access to collection of audiobooks for kids", subtitle: "Hand-on labs with lecturers", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "clean", visual: "audiobooks", asset: "/real-adapty-templates/audiobooks.png" },
  { id: "herbs", title: "Get Full Access to The Guide of Medicinal Herbs", subtitle: "The collection of over 5,000 plants", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "clean", visual: "herbs", asset: "/real-adapty-templates/herbs.png" },
  { id: "fitness-trial", title: "How your free trial works", subtitle: "Popular VIP content", tags: ["1 product", "Trial timeline"], productCount: 1, media: "image", components: ["Trial timeline"], category: "All", theme: "clean", visual: "fitness-trial", asset: "/real-adapty-templates/fitness-trial.png" },
  { id: "video-access", title: "Get Full Access", subtitle: "Faster video processing", tags: ["1 product"], productCount: 1, media: "none", components: [], category: "All", theme: "ocean", visual: "video-access", asset: "/real-adapty-templates/video-access.png" },
  { id: "design-life", title: "Design your life", subtitle: "A beautiful week", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "sky", visual: "design-life", asset: "/real-adapty-templates/design-life.png" },
  { id: "training", title: "Start training today", subtitle: "Access to premium art styles", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "black", visual: "training", asset: "/real-adapty-templates/training.png" },
  { id: "premium-access", title: "Premium Access", subtitle: "Less Work More Relaxing with Robot", tags: ["1 product", "Trial timeline"], productCount: 1, media: "image", components: ["Trial timeline"], category: "All", theme: "clean", visual: "premium-access", asset: "/real-adapty-templates/premium-access.png" },
  { id: "full-app", title: "Unlock the full app with 50% off", subtitle: "All lessons unlocked", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "clean", visual: "full-app", asset: "/real-adapty-templates/full-app.png" },
  { id: "item-placeholder", title: "Item One", subtitle: "This is a brief description for the first placeholder item.", tags: ["1 product"], productCount: 1, media: "none", components: [], category: "All", theme: "clean", visual: "item-placeholder", asset: "/real-adapty-templates/item-placeholder.png" },
  { id: "item-placeholder-dark", title: "Item One", subtitle: "This is a brief description for the first placeholder item.", tags: ["1 product"], productCount: 1, media: "none", components: [], category: "All", theme: "black", visual: "item-placeholder-dark", asset: "/real-adapty-templates/item-placeholder-dark.png" },
  { id: "fantasy-access", title: "Transparent template #3", subtitle: "Advantageous offer", tags: ["1 product"], productCount: 1, media: "image", components: [], category: "All", theme: "midnight", visual: "fantasy-access", asset: "/real-adapty-templates/fantasy-access.png" },
  { id: "ht-blue-privilege", title: "蓝色特权页", subtitle: "蓝色特权对比与商品套餐", tags: ["3 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-blue", visual: "ht-blue", documentTemplate: "blue-privilege", prdScreenshot: "/ht-prd-screenshots/blue-privilege.png" },
  { id: "ht-membership-plans", title: "HelloTalk 会员套餐页", subtitle: "会员订阅方案与访客示例轮播", tags: ["3 products", "Carousel"], productCount: 2, media: "image", components: ["Carousel"], category: "Popular", theme: "ht-plans", visual: "ht-plans", documentTemplate: "membership-plans", prdScreenshot: "/ht-prd-screenshots/membership-plans.jpg" },
  { id: "ht-payment-recovery", title: "HelloTalk 支付未完成页", subtitle: "支付恢复与倒计时优惠", tags: ["2 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-recovery", visual: "ht-recovery", documentTemplate: "payment-recovery", prdScreenshot: "/ht-prd-screenshots/payment-recovery.png" },
  { id: "ht-sku-sheet", title: "HelloTalk SKU 半窗", subtitle: "横版促销视觉与套餐选择", tags: ["3 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-sku", visual: "ht-sku", documentTemplate: "sku-sheet", prdScreenshot: "/ht-prd-screenshots/sku-sheet.jpg" },
];

const componentCatalog = ["Text", "Image", "Card", "Web Paywall Button", "Button", "List", "Links", "Timer", "Carousel", "Products"];

const sourceTreeObserved = new Set(["knowledge", "trial", "connection", "family", "premium-access", "document", "yoga", "black-friday", "black-friday-timer", "christmas", "halloween", "new-year", "report", "avatar", "mindfulness", "trial-white", "trial-blue", "fitness-trial", "access", "weather", "workout", "audiobooks", "herbs", "video-access", "design-life", "full-app", "item-placeholder", "item-placeholder-dark", "fantasy-access", "editing-plan", "training"]);
const documentStyleTemplateIds = new Set(["ht-blue-privilege", "ht-membership-plans", "ht-payment-recovery", "ht-sku-sheet"]);
const isEditableTemplate = (template) => sourceTreeObserved.has(template.id) || documentStyleTemplateIds.has(template.id);
const templateEditableStatus = (template) => documentStyleTemplateIds.has(template.id) ? "飞书交付文档已定义样式与字段；本地可编辑复现" : "源端已观察核心结构；本地可编辑复现";

// Template-card filters must only rely on Builder trees observed in Adapty.
const sourceVerifiedTemplateComponents = Object.freeze({
  knowledge: ["Trial timeline", "Reviews"],
  trial: ["Trial timeline"],
  "trial-white": ["Trial timeline"],
  "trial-blue": ["Trial timeline"],
  "fitness-trial": ["Trial timeline"],
  "premium-access": ["Trial timeline"],
  halloween: ["Reviews"],
  mindfulness: ["Free trial toggle"],
  "ht-blue-privilege": ["Timer"],
  "ht-membership-plans": ["Carousel"],
  "ht-payment-recovery": ["Timer"],
  "ht-sku-sheet": ["Timer"],
});

const node = (id, type, content = "", depth = 0, extra = {}) => ({ id, type, label: "", content, depth, ...extra });

function nodeParentId(nodes, index) {
  const current = nodes[index];
  if (current?.parentId) return current.parentId;
  const depth = current?.depth ?? 0;
  if (!depth) return null;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if ((nodes[cursor].depth ?? 0) === depth - 1) return nodes[cursor].id;
  }
  return null;
}

function nodeSubtreeEnd(nodes, start) {
  const depth = nodes[start]?.depth ?? 0;
  let end = start + 1;
  while (end < nodes.length && (nodes[end].depth ?? 0) > depth) end += 1;
  return end;
}

function canMoveBuilderNode(nodes, sourceId, targetId) {
  const sourceIndex = nodes.findIndex((node) => node.id === sourceId);
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
  if (targetIndex >= sourceIndex && targetIndex < nodeSubtreeEnd(nodes, sourceIndex)) return false;
  return nodeParentId(nodes, sourceIndex) === nodeParentId(nodes, targetIndex);
}

function moveBuilderNode(nodes, sourceId, targetId, position) {
  if (!canMoveBuilderNode(nodes, sourceId, targetId)) return nodes;
  const sourceIndex = nodes.findIndex((node) => node.id === sourceId);
  const sourceEnd = nodeSubtreeEnd(nodes, sourceIndex);
  const moving = nodes.slice(sourceIndex, sourceEnd);
  const remaining = [...nodes.slice(0, sourceIndex), ...nodes.slice(sourceEnd)];
  const targetIndex = remaining.findIndex((node) => node.id === targetId);
  const insertAt = position === "before" ? targetIndex : nodeSubtreeEnd(remaining, targetIndex);
  return [...remaining.slice(0, insertAt), ...moving, ...remaining.slice(insertAt)];
}

function createBuilderNodes(templateId = "knowledge") {
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const hero = (depth = 0) => node("hero-image", "Hero Image", template.visual, depth, { theme: template.theme });
  const pending = (id, type, depth = 0) => node(id, type, "", depth, { sourcePending: true });

  if (template.id === "knowledge") {
    return [
      hero(),
      node("headline", "Text", "Unlock the World of Knowledge", 0, { label: "title", variant: "headline" }),
      node("body-text", "Text", "Smart summaries and audio insights designed for lifelong learners", 0, { label: "caption", variant: "body" }),
      node("benefits", "List", "Comprehensive Book Analysis|Deep dives into 500+ bestsellers across business, self-help, science, and fiction genres.\nSmart Recommendations|AI-powered suggestions based on your reading history, interests, and learning goals.\nOffline Access & Sync|Download summaries and audiobooks for offline learning, syncing seamlessly across all devices.", 0, { label: "benefits" }),
      node("explore-library", "Text", "Explore the full library...", 0, { label: "link", variant: "link" }),
      node("social-proof", "Text", "Over 50,000 satisfied learners globally", 0, { label: "social proof", variant: "body" }),
      node("timeline-title", "Text", "How your free trial works", 0, { label: "section title", variant: "section" }),
      node("trial-card", "Card", "Today|Begin with unlimited access to our complete summary library and premium features.\nDay 6 reminder|We'll send a friendly notification about your trial status and next steps.\nDay 7 activation|Your premium membership activates automatically. Cancel anytime with one tap.", 0, { label: "trial timeline" }),
      node("reviews", "Carousel", "Absolutely brilliant! I've absorbed insights from 12 books in my first week. The audio summaries are perfect for my morning jogs.\n---\nThis app is a goldmine. I can quickly grasp key concepts from business books and apply them to my company immediately.\n---\nLove how I can switch between reading and listening. Perfect for studying during busy clinical rotations.", 0, { label: "reviews" }),
      node("product-intro", "Text", "Choose your learning path:", 0, { label: "products caption", variant: "section" }),
      node("products", "Products", "Monthly|Great for getting started|$79.99 /month", 0),
      node("product-note", "Text", "Subscribe to unlock our complete knowledge library!", 0, { label: "product note", variant: "body" }),
      node("links", "Links", "Terms of Service · Privacy Policy · Restore Purchase", 0),
      node("legal-copy", "Text", "By starting your trial, you agree to our Terms. Your subscription will auto-renew unless cancelled 24 hours before the current period ends via Account Settings.", 0, { label: "legal", variant: "legal" }),
      node("purchase", "Purchase Button", "START YOUR FREE 7-DAY TRIAL", 0, { label: "purchase" }),
      node("footer", "Footer", "Without commitment. Cancel anytime.", 0),
    ];
  }

  if (template.id === "trial") {
    return [
      hero(),
      node("headline", "Header", "What to expect during your free trial", 0, { variant: "headline" }),
      node("trial-list", "List", "", 0),
      node("today", "List item", "Today|Unlock full premium access with unlimited AI tutoring sessions today.", 1),
      node("day-2", "List item", "Day 2|We'll let you know when your trial period is ending.", 1),
      node("day-3", "List item", "Day 3|Subscription activates today. Cancel anytime before to avoid charges.", 1),
      node("footer", "Footer", "Without commitment. Cancel anytime.", 0),
      node("products", "Products", "Try 3 days free|continue for $6.67/month|Billed annually at $79.99", 0),
      node("purchase", "Button", "Get Free Access", 0, { label: "purchase" }),
      node("fine-print", "Text", "", 0, { label: "text", variant: "legal" }),
      node("links", "Links", "Terms of Service · Privacy Policy · Restore Purchase", 0),
    ];
  }

  if (template.id === "trial-blue") {
    return [
      hero(),
      node("headline", "Header", "How your free trial works", 0, { variant: "headline" }),
      node("trial-list", "List", "", 0),
      node("today", "Today", "Get your free trial and gain complete access to app.", 1),
      node("day-5", "Day 5", "Receive a notification that your trial is nearing its end.", 1),
      node("day-7", "Day 7", "You'll be billed today. Cancel at any time before.", 1),
      node("footer", "Footer", "", 0),
      node("products", "Products", "Japanese Ai - 1 Year|$79.99/year ($6.67/month)", 0, { variant: "purchase" }),
      node("purchase", "Purchase Button", "Continue", 0, { label: "purchase" }),
      node("caption", "Caption", "Auto-renewable. Cancel anytime.", 0, { variant: "legal" }),
    ];
  }

  if (template.id === "fitness-trial") {
    return [
      hero(),
      node("headline", "Headline", "How your free trial works", 0, { variant: "headline" }),
      node("benefits", "List", "", 0),
      node("item-0", "Item 0", "Day|Start enjoying full access to the most popular VIP tools.", 1),
      node("item-1", "Item 1", "In 5 days|You'll get a reminder that your trial is about to end.", 1),
      node("item-2", "Item 2", "In 7 days|Your VIP subscription will begin and you'll be charged. Cancel anytime before.", 1),
      node("products", "Products", "", 0),
      node("annual-product", "Japanese Ai - 1 Year", "Japanese Ai - 1 Year|$79.99 / 1 year", 0),
      node("footer", "Footer", "One-time opportunity", 0),
      node("purchase", "Purchase Button", "Start free trial", 0, { label: "purchase" }),
    ];
  }

  if (template.id === "trial-white") {
    return [
      hero(),
      node("headline", "Header", "HOW YOUR FREE TRIAL WORKS", 0, { variant: "headline" }),
      node("caption", "Caption", "Unlock the most powerful app features with Premium.", 0, { variant: "body" }),
      node("trial-list", "List", "NOW|Unlock all the features and start your journey today.\nIN 5 DAYS|Get a notification reminder that your trial is ending.\nIN 7 DAYS|You'll be charged for Premium. Cancel anytime.", 0, { label: "trial timeline" }),
      node("footer", "Footer", "", 0),
      node("products", "Products", "Japanese Ai - 1 Year|$79.99 per year ($6.67/month)", 0, { variant: "purchase" }),
      node("purchase", "Purchase Button", "Continue", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "access") {
    return [
      hero(),
      node("app-icon", "App Icon", "", 0),
      node("headline", "Header", "Get Unlimited Access", 0, { variant: "headline" }),
      node("features", "Feature list", "Create Live wallpapers|\nUnlock Premium content|\nDaily content updates|\nAd-free experience|", 0),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99/year", 1),
      node("footer", "Footer", "All this for just $79.99/year. Auto-renewable, you can cancel anytime.", 0),
      node("purchase", "Purchase Button", "Continue →", 0, { label: "purchase" }),
      node("links", "Links", "Terms of Use · Privacy Policy · Restore", 0),
    ];
  }

  if (template.id === "weather") {
    return [
      hero(),
      node("weather-image", "Image", "SKYCAST", 0),
      node("headline", "Header", "Exclusive Weather Insights: Unlock Premium Forecasting", 0, { variant: "headline" }),
      node("terms", "Terms", "Recurring billing · Cancel any time", 0),
      node("verify", "Verify", "✓ Verified by App Store", 0),
      node("divider-1", "Divider", "", 0),
      node("list-1", "List 1", "Ad-Free Experience|Enjoy uninterrupted weather tracking with our ad-free experience", 0),
      node("divider-2", "Divider", "", 0),
      pending("tag", "Tag"),
      pending("header-2", "Header 2"),
      pending("caption-2", "Caption 2"),
      pending("header-3", "Header 3"),
      pending("caption-3", "Caption 3"),
      pending("list-2", "List 2"),
      node("divider-3", "Divider", "", 0),
      pending("header-4", "Header 4"),
      pending("caption-4", "Caption 4"),
      pending("list-3", "List 3"),
      node("divider-4", "Divider", "", 0),
      pending("links", "Links"),
      pending("legal", "Legal"),
      pending("footer", "Footer"),
      node("purchase", "Purchase Button", "SUBSCRIBE NOW", 0, { label: "purchase" }),
    ];
  }

  if (template.id === "workout") {
    return [
      hero(),
      node("logo", "Logo", "POWERLY", 0),
      node("header-1", "HEADER 1", "Your Personal First Day Workout is Ready", 0, { variant: "headline" }),
      node("image-1", "Image 1", "", 0),
      node("title-1", "Title 1", "Core Plank", 0),
      node("repeats-1", "Repeats 1", "30 SECONDS", 0),
      node("caption-1", "Caption 1", "Assume a push-up position, aligning hands beneath shoulders. Engage core muscles, maintaining a straight line from head to heels.", 0),
      pending("image-2", "Image 2"),
      pending("title-2", "Title 2"),
      pending("repeats-2", "Repeats 2"),
      pending("caption-2", "Caption 2"),
      pending("image-3", "Image 3"),
      pending("title-3", "Title 3"),
      pending("repeats-3", "Repeats 3"),
      pending("caption-3", "Caption 3"),
      pending("image-4", "Image 4"),
      pending("title-4", "Title 4"),
      pending("repeats-4", "Repeats 4"),
      pending("caption-4", "Caption 4"),
      pending("header-2", "HEADER 2"),
      pending("subheader-2", "Subheader 2"),
      pending("features", "Features"),
      pending("header-3", "HEADER 3"),
      pending("subheader-3", "Subheader 3"),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year", 1),
      pending("links", "Links"),
      pending("legal", "Legal"),
      pending("footer", "Footer"),
      node("purchase", "Purchase Button", "Continue", 0, { label: "purchase" }),
    ];
  }

  if (template.id === "audiobooks") {
    return [
      hero(),
      node("headline", "Headline", "Get access to collection of audiobooks for kids", 0, { variant: "headline" }),
      node("benefits", "List", "", 0),
      node("item-0", "Item 0", "Access all quizzes and exams", 1),
      node("item-1", "Item 1", "Offline mode", 1),
      node("item-2", "Item 2", "Hands-on labs with lecturers", 1),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99 / 1 year", 1),
      node("footer", "Footer", "", 0),
      node("purchase", "Purchase Button", "Continue", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "herbs") {
    return [
      hero(),
      node("headline", "Headline", "Get Full Access to The Guide of Medicinal Herbs", 0, { variant: "headline" }),
      node("subhead", "Subhead", "The collection of over 5,000 plants", 0, { variant: "body" }),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$4.99 / 1 week", 1),
      node("footer", "Footer", "One-time opportunity", 0),
      node("purchase", "Purchase Button", "Continue", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "video-access") {
    return [
      hero(),
      node("headline", "Headline", "Get Full Access", 0, { variant: "headline" }),
      node("benefits", "List", "", 0),
      node("item-0", "Item 0", "Faster Video Processing", 1),
      node("item-1", "Item 1", "Exclusive Effects & Styles", 1),
      node("item-2", "Item 2", "No Watermark", 1),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99 / 1 year", 1),
      node("footer", "Footer", "The Best offer", 0),
      node("purchase", "Purchase Button", "Subscribe Now", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "design-life") {
    return [
      hero(),
      node("headline", "Headline", "Design your life", 0, { variant: "headline" }),
      node("subhead", "Subhead", "Join 1 million people taking control of their sleep and energy", 0, { variant: "body" }),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99 / 1 year", 1),
      node("footer", "Footer", "Advantageous offer", 0),
      node("purchase", "Purchase Button", "Subscribe Now", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "full-app") {
    return [
      hero(),
      node("headline", "Headline", "Unlock the full app with 50% off today", 0, { variant: "headline" }),
      node("subhead", "Subhead", "All lessons unlocked · Full access to all languages · Remove all ads", 0, { variant: "body" }),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99 · $1.54/week", 1),
      node("footer", "Footer", "", 0),
      node("purchase", "Purchase Button", "Subscribe Now", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (["item-placeholder", "item-placeholder-dark"].includes(template.id)) {
    return [
      hero(),
      node("items", "List", "Item One|This is a brief description for the first placeholder item.\nItem Two|Here is a short explanation for the second placeholder item.\nItem Three|This description provides details about the third placeholder item.", 0),
      node("image", "Image", "", 0),
      node("text", "Text", "This is a placeholder text for your content. It serves as an example to illustrate where actual information will go.", 0, { variant: "body" }),
      node("products", "Products", "", 0),
      node("annual-product", "Japanese Ai - 1 Year", "Japanese Ai - 1 Year|$4.99 / 1 week", 0),
      node("footer", "Footer", "Try before you buy · $2.16/month", 0),
      node("purchase", "Purchase", "Continue", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore · Login", 0),
    ];
  }

  if (template.id === "fantasy-access") {
    return [
      hero(),
      node("products", "Products", "", 0),
      node("annual-product", "Japanese Ai - 1 Year", "Japanese Ai - 1 Year|$79.99 / 1 year", 0),
      node("footer", "Footer", "Advantageous offer", 0),
      node("purchase", "Purchase Button", "Start", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "editing-plan") {
    return [
      node("hero-video", "Hero Video", template.visual, 0, { theme: template.theme }),
      node("headline", "Headline", "Choose the plan that works best for you!", 0, { variant: "headline" }),
      node("benefits", "List", "", 0),
      node("item-0", "Item 0", "Effortless AI-Powered Edits|Turn any video into a professional masterpiece with just a few taps, thanks to cutting-edge AI technology.", 1),
      node("item-1", "Item 1", "Exclusive Filters and Effects|Access a wide range of unique filters, transitions, and effects to make your content stand out.", 1),
      node("item-2", "Item 2", "Save Time with Auto-Enhance", 1),
      node("footer", "Footer", "", 0),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$45.99 per year · $4.16 per month", 1),
      node("purchase", "Purchase Button", "Start free trial", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "training") {
    return [
      hero(),
      node("headline", "Headline", "Start training today", 0, { variant: "headline" }),
      node("benefits", "List", "", 0),
      node("item-0", "Item 0", "Access to premium art styles", 1),
      node("item-1", "Item 1", "Unlimited artwork creation", 1),
      node("item-2", "Item 2", "NFT minting", 1),
      node("products", "Products", "", 0),
      node("annual-product", "Product", "Japanese Ai - 1 Year|$79.99 / 1 year", 1),
      node("footer", "Footer", "One-time opportunity", 0),
      node("purchase", "Purchase Button", "Start", 0, { label: "purchase" }),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "black-friday") {
    return [
      hero(),
      node("black-friday-image", "Black Friday Image", "BLACK FRIDAY", 0),
      node("discount", "Discount", "50% OFF", 0, { variant: "headline" }),
      node("benefits", "List", "Weekly Activity Planner|Easily organize and track your weekly activities, whether recurring or varied.\nUnlimited History Charts|Track your progress with detailed stats and session history.\nAccess to Future Premium Features|Enjoy early access to exciting new features planned for the future.", 0),
      node("footer-top", "Footer Top Part", "", 0),
      node("products", "Products", "Japanese Ai - 1 Year|$9.99/month", 0, { variant: "purchase" }),
      node("footer", "Footer", "There's no better deal than this one", 0),
      node("button-links", "Button and Links", "GET FULL ACCESS|Terms · Privacy · Restore", 0, { label: "purchase" }),
    ];
  }

  if (template.id === "new-year") {
    return [
      hero(),
      node("offer-card", "Card", "BEGIN THE NEW YEAR|with exclusive Christmas Offer!\n50% OFF", 0),
      node("review-carousel", "Carousel", "Megan Ross|User-friendly interface and robust features. Upgrading to Pro was worth it for the full range of functions!", 0, { label: "review" }),
      node("products", "Products", "Japanese Ai - 1 Year|$79.99/year|$1.54/week", 0, { variant: "purchase" }),
      node("footer", "Footer", "Special holiday offer", 0),
    ];
  }

  if (template.id === "premium-access") {
    return [
      hero(),
      node("headline", "Headline", "Premium Access", 0, { variant: "headline" }),
      node("subhead", "Subhead", "Less Work More Relaxing with Robot", 0, { variant: "body" }),
      node("trial-list", "List", "", 0),
      node("item-0", "List item", "Today|Start enjoying full access to advanced features", 1),
      node("item-1", "List item", "In 5 days|Get a reminder that your free trial will be ending soon", 1),
      node("item-2", "List item", "In 7 days|You will automatically be charged unless you cancel at any time", 1),
      node("products", "Products", "$79.99 / 1 year|Time-limited offer|$79.99 / 1 year", 0),
      node("footer", "Footer", "", 0),
      node("purchase", "Purchase Button", "Try 7 days free and subscribe", 0),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "family") {
    return [
      hero(),
      node("family-card", "Card", "", 0, { label: "hero content" }),
      node("family-kicker", "Text", "Speak Easy with Family Plan", 1, { variant: "body" }),
      node("headline", "Text", "Unlock fluency for the whole family", 1, { variant: "headline" }),
      node("benefits", "List", "Learn together, progress together\nPremium features for up to 5 family members across all devices\n3 day free trial, then $149.99/year until cancelled ($12.49/month)", 0),
      node("footer", "Footer", "Without commitment. Cancel anytime.", 0),
      node("products", "Products", "Start learning now|3 day free trial, then $149.99/year until cancelled ($12.49/month)|", 0, { variant: "purchase" }),
      node("post-product", "Text", "", 0, { label: "text", variant: "legal" }),
      node("links", "Links", "Terms · Restore Purchase", 0),
    ];
  }

  if (template.id === "connection") {
    return [
      hero(),
      node("story-card", "Card", "", 0, { label: "hero content" }),
      node("headline", "Text", "Build deeper connections, one conversation at a time", 1, { variant: "headline" }),
      node("couple-image", "Image", "James with Jenny", 1, { label: "image" }),
      node("subhead", "Text", "Transform how you communicate and understand each other's needs", 0, { variant: "body" }),
      node("products", "Products", "$6.67/monthly|Partner access included|$6.67/monthly", 0),
      node("product", "Product", "Japanese Ai - 1 Year", 1),
      node("footer", "Footer", "", 0),
      node("purchase", "Purchase Button", "START YOUR JOURNEY TOGETHER", 0),
      node("legal-copy", "Text", "Subscription renews automatically unless cancelled.", 0, { label: "legal", variant: "legal" }),
      node("links", "Links", "Terms of Use · Privacy Policy", 0),
      node("restore-links", "Links", "Restore Purchase", 0),
    ];
  }

  if (template.id === "document") {
    return [
      hero(),
      node("offer-card", "Card", "", 0, { label: "launch offer" }),
      node("offer-kicker", "Text", "SPECIAL LAUNCH OFFER", 1, { variant: "section" }),
      node("headline", "Text", "Get premium document management at an exclusive price", 1, { variant: "headline" }),
      node("offer-copy", "Text", "This limited-time offer gives you access to all premium features including unlimited scans, advanced organization, and priority sync at a fraction of the regular cost.", 1, { variant: "body" }),
      node("basic-plan", "Button", "Continue with basic plan", 0, { label: "secondary action" }),
      node("gift-image", "Image", "Launch offer gift", 0, { label: "image" }),
      node("footer", "Footer", "", 0),
      node("products", "Products", "CLAIM OFFER|$0.99 for 2 weeks, then|$1.54 /week", 0, { variant: "purchase" }),
      node("product", "Product", "Japanese Ai - 1 Year", 1),
    ];
  }

  if (template.id === "yoga") {
    return [
      hero(),
      node("yoga-image", "Image", "Yoga hero", 0, { label: "image" }),
      node("headline", "Header", "START YOUR YOGA JOURNEY TODAY!", 0, { variant: "headline" }),
      node("features", "Feature list", "Access to 300+ tailored workouts\nProfessional coaching videos\nDiscover delicious vegan recipes\nFace yoga and stretching routines", 0, { label: "feature list" }),
      node("products", "Products", "CONTINUE|1 year days free, then|$79.99 /year", 0, { variant: "purchase" }),
      node("product", "Product", "Japanese Ai - 1 Year", 1),
      node("caption", "Caption", "You can opt out at any point during the trial period.", 0, { variant: "body" }),
      node("legal", "Legal", "Payment will be charged to your iTunes at confirmation of purchase. Subscriptions will automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal, in accordance with your plan, within 24 hours prior to the end of the current period. You can manage or turn off auto-renew in your Apple ID account settings anytime after purchase. Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription to that publication, where applicable.", 0, { variant: "legal" }),
      node("footer", "Footer", "", 0),
    ];
  }

  if (template.id === "black-friday-timer") {
    return [
      hero(),
      node("top-text", "Top Text", "Lifetime Access", 0, { variant: "section" }),
      node("black-friday-image", "Black Friday Image", "BLACK FRIDAY", 0, { label: "image" }),
      node("offer-image", "Image", "Limited-time offer", 0, { label: "image" }),
      node("offer-card", "Card", "Get unlimited access to all premium features with a single lifetime purchase. No recurring fees.|EXPIRES IN: 04:59:59", 0, { label: "offer" }),
      node("product-image", "Image", "A one-time payment", 1, { label: "image" }),
      node("products", "Products", "$79.99|instead of $79.99/year|$79.99", 0),
      node("purchase", "Purchase Button", "Continue", 0),
      node("links", "Links", "Terms · Privacy · Restore", 0),
      node("footer", "Footer", "", 0),
    ];
  }

  if (template.id === "christmas") {
    return [
      hero(),
      node("holiday-card", "Card", "SPECIAL HOLIDAY DISCOUNT!|50% OFF", 0, { label: "holiday offer" }),
      node("countdown-card", "Card", "LIMITED TIME ONLY|06:23:59:59", 0, { label: "countdown visual" }),
      node("products", "Products", "$79.99 /year|$1.54 /month|$79.99 /year", 0),
      node("product", "Product", "Japanese Ai - 1 Year", 1),
      node("footer", "Footer", "with 1 week trial", 0),
      node("price-card", "Card", "", 0, { label: "price block" }),
      node("purchase", "Purchase Button", "CONTINUE", 0),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "halloween") {
    const reviews = [
      "User-friendly interface and robust features. Upgrading to Pro was worth it for the full range of tools. Highly recommend! — Jay Hawkins",
      "Love this app! The Pro upgrade is a game-changer with its additional features. It’s well worth the investment. Five stars! — TechGuru99",
      "Excellent app for productivity! The Pro version offers advanced tools that are incredibly useful. Highly recommend upgrading for full access. — CreativeMind86",
      "Very impressed with this app! Easy to use and packed with features. Pro upgrade provides even more value. Totally worth it. — StarGazer24",
      "This app is amazing! Great features and simple to navigate. The Pro upgrade unlocks powerful tools. Highly recommend to everyone! — PixlWizard",
    ];
    return [
      hero(),
      node("headline-card", "Card", "BE FEARLESS!|Halloween offer now on!", 0, { label: "headline" }),
      node("reviews", "Carousel", reviews.join("\n---\n"), 0, { label: "reviews" }),
      ...reviews.map((review, index) => node(`review-card-${index + 1}`, "Card", "", 1, { label: `review ${index + 1}` })),
      node("footer", "Footer", "", 0),
      node("products", "Products", "$79.99 / 1 year|Special Halloween offer|$79.99", 0),
      node("purchase", "Purchase Button", "Continue", 0),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "report") {
    return [
      hero(),
      node("headline", "Header", "Receive your personalized report", 0, { variant: "headline" }),
      node("stars", "Stars", "★★★★★", 0, { label: "rating" }),
      node("features", "Feature list", "Delve into personalized horoscopes\nExplore your compatibility reports\nExperience real-time palm reading\nEnhance your self-awareness and understanding of others.", 0, { label: "feature list" }),
      node("footer", "Footer", "", 0),
      node("products", "Products", "$1.54 / week|cancel anytime.|$1.54 / week", 0),
      node("product", "Product", "Japanese Ai - 1 Year", 1),
      node("purchase", "Purchase Button", "CONTINUE", 0),
      node("links", "Links", "Terms · Privacy · Restore", 0),
    ];
  }

  if (template.id === "avatar") {
    return [
      hero(),
      node("offer", "Text", "✪ ONE-TIME OFFER", 0, { variant: "section" }),
      node("headline", "Header", "Create your 3D avatar", 0, { variant: "headline" }),
      node("products", "Products", "Enjoy 7 days for FREE, then $7.99/week.|Auto renewable.|$7.99 / week", 0),
      node("footer", "Footer", "", 0),
      node("purchase", "Purchase Button", "Continue with trial →", 0),
      node("caption", "Caption", "Auto renewable. Cancel anytime.", 0, { variant: "body" }),
    ];
  }

  if (template.id === "mindfulness") {
    return [
      hero(),
      node("mindfulness-card", "Card", "", 0, { label: "hero content" }),
      node("mindfulness-image", "Image", "Mindfulness meditation illustration", 1, { label: "image" }),
      node("mindfulness-headline", "Header", "Mindfulness Unlocked", 1, { variant: "headline" }),
      node("mindfulness-caption", "Caption", "Experience guided meditations", 1, { variant: "body" }),
      node("reviews", "Carousel", "Amazing app!|The Pro version is a must-have with its extensive features. Easy to use and very intuitive. Highly recommended for everyone.\n---\nAmazing app!|The Pro version is a must-have with its extensive features. Easy to use and very intuitive. Highly recommended for everyone.", 0, { label: "2 reviews" }),
      node("footer", "Footer", "", 0),
      node("products", "Products", "Continue|Annual access|$119.88/year", 0, { variant: "purchase" }),
      node("trial-toggle", "Toggle", "Not sure? Get free trial|Cancel anytime", 0, { label: "free trial", defaultState: "Off" }),
      node("toggle-on", "Toggle On", "", 1, { label: "active state", evidence: "partial" }),
      node("toggle-off", "Toggle Off", "", 1, { label: "inactive state", evidence: "partial" }),
      node("links", "Links", "Terms of use · Privacy policy", 0),
    ];
  }

  if (template.id === "ht-blue-privilege") {
    return [
      node("hero-image", "Hero Image", template.visual, 0, { theme: template.theme, config: { copyPrefix: "VIP", copySuffix: "7折大促", copyCaption: "HelloTalk 世界杯", bannerEnabled: true, deepLink: "" } }),
      node("benefits", "List", "", 0, { label: "特权对比", config: { bluePrivilege: true, privilegeRows: initialPrivilegeRows, maxVisibleRows: 5, headerBackground: "#f1f1f1", vipColumnBackground: "#ffffff", backgroundColor: "#f5f5f5", secondaryColor: "#bdbdbd", accentColor: "#ffb40d" } }),
      node("timer", "Timer", "18:32:25", 0, { config: { bluePrivilege: true, enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view", locale: "English", backgroundColor: "#ffd16b", color: "#19ad34" } }),
      node("products", "Products", "1个月|¥78|¥78/月\n12个月|¥488|¥40.67/月\n终身|¥698|永久会员权益", 0, { config: { bluePrivilege: true, defaultSelected: 1, showOfferBadge: true, offerBadgeLabel: "🔥 30% OFF", badgeProductIndex: 1, badgePosition: "top", badgeGradient: ["#ff860a", "#ffb000", "#ffd10b"], selectedBorderGradient: ["#ff860a", "#ff860a", "#ff860a"], selectedBackground: "#ffffff", saveTextColor: "#ff8207", purchaseTextGradient: ["#ffffff", "#ffffff", "#ffffff"], purchaseBackgroundGradient: ["#ff8707", "#ffb000", "#ffd10b"], planSavings: ["", "节省 48%", "立减¥1000"], planOriginalPrices: ["", "", "¥1698"], visibleProductCount: 3, productBackground: "#f5f5f5" } }),
      node("retention", "Card", "", 0, { label: "挽留弹窗", config: { retention: true, enabled: false, title: "错过这次，就要多花 30%😱", timerLabel: "倒计时", timerStart: "71:22:22", buttonText: "立享优惠", cancelText: "忍痛取消", backgroundColor: "#f7f7f7", buttonStartColor: "#ff8600", buttonEndColor: "#ffcd00", buttonTextColor: "#ffffff", titleColor: "#111111", timerColor: "#11bf42", imageSrc: "/ht-retention-gift.png", backgroundImage: "" } }),
      node("purchase", "Button", "立即领取优惠", 0, { config: { action: "Purchase" } }),
      node("legal", "Text", "如果当前缴费期前 24 小时没有取消续订，系统会自动续订，费用将从你的 iTunes 账户收取，你可随时前往 iTunes 商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的", 0, { label: "续订说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "ht-membership-plans") {
    return [
      node("carousel", "Carousel", "7", 0, { label: "访客示例轮播", config: { itemCount: 7, initialSlide: 0 } }),
      node("hero-image", "Hero Image", template.visual, 1, { theme: template.theme }),
      node("headline", "Headline", "解锁谁看了我", 0, { variant: "headline" }),
      node("caption", "Text", "找到志同道合的学习语伴！", 0, { variant: "body" }),
      node("products", "Products", "1个月会员|¥78/月|$12.99/月\n12个月会员|¥488/年|$6.67/月\n终身会员|¥698|物有所值", 0, { config: { defaultSelected: 1, showOfferBadge: true } }),
      node("purchase", "Button", "继续", 0, { config: { action: "Purchase" } }),
      node("legal", "Text", "可随时取消", 0, { label: "订阅说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "ht-payment-recovery") {
    return [
      node("offer-card", "Card", "", 0, { label: "支付恢复弹窗" }),
      hero(1),
      node("headline", "Headline", "错过就要恢复原价了", 1, { variant: "headline" }),
      node("caption", "Text", "现在领取优惠，继续解锁 VIP 专属权益", 1, { variant: "body" }),
      node("products", "Products", "1年会员|¥28.17/月|新用户立省 64%\n1个月会员|¥78/月|", 1, { config: { defaultSelected: 0, showOfferBadge: true } }),
      node("timer", "Timer", "71:49:28", 1, { config: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view" } }),
      node("purchase", "Button", "立即领取优惠", 1, { config: { action: "Purchase" } }),
      node("legal", "Text", "首年优惠价，次年按标准价格续订，可随时取消。", 1, { label: "续订说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 1),
    ];
  }

  if (template.id === "ht-sku-sheet") {
    return [
      node("sku-card", "Card", "", 0, { label: "SKU 半窗" }),
      hero(1),
      node("headline", "Headline", "Golden Week Special Offer", 1, { variant: "headline" }),
      node("caption", "Text", "年度与终身 VIP 限时立减 30%", 1, { variant: "body" }),
      node("timer", "Timer", "00:47:04", 1, { config: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view" } }),
      node("products", "Products", "1个月会员|¥39|¥78\n12个月会员|¥338|¥488\n终身会员|¥698|¥1198", 1, { config: { defaultSelected: 1, showOfferBadge: true } }),
      node("purchase", "Button", "领取限时优惠", 1, { config: { action: "Purchase" } }),
      node("legal", "Text", "订阅会在当前周期结束前 24 小时自动续订，可随时在账户设置中取消。", 1, { label: "续订说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 1),
    ];
  }

  // Source screenshots confirm the visible copy for these cards, but their Builder trees have not been captured yet.
  return [
    hero(),
    node("source-reference", "Source reference", "Source visual captured. Builder layer tree is still being collected.", 0, { label: "unverified structure", evidence: "preview" }),
  ];
}

function createComponentNode(type, index) {
  const contentByType = {
    Text: "text", Image: "", Card: "", "Web Paywall Button": "Pay on web", Button: "button text", List: "", "List item": "title|caption", Links: "Terms · Privacy · Restore · Login", Timer: "04:59:59", Carousel: "", Products: "",
  };
  const configByType = {
    Timer: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "", suffix: "", resetMode: "Reset timer on every paywall view" },
    Products: { defaultSelected: 0, showOfferBadge: true },
    Button: { action: "Purchase" },
  };
  return { id: `added-${type.toLowerCase().replace(/[^a-z]+/g, "-")}-${index}`, type, label: "", depth: 0, content: contentByType[type] ?? "", config: configByType[type] };
}

function BuilderNodeIcon({ type }) {
  const Icon = type === "Timer" ? Clock3
    : type === "Products" ? Package
      : type === "Links" ? Link2
        : type === "Carousel" ? GalleryHorizontal
          : type === "Card" ? RectangleHorizontal
            : ["Button", "Purchase Button", "Web Paywall Button"].includes(type) ? MousePointerClick
              : ["Hero Image", "Image"].includes(type) ? ImageIcon
                : type === "List" ? List
                  : ["Text", "Headline", "Header", "Caption", "Legal"].includes(type) ? Type
                    : Blocks;
  return <Icon size={13} strokeWidth={2.15} />;
}

const productOptions = [
  "月度会员 / Monthly",
  "Japanese ai / 3 months",
  "Japanese Ai - 1 Year / Annual",
];

const observedProductRows = [
  { product: "Japanese Ai - 1 Year", period: "Annual", offer: "Black Friday" },
  { product: "Japanese ai", period: "3 months", offer: "No offers for this product" },
  { product: "月度会员", period: "Monthly", offer: "springsale" },
];

const localeLabels = {
  en: "English",
  zh: "Simplified Chinese",
  ja: "Japanese",
};

const appCategories = [
  "Entertainment", "Weather", "Medical", "Productivity", "Travel", "Music",
  "Reference", "Health & fitness", "Stickers", "Finance", "Developer tools",
  "Social networking", "Business", "Education", "Graphics & design", "Games",
  "Sports", "Books", "Lifestyle", "Shopping", "Utilities", "Food & drink",
  "Magazines & newspapers", "Photo & Video",
];

const zhCopy = {
  "Paywalls": "付费墙", "Test": "测试", "Help": "帮助", "App settings": "应用设置", "Account": "账户",
  "Add a new app": "新建应用", "Evidence & gaps": "已验证与缺口", "Only observed behavior is reproduced. These routes are deliberately not invented.": "仅复刻已观察到的行为；未验证的结果不会被编造。",
  "Create paywall": "创建付费墙", "Create as draft": "创建草稿", "General": "基础设置", "Products": "产品套餐",
  "Paywall name": "付费墙名称", "Paywall screenshot": "付费墙截图", "Upload screenshot": "上传截图",
  "Build no-code paywall": "使用无代码构建器", "Choose a template": "选择模板", "Generate Paywall with AI": "使用 AI 生成付费墙",
  "Copy a Design from Your Apps": "从其他应用复制设计", "Builder & Generator": "构建器与生成器", "Choose how to start": "选择创建方式",
  "Start with the visual Builder.": "从可视化构建器开始。", "Observed template library and filters.": "查看已观察到的模板库与筛选项。",
  "Entry is known; generation output is not.": "入口已验证，生成结果尚未验证。", "Visual Builder configuration only.": "仅复制可视化构建器配置。",
  "Metrics": "指标", "View in analytics": "在分析中查看", "Duplicate": "复制", "Test on Device": "在设备上测试", "Archive": "归档",
  "State": "状态", "Started at": "创建时间", "Open Builder": "打开构建器",
  "Discard": "放弃更改", "Save": "保存", "Save & publish": "保存并发布", "Add product": "添加产品",
  "Template": "模板", "Change template": "更换模板", "Layout settings": "布局设置", "Elements": "元素", "Show on device": "在设备上展示",
  "Source visual": "源端画面", "Editable structure": "可编辑结构", "Source reference": "源端参考画面",
  "Source preview": "源端画面", "Structure pending": "结构待采集",
  "This template has a captured source visual, but its exact Builder layer tree has not been verified. Editing is intentionally unavailable until the source structure is collected.": "该模板已采集源端画面，但精确的构建器图层树尚未验证；在采集完成前，不开放伪造的编辑能力。",
  "The matching source visual is shown in the device preview. No generic editable nodes are substituted for this template.": "设备预览显示与模板卡一致的源端画面；不会用通用可编辑节点替代该模板。",
  "On": "开启", "Add element": "添加元素", "Localization": "本地化", "English": "英语", "French": "法语", "Simplified Chinese": "简体中文",
  "Add locale": "添加语言", "Content": "内容", "Style": "样式", "Layout": "布局", "Text": "文本", "Image": "图片", "Card": "卡片",
  "Web Paywall Button": "网页付费按钮", "Button": "按钮", "List": "列表", "Links": "链接", "Timer": "倒计时", "Carousel": "轮播图",
  "Toggle": "试用开关", "Toggle On": "开关开启状态", "Toggle Off": "开关关闭状态", "Default toggle state": "默认开关状态", "Active": "已开启",
  "Hero Image": "主视觉图片", "Header": "标题", "Headline": "主标题", "Subhead": "副标题", "Caption": "说明文案", "Legal": "法律说明", "Top Text": "顶部文案", "Feature list": "权益列表", "List item": "列表项", "Product": "产品", "Purchase Button": "购买按钮", "Stars": "星级", "Black Friday Image": "黑色星期五图片", "Footer": "底部区域", "Purchase": "购买", "Continue": "继续", "Terms of service": "服务条款",
  "Privacy policy": "隐私政策", "Restore": "恢复购买", "Close": "关闭", "Cancel": "取消", "Accept": "确认",
  "Paywall publishing confirmation": "付费墙发布确认", "Archive paywall": "归档付费墙", "Filters": "筛选",
  "Number of products": "产品数量", "Image / video": "图片 / 视频", "Components": "组件", "Length": "内容长度", "Background theme": "背景主题",
  "Category": "分类", "1 product (31)": "1 个产品（31）", "More than 1 product (56)": "多个产品（56）", "All": "全部",
  "With Image or Video (77)": "含图片或视频（77）", "No media (3)": "无媒体（3）", "Free trial toggle (5)": "免费试用开关（5）",
  "Trial timeline (24)": "试用时间线（24）", "Reviews (7)": "评价（7）", "Timer (5)": "倒计时（5）", "Short": "短", "Long": "长",
  "Light": "浅色", "Dark": "深色", "All paywalls (56)": "全部付费墙（56）", "Popular (5)": "热门（5）", "Seasonal (7)": "季节活动（7）",
  "Generate a Design with AI": "使用 AI 生成设计", "Start Generating": "开始生成", "Choose Paywall": "选择付费墙",
  "Selected template": "已选模板", "No template selected": "尚未选择模板", "Open in Builder": "在构建器中打开",
  "Annual plan with trial": "年度方案与试用", "Upgrade your routine": "升级你的日常", "Simple annual offer": "简洁年度优惠",
  "Premium membership": "高级会员", "Seasonal subscription": "季节订阅", "Start your journey": "开启你的旅程",
  "Unlock the World of Knowledge": "解锁知识的世界", "What to expect during your free trial": "免费试用期间会发生什么", "Build deeper connections": "建立更深的连接",
  "Unlock fluency for the whole family": "为全家解锁流畅表达", "Premium document management": "高级文档管理", "How your free trial works": "免费试用如何运作",
  "Start your yoga journey today": "今天开始你的瑜伽之旅", "Receive your personalized report": "领取你的专属报告", "Create your 3D avatar": "创建你的 3D 形象",
  "Get Unlimited Access": "解锁无限访问", "Exclusive Weather Insights": "专属天气洞察", "Mindfulness Unlocked": "解锁正念体验",
  "Your Personal First Day Workout is Ready": "你的首日专属训练已准备好", "Be Fearless": "勇敢无畏", "Black Friday Lifetime Access": "黑色星期五终身访问",
  "Premium learning library": "高级学习内容库", "Day-by-day trial guide": "逐日试用指引", "A focused conversation plan": "专注对话计划",
  "Family learning plan": "家庭学习方案", "Exclusive launch offer": "专属首发优惠", "Clear renewal timeline": "清晰续订时间线",
  "Personal wellness plan": "个人健康计划", "Explore your profile": "探索你的个人档案", "Try it free for seven days": "免费体验七天",
  "Premium wallpaper collection": "高级壁纸合集", "Unlock premium forecasting": "解锁高级天气预报", "Experience guided meditations": "体验引导式冥想",
  "A plan built for today": "为今天定制的计划", "Halloween offer now on": "万圣节优惠正在进行", "Limited holiday discount": "限时节日优惠",
  "Element content": "元素内容", "Delete element": "删除元素", "Preview orientation": "预览方向", "Preview visibility": "预览可见性",
  "No locally reconstructed templates match this filter combination.": "没有本地还原模板符合当前筛选组合。", "All paywalls": "全部付费墙", "Popular": "热门", "Seasonal": "季节活动",
  "No locally captured Adapty templates match this filter combination.": "没有已采集的 Adapty 真实模板符合当前筛选组合。",
  "Don't have a design? Our AI will create a unique paywall for you from scratch.": "还没有设计？AI 会从零为你生成一张独特的付费墙。",
  "Reuse a design you've built with Paywall Builder in another app.": "复用你在其他应用中通过付费墙构建器创建的设计。", "Get Free Access": "免费开始使用",
  "1 product · Trial timeline · Reviews": "1 个产品 · 试用时间线 · 评价", "1 product · Image": "1 个产品 · 图片", "1 product · Free trial toggle": "1 个产品 · 免费试用开关",
  "Text Required": "文本内容", "Max lines": "最大行数", "Overflow": "溢出处理", "Scale text": "缩放文字", "Close preview": "关闭预览",
  "Visual media": "视觉媒体", "Embedded headline": "内嵌主标题", "Embedded supporting copy": "内嵌辅助文案", "Embedded copy layout": "内嵌文案布局", "Left offset": "左侧偏移", "Bottom offset": "底部偏移",
  "Image fit": "图片适配", "Contain": "完整显示", "Title prefix": "标题前缀", "Title suffix": "标题后缀", "Title prefix color": "标题前缀颜色", "Title suffix color": "标题后缀颜色",
  "PREMIUM ACCESS": "高级访问", "Smart summaries and audio insights designed for lifelong learners": "为持续学习者准备的智能摘要与音频洞察",
  "Premium content and tools": "高级内容与工具", "A plan that fits your routine": "适合你日常节奏的方案", "Cancel anytime from settings": "可随时在设置中取消",
  "Today": "今天", "Full access starts now": "完整访问从现在开始", "Day 6": "第 6 天", "We will remind you": "我们会提醒你", "Day 7": "第 7 天", "Your plan renews": "你的方案将续订",
  "Loved by thousands of members": "受到数千名会员的喜爱", "Annual access": "年度访问", "Start your free trial": "开始免费试用", "Without commitment. Cancel anytime.": "无需承诺，随时可取消。",
  "New text": "新增文本", "New card": "新增卡片", "Open web checkout": "打开网页结算", "First benefit": "第一项权益", "Second benefit": "第二项权益", "Customer story": "用户故事",
  "Quarterly access": "季度访问", "Supporting text": "辅助文案", "Heading": "标题",
  "1 product": "1 个产品", "2 products": "2 个产品", "Trial timeline": "试用时间线", "Reviews": "评价", "No media": "无媒体",
  "Create a web paywall": "创建网页付费墙", "Create web paywall": "创建网页付费墙", "Learn more": "了解更多",
  "Paste the web paywall link": "粘贴网页付费墙链接", "Save link": "保存链接", "Choose how to trigger the web purchase flow": "选择如何触发网页购买流程",
  "Read docs": "查看文档", "You’re ready to launch!": "已准备好发布！", "Table": "表格", "JSON": "JSON", "Import/Export": "导入/导出",
  "Locales": "语言", "Import": "导入", "Export": "导出", "Add value": "添加配置项", "String": "文本", "Number": "数字",
  "Boolean": "布尔值", "Default": "默认", "Remove French": "移除法语", "AI Translate": "AI 翻译",
  "Revenue": "收入", "Unique views": "独立浏览量", "ARPAS": "每位活跃订阅用户收入", "Trials": "试用", "Purchases": "购买", "Refunds": "退款",
  "Last month": "上个月", "week": "按周", "Group by Product": "按产品分组", "Add filter": "添加筛选", "Audience based": "按受众",
  "Filter metrics by install date": "按安装日期筛选指标", "Search": "搜索", "Reset": "重置", "Apply": "应用",
  "Create your first Paywall": "创建第一个付费墙", "New paywall": "新建付费墙", "Acquisition": "拉新", "Cancellation": "取消订阅",
  "Start blank": "从空白开始", "Use template": "使用模板", "Publish": "发布", "Localize": "本地化", "Share": "分享",
  "Name": "名称", "Terms": "条款", "Privacy": "隐私政策", "Restore Purchase": "恢复购买", "Login button": "登录按钮",
  "External browser": "外部浏览器", "Offer": "优惠", "Primary text": "主文案", "Secondary text": "辅助文案",
  "No offer": "无优惠", "Action": "动作", "Action ID": "动作 ID",
  "Interface language": "界面语言", "Chinese": "中文",
  "1 product · Trial timeline": "1 个产品 · 试用时间线", "Off": "关闭", "Link text": "链接文案", "Link URL": "链接地址",
  "Restore button": "恢复购买按钮", "Button text": "按钮文案", "Terms of Service URL": "服务条款链接", "Privacy Policy URL": "隐私政策链接",
  "Complete template setup": "完成模板设置", "Custom Fonts": "自定义字体", "Review the font setup before saving this template.": "保存模板前请检查字体设置。",
  "The first template save was observed to surface Custom Fonts and require Terms of Service and Privacy Policy URLs in Links.": "已观察到首次保存模板时会提示自定义字体，并要求在“链接”中填写服务条款与隐私政策地址。",
  "LEARN WITHOUT LIMITS": "突破学习限制", "Unlock your potential": "释放你的潜能", "Personal lessons, smart practice and everything you need to make progress.": "个性化课程、智能练习，以及持续进步所需的一切。",
  "Unlimited conversations": "无限对话", "Personalized learning plan": "个性化学习计划", "Annual": "年度", "Monthly": "月度", "BEST VALUE": "最优方案",
  "All prices, titles, and offers displayed are placeholders. The actual data from App Store and Google Play will be shown in the app.": "预览中的价格、标题和优惠均为占位内容；应用内会显示 App Store 与 Google Play 的实际数据。",
  "iPhone 15 Pro": "iPhone 15 Pro", "System (SF Pro, Roboto) Regular": "系统字体（SF Pro、Roboto）常规", "Top button 1": "顶部按钮 1", "Top button 2": "顶部按钮 2",
  "Default font": "默认字体", "Purchase flow": "购买流程", "Products as list + purchase button": "产品列表 + 购买按钮", "Background color": "背景颜色",
  "Enable Dark mode": "启用深色模式", "Content layout": "内容布局", "Default child margin": "子元素默认边距", "Spacing": "间距", "Add max width": "添加最大宽度",
  "Show after delay": "延迟显示", "Fill color": "填充颜色", "Border color": "边框颜色", "Border thickness": "边框粗细", "Icon color": "图标颜色",
  "Upload image": "上传图片", "Upload video": "上传视频", "Choose a file from your computer": "从电脑中选择文件", "Enter custom media ID": "输入自定义媒体 ID",
  "Media": "媒体", "Video": "视频", "Display": "展示方式", "Overlay": "叠加", "Transparent": "透明", "Flat": "平铺", "Tint": "色调",
  "Tint opacity": "色调透明度", "Image height": "图片高度",
  "Terms of Service": "服务条款", "Privacy Policy": "隐私政策",
  "Read the docs": "查看文档", "All placements": "全部展示位置", "States (3)": "状态（3）", "Live": "已发布", "Draft": "草稿", "Inactive": "未启用",
  "Search by paywall name": "按付费墙名称搜索", "Proceeds": "实收款项", "Net proceeds": "净实收款项", "1 - 2 of 2": "第 1 - 2 项，共 2 项",
  "Create a draft and configure it with products and a no-code builder.": "创建草稿，并在产品套餐与无代码构建器中完成设置。",
  "Actions for test": "test 的操作", "Actions for test 2": "test 2 的操作", "Edit": "编辑",
  "No switch (all products are visible)": "不切换（展示所有产品）", "Selected product": "选中的产品", "Products grouping": "产品分组",
  "Custom media ID": "自定义媒体 ID", "Background image": "背景图片", "Fill": "填充", "Border": "边框", "Corner radius": "圆角",
    "Height": "高度", "Aspect": "宽高比", "Original": "原始比例", "Cover": "填满", "Padding": "内边距", "Vertical offset": "垂直偏移",
  "Format": "格式", "Separator": "分隔符", "Starting value": "初始值", "Text before": "前置文案", "Text after": "后置文案", "Reset on every opening": "每次打开时重置",
  "Default icon": "默认图标", "Icon position": "图标位置", "Connector": "连接线", "Autoplay": "自动播放", "Timing": "时长", "Transition": "切换效果", "Pause on user interaction": "用户操作时暂停",
  "Toggle color": "开关颜色", "Active color": "开启颜色", "Title text": "标题文案", "Text spacing": "文字间距",
  "Pagination dots": "分页圆点", "Dot color": "圆点颜色", "Dot size": "圆点尺寸", "Dot spacing": "圆点间距", "Horizontal": "横向", "Vertical": "纵向",
  "Opacity": "透明度", "Top padding": "上内边距", "Right padding": "右内边距", "Bottom padding": "下内边距", "Left padding": "左内边距",
  "PAYWALL": "付费墙", "✓ Unlimited conversations": "✓ 无限对话", "✓ Personalized learning plan": "✓ 个性化学习计划",
  "$49.99 / year": "$49.99 / 年", "$8.99 / month": "$8.99 / 月", "Terms of service · Privacy policy · Restore": "服务条款 · 隐私政策 · 恢复购买",
  "2 products · Reviews": "2 个产品 · 评价", "1 product · Timer": "1 个产品 · 倒计时", "2 products · Image": "2 个产品 · 图片",
  "2 products · Timer": "2 个产品 · 倒计时", "1 product · No media": "1 个产品 · 无媒体", "Icon": "图标", "Align": "对齐", "Left": "左侧",
  "Hero media": "主视觉媒体", "Top banner": "顶部横幅", "Show banner": "展示横幅", "Language": "语言", "Audience": "用户类型", "Banner deep link": "横幅跳转链接",
  "Copy embedded in this visual": "主视觉内嵌文案", "Supporting copy": "辅助文案", "The headline and supporting copy are composited in the hero image layer, not independent text components. Show banner directly maps to its visibility in the preview.": "主标题与辅助文案属于主视觉图层，不作为独立文本组件；展示横幅会直接同步预览可见性。",
  "Privilege rows": "特权行", "Add privilege": "添加特权", "Visible rows": "显示行数", "Privilege": "特权", "Non-member": "非会员", "Each row maps directly to the three columns in the current paywall preview. You can add or remove a privilege without converting the component into free-form text.": "每一行都会直接映射到当前付费墙预览的三列，可独立新增或删除，不会退化为自由文本。",
  "Product packages": "产品套餐", "Visible packages": "显示套餐数", "Default selected": "默认选中", "Show selected package badge": "展示已选套餐角标", "Package": "套餐", "Price": "价格", "Add package": "添加套餐", "Remove package": "删除套餐",
  "List background": "列表背景", "Header background": "表头背景", "VIP column background": "VIP 列背景", "Non-member text": "非会员文字", "VIP text": "VIP 文字", "Product area background": "套餐区域背景", "Selected background": "选中背景", "Selected border": "选中边框", "Badge background": "角标背景", "Badge text": "角标文字",
  "Page behavior": "页面行为", "Confirm before closing": "关闭前二次确认", "This is a page-exit rule, so it is stored with the template but does not alter the resting device preview. Module order is changed directly by dragging items in the Elements panel.": "这是离开页面时生效的规则，会保存到模板中；静态设备预览不会伪造弹窗。模块顺序可在元素面板中直接拖动调整。",
  "Replace": "替换", "Remove media": "删除媒体", "Restore source": "恢复源素材", "Upload image or video": "上传图片或视频", "PNG, JPG, WebP, MP4, max size 10MB.": "支持 PNG、JPG、WebP、MP4，最大 10MB。",
  "Source media": "源素材", "Français": "法语", "System": "系统", "Serif": "衬线", "Monospace": "等宽", "Colon": "冒号", "Dot": "圆点", "Space": "空格",
  "Limited": "受限", "Included": "已包含", "New privilege": "新增特权", "New package": "新增套餐",
  "Font size": "字号", "Font": "字体", "Weight": "字重", "Regular": "常规", "Medium": "中等", "Bold": "粗体", "Heavy": "特粗", "Center": "居中", "Right": "右对齐",
  "Time format": "时间格式", "Time separator": "时间分隔符", "Timer text": "倒计时文案", "Start value": "初始值", "Timer mode": "倒计时模式", "Reset timer on every paywall view": "每次打开付费墙时重置", "Show timer": "展示倒计时",
  "Background": "背景", "Color": "颜色", "Standard color": "标准颜色", "Text color": "文字颜色", "Title size": "标题字号", "Title font": "标题字体", "Caption size": "说明字号", "Caption font": "说明字体", "Selection color": "选中颜色", "Link color": "链接颜色", "Shadow": "阴影", "Margin": "外边距", "Rounded rectangle": "圆角矩形",
  "Visible link labels": "可见链接文案", "Default selected product": "默认选中产品", "Show offer badge": "展示优惠角标", "Plans": "套餐内容", "One plan per line. Use “name|price|supporting copy” to map each visible plan.": "每行一个套餐，使用“名称|价格|辅助文案”映射预览内容。",
  "Preview mode": "预览模式", "Document style": "文档样式",
  "1 - ": "第 1 - ", " of ": "，共 "
};

const enCopy = Object.fromEntries(Object.entries(zhCopy).map(([english, chinese]) => [chinese, english]));

function localizeInterface(root, locale) {
  if (!root) return;
  const dictionary = locale === "zh-CN" ? zhCopy : enCopy;
  const replace = (value) => {
    const leading = value.match(/^\s*/)?.[0] ?? "";
    const trailing = value.match(/\s*$/)?.[0] ?? "";
    const core = value.slice(leading.length, value.length - trailing.length);
    return dictionary[core] ? leading + dictionary[core] + trailing : value;
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      return parent && !parent.closest("[data-no-translate]") && !["SCRIPT", "STYLE"].includes(parent.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => { const next = replace(node.nodeValue); if (next !== node.nodeValue) node.nodeValue = next; });
  root.querySelectorAll("[placeholder],[aria-label],[title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value && dictionary[value]) element.setAttribute(attribute, dictionary[value]);
    });
  });
}

function App() {
  const [view, setView] = useState("list");
  const [paywalls, setPaywalls] = useState(originalPaywalls);
  const [selectedId, setSelectedId] = useState("test-2");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("Live,Draft,Inactive");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState({
    name: "RESEARCH - Rebuild Draft",
    products: ["月度会员 / Monthly", "Japanese Ai - 1 Year / Annual"],
  });
  const [compliance, setCompliance] = useState(false);
  const [rememberCompliance, setRememberCompliance] = useState(false);
  const [templateSelected, setTemplateSelected] = useState(null);
  const [appliedTemplate, setAppliedTemplate] = useState(null);
  const [templateLinks, setTemplateLinks] = useState({ terms: "terms-link", privacy: "privacy-link" });
  const [builderTab, setBuilderTab] = useState("tree");
  const [builderNodes, setBuilderNodes] = useState(() => createBuilderNodes());
  const [activeNode, setActiveNode] = useState("links");
  const [unknownOpen, setUnknownOpen] = useState(true);
  const [placementFilter, setPlacementFilter] = useState([]);
  const [placementDraft, setPlacementDraft] = useState([]);
  const [placementMenuOpen, setPlacementMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    const root = document.querySelector(".app");
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
    localizeInterface(root, locale);
    const observer = new MutationObserver(() => localizeInterface(root, locale));
    if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const filteredPaywalls = useMemo(() => {
    const allowedStates = stateFilter.split(",");
    return paywalls.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && allowedStates.includes(item.state));
  }, [paywalls, search, stateFilter]);

  const selected = paywalls.find((item) => item.id === selectedId) ?? paywalls[0];

  const openPaywall = (item) => {
    setSelectedId(item.id);
    setView("general");
  };

  const createDraft = () => {
    if (!compliance) return;
    const id = `research-${Date.now()}`;
    const created = { id, name: draft.name || "Untitled paywall", state: "Draft", products: draft.products.length, startedAt: "20 Aug 2026", icon: false };
    setPaywalls((current) => [...current, created]);
    setSelectedId(id);
    setView("general");
    setModal(null);
    setCompliance(false);
    notify(rememberCompliance ? "Draft created. Future confirmation preference saved." : "Draft created.");
  };

  const duplicate = (source = selected) => {
    setDraft((current) => ({ ...current, name: `${source.name} (Copy)`, products: productOptions.slice(0, source.products) }));
    setView("create");
    notify("Duplicate opens an unsaved copy. It is not added to the list yet.");
  };

  const archiveCurrent = () => {
    setPaywalls((current) => current.filter((item) => item.id !== selected.id));
    setView("list");
    setModal(null);
    notify("Paywall successfully archived.");
  };

  const markUnknown = (item) => {
    setModal({ kind: "unknown", item });
  };

  const updateBuilderNode = (id, patch) => setBuilderNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  const removeBuilderNode = (id) => {
    setBuilderNodes((current) => current.filter((node) => node.id !== id));
    setActiveNode((current) => current === id ? "headline" : current);
  };
  const applyTemplate = (templateIndex) => {
    const template = templates[templateIndex];
    const nextNodes = createBuilderNodes(template.id);
    setTemplateSelected(templateIndex);
    setAppliedTemplate(templateIndex);
    setBuilderNodes(nextNodes);
    // Templates do not share a universal node id; select the first real layer.
    setActiveNode(nextNodes[0]?.id ?? "links");
    setBuilderTab("tree");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">a</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button className={`nav-item ${label === "Paywalls" ? "active" : ""}`} key={label} onClick={() => label === "Paywalls" && setView("list")}>
              <Icon size={18} />
              <span>{label}</span>
              {label === "Flows" && <em>Beta</em>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="app-switcher-wrap">
            <button className="app-switcher" onClick={() => setAppMenuOpen((open) => !open)}><b>T</b> Test <ChevronDown size={15} /></button>
            {appMenuOpen && (
              <div className="app-menu">
                <button className="app-menu-current"><b>T</b><span>Test</span><Check size={15} /></button>
                <button onClick={() => { setAppMenuOpen(false); setModal({ kind: "add-app" }); }}><Plus size={16} /> Add a new app</button>
              </div>
            )}
          </div>
          <div className="top-actions"><div className="language-console" data-no-translate><span>{locale === "zh-CN" ? "界面语言" : "Interface language"}</span><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "zh-CN" ? "active" : ""} onClick={() => setLocale("zh-CN")}>中文</button></div><Bell size={20} /><span>Help</span><span>App settings</span><span>Account</span></div>
        </header>

        <div className="content">
          {view === "list" && (
            <PaywallList
              paywalls={filteredPaywalls}
              search={search}
              setSearch={setSearch}
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              placementFilter={placementFilter}
              setPlacementFilter={setPlacementFilter}
              placementDraft={placementDraft}
              setPlacementDraft={setPlacementDraft}
              placementMenuOpen={placementMenuOpen}
              setPlacementMenuOpen={setPlacementMenuOpen}
              rowMenuId={rowMenuId}
              setRowMenuId={setRowMenuId}
              openPaywall={openPaywall}
              setView={setView}
              setModal={setModal}
              duplicate={duplicate}
              locale={locale}
            />
          )}
          {view === "create" && (
            <CreatePaywall
              draft={draft}
              setDraft={setDraft}
              setView={setView}
              setModal={setModal}
              createDraft={createDraft}
              markUnknown={markUnknown}
            />
          )}
          {view === "general" && (
            <PaywallWorkspace
              selected={selected}
              draft={draft}
              setDraft={setDraft}
              view={view}
              setView={setView}
              duplicate={duplicate}
              setModal={setModal}
              markUnknown={markUnknown}
              builderNodes={builderNodes}
              setBuilderNodes={setBuilderNodes}
              updateBuilderNode={updateBuilderNode}
              removeBuilderNode={removeBuilderNode}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              builderTab={builderTab}
              setBuilderTab={setBuilderTab}
              templateSelected={templateSelected}
              setTemplateSelected={setTemplateSelected}
              appliedTemplate={appliedTemplate}
              templateLinks={templateLinks}
              setTemplateLinks={setTemplateLinks}
              notify={notify}
            />
          )}
          {view === "builder" && (
            <PaywallWorkspace
              selected={selected}
              draft={draft}
              setDraft={setDraft}
              view={view}
              setView={setView}
              duplicate={duplicate}
              setModal={setModal}
              markUnknown={markUnknown}
              builderNodes={builderNodes}
              setBuilderNodes={setBuilderNodes}
              updateBuilderNode={updateBuilderNode}
              removeBuilderNode={removeBuilderNode}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              builderTab={builderTab}
              setBuilderTab={setBuilderTab}
              templateSelected={templateSelected}
              setTemplateSelected={setTemplateSelected}
              appliedTemplate={appliedTemplate}
              templateLinks={templateLinks}
              setTemplateLinks={setTemplateLinks}
              notify={notify}
            />
          )}
          {view === "metrics" && <Metrics setView={setView} markUnknown={markUnknown} />}
        </div>
      </main>

      <aside className={`evidence-panel ${unknownOpen ? "open" : ""}`}>
        <button className="evidence-head" onClick={() => setUnknownOpen((open) => !open)}>
          <span><CircleHelp size={17} /> Evidence & gaps</span>
          <ChevronRight size={16} />
        </button>
        {unknownOpen && (
          <div className="evidence-body">
            <p>Only observed behavior is reproduced. These routes are deliberately not invented.</p>
            {missingItems.map((item) => (
              <button className="gap-card" key={item.id} onClick={() => markUnknown(item)}>
                <small>{item.id}</small>
                <strong>{item.feature}</strong>
                <span>{item.unknown}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
      {modal?.kind === "compliance" && (
        <ComplianceModal
          compliance={compliance}
          setCompliance={setCompliance}
          rememberCompliance={rememberCompliance}
          setRememberCompliance={setRememberCompliance}
          onClose={() => setModal(null)}
          onAccept={createDraft}
        />
      )}
      {modal?.kind === "builder-save" && (
        <ComplianceModal
          compliance={compliance}
          setCompliance={setCompliance}
          rememberCompliance={rememberCompliance}
          setRememberCompliance={setRememberCompliance}
          onClose={() => setModal(null)}
          onAccept={() => { setModal(null); setCompliance(false); notify("Builder changes saved locally after the observed confirmation."); }}
          context="builder"
        />
      )}
      {modal?.kind === "template-requirements" && (
        <TemplateRequirementsModal
          onClose={() => setModal(null)}
          onContinue={(links) => { setTemplateLinks(links); setModal({ kind: "builder-save" }); }}
        />
      )}
      {modal?.kind === "archive" && <ArchiveModal name={selected.name} onClose={() => setModal(null)} onArchive={archiveCurrent} />}
      {modal?.kind === "device-test" && <DeviceTestModal onClose={() => setModal(null)} />}
      {modal?.kind === "templates" && (
        <TemplatesModal
          selected={templateSelected}
          setSelected={setTemplateSelected}
          onClose={() => setModal(null)}
          onOpenAi={() => setModal({ kind: "ai" })}
          onOpenBuilder={(templateIndex) => { const template = templates[templateIndex]; applyTemplate(templateIndex); setModal(null); setView("builder"); notify(isEditableTemplate(template) ? (documentStyleTemplateIds.has(template.id) ? "已应用基于飞书 Paywall 规范的可编辑模板。" : "已应用基于源端核心结构的可编辑复现。") : "已应用源端预览内容；精确节点树仍在采集。"); }}
          markUnknown={markUnknown}
        />
      )}
      {modal?.kind === "ai" && <AiModal onClose={() => setModal(null)} markUnknown={markUnknown} />}
      {modal?.kind === "migration" && (
        <MigrationModal
          onClose={() => setModal(null)}
          markUnknown={markUnknown}
        />
      )}
      {modal?.kind === "add-app" && <AddAppModal onClose={() => setModal(null)} markUnknown={markUnknown} />}
      {modal?.kind === "unknown" && <UnknownModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  );
}

function PaywallList({
  paywalls,
  search,
  setSearch,
  stateFilter,
  setStateFilter,
  placementFilter,
  setPlacementFilter,
  placementDraft,
  setPlacementDraft,
  placementMenuOpen,
  setPlacementMenuOpen,
  rowMenuId,
  setRowMenuId,
  openPaywall,
  setView,
  setModal,
  duplicate,
  locale,
}) {
  const placementName = placementFilter.length ? placementFilter.join(", ") : "All placements";
  const paginationText = locale === "zh-CN" ? `第 1 - ${paywalls.length} 项，共 ${paywalls.length} 项` : `1 - ${paywalls.length} of ${paywalls.length}`;
  const togglePlacement = (placement) => setPlacementDraft((current) => current.includes(placement) ? current.filter((item) => item !== placement) : [...current, placement]);
  const applyPlacementFilter = () => {
    setPlacementFilter(placementDraft);
    setPlacementMenuOpen(false);
  };

  return (
    <section>
      <div className="page-heading">
        <div><h1>Paywalls <span>↗</span></h1><p>Read the docs</p></div>
        <button className="primary" onClick={() => setView("create")}>Create paywall</button>
      </div>
      <div className="list-controls">
        <label className="search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by paywall name" /></label>
        <div className="placement-filter">
          <button className="select" onClick={() => { setPlacementDraft(placementFilter); setPlacementMenuOpen((open) => !open); }}>{placementName} <ChevronDown size={17} /></button>
          {placementMenuOpen && (
            <div className="placement-menu">
              <label><input type="checkbox" checked={placementDraft.includes("test placement1")} onChange={() => togglePlacement("test placement1")} /> test placement1</label>
              <div><button className="secondary" onClick={() => setPlacementMenuOpen(false)}>Cancel</button><button className="primary" onClick={applyPlacementFilter}>Apply</button></div>
            </div>
          )}
        </div>
        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
          <option value="Live,Draft,Inactive">States (3)</option>
          <option value="Live">Live</option>
          <option value="Draft">Draft</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th><span aria-hidden="true">⌄</span> <span>Paywall name</span> <Sort /></th><th><Help /> Revenue</th><th><Help /> Proceeds</th><th><Help /> Net proceeds</th><th><Help /> Purchases</th><th><Help /> Trials</th><th><Help /> Refunds</th><th><Help /> Products</th><th>Started at <Sort /></th><th>State <Sort /></th><th /></tr></thead>
          <tbody>
            {paywalls.map((item) => (
              <tr key={item.id} onClick={() => openPaywall(item)}>
                <td><ChevronDown size={16} /> <strong>{item.name}</strong> {item.icon && <ImageIcon size={16} color="#71717a" />}</td>
                <td>$0</td><td>$0</td><td>$0</td><td>0</td><td>0</td><td>0</td><td>{item.products}</td><td>{item.startedAt}</td>
                <td><StateBadge state={item.state} /></td>
                <td className="row-actions">
                  <button className="icon tiny" aria-label={`Actions for ${item.name}`} onClick={(event) => { event.stopPropagation(); setRowMenuId((current) => current === item.id ? null : item.id); }}><MoreVertical size={19} /></button>
                  {rowMenuId === item.id && (
                    <div className="row-menu">
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); setView("metrics"); }}>Metrics</button>
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); }}>Edit</button>
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); duplicate(item); }}>Duplicate</button>
                      <button className="danger-menu" onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); setModal({ kind: "archive" }); }}>Archive</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{paginationText}</span><div><button disabled><ChevronLeft size={18} /></button><button className="current">1</button><button disabled><ChevronRight size={18} /></button></div></div>
    </section>
  );
}

function CreatePaywall({ draft, setDraft, setView, setModal, createDraft, markUnknown }) {
  return (
    <section className="create">
      <button className="back" onClick={() => setView("list")}><ArrowLeft size={18} /> Paywalls</button>
      <div className="create-header"><div><h1>Create paywall</h1><p>Create a draft and configure it with products and a no-code builder.</p></div><button className="primary" onClick={() => setModal({ kind: "compliance" })}>Create as draft</button></div>
      <div className="create-grid">
        <div className="form-card">
          <h2>General</h2>
          <Field label="Paywall name"><input value={draft.name} onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))} /></Field>
          <Field label="Products">
            {draft.products.map((product, index) => (
              <ProductRow
                key={`${product}-${index}`}
                product={product}
                index={index}
                onProductChange={(nextProduct) => setDraft((state) => ({ ...state, products: state.products.map((current, currentIndex) => currentIndex === index ? nextProduct : current) }))}
                onRemove={() => setDraft((state) => ({ ...state, products: state.products.filter((_, currentIndex) => currentIndex !== index) }))}
                markUnknown={markUnknown}
              />
            ))}
            <button className="secondary" onClick={() => setDraft((state) => ({ ...state, products: [...state.products, productOptions[0]] }))}><Plus size={16} /> Add product</button>
          </Field>
          <Field label="Paywall screenshot"><button className="upload unknown-action" onClick={() => markUnknown({ id: "U-01", feature: "Screenshot upload", known: "PNG / WEBP / JPG, maximum 10 MB and recommended 320x568 were observed.", unknown: "This reconstruction intentionally does not simulate file validation or the exact backend upload response." })}><Upload size={18} /> Upload screenshot <small>PNG, WEBP or JPG up to 10 MB</small></button></Field>
        </div>
        <div className="start-card">
          <span className="eyebrow">Builder & Generator</span><h2>Choose how to start</h2>
          <button onClick={() => setView("builder")}><Blocks size={22} /><span><strong>Build no-code paywall</strong><small>Start with the visual Builder.</small></span><ChevronRight size={18} /></button>
          <button onClick={() => setModal({ kind: "templates" })}><LayoutTemplate size={22} /><span><strong>Choose a template</strong><small>Observed template library and filters.</small></span><ChevronRight size={18} /></button>
          <button onClick={() => setModal({ kind: "ai" })}><WandSparkles size={22} /><span><strong>Generate Paywall with AI</strong><small>Entry is known; generation output is not.</small></span><ChevronRight size={18} /></button>
          <button onClick={() => setModal({ kind: "migration" })}><Copy size={22} /><span><strong>Copy a Design from Your Apps</strong><small>Visual Builder configuration only.</small></span><ChevronRight size={18} /></button>
        </div>
      </div>
      <button className="subtle-action" onClick={createDraft}>Development shortcut: create a local draft after confirmation</button>
    </section>
  );
}

function PaywallWorkspace({ selected, draft, setDraft, view, setView, duplicate, setModal, markUnknown, builderNodes, setBuilderNodes, updateBuilderNode, removeBuilderNode, activeNode, setActiveNode, builderTab, setBuilderTab, appliedTemplate, templateLinks, setTemplateLinks, notify }) {
  const [addElementOpen, setAddElementOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [transientProducts, setTransientProducts] = useState([]);
  const [previewMode, setPreviewMode] = useState("source");
  const [dragState, setDragState] = useState(null);
  useEffect(() => setPreviewMode(appliedTemplate !== null && templates[appliedTemplate]?.documentTemplate ? "editable" : "source"), [appliedTemplate]);
  if (view === "builder") {
    const active = builderNodes.find((node) => node.id === activeNode);
    const builderBoundary = missingItems.find((item) => item.id === "B-01");
    const isDocumentTemplate = appliedTemplate !== null && Boolean(templates[appliedTemplate]?.documentTemplate);
    const addElement = (type) => {
      if (isDocumentTemplate) {
        markUnknown(builderBoundary);
        return;
      }
      const next = createComponentNode(type, builderNodes.filter((node) => node.id.startsWith("added-")).length + 1);
      setBuilderNodes((current) => [...current, next]);
      setActiveNode(next.id);
      setBuilderTab("tree");
      setAddElementOpen(false);
      notify(`${type} 已添加到构建器，并可在右侧继续编辑。`);
    };
    const addNestedElement = (parentId, type) => {
      if (isDocumentTemplate) {
        markUnknown(builderBoundary);
        return;
      }
      const nextId = `added-${type.toLowerCase().replace(/[^a-z]+/g, "-")}-${builderNodes.filter((node) => node.id.startsWith("added-")).length + 1}`;
      setBuilderNodes((current) => {
        const parentIndex = current.findIndex((node) => node.id === parentId);
        if (parentIndex < 0) return current;
        const parent = current[parentIndex];
        const next = { ...createComponentNode(type, current.filter((node) => node.id.startsWith("added-")).length + 1), depth: (parent.depth ?? 0) + 1, parentId };
        let insertAt = parentIndex + 1;
        while (insertAt < current.length && (current[insertAt].depth ?? 0) > (parent.depth ?? 0)) insertAt += 1;
        return [...current.slice(0, insertAt), next, ...current.slice(insertAt)];
      });
      setActiveNode(nextId);
      setBuilderTab("tree");
      const parent = builderNodes.find((node) => node.id === parentId);
      notify(`${type} 已作为 ${parent?.type ?? "容器"} 子元素添加。`);
    };
    const getNodeDropTarget = (clientX, clientY, sourceId) => {
      const target = document.elementFromPoint(clientX, clientY)?.closest("[data-node-id]");
      const targetId = target?.dataset.nodeId;
      if (!targetId || !canMoveBuilderNode(builderNodes, sourceId, targetId)) return null;
      const { top, height } = target.getBoundingClientRect();
      return { targetId, position: clientY < top + height / 2 ? "before" : "after" };
    };
    const beginNodeDrag = (event, id) => {
      if (event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragState({ id, targetId: null, position: null });
      setActiveNode(id);
      setBuilderTab("tree");
      if (appliedTemplate !== null && isEditableTemplate(templates[appliedTemplate])) setPreviewMode("editable");
    };
    const updateNodeDropTarget = (event) => {
      const sourceId = dragState?.id;
      if (!sourceId) return;
      const nextTarget = getNodeDropTarget(event.clientX, event.clientY, sourceId);
      if (!nextTarget) return;
      event.preventDefault();
      setDragState({ id: sourceId, ...nextTarget });
    };
    const dropNode = (event) => {
      const sourceId = dragState?.id;
      const nextTarget = sourceId ? getNodeDropTarget(event.clientX, event.clientY, sourceId) : null;
      if (sourceId && nextTarget) {
        setBuilderNodes((current) => moveBuilderNode(current, sourceId, nextTarget.targetId, nextTarget.position));
        setActiveNode(sourceId);
      }
      setDragState(null);
    };
    return (
      <section className="builder-page">
        <WorkspaceHeader selected={selected} setView={setView} duplicate={duplicate} setModal={setModal} markUnknown={markUnknown} />
        <div className="detail-tabs"><button onClick={() => setView("general")}>General</button><button className="active">Builder & Generator</button></div>
        {appliedTemplate !== null && <div className={`template-context ${isEditableTemplate(templates[appliedTemplate]) ? "observed-tree" : "preview-only"}`}><span>Template</span><strong>{templates[appliedTemplate].title}</strong><small>{isEditableTemplate(templates[appliedTemplate]) ? templateEditableStatus(templates[appliedTemplate]) : "源端已采集预览内容；精确节点树待采集"}</small><button className="secondary" onClick={() => setModal({ kind: "templates" })}><LayoutTemplate size={15} /> Change template</button></div>}
        <div className="builder">
          <aside className="node-panel">
            <label className="device-toggle unknown-action"><input type="checkbox" defaultChecked onChange={() => markUnknown(builderBoundary)} /> <span>On</span> Show on device</label>
            <div className="panel-tabs"><button className={builderTab === "settings" ? "active" : ""} onClick={() => setBuilderTab("settings")}>Layout settings</button><button className={builderTab === "tree" ? "active" : ""} onClick={() => setBuilderTab("tree")}>Elements</button></div>
            <div className="add-element-wrap"><button className={`add-element ${isDocumentTemplate ? "unknown-action" : ""}`} onClick={() => isDocumentTemplate ? markUnknown(builderBoundary) : setAddElementOpen((open) => !open)}><Plus size={17} /> Add element</button>{addElementOpen && !isDocumentTemplate && <div className="add-element-menu">{componentCatalog.map((item) => <button key={item} onClick={() => addElement(item)}>{item}</button>)}</div>}</div>
            <div className="node-list">{builderNodes.map((node) => {
              const isDragging = dragState?.id === node.id;
              const dropClass = dragState?.targetId === node.id ? `drop-${dragState.position}` : "";
              return <button type="button" data-node-id={node.id} style={{ paddingLeft: `${7 + (node.depth ?? 0) * 15}px` }} className={`node ${activeNode === node.id ? "selected" : ""} ${isDragging ? "dragging" : ""} ${dropClass}`} onPointerDown={(event) => beginNodeDrag(event, node.id)} onPointerMove={updateNodeDropTarget} onPointerUp={dropNode} onPointerCancel={() => setDragState(null)} onClick={() => { setBuilderTab("tree"); setActiveNode(node.id); }} key={node.id} aria-grabbed={isDragging}><span className="drag-handle" aria-hidden="true"><GripVertical size={14} /></span><i><BuilderNodeIcon type={node.type} /></i><strong>{node.config?.retention ? "挽留弹窗" : node.type}</strong><small>{node.config?.retention ? "" : node.label}</small></button>;
            })}</div>
            <div className="builder-locales"><div><strong>Localization</strong><button className="icon tiny unknown-action" onClick={() => markUnknown(builderBoundary)}><Plus size={15} /></button></div><button className="locale-row">English <i /></button><button className="locale-row selected">French <i /></button><button className="locale-row">Simplified Chinese <i /></button><button className="add-locale unknown-action" onClick={() => markUnknown(builderBoundary)}>Add locale</button></div>
          </aside>
          <div className="canvas-area"><div className="device-controls"><button className="unknown-action" onClick={() => markUnknown(builderBoundary)}><Smartphone size={16} /> iPhone 15 Pro <ChevronDown size={14} /></button>{appliedTemplate !== null && <div className="preview-mode" aria-label="Preview mode"><button className={previewMode === "source" ? "active" : ""} onClick={() => setPreviewMode("source")}>{templates[appliedTemplate].documentTemplate ? "文档样式" : "Source visual"}</button><button className={previewMode === "editable" ? "active" : ""} disabled={!isEditableTemplate(templates[appliedTemplate])} onClick={() => setPreviewMode("editable")}>Editable structure</button></div>}<button className="icon unknown-action" title="Preview orientation" onClick={() => markUnknown(builderBoundary)}><RotateCw size={15} /></button><button className="icon unknown-action" title="Preview visibility" onClick={() => markUnknown(builderBoundary)}><Eye size={15} /></button></div><PaywallPreview nodes={builderNodes} template={appliedTemplate !== null ? templates[appliedTemplate] : null} mode={previewMode} activeNode={activeNode} onSelect={(id) => { setActiveNode(id); setBuilderTab("tree"); }} />{appliedTemplate !== null && previewMode === "source" && <p className="source-preview-note">{templates[appliedTemplate].documentTemplate ? "飞书文档中的 Paywall 样式参考，与模板库卡片一一对应。" : "源端模板画面，与模板库卡片一一对应。"}</p>}{appliedTemplate !== null && previewMode === "editable" && <p className="source-preview-note">{isEditableTemplate(templates[appliedTemplate]) ? "已采集样式与核心字段的本地可编辑复现。" : "精确节点树仍在采集。"}</p>}<p className="preview-disclaimer">All prices, titles, and offers displayed are placeholders. The actual data from App Store and Google Play will be shown in the app.</p></div>
          <aside className="property-panel">{builderTab === "settings" ? <LayoutSettings markUnknown={markUnknown} boundary={builderBoundary} setModal={setModal} appliedTemplate={appliedTemplate} nodes={builderNodes} updateNode={updateBuilderNode} /> : <BuilderProperties active={active} setBuilderTab={setBuilderTab} markUnknown={markUnknown} boundary={builderBoundary} templateLinks={templateLinks} setTemplateLinks={setTemplateLinks} updateNode={updateBuilderNode} removeNode={removeBuilderNode} addNestedNode={addNestedElement} isDocumentTemplate={isDocumentTemplate} />}</aside>
        </div>
        <div className="builder-footer"><button className="secondary unknown-action" onClick={() => markUnknown(builderBoundary)}>Discard</button><button className="primary" onClick={() => setModal({ kind: appliedTemplate !== null ? "template-requirements" : "builder-save" })}>Save</button></div>
      </section>
    );
  }

  return (
    <section>
      <WorkspaceHeader selected={selected} setView={setView} duplicate={duplicate} setModal={setModal} markUnknown={markUnknown} />
      <div className="detail-tabs"><button className="active">General</button><button onClick={() => setView("builder")}>Builder & Generator</button></div>
      <div className="detail-layout">
        <div className="form-card detail-form"><h2>General</h2><Field label="Paywall name"><input defaultValue={selected.name} /></Field><Field label="Products">{observedProductRows.slice(0, selected.products).map((row, index) => <ProductRow key={row.product} product={`${row.product} / ${row.period}`} offer={row.offer} index={index} markUnknown={markUnknown} readOnly />)}{transientProducts.map((row) => <ProductRow key={row.product} product={`${row.product} / ${row.period}`} offer={row.offer} markUnknown={markUnknown} readOnly />)}{selected.state === "Draft" && <div className="product-add-wrap"><button className="secondary" onClick={() => setProductPickerOpen((open) => !open)}><Plus size={16} /> Add product</button>{productPickerOpen && <div className="product-add-menu"><button onClick={() => { setTransientProducts((items) => [...items, { product: "月度会员", period: "Monthly", offer: "springsale" }]); setProductPickerOpen(false); }}>月度会员</button><button onClick={() => { setTransientProducts((items) => [...items, { product: "Japanese ai", period: "3 months", offer: "No offers for this product" }]); setProductPickerOpen(false); }}>Japanese ai</button></div>}</div>}{selected.state === "Live" && <><button className="secondary" disabled><Plus size={16} /> Add product</button><p className="locked">Products are locked after the first transaction. Duplicate to change products.</p></>}</Field><Field label="Paywall screenshot"><button className="upload unknown-action" onClick={() => markUnknown({ id: "U-01", feature: "Screenshot upload", known: "PNG / WEBP / JPG, maximum 10 MB and recommended 320x568 were observed.", unknown: "This reconstruction intentionally does not simulate file validation or the exact backend upload response." })}><Upload size={18} /> Upload screenshot</button></Field></div>
        <aside className="detail-aside"><div><span className="eyebrow">State</span><StateBadge state={selected.state} /></div><div><span className="eyebrow">Products</span><strong>{selected.products}</strong></div><div><span className="eyebrow">Started at</span><strong>{selected.startedAt}</strong></div><button className="secondary full" onClick={() => setView("builder")}><Blocks size={16} /> Open Builder</button></aside>
      </div>
      <div className="builder-footer"><button className="secondary unknown-action" onClick={() => markUnknown(missingItems.find((item) => item.id === "M-01"))}>Discard</button>{selected.state === "Live" ? <button className="primary" onClick={() => setModal({ kind: "builder-save" })}>Save & publish</button> : <button className={transientProducts.length ? "primary unknown-action" : "primary"} onClick={() => transientProducts.length ? markUnknown({ id: "P-01", feature: "Draft product Save persistence", known: "当前页新增产品后可立即出现 Japanese ai / 3 months / No offers for this product。点击 Save 后仍为 Draft；本次账户试验重载后该新增项没有保留。", unknown: "保存未保留的服务端原因及可复现条件未实测。" }) : notify("Draft remains Draft; no publishing confirmation was observed.")}>Save</button>}</div>
    </section>
  );
}

function BuilderProperties({ active, setBuilderTab, markUnknown, boundary, templateLinks, setTemplateLinks, updateNode, removeNode, addNestedNode, isDocumentTemplate }) {
  const [tab, setTab] = useState("content");
  const type = active?.type ?? "Elements";
  const componentBoundary = {
    ...boundary,
    feature: `${type} detailed behavior`,
    known: `The visible ${type} inspector fields are reconstructed from the observed Builder panel.`,
    unknown: "Live preview propagation, validation, persistence, and any field not captured verbatim remain unverified.",
  };

  const tabBar = <div className="property-tabs"><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>Content</button><button className={tab === "style" ? "active" : ""} onClick={() => setTab("style")}>Style</button><button className={tab === "layout" ? "active" : ""} onClick={() => setTab("layout")}>Layout</button></div>;
  const nodeEditor = <EditableNodeControls active={active} updateNode={updateNode} removeNode={removeNode} canRemove={!isDocumentTemplate} />;

  if (type === "Links") {
    return <div className="property-scroll"><h3>Links</h3>{tabBar}{tab === "content" && <LinksContent active={active} updateNode={updateNode} templateLinks={templateLinks} setTemplateLinks={setTemplateLinks} />}{tab === "style" && <LinkStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (active?.id === "hero-image") {
    return <div className="property-scroll"><h3>Hero Image</h3>{!isDocumentTemplate && nodeEditor}{tabBar}{tab === "content" && <HeroMediaContent active={active} updateNode={updateNode} />}{tab === "style" && <HeroStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <HeroLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "List item" || type === "Today" || /^Item \d+$/.test(type) || /^Day \d+$/.test(type)) {
    return <div className="property-scroll"><h3>List item</h3>{nodeEditor}{tabBar}{tab === "content" && <ListItemContent active={active} updateNode={updateNode} />}{tab === "style" && <ListItemStyle />}{tab === "layout" && <ListItemLayout />}</div>;
  }

  if (["Text", "Header", "Headline", "Subhead", "Caption", "Legal", "Top Text"].includes(type) || /^(HEADER|Header|Caption|Title|Repeats|Subheader) \d+$/.test(type)) {
    return <div className="property-scroll"><h3>Text</h3>{!isDocumentTemplate && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <TextContent active={active} updateNode={updateNode} />}{tab === "style" && <TextStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (["Image", "Black Friday Image"].includes(type) || /^Image \d+$/.test(type)) {
    return <div className="property-scroll"><h3>Image</h3>{nodeEditor}{tabBar}{tab === "content" && <ImageContent active={active} updateNode={updateNode} />}{tab === "style" && <HeroStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} showHeight />}</div>;
  }

  if (["Button", "Purchase Button"].includes(type)) {
    return <div className="property-scroll"><h3>Button</h3>{!isDocumentTemplate && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <ButtonContent active={active} updateNode={updateNode} />}{tab === "style" && <ButtonStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Web Paywall Button") {
    return <div className="property-scroll"><h3>Web Paywall Button</h3>{!isDocumentTemplate && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <WebButtonContent active={active} updateNode={updateNode} />}{tab === "style" && <ButtonStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "List" || /^List \d+$/.test(type) || ["Feature list", "Features"].includes(type)) {
    return <div className="property-scroll"><h3>List</h3>{!isDocumentTemplate && nodeEditor}{tabBar}{tab === "content" && <ListContent active={active} updateNode={updateNode} addNestedNode={addNestedNode} allowAdd={!isDocumentTemplate} />}{tab === "style" && <ListStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Carousel") {
    return <div className="property-scroll"><h3>Carousel</h3>{tabBar}{tab === "content" && <CarouselContent active={active} updateNode={updateNode} addNestedNode={addNestedNode} allowAdd={!isDocumentTemplate} />}{tab === "style" && <CarouselStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Card") {
    if (active?.config?.retention) return <div className="property-scroll"><h3>挽留弹窗</h3>{tabBar}{tab === "content" && <RetentionContent active={active} updateNode={updateNode} />}{tab === "style" && <RetentionStyle active={active} updateNode={updateNode} />}{tab === "layout" && <p className="property-copy">弹窗尺寸和各区域高度按 HT 基准图固定，内容变化不撑开页面。</p>}</div>;
    return <div className="property-scroll"><h3>Card</h3>{tabBar}{tab === "content" && <CardContent active={active} addNestedNode={addNestedNode} allowAdd={!isDocumentTemplate} />}{tab === "style" && <CardStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Timer") {
    return <div className="property-scroll"><h3>Timer</h3>{tabBar}{tab === "content" && <TimerContent active={active} updateNode={updateNode} />}{tab === "style" && <TimerStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Products") {
    if (active.config?.bluePrivilege) return <div className="property-scroll"><h3>商品套餐</h3><ProductsStyleEditor active={active} updateNode={updateNode} /></div>;
    return <div className="property-scroll"><h3>Products</h3>{tabBar}{tab === "content" && <ProductsContent active={active} updateNode={updateNode} />}{tab === "style" && <ProductsStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Toggle") {
    return <div className="property-scroll"><h3>Toggle</h3><ToggleContent node={active} updateNode={updateNode} boundary={componentBoundary} markUnknown={markUnknown} /></div>;
  }

  if (["Toggle On", "Toggle Off"].includes(type)) {
    return <div className="property-scroll"><h3>{type}</h3><p className="property-copy">This is a source-observed toggle state layer.</p><InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="The state layer exists in the source tree. Its detailed fields have not been opened, so this demo does not invent them." /></div>;
  }

  if (type === "Source reference") {
    return <div className="property-scroll"><h3>Source reference</h3><p className="property-copy">This template has a captured source visual, but its exact Builder layer tree has not been verified. Editing is intentionally unavailable until the source structure is collected.</p><InspectorBoundary boundary={boundary} markUnknown={markUnknown} message="The matching source visual is shown in the device preview. No generic editable nodes are substituted for this template." /></div>;
  }

  return <div className="property-scroll"><h3>{type}</h3>{nodeEditor}{tabBar}<InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="This source-observed template layer can be edited as content. Its dedicated inspector fields were not captured, so the demo does not substitute a generic configuration panel." /></div>;
}

function EditableNodeControls({ active, updateNode, removeNode, canRemove = true }) {
  if (!active) return null;
  return <section className="node-editor"><Field label="Element content"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>{canRemove && <NodeDeleteControl active={active} removeNode={removeNode} />}</section>;
}

function NodeDeleteControl({ active, removeNode }) {
  return <button className="danger" onClick={() => removeNode(active.id)}>Delete element</button>;
}

function InspectorBoundary({ boundary, markUnknown, message = "The visible entry is retained, but the next detailed behavior has not been verified." }) {
  return <div className="unknown-rule"><CircleHelp size={17} /><span>{message}<button className="text-action unknown-action" onClick={() => markUnknown(boundary)}>View evidence</button></span></div>;
}

function updateNodeConfig(active, updateNode, patch) {
  updateNode(active.id, { config: { ...active.config, ...patch } });
}

function heroTitleParts(config) {
  const legacyTitle = config.copyTitle ?? "";
  const legacyPrefix = legacyTitle.startsWith("VIP") ? "VIP" : "";
  return {
    prefix: config.copyPrefix ?? legacyPrefix,
    suffix: config.copySuffix ?? (legacyPrefix ? legacyTitle.slice(3).trimStart() : legacyTitle),
  };
}

function MediaUploadFields({ active, updateNode, label = "Media file" }) {
  const inputRef = useRef(null);
  const config = active.config ?? {};
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeConfig(active, updateNode, { mediaState: "custom", mediaSrc: reader.result, mediaName: file.name, mediaType: file.type.startsWith("video/") ? "Video" : "Image" });
    reader.readAsDataURL(file);
  };
  return <><Field label={label}><input ref={inputRef} className="visually-hidden" type="file" accept="image/*,video/*" onChange={handleFile} /><button className="upload" type="button" onClick={() => inputRef.current?.click()}><Upload size={18} /> {config.mediaName ? `Replace ${config.mediaName}` : "Upload image or video"}<small>PNG, JPG, WebP, MP4, max size 10MB.</small></button></Field>{config.mediaState !== "removed" && <div className="media-actions"><span>{config.mediaName || "Source media"}</span><button type="button" className="secondary" onClick={() => updateNodeConfig(active, updateNode, { mediaState: "removed", mediaSrc: "", mediaName: "" })}>Remove media</button>{config.mediaState === "custom" && <button type="button" className="text-action" onClick={() => updateNodeConfig(active, updateNode, { mediaState: "source", mediaSrc: "", mediaName: "" })}>Restore source</button>}</div>}{config.mediaState === "removed" && <div className="media-actions"><span>No media</span><button type="button" className="text-action" onClick={() => updateNodeConfig(active, updateNode, { mediaState: "source", mediaSrc: "", mediaName: "" })}>Restore source</button></div>}</>;
}

function HeroMediaContent({ active, updateNode }) {
  const kind = active.config?.mediaType ?? "Image";
  const config = active.config ?? {};
  const hasEmbeddedCopy = config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined;
  const titleParts = heroTitleParts(config);
  return <><Field label="Media"><div className="segmented"><button className={kind === "Image" ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { mediaType: "Image" })}>Image</button><button className={kind === "Video" ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { mediaType: "Video" })}>Video</button></div></Field><MediaUploadFields active={active} updateNode={updateNode} label="Hero media" />{hasEmbeddedCopy && <section className="embedded-copy-editor"><h4>Top banner</h4><label className="switch-row"><input type="checkbox" checked={config.bannerEnabled !== false} onChange={(event) => updateNodeConfig(active, updateNode, { bannerEnabled: event.target.checked })} /><span>{config.bannerEnabled !== false ? "On" : "Off"}</span><strong>Show banner</strong></label><Field label="Banner deep link"><input value={config.deepLink ?? ""} placeholder="https://" onChange={(event) => updateNodeConfig(active, updateNode, { deepLink: event.target.value })} /></Field><h4>Copy embedded in this visual</h4><Field label="Title prefix"><input value={titleParts.prefix} onChange={(event) => updateNodeConfig(active, updateNode, { copyPrefix: event.target.value })} /></Field><Field label="Title suffix"><input value={titleParts.suffix} onChange={(event) => updateNodeConfig(active, updateNode, { copySuffix: event.target.value })} /></Field><Field label="Supporting copy"><input value={config.copyCaption ?? ""} onChange={(event) => updateNodeConfig(active, updateNode, { copyCaption: event.target.value })} /></Field><p className="property-copy">The headline and supporting copy are composited in the hero image layer, not independent text components. Show banner directly maps to its visibility in the preview.</p></section>}</>;
}

function TextContent({ active, updateNode }) {
  return <Field label="Text Required"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>;
}

function ImageContent({ active, updateNode }) {
  return <MediaUploadFields active={active} updateNode={updateNode} label="Image file" />;
}

function ConfigColorField({ label, active, updateNode, name, fallback }) {
  const value = active.config?.[name] ?? fallback;
  return <Field label={label}><div className="color-picker"><input type="color" value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /><input value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></div></Field>;
}

const validHexColor = (value) => /^#[\da-fA-F]{6}$/.test(value);
const productGradient = (colors, fallback) => `linear-gradient(90deg, ${(Array.isArray(colors) && colors.length === 3 ? colors : fallback).map((color, index) => validHexColor(color) ? color : fallback[index]).join(", ")})`;

function ProductColorInput({ value, onChange, label }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <span className="product-color-input"><input type="color" aria-label={`${label}色块`} value={validHexColor(value) ? value : "#000000"} onChange={(event) => { setDraft(event.target.value); onChange(event.target.value); }} /><input aria-label={label} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (validHexColor(draft)) onChange(draft); else setDraft(value); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></span>;
}

function ProductColorField({ label, active, updateNode, name, fallback, gradient = false }) {
  const value = active.config?.[name] ?? fallback;
  const colors = gradient ? (Array.isArray(value) && value.length === 3 ? value : fallback) : [value];
  return <div className="product-color-field"><strong>{label}</strong><div className={gradient ? "product-color-stops" : "product-color-single"}>{colors.map((color, index) => <ProductColorInput key={`${name}-${index}`} label={gradient ? `${label} 第${index + 1}段` : label} value={color} onChange={(next) => updateNodeConfig(active, updateNode, { [name]: gradient ? colors.map((item, position) => position === index ? next : item) : next })} />)}</div></div>;
}

function ConfigNumberField({ label, active, updateNode, name, fallback, min = 0, max = 100, step = 1, suffix = "" }) {
  const value = active.config?.[name] ?? fallback;
  const commit = (valueToCommit) => {
    if (valueToCommit === "") return updateNodeConfig(active, updateNode, { [name]: fallback });
    const parsed = Number(valueToCommit);
    updateNodeConfig(active, updateNode, { [name]: Number.isFinite(parsed) ? parsed : fallback });
  };
  return <Field label={label}><div className="number-unit"><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} onBlur={(event) => commit(event.target.value)} /><span>{suffix}</span></div></Field>;
}

function ConfigInsets({ active, updateNode, prefix = "margin" }) {
  const config = active.config ?? {};
  const keys = [["Top", "上"], ["Right", "右"], ["Bottom", "下"], ["Left", "左"]];
  return <div className="four-inputs">{keys.map(([label, key]) => {
    const name = `${prefix}${label}`;
    return <label key={name} className="inset-input"><span>{key}</span><input type="number" min={prefix === "padding" ? 0 : -80} aria-label={`${key}${prefix === "padding" ? "图片边距" : "外边距"}`} value={config[name] ?? 0} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></label>;
  })}</div>;
}

function TextStyleEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="fontSize" fallback={28} min={10} max={56} suffix="px" /><Field label="Align"><select value={config.textAlign ?? "center"} onChange={(event) => updateNodeConfig(active, updateNode, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></div><div className="split-fields"><Field label="Weight"><select value={config.fontWeight ?? "700"} onChange={(event) => updateNodeConfig(active, updateNode, { fontWeight: event.target.value })}><option value="400">Regular</option><option value="500">Medium</option><option value="700">Bold</option><option value="900">Heavy</option></select></Field><Field label="Font"><select value={config.fontFamily ?? "system"} onChange={(event) => updateNodeConfig(active, updateNode, { fontFamily: event.target.value })}><option value="system">System</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></Field></div><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="color" fallback="#171717" /><div className="split-fields"><ConfigNumberField label="Opacity" active={active} updateNode={updateNode} name="opacity" fallback={100} min={0} max={100} suffix="%" /><ConfigNumberField label="Max lines" active={active} updateNode={updateNode} name="maxLines" fallback={2} min={1} max={8} suffix="" /></div><label className="switch-row compact-switch"><input type="checkbox" checked={config.scaleText === true} onChange={(event) => updateNodeConfig(active, updateNode, { scaleText: event.target.checked })} /><span>{config.scaleText ? "On" : "Off"}</span><strong>Scale text</strong></label></>;
}

function HeroStyleEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><h4>Visual media</h4><Field label="Image fit"><div className="segmented">{[["cover", "Cover"], ["contain", "Contain"]].map(([value, label]) => <button key={value} className={(config.mediaFit ?? "cover") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { mediaFit: value })}>{label}</button>)}</div></Field><ConfigColorField label="Background color" active={active} updateNode={updateNode} name="mediaBackgroundColor" fallback="#ffffff" />{(config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined) && <section className="embedded-copy-editor"><h4>Embedded headline</h4><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="copyTitleSize" fallback={30} min={8} max={96} suffix="px" /><ConfigColorField label="Title prefix color" active={active} updateNode={updateNode} name="copyPrefixColor" fallback="#ffffff" /><ConfigColorField label="Title suffix color" active={active} updateNode={updateNode} name="copyTitleColor" fallback="#ffc524" /></div><h4>Embedded supporting copy</h4><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="copyCaptionSize" fallback={16} min={8} max={64} suffix="px" /><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="copyCaptionColor" fallback="#ffffff" /></div></section>}</>;
}

function ElementLayoutEditor({ active, updateNode, showHeight = false }) {
  return <><Field label="Margin"><ConfigInsets active={active} updateNode={updateNode} /></Field><ConfigNumberField label="Vertical offset" active={active} updateNode={updateNode} name="offsetY" fallback={0} min={-120} max={120} suffix="px" />{showHeight && <ConfigNumberField label="Media height" active={active} updateNode={updateNode} name="mediaHeight" fallback={100} min={35} max={160} suffix="%" />}</>;
}

function HeroLayoutEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><h4>Visual media</h4><ConfigNumberField label="Image height" active={active} updateNode={updateNode} name="mediaHeight" fallback={100} min={1} max={200} suffix="%" /><label className="switch-row"><input type="checkbox" checked={config.rounded === true} onChange={(event) => updateNodeConfig(active, updateNode, { rounded: event.target.checked })} /><span>{config.rounded ? "On" : "Off"}</span><strong>Rounded rectangle</strong></label>{config.rounded && <ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={0} min={0} max={64} suffix="px" />}<Field label="图片四侧留白 (px)"><ConfigInsets active={active} updateNode={updateNode} prefix="padding" /></Field><ConfigNumberField label="Vertical offset" active={active} updateNode={updateNode} name="offsetY" fallback={0} min={-120} max={120} suffix="px" />{(config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined) && <section className="embedded-copy-editor"><h4>Embedded copy layout</h4><div className="split-fields"><ConfigNumberField label="Left offset" active={active} updateNode={updateNode} name="copyLeft" fallback={12} min={-20} max={100} suffix="%" /><ConfigNumberField label="Bottom offset" active={active} updateNode={updateNode} name="copyBottom" fallback={15} min={-20} max={100} suffix="%" /></div><Field label="Align"><select value={config.copyAlign ?? "left"} onChange={(event) => updateNodeConfig(active, updateNode, { copyAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></section>}</>;
}

function ButtonStyleEditor({ active, updateNode }) {
  return <><div className="split-fields"><ConfigColorField label="Fill color" active={active} updateNode={updateNode} name="backgroundColor" fallback="#6b2df3" /><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="color" fallback="#ffffff" /></div><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={24} min={0} max={48} suffix="px" /></>;
}

function LinkStyleEditor({ active, updateNode }) {
  return <><div className="split-fields"><ConfigColorField label="Link color" active={active} updateNode={updateNode} name="color" fallback="#8b8b8b" /><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="fontSize" fallback={11} min={8} max={20} suffix="px" /></div><Field label="Align"><select value={active.config?.textAlign ?? "left"} onChange={(event) => updateNodeConfig(active, updateNode, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></>;
}

function ListStyleEditor({ active, updateNode }) {
  if (active.config?.bluePrivilege) return <><ConfigColorField label="List background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f5f5f5" /><div className="split-fields"><ConfigColorField label="Header background" active={active} updateNode={updateNode} name="headerBackground" fallback="#f1f1f1" /><ConfigColorField label="VIP column background" active={active} updateNode={updateNode} name="vipColumnBackground" fallback="#ffffff" /></div><div className="split-fields"><ConfigColorField label="Non-member text" active={active} updateNode={updateNode} name="secondaryColor" fallback="#bdbdbd" /><ConfigColorField label="VIP text" active={active} updateNode={updateNode} name="accentColor" fallback="#ffb40d" /></div></>;
  return <><ConfigColorField label="Background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f5f5f5" /><div className="split-fields"><ConfigColorField label="Standard color" active={active} updateNode={updateNode} name="secondaryColor" fallback="#bdbdbd" /><ConfigColorField label="VIP color" active={active} updateNode={updateNode} name="accentColor" fallback="#ffb40d" /></div></>;
}

function CardStyleEditor({ active, updateNode }) {
  return <><ConfigColorField label="Background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#ffffff" /><div className="split-fields"><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={22} min={0} max={48} suffix="px" /><ConfigNumberField label="Shadow" active={active} updateNode={updateNode} name="shadow" fallback={16} min={0} max={40} suffix="px" /></div></>;
}

function TimerStyleEditor({ active, updateNode }) {
  return <><div className="split-fields"><ConfigColorField label="Timer color" active={active} updateNode={updateNode} name="color" fallback="#19ad34" /><ConfigColorField label="Background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#ffd16b" /></div><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={6} min={0} max={24} suffix="px" /></>;
}

function CarouselStyleEditor({ active, updateNode }) {
  return <><div className="split-fields"><ConfigColorField label="Active dot" active={active} updateNode={updateNode} name="accentColor" fallback="#111111" /><ConfigColorField label="Inactive dot" active={active} updateNode={updateNode} name="secondaryColor" fallback="#dedede" /></div><ConfigNumberField label="Dot gap" active={active} updateNode={updateNode} name="gap" fallback={8} min={2} max={24} suffix="px" /></>;
}

function ProductsStyleEditor({ active, updateNode }) {
  if (active.config?.bluePrivilege) return <div className="product-color-settings">
    <ProductColorField label="商品标签颜色" active={active} updateNode={updateNode} name="badgeGradient" fallback={["#ff860a", "#ffb000", "#ffd10b"]} gradient />
    <ProductColorField label="商品选中框颜色" active={active} updateNode={updateNode} name="selectedBorderGradient" fallback={["#ff860a", "#ff860a", "#ff860a"]} gradient />
    <ProductColorField label="商品选中背景颜色" active={active} updateNode={updateNode} name="selectedBackground" fallback="#ffffff" />
    <ProductColorField label="商品SAVE文字颜色" active={active} updateNode={updateNode} name="saveTextColor" fallback="#ff8207" />
    <ProductColorField label="购买按钮文字颜色" active={active} updateNode={updateNode} name="purchaseTextGradient" fallback={["#ffffff", "#ffffff", "#ffffff"]} gradient />
    <ProductColorField label="购买按钮背景颜色" active={active} updateNode={updateNode} name="purchaseBackgroundGradient" fallback={["#ff8707", "#ffb000", "#ffd10b"]} gradient />
  </div>;
  return <><div className="split-fields"><ConfigColorField label="Selection color" active={active} updateNode={updateNode} name="accentColor" fallback="#ff860a" /><ConfigColorField label="Selected background" active={active} updateNode={updateNode} name="selectedBackground" fallback="#ffffff" /></div><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={18} min={0} max={32} suffix="px" /></>;
}

function ImageStyle() {
  return <Field label="Aspect"><div className="select-like">Fill <ChevronDown size={14} /></div></Field>;
}

function HeroMediaStyle() {
  const [mode, setMode] = useState("Overlay");
  return <><Field label="Display"><div className="segmented">{["Overlay", "Transparent", "Flat"].map((item) => <button className={mode === item ? "active" : ""} onClick={() => setMode(item)} key={item}>{item}</button>)}</div></Field><Field label="Tint"><ColorOpacity color="#212121" opacity="0" /></Field></>;
}

function HeroMediaLayout() {
  return <><Field label="Image height"><input placeholder="Not captured" /></Field><label className="switch-row"><input type="checkbox" /><span>Not captured</span><strong>Rounded rectangle</strong></label><Field label="Corner radius"><input placeholder="Not captured" /></Field><Field label="Padding"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field><div className="unknown-rule"><CircleHelp size={17} /><span>Hero Image 的这些字段入口已见，但本轮没有保留它们的源端默认值。</span></div></>;
}

function ImageLayout() {
  return <Field label="Image height"><input defaultValue="100" /></Field>;
}

function CardContent({ active, addNestedNode, allowAdd = true }) {
  const [open, setOpen] = useState(false);
  const allowed = ["List", "Button", "Image", "Text", "Timer"];
  return allowAdd ? <><h4>Card items</h4><div className="nested-add-wrap"><button className="text-action" onClick={() => setOpen((value) => !value)}><Plus size={15} /> Add element</button>{open && <div className="nested-add-menu">{allowed.map((type) => <button key={type} onClick={() => { addNestedNode(active.id, type); setOpen(false); }}>{type}</button>)}</div>}</div></> : <p className="property-copy">当前模板的卡片结构由已采集的固定画面组成；任意新增子元素尚未形成可回写的预览规则。</p>;
}

function TimerContent({ active, updateNode }) {
  const config = active.config ?? {};
  const updateConfig = (patch) => updateNode(active.id, { config: { ...config, ...patch } });
  return <><label className="switch-row"><input type="checkbox" checked={config.enabled !== false} onChange={(event) => updateConfig({ enabled: event.target.checked })} /><span>{config.enabled !== false ? "On" : "Off"}</span><strong>Show timer</strong></label><h4>Time format</h4><div className="split-fields"><Field label="Format"><select value={config.format ?? "hh:mm:ss"} onChange={(event) => updateConfig({ format: event.target.value })}><option value="hh:mm:ss">hh:mm:ss</option><option value="mm:ss">mm:ss</option></select></Field><Field label="Time separator"><select value={config.separator ?? ":"} onChange={(event) => updateConfig({ separator: event.target.value })}><option value=":">Colon</option><option value="·">Dot</option><option value=" ">Space</option></select></Field></div><h4>Timer text</h4><Field label="Start value"><input value={active.content ?? "04:59:59"} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><div className="split-fields"><Field label="Text before"><ConfigInput active={active} updateNode={updateNode} name="prefix" fallback="" placeholder="Enter text here" /></Field><Field label="Text after"><ConfigInput active={active} updateNode={updateNode} name="suffix" fallback="" placeholder="Enter text here" /></Field></div><h4>Timer mode</h4><Field label=""><select value={config.resetMode ?? "Reset timer on every paywall view"} onChange={(event) => updateConfig({ resetMode: event.target.value })}><option>Reset timer on every paywall view</option></select></Field></>;
}

function ToggleContent({ node, updateNode, boundary, markUnknown }) {
  const [title = "", secondary = ""] = (node.content ?? "").split("|");
  const defaultState = node.defaultState ?? "Off";
  const updateCopy = (nextTitle, nextSecondary) => updateNode(node.id, { content: `${nextTitle}|${nextSecondary}` });
  return <>
    <Field label="Default toggle state"><div className="segmented"><button className={defaultState === "Off" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "Off" })}>Off</button><button className={defaultState === "On" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "On" })}>On</button></div></Field>
    <Field label="Title text"><textarea value={title} onChange={(event) => updateCopy(event.target.value, secondary)} /></Field><Field label="Secondary text"><textarea value={secondary} onChange={(event) => updateCopy(title, event.target.value)} /></Field><InspectorBoundary boundary={boundary} markUnknown={markUnknown} message="开关的颜色、边框与布局字段尚未接入预览，不显示为可编辑字段。" />
  </>;
}

function TextStyle() {
  return <><Field label="Font"><div className="select-like">System (SF Pro, Roboto) Regular <ChevronDown size={14} /></div></Field><div className="split-fields"><Field label="Size"><input defaultValue="28" /></Field><Field label="Align"><div className="select-like">Center <ChevronDown size={14} /></div></Field></div><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field></>;
}

function TextLayout() {
  return <><Field label="Margin"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field></>;
}

function ButtonContent({ active, updateNode }) {
  return <><Field label="Text"><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><p className="property-copy">购买、关闭和自定义动作的执行结果尚未在当前模板预览中采集，因此不显示为可配置字段。</p></>;
}

function WebButtonContent({ active, updateNode }) {
  return <><Field label="Button text"><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><p className="property-copy">浏览器打开方式、Offer 与辅助文案的预览映射尚未采集，不显示为可编辑字段。</p></>;
}

function LinksContent({ active, updateNode, templateLinks, setTemplateLinks }) {
  return <><Field label="Visible link labels"><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><p className="property-copy">服务条款、隐私政策与恢复购买的跳转逻辑未在当前预览中执行；链接 URL 不显示为无反馈输入。</p></>;
}

function ListContent({ active, updateNode, addNestedNode, allowAdd = true }) {
  if (!allowAdd && active.id === "benefits") return <PrivilegeComparisonEditor active={active} updateNode={updateNode} />;
  return allowAdd ? <><h4>List items</h4><button className="text-action" onClick={() => addNestedNode(active.id, "List item")}><Plus size={15} /> Add element</button></> : <p className="property-copy">This fixed list has no captured item schema, so the demo does not replace it with a generic text field.</p>;
}

function PrivilegeComparisonEditor({ active, updateNode }) {
  const rows = privilegeRowsFor(active);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const draggedId = useRef(null);
  const commit = (nextRows) => updateNodeConfig(active, updateNode, { privilegeRows: nextRows });
  const patchRow = (id, patch) => commit(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const moveRow = (fromId, toId) => {
    const next = [...rows];
    const from = next.findIndex((row) => row.id === fromId);
    const to = next.findIndex((row) => row.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    commit(next);
  };
  const openEditor = (row) => { setEditingId(row.id); setDraft(JSON.parse(JSON.stringify(row.detail))); };
  const closeEditor = () => { setEditingId(null); setDraft(null); };
  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const upload = (file, callback) => { if (!file) return; const reader = new FileReader(); reader.onload = () => callback(String(reader.result)); reader.readAsDataURL(file); };
  const setImage = (index, patch) => patchDraft({ images: draft.images.map((image, position) => position === index ? { ...image, ...patch } : image) });
  const valueEditor = (row, field, label) => {
    const mode = row[field + "Mode"] ?? (row[field] === "受限" || row[field] === "✓" ? "icon" : "text");
    const icon = row[field + "Icon"] ?? (field === "standard" ? "lock" : "check");
    return <label className="privilege-value-field"><span>{label}</span><select aria-label={label + "显示方式 " + row.name} value={mode} onChange={(event) => patchRow(row.id, { [field + "Mode"]: event.target.value })}><option value="text">文字</option><option value="icon">图标</option></select>{mode === "icon" ? <select aria-label={label + "图标 " + row.name} value={icon} onChange={(event) => patchRow(row.id, { [field + "Icon"]: event.target.value })}><option value="lock">锁定</option><option value="check">勾选</option></select> : <input aria-label={label + "文字 " + row.name} value={row[field]} onChange={(event) => patchRow(row.id, { [field]: event.target.value })} />}</label>;
  };
  return <section className="privilege-editor">
    <div className="privilege-editor-heading"><h4>特权行</h4><button type="button" className="text-action" onClick={() => commit([...rows, { id: "privilege-" + Date.now(), name: "新特权", type: "", standard: "", vip: "", standardMode: "text", vipMode: "text", pageId: "", detail: { positions: ["蓝色特权页"], title: "", iconSrc: "", images: [{ locale: "Chinese", src: "" }], titleColor: "#F6C85F", copyKey: "", descriptionColor: "#FFF8E7", descriptionKey: "" } }])}><Plus size={15} /> 添加特权</button></div>
    <Field label="显示行数"><input type="number" min="1" max={rows.length} value={active.config?.maxVisibleRows ?? 5} onChange={(event) => updateNodeConfig(active, updateNode, { maxVisibleRows: Math.max(1, Math.min(rows.length, Number(event.target.value) || 1)) })} /></Field>
    {rows.map((row, index) => <div className="privilege-row-wrap" key={row.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveRow(draggedId.current, row.id); draggedId.current = null; }}>
      <div className="privilege-row"><button type="button" className="privilege-drag" aria-label={"拖动排序 " + row.name} title="拖动排序" draggable onDragStart={(event) => { draggedId.current = row.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", row.id); }} onDragEnd={() => { draggedId.current = null; }}><GripVertical size={16} /></button><input aria-label={"特权 " + (index + 1)} value={row.name} onChange={(event) => patchRow(row.id, { name: event.target.value })} /><button type="button" className="row-remove" aria-label={"删除特权 " + row.name} onClick={() => commit(rows.filter((item) => item.id !== row.id))}><X size={14} /></button></div>
      <div className="privilege-values">{valueEditor(row, "standard", "非会员")}{valueEditor(row, "vip", "VIP")}</div>
      <div className="privilege-row-management"><label>特权页管理<select aria-label={"特权页管理 " + row.name} value={row.pageId ?? ""} onChange={(event) => patchRow(row.id, { pageId: event.target.value })}><option value="">未绑定</option><option value="detail">当前特权详情页</option></select></label><button type="button" aria-label={"编辑特权 " + row.name} title="编辑特权" onClick={() => openEditor(row)}><Pencil size={15} /></button></div>
    </div>)}
    {editingId && draft && <div className="ht-admin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><div className="ht-admin-dialog" role="dialog" aria-modal="true" aria-label="编辑特权配置" data-no-translate>
      <header className="ht-admin-header"><h2>编辑</h2><button type="button" aria-label="关闭" onClick={closeEditor}><X size={22} /></button></header>
      <div className="ht-admin-scroll"><div className="ht-admin-form">
        <div className="ht-admin-line"><label className="ht-admin-label required">paywall位置</label><div className="ht-admin-positions">{["会员套餐页", "蓝色特权页", "VIP分级页面-VIP", "VIP分级页面-VIPPlus"].map((position) => <label key={position}><input type="checkbox" checked={(draft.positions ?? []).includes(position)} onChange={(event) => patchDraft({ positions: event.target.checked ? [...(draft.positions ?? []), position] : (draft.positions ?? []).filter((item) => item !== position) })} />{position}</label>)}</div></div>
        <div className="ht-admin-line title-line"><label className="ht-admin-label required" htmlFor="privilege-config-title">特权配置标题</label><div><div className="ht-admin-input-clear"><input id="privilege-config-title" value={draft.title ?? ""} onChange={(event) => patchDraft({ title: event.target.value })} /><button type="button" aria-label="清空特权配置标题" onClick={() => patchDraft({ title: "" })}><X size={14} /></button></div><p className="ht-admin-hint">*用于展示会员套餐页模板添加特权&顺序选择项</p></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required" htmlFor="privilege-config-type">特权类型</label><select id="privilege-config-type" value={draft.type ?? rows.find((row) => row.id === editingId)?.type ?? ""} disabled={Boolean(rows.find((row) => row.id === editingId)?.type)} onChange={(event) => patchDraft({ type: event.target.value })}><option value="">选择特权类型</option>{privilegeNames.map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className="ht-admin-line icon-line"><label className="ht-admin-label">特权图标</label><div><div className="ht-admin-upload"><input aria-label="特权图标地址" value={draft.iconSrc ?? ""} onChange={(event) => patchDraft({ iconSrc: event.target.value })} /><label className="ht-admin-upload-button"><Upload size={17} />上传<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (src) => patchDraft({ iconSrc: src }))} /></label></div>{draft.iconSrc && <img className="ht-admin-icon-preview" src={draft.iconSrc} alt="特权图标预览" />}</div></div>
        <div className="ht-admin-line image-line"><label className="ht-admin-label required">Image</label><div>{(draft.images ?? []).map((image, index) => <div className={"ht-admin-image-row" + (!image.src ? " is-empty" : "")} key={index}><div className="ht-admin-image-controls"><select aria-label={"图片语言 " + (index + 1)} value={image.locale} onChange={(event) => setImage(index, { locale: event.target.value })}><option>English</option><option>Chinese</option><option>简体中文</option><option>Français</option></select><input aria-label={"图片地址 " + (index + 1)} value={image.src} onChange={(event) => setImage(index, { src: event.target.value })} /><label className="ht-admin-upload-button"><Upload size={17} />上传<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (src) => setImage(index, { src }))} /></label>{index > 0 && <button type="button" className="ht-admin-image-delete" aria-label={"删除图片语言 " + (index + 1)} onClick={() => patchDraft({ images: draft.images.filter((_, position) => position !== index) })}><X size={20} /></button>}</div>{image.src && <img className="ht-admin-image-preview" src={image.src} alt={image.locale + "预览"} />}</div>)}<div className="ht-admin-add-group"><button type="button" className="ht-admin-add" onClick={() => patchDraft({ images: [...(draft.images ?? []), { locale: "English", src: "" }] })}><Plus size={17} />追加</button><button type="button" className="ht-admin-add-more" aria-label="更多图片操作" onClick={() => setImageMenuOpen(!imageMenuOpen)}>···</button>{imageMenuOpen && <button type="button" className="ht-admin-add-popover" onClick={() => { patchDraft({ images: [...(draft.images ?? []), { ...(draft.images?.at(-1) ?? { locale: "English", src: "" }) }] }); setImageMenuOpen(false); }}>复制上一项</button>}</div><div className="ht-admin-size-note">旧UI尺寸：355px*260px<br />新UI尺寸：390px*260px</div></div></div>
        <div className="ht-admin-line color-line-admin"><label className="ht-admin-label required">特权文案色值</label><div className="ht-admin-color"><input aria-label="特权文案色值" value={draft.titleColor ?? "#F6C85F"} onChange={(event) => patchDraft({ titleColor: event.target.value })} /><input type="color" aria-label="选择特权文案颜色" value={draft.titleColor ?? "#F6C85F"} onChange={(event) => patchDraft({ titleColor: event.target.value })} /></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required">特权文案(占位符)</label><div className="ht-admin-key"><input aria-label="特权文案占位符" value={draft.copyKey ?? ""} onChange={(event) => patchDraft({ copyKey: event.target.value })} /><button type="button" aria-label="编辑特权文案" onClick={(event) => event.currentTarget.previousSibling.focus()}><Pencil size={18} /></button></div></div>
        <div className="ht-admin-line color-line-admin"><label className="ht-admin-label required">描述文案色值</label><div className="ht-admin-color"><input aria-label="描述文案色值" value={draft.descriptionColor ?? "#FFF8E7"} onChange={(event) => patchDraft({ descriptionColor: event.target.value })} /><input type="color" aria-label="选择描述文案颜色" value={draft.descriptionColor ?? "#FFF8E7"} onChange={(event) => patchDraft({ descriptionColor: event.target.value })} /></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required">描述文案(占位符)</label><div className="ht-admin-key"><input aria-label="描述文案占位符" value={draft.descriptionKey ?? ""} onChange={(event) => patchDraft({ descriptionKey: event.target.value })} /><button type="button" aria-label="编辑描述文案" onClick={(event) => event.currentTarget.previousSibling.focus()}><Pencil size={18} /></button></div></div>
      </div></div>
      <footer className="ht-admin-footer"><button type="button" onClick={closeEditor}>取消</button><button type="button" onClick={() => { patchRow(editingId, { detail: draft, type: draft.type ?? rows.find((row) => row.id === editingId)?.type }); closeEditor(); }}>确认</button></footer>
    </div></div>}
  </section>;
}

function ListItemContent({ active, updateNode }) {
  const [title = "", caption = ""] = (active.content ?? "").split("|");
  const updateCopy = (nextTitle, nextCaption) => updateNode(active.id, { content: `${nextTitle}|${nextCaption}` });
  return <><Field label="Title"><textarea value={title} onChange={(event) => updateCopy(event.target.value, caption)} /></Field><Field label="Caption"><textarea value={caption} onChange={(event) => updateCopy(title, event.target.value)} /></Field><p className="property-copy">自定义图标与连接线样式尚未接入预览，不显示为可编辑字段。</p></>;
}

function ListItemStyle() {
  return <><Field label="Title font"><div className="select-like">Nunito Extrabold <ChevronDown size={14} /></div></Field><Field label="Title size"><input defaultValue="17" /></Field><Field label="Caption font"><div className="select-like">Nunito Medium <ChevronDown size={14} /></div></Field><Field label="Caption size"><input defaultValue="15" /></Field><Field label="Icon placement"><div className="select-like">Left <ChevronDown size={14} /></div></Field></>;
}

function ListItemLayout() {
  return <><Field label="Margin"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field></>;
}

function ListStyle() {
  return <><Field label="Default icon"><div className="select-like">Default icon <ChevronDown size={14} /></div></Field><Field label="Icon placement"><div className="select-like">Left <ChevronDown size={14} /></div></Field><Field label="Icon color"><ColorOpacity color="#000000" opacity="100" /></Field><h4>Connector</h4><Field label="Thickness"><input defaultValue="0" /></Field><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field><Field label="Icon size"><input placeholder="Not captured" /></Field><h4>Title</h4><Field label="Font"><div className="select-like">Nunito Extrabold <ChevronDown size={14} /></div></Field><Field label="Size"><input defaultValue="17" /></Field><h4>Caption</h4><Field label="Font"><div className="select-like">Nunito Medium <ChevronDown size={14} /></div></Field><Field label="Size"><input defaultValue="15" /></Field></>;
}

function CarouselContent({ active, updateNode, addNestedNode, allowAdd = true }) {
  const config = active.config ?? {};
  const updateConfig = (patch) => updateNode(active.id, { config: { ...config, ...patch } });
  return <><h4>Carousel behavior</h4><div className="split-fields"><Field label="Number of slides"><input type="number" min="1" max="10" value={config.itemCount ?? active.content ?? 1} onChange={(event) => updateConfig({ itemCount: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })} /></Field><Field label="Initial slide"><input type="number" min="0" max={Math.max(0, (config.itemCount ?? active.content ?? 1) - 1)} value={config.initialSlide ?? 0} onChange={(event) => updateConfig({ initialSlide: Math.max(0, Number(event.target.value) || 0) })} /></Field></div>{allowAdd && <><h4>Carousel items</h4><button className="text-action" onClick={() => addNestedNode(active.id, "Card")}><Plus size={15} /> Add element</button></>}</>;
}

function ProductsContent({ active, updateNode }) {
  const config = active.config ?? {};
  const products = (active.content ?? "").split("\n").filter(Boolean);
  const updateConfig = (patch) => updateNode(active.id, { config: { ...config, ...patch } });
  return <><Field label="Products grouping"><div className="select-like muted-select">No switch (all products are visible) <ChevronDown size={14} /></div></Field><Field label="Default selected product"><select value={String(config.defaultSelected ?? 0)} onChange={(event) => updateConfig({ defaultSelected: Number(event.target.value) })}>{products.map((row, index) => <option key={row} value={index}>{row.split("|")[0]}</option>)}</select></Field><label className="switch-row"><input type="checkbox" checked={config.showOfferBadge !== false} onChange={(event) => updateConfig({ showOfferBadge: event.target.checked })} /><span>{config.showOfferBadge !== false ? "On" : "Off"}</span><strong>Show offer badge</strong></label><h4>Products</h4><Field label="Plans"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><p className="property-copy">One plan per line. Use “name|price|supporting copy” to map each visible plan.</p></>;
}

function RetentionImageField({ active, updateNode, name, label, fallback }) {
  const inputRef = useRef(null);
  const current = active.config?.[name] ?? fallback;
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeConfig(active, updateNode, { [name]: reader.result });
    reader.readAsDataURL(file);
  };
  return <Field label={label}><div className="retention-image-field"><input ref={inputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /><button type="button" className="secondary" onClick={() => inputRef.current?.click()}>{current ? "替换图片" : "上传图片"}</button>{current && <button type="button" className="secondary" onClick={() => updateNodeConfig(active, updateNode, { [name]: "" })}>移除</button>}{current && <img src={current} alt="当前素材" />}</div></Field>;
}

function RetentionContent({ active, updateNode }) {
  const config = active.config ?? {};
  const field = (name, label, fallback = "") => <Field label={label} key={name}><input value={config[name] ?? fallback} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></Field>;
  return <><label className="switch-row"><input type="checkbox" checked={config.enabled === true} onChange={(event) => updateNodeConfig(active, updateNode, { enabled: event.target.checked })} /><span>{config.enabled ? "开启" : "关闭"}</span><strong>关闭页面时显示挽留弹窗</strong></label><p className="property-copy">开启后点击预览左上角返回按钮触发；选择弹窗组件可直接预览。</p>{field("title", "标题", "错过这次，就要多花 30%😱")}<RetentionImageField active={active} updateNode={updateNode} name="backgroundImage" label="弹窗背景图片" fallback="" /><RetentionImageField active={active} updateNode={updateNode} name="imageSrc" label="主视觉图片" fallback="/ht-retention-gift.png" />{field("timerLabel", "倒计时文案", "倒计时")}{field("timerStart", "倒计时初始值", "71:22:22")}{field("buttonText", "主按钮文案", "立享优惠")}{field("cancelText", "取消按钮文案", "忍痛取消")}</>;
}

function RetentionStyle({ active, updateNode }) {
  return <><ConfigColorField label="弹窗背景颜色" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f7f7f7" /><ConfigColorField label="标题文字颜色" active={active} updateNode={updateNode} name="titleColor" fallback="#111111" /><ConfigColorField label="倒计时文字颜色" active={active} updateNode={updateNode} name="timerColor" fallback="#11bf42" /><div className="split-fields"><ConfigColorField label="按钮起始颜色" active={active} updateNode={updateNode} name="buttonStartColor" fallback="#ff8600" /><ConfigColorField label="按钮结束颜色" active={active} updateNode={updateNode} name="buttonEndColor" fallback="#ffcd00" /></div><ConfigColorField label="按钮文字颜色" active={active} updateNode={updateNode} name="buttonTextColor" fallback="#ffffff" /></>;
}

function ConfigInput({ active, updateNode, name, fallback, ...props }) {
  const value = active.config?.[name] ?? fallback;
  return <input value={value} onChange={(event) => updateNode(active.id, { config: { ...active.config, [name]: event.target.value } })} {...props} />;
}

function ColorOpacity({ color, opacity }) {
  return <div className="color-with-opacity"><div className="color-line"><i style={{ background: color }} /> {color}</div><input defaultValue={opacity} aria-label="Opacity" /></div>;
}

function PaddingInputs({ values = [0, 0, 0, 0] }) {
  return <div className="four-inputs"><input aria-label="Top padding" defaultValue={values[0]} /><input aria-label="Right padding" defaultValue={values[1]} /><input aria-label="Bottom padding" defaultValue={values[2]} /><input aria-label="Left padding" defaultValue={values[3]} /></div>;
}

function LinkOption({ title, checked = false, fields }) {
  return <section className="link-option"><label className="switch-row"><input type="checkbox" defaultChecked={checked} /><span>{checked ? "On" : "Off"}</span><strong>{title}</strong></label>{checked && fields.map(([label, value, onValueChange]) => <Field label={label} key={label}><input {...(onValueChange ? { value, onChange: (event) => onValueChange(event.target.value) } : { defaultValue: value })} /></Field>)}</section>;
}

function LayoutSettings({ markUnknown, boundary, setModal, appliedTemplate }) {
  const isBluePrivilege = appliedTemplate !== null && templates[appliedTemplate]?.documentTemplate === "blue-privilege";
  return <div className="property-scroll layout-settings"><h3>Layout settings</h3><Field label="Template"><div className="inline-select"><span>{appliedTemplate !== null ? templates[appliedTemplate].title : "X template #19"}</span><button className="secondary" onClick={() => setModal({ kind: "templates" })}>Change template</button></div></Field>{isBluePrivilege ? <section className="page-settings"><h4>页面行为</h4><p className="property-copy">关闭页面时的挽留弹窗在「元素 → 挽留弹窗」中配置。套餐角标在「元素 → 产品套餐」中配置。</p></section> : <InspectorBoundary boundary={boundary} markUnknown={markUnknown} message="全局背景、字体、顶部按钮与间距的字段尚未建立可靠的预览映射，因此不显示为可编辑控件。" />}</div>;
}

function WorkspaceHeader({ selected, setView, duplicate, setModal, markUnknown }) {
  return (
    <><button className="back" onClick={() => setView("list")}><ArrowLeft size={18} /> Paywalls</button><div className="workspace-heading"><div><span className="eyebrow">Paywall</span><h1>{selected.name}</h1></div><div className="workspace-actions"><button className="secondary" onClick={() => setView("metrics")}><BarChart3 size={16} /> Metrics</button><button className="secondary unknown-action" onClick={() => markUnknown({ id: "A-01", feature: "View in analytics", known: "The action opens Analytics with paywall_id in the URL.", unknown: "The complete Analytics destination state is outside this reconstruction." })}>View in analytics</button><button className="secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>{selected.state === "Draft" && <button className="secondary" onClick={() => setModal({ kind: "device-test" })}><Smartphone size={16} /> Test on Device</button>}<button className="secondary danger-outline" onClick={() => setModal({ kind: "archive" })}><Archive size={16} /> Archive</button></div></div></>
  );
}

function DeviceTestModal({ onClose }) {
  const previewUrl = "https://mobile-app.adapty.io/paywall-preview?app_id=4044295d-a03a-4c32-9b41-d057fe635445&paywall_id=research-paywall&current_locale=en&locales=en&cluster=us";
  return <Modal title="Test on Device" onClose={onClose}><div className="device-test"><div className="device-qr">▦</div><p className="modal-copy">Open the preview with your device camera or copy this test link.</p><div className="test-link"><input value={previewUrl} readOnly /><button className="icon" title="Copy"><Copy size={16} /></button></div><div className="modal-actions"><button className="primary" onClick={onClose}>Done</button></div></div></Modal>;
}

function ProductRow({ product, offer, onProductChange, onRemove, markUnknown, readOnly = false }) {
  const defaultOffer = offer ?? (product.includes("1 Year") ? "Black Friday" : "No offers for this product");
  const offerBoundary = {
    id: "P-01",
    feature: "Product offer selection",
    known: "已实测：Japanese Ai - 1 Year（Annual）显示 Black Friday；Japanese ai（3 months）显示 No offers for this product。",
    unknown: "其余 Offer 选项、优惠资格校验、切换后的保存规则与最终交易结果未实测。",
  };
  return (
    <div className="product-row">
      <select value={product} disabled={readOnly} onChange={(event) => onProductChange?.(event.target.value)}>
        {readOnly ? <option>{product}</option> : productOptions.map((option) => <option key={option}>{option}</option>)}
      </select>
      <select className="unknown-action" value={defaultOffer} onClick={() => markUnknown(offerBoundary)} onChange={() => markUnknown(offerBoundary)}>
        <option>Black Friday</option><option>No offers for this product</option>
      </select>
      <button className={`icon ${readOnly ? "unknown-action" : ""}`} onClick={() => readOnly ? markUnknown(offerBoundary) : onRemove?.()}><X size={17} /></button>
    </div>
  );
}

function Metrics({ setView, markUnknown }) {
  const [filterMenu, setFilterMenu] = useState(false);
  const [stateFilter, setStateFilter] = useState(false);
  const [statePanel, setStatePanel] = useState(false);
  const [datePanel, setDatePanel] = useState(false);
  const [groupMenu, setGroupMenu] = useState(false);
  const [audienceMenu, setAudienceMenu] = useState(false);
  const boundary = missingItems.find((item) => item.id === "MT-01");
  const metrics = ["Revenue", "Unique views", "ARPAS", "Trials", "Purchases", "Refunds"];
  const columns = ["Audience", "Revenue", "Proceeds", "Net proceeds", "ARPPU", "ARPAS", "Unique CR purchases", "CR purchases", "Unique CR trials", "CR trials", "Purchases", "Trials", "Trials cancelled", "Refunds", "Refund rate", "Views", "Unique views"];
  return <section className="metrics-page"><button className="back" onClick={() => setView("general")}><ArrowLeft size={18} /> Paywall</button><div className="workspace-heading"><div><span className="eyebrow">Paywall</span><h1>Metrics</h1></div><div className="workspace-actions"><button className="secondary" onClick={() => setView("general")}>Edit paywall</button><button className="secondary unknown-action" onClick={() => markUnknown(boundary)}>View in analytics</button></div></div><div className="metrics-controls"><div className="metrics-popover-wrap"><button className="select" onClick={() => setDatePanel((open) => !open)}>Last month <ChevronDown size={16} /></button>{datePanel && <DatePopover />}</div><button className="select">week <ChevronDown size={16} /></button><div className="metrics-popover-wrap"><button className="select" onClick={() => setGroupMenu((open) => !open)}>Group by Product <ChevronDown size={16} /></button>{groupMenu && <div className="metric-menu"><button>Product</button></div>}</div><div className="metrics-popover-wrap"><button className={`secondary ${stateFilter ? "" : ""}`} onClick={() => stateFilter ? setStatePanel((open) => !open) : setFilterMenu((open) => !open)}>{stateFilter ? "State" : <><Plus size={16} /> Add filter</>}</button>{filterMenu && <div className="metric-menu"><button onClick={() => { setStateFilter(true); setFilterMenu(false); setStatePanel(true); }}>State</button></div>}{statePanel && <div className="state-filter-panel"><label className="search"><Search size={15} /><input placeholder="Search" /></label><label><input type="checkbox" defaultChecked /> State</label><div><button className="secondary" onClick={() => { setStateFilter(false); setStatePanel(false); }}>Reset</button><button className="primary" onClick={() => setStatePanel(false)}>Apply</button></div></div>}</div><div className="metrics-popover-wrap"><button className="select" onClick={() => setAudienceMenu((open) => !open)}>Audience based <ChevronDown size={16} /></button>{audienceMenu && <div className="metric-menu"><button className="unknown-action" onClick={() => markUnknown(boundary)}>Audience based</button></div>}</div><label className="install-filter"><input type="checkbox" /> Filter metrics by install date</label><button className="icon unknown-action" onClick={() => markUnknown(boundary)}><Download size={17} /></button></div><div className="metric-grid">{metrics.map((metric) => <div className={`metric-card ${metric === "Revenue" ? "revenue-card" : ""}`} key={metric}><span>{metric}</span><strong>{metric === "Revenue" ? "No Data" : "0"}</strong></div>)}</div><div className="table-wrap metrics-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr>{columns.map((column, index) => <td key={column}>{index === 0 ? "Total" : column.includes("Revenue") || column.includes("Proceeds") || column === "ARPPU" || column === "ARPAS" ? "$0" : "0"}</td>)}</tr></tbody></table></div></section>;
}

function DatePopover() {
  return <div className="date-popover"><strong>Date range</strong><button className="date-preset">Last month <ChevronDown size={14} /></button><h3>21 Jul - 20 Aug</h3><div className="date-fields"><input defaultValue="21.07.2026" /><input defaultValue="20.08.2026" /></div><div className="calendar-preview"><div><strong>July 2026</strong><div className="calendar-grid">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", ...Array.from({ length: 31 }, (_, index) => String(index + 1))].map((day) => <span key={`j${day}`}>{day}</span>)}</div></div><div><strong>August 2026</strong><div className="calendar-grid">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", ...Array.from({ length: 31 }, (_, index) => String(index + 1))].map((day) => <span key={`a${day}`}>{day}</span>)}</div></div></div><div className="grain-row">{["Year", "Quarter", "Month", "Week", "Day"].map((grain) => <button className={grain === "Week" ? "active" : ""} key={grain}>{grain}</button>)}</div><div className="date-actions"><button className="primary">Apply</button></div></div>;
}

function ComplianceModal({ compliance, setCompliance, rememberCompliance, setRememberCompliance, onClose, onAccept, context = "draft" }) {
  const policies = ["Do not make misleading claims about unlocking content.", "Clearly show price and duration.", "Clearly disclose purchase details before purchase.", "Make cross-platform content available immediately.", "Clearly show Terms & Conditions.", "Do not link to external purchase options."];
  return <Modal title="Paywall publishing confirmation" onClose={onClose}><p className="modal-copy">{context === "builder" ? "Publishing paywall you confirm that it meets the guidelines of the stores." : "This confirmation was observed before creating a Draft, despite its publishing wording."}</p><ul className="policy-list">{policies.map((item) => <li key={item}><Check size={16} /> {item}</li>)}</ul><label className="check-row"><input type="checkbox" checked={compliance} onChange={(event) => setCompliance(event.target.checked)} /> <span>I confirm this paywall complies with App Store Review Guidelines and Google Play Developer Program Policies.</span></label><label className="check-row optional"><input type="checkbox" checked={rememberCompliance} onChange={(event) => setRememberCompliance(event.target.checked)} /> <span>Remember this confirmation for all future paywalls.</span></label><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!compliance} onClick={onAccept}>Accept</button></div></Modal>;
}

function TemplateRequirementsModal({ onClose, onContinue }) {
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const isComplete = termsUrl.trim().length > 0 && privacyUrl.trim().length > 0;
  return <Modal title="Complete template setup" onClose={onClose}>
    <p className="modal-copy">The first template save was observed to surface Custom Fonts and require Terms of Service and Privacy Policy URLs in Links.</p>
    <div className="template-requirements">
      <div><strong>Custom Fonts</strong><span>Review the font setup before saving this template.</span></div>
      <Field label="Terms of Service URL"><input value={termsUrl} onChange={(event) => setTermsUrl(event.target.value)} placeholder="https://example.com/terms" /></Field>
      <Field label="Privacy Policy URL"><input value={privacyUrl} onChange={(event) => setPrivacyUrl(event.target.value)} placeholder="https://example.com/privacy" /></Field>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!isComplete} onClick={() => onContinue({ terms: termsUrl, privacy: privacyUrl })}>Continue</button></div>
  </Modal>;
}

function ArchiveModal({ name, onClose, onArchive }) {
  const [value, setValue] = useState("");
  return <Modal title="Archive paywall" onClose={onClose}><p className="modal-copy">This action cannot be undone. Type the complete paywall name to continue.</p><Field label={`Type "${name}"`}><input value={value} onChange={(event) => setValue(event.target.value)} /></Field><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="danger-button" disabled={value !== name} onClick={onArchive}>Archive paywall</button></div></Modal>;
}

function TemplatesModal({ selected, setSelected, onClose, onOpenAi, onOpenBuilder, markUnknown }) {
  const [pendingSelected, setPendingSelected] = useState(selected);
  const [filters, setFilters] = useState({
    // Start unfiltered so the HelloTalk document templates are discoverable on first open.
    products: [],
    media: "All",
    components: [],
    length: "All",
    background: "All",
    category: "All",
  });
  const toggleListFilter = (key, value) => setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const setSingleFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const Filter = ({ children, value, group, list = false }) => {
    const checked = list ? filters[group].includes(value) : filters[group] === value;
    return <label className="filter-option"><input type={list ? "checkbox" : "radio"} name={list ? undefined : group} checked={checked} onChange={() => list ? toggleListFilter(group, value) : setSingleFilter(group, value)} /> {children}</label>;
  };
  const pendingTemplate = pendingSelected === null ? null : templates[pendingSelected];
  const displayTags = (template) => isEditableTemplate(template) ? template.tags : ["Source preview", "Structure pending"];
  const filteredTemplates = templates.filter((template) => {
    const productMatch = !filters.products.length || filters.products.some((item) => template.productCount === (item === "1 product" ? 1 : 2));
    const mediaMatch = filters.media === "All" || (filters.media === "With Image or Video" ? ["image", "video"].includes(template.media) : template.media === "none");
    const componentMatch = filters.components.every((item) => sourceVerifiedTemplateComponents[template.id]?.includes(item));
    const lengthMatch = filters.length === "All" || (filters.length === "Short" ? template.title.length < 28 : template.title.length >= 28);
    const backgroundMatch = filters.background === "All" || (filters.background === "Dark" ? ["night", "black", "midnight", "ocean", "halloween"].includes(template.theme) : !["night", "black", "midnight", "ocean", "halloween"].includes(template.theme));
    const categoryMatch = filters.category === "All" || template.category === filters.category;
    return productMatch && mediaMatch && componentMatch && lengthMatch && backgroundMatch && categoryMatch;
  });
  const documentTemplates = filteredTemplates.filter((template) => template.documentTemplate);
  const prioritizedTemplates = [...documentTemplates, ...filteredTemplates.filter((template) => !template.documentTemplate)];
  return <Modal title="Choose a template" onClose={onClose} wide><div className="template-modal"><aside><div className="filter-heading"><strong>Filters</strong><span className="filter-count">{filteredTemplates.length}</span></div><p>Number of products</p><Filter group="products" value="1 product" list>1 product (31)</Filter><Filter group="products" value="More than 1 product" list>More than 1 product (56)</Filter><p>Image / video</p><Filter group="media" value="All">All</Filter><Filter group="media" value="With Image or Video">With Image or Video (77)</Filter><Filter group="media" value="No media">No media (3)</Filter><p>Components</p><Filter group="components" value="Free trial toggle" list>Free trial toggle (5)</Filter><Filter group="components" value="Trial timeline" list>Trial timeline (24)</Filter><Filter group="components" value="Reviews" list>Reviews (7)</Filter><Filter group="components" value="Timer" list>Timer (5)</Filter><p>Length</p><Filter group="length" value="All">All</Filter><Filter group="length" value="Short">Short</Filter><Filter group="length" value="Long">Long</Filter><p>Background theme</p><Filter group="background" value="All">All</Filter><Filter group="background" value="Light">Light</Filter><Filter group="background" value="Dark">Dark</Filter><p>Category</p><Filter group="category" value="All">All paywalls</Filter><Filter group="category" value="Popular">Popular</Filter><Filter group="category" value="Seasonal">Seasonal</Filter></aside><div className="template-content"><div className="template-scroll-content"><div className="template-entries"><button className="secondary" onClick={onOpenAi}><WandSparkles size={18} /><span><strong>Generate a Design with AI</strong><small>Don't have a design? Our AI will create a unique paywall for you from scratch.</small></span></button><button onClick={() => markUnknown(missingItems[3])}><Copy size={18} /><span><strong>Copy a Design from Your Apps</strong><small>Reuse a design you've built with Paywall Builder in another app.</small></span></button></div><div className="template-selection-summary">{pendingTemplate ? <><span>Selected template</span><strong>{pendingTemplate.title}</strong><small>{displayTags(pendingTemplate).join(" · ")}</small></> : <span>No template selected</span>}</div>{documentTemplates.length > 0 && <div className="template-document-callout"><span>飞书文档 · 第三模块</span><strong>HelloTalk Paywall 模板</strong><small>蓝色特权页、会员套餐页、支付未完成页、SKU 半窗</small></div>}<div className="template-grid rich-template-grid">{prioritizedTemplates.map((template) => { const index = templates.indexOf(template); return <button aria-pressed={pendingSelected === index} className={`template template-${template.theme} ${pendingSelected === index ? "selected" : ""}`} onClick={() => setPendingSelected(index)} key={template.id}><div className="template-source-preview"><SourceTemplateMedia template={template} /></div><strong>{template.title}</strong><small>{displayTags(template).join(" · ")}</small></button>; })}</div>{!filteredTemplates.length && <div className="template-empty">No locally captured Adapty templates match this filter combination.</div>}</div><div className="modal-actions template-modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={pendingSelected === null} onClick={() => onOpenBuilder(pendingSelected)}>Open in Builder</button></div></div></div></Modal>;
}

function AiModal({ onClose, markUnknown }) {
  const [tab, setTab] = useState("chats");
  const [style, setStyle] = useState("");
  const examples = ["Trusted Choice", "Push Forward", "Black&white", "Playful Vibes", "Pro Level", "Kind & Supportive", "Exclusive Access", "Welcome Aboard"];
  const surprise = () => {
    window.alert("We couldn't detect your app in app store. Please make sure that the Apple App ID is filled in settings in the iOS SDK section.");
  };
  return <Modal title="Describe your Perfect Paywall" onClose={onClose}>
    <div className="segmented"><button className={tab === "chats" ? "active" : ""} onClick={() => setTab("chats")}>Chats</button><button className={tab === "examples" ? "active" : ""} onClick={() => setTab("examples")}>Examples</button></div>
    {tab === "chats" ? <><div className="ai-empty"><Sparkles size={30} /><h3>Describe your Perfect Paywall</h3><p>Create paywalls in seconds - no manual setup needed! Generate instantly, customize easily, and launch effortlessly. Save time and stay in control!</p></div><div className="chips">{["Trusted", "Playful", "Black&white", "Professional", "Motivational", "Supportive", "Onboarding", "Exclusive"].map((chip) => <button className={style === chip ? "active" : ""} onClick={() => setStyle(chip)} key={chip}>{chip}</button>)}</div><textarea className="prompt" placeholder={'e.g., "A dark-mode paywall for a fitness app, focus on the annual plan"...'} /><p className="ai-how-it-works">How it works: We combine your prompt with your app's store data to create the most relevant paywalls for you.</p><div className="modal-actions"><button className="secondary" onClick={() => setTab("examples")}>Browse examples</button><button className="secondary" onClick={surprise}>Surprise me</button><button className="primary" onClick={surprise}>Generate</button></div></> : <div className="ai-examples">{examples.map((example) => <article key={example}><div><strong>{example}</strong><small>Observed example entry; the prompt body was not opened.</small></div><button className="secondary unknown-action" onClick={() => markUnknown(missingItems[1])}>Use prompt</button></article>)}</div>}
  </Modal>;
}

function MigrationModal({ onClose, markUnknown }) {
  return <Modal title="Migrate paywall's design" onClose={onClose}><p className="modal-copy">Copy only the visual Builder configuration. Products and other paywall configuration are not copied.</p><label className="form-field"><span>1. Select application</span><select disabled><option>No source application available</option></select></label><label className="form-field"><span>2. Select a Builder paywall</span><select disabled><option>Select a Builder paywall</option></select></label><div className="migration-warning"><CircleHelp size={18} /> Remember to test custom fonts on a device, as they may not display correctly.</div><p className="unknown-rule"><CircleHelp size={16} /> The observed account had no other application design candidate, so this Demo does not invent one.</p><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary unknown-action" disabled onClick={() => markUnknown(missingItems[3])}>Copy Selected Paywall</button></div></Modal>;
}

function AddAppModal({ onClose, markUnknown }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const appBoundary = {
    id: "G-01",
    feature: "Create a new app",
    known: "顶部应用切换菜单包含 Test 与 Add a new app。新增表单含必填 App name、必填 Category、App icon 上传入口、Cancel、Add a new app；Category 共 24 项。",
    unknown: "提交创建后的校验、应用创建结果、切换后的数据刷新、权限与异常处理未实测。",
  };
  return (
    <Modal title="Add a new app" onClose={onClose}>
      <Field label="App name"><input value={name} placeholder="Enter your app name" onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Category"><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Select a category</option>{appCategories.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="App icon"><button className="upload unknown-action" onClick={() => markUnknown(appBoundary)}><Upload size={18} /> Choose File <small>PNG, JPG, max size 2MB.</small></button></Field>
      <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary unknown-action" disabled={!name || !category} onClick={() => markUnknown(appBoundary)}>Add a new app</button></div>
    </Modal>
  );
}

function UnknownModal({ item, onClose }) {
  return <Modal title={`${item.id} · Known boundary`} onClose={onClose}><div className="unknown"><span className="eyebrow">Observed</span><p>{item.known}</p><span className="eyebrow">Not reproduced</span><p>{item.unknown}</p><div className="unknown-rule"><CircleHelp size={18} /> This demo keeps the entry point but does not invent its result.</div></div><div className="modal-actions"><button className="primary" onClick={onClose}>Close</button></div></Modal>;
}

function Modal({ title, onClose, children, wide = false }) { return <div className="modal-backdrop"><section className={`modal ${wide ? "wide" : ""}`}><header><h2>{title}</h2><button className="icon" onClick={onClose}><X size={19} /></button></header>{children}</section></div>; }
function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label>; }
function StateBadge({ state }) { return <span className={`state ${state.toLowerCase()}`}><i /> {state}</span>; }
function Sort() { return <span className="sort">↕</span>; }
function Help() { return <CircleHelp size={15} className="help" />; }
function SourceTemplateMedia({ template }) {
  if (template.prdScreenshot) return <img className="prd-template-screenshot" src={template.prdScreenshot} alt={`${template.title} PRD screenshot`} />;
  if (template.documentTemplate) return <HelloTalkPaywall variant={template.documentTemplate} interactive={false} />;
  const assets = template.assetParts ?? [template.asset];
  if (assets.length === 1) return <img src={assets[0]} alt={`Adapty template: ${template.title}`} />;
  return <div className="source-template-stack">{assets.map((asset) => <img src={asset} alt="" key={asset} />)}</div>;
}

const helloTalkTemplateDefaults = {
  "blue-privilege": { title: "VIP 7折大促", caption: "HelloTalk 世界杯", timer: "18 : 32 : 25", action: "立即领取优惠", legal: "如果当前缴费期前 24 小时没有取消续订，系统会自动续订。", plans: [["1个月", "¥78", "¥78/月"], ["12个月", "¥488", "¥40.67/月"], ["终身", "¥698", "永久会员权益"]] },
  "membership-plans": { title: "解锁谁看了我", caption: "找到志同道合的学习语伴！", timer: "", action: "继续", legal: "如果当前缴费期前 24 小时没有取消续订，系统会自动续订。", plans: [["1个月", "$12.99", "$12.99/月"], ["12个月", "$79.99", "$6.67/月"], ["终身", "$139.99", "永久会员权益"]] },
  "payment-recovery": { title: "错过就要恢复原价了", caption: "现在购买，立享 VIP 专属特权，助力你语言学习", timer: "71:49:28", action: "立即领取优惠", legal: "首年 ¥338，次年系统会以 ¥488 自动续订，可随时取消。", plans: [["1年", "¥28.17/月", "新用户立省 64%"], ["1个月", "¥78/月", ""]] },
  "sku-sheet": { title: "Golden Week Special Offer", caption: "Get 30% Off Annual & Lifetime VIP", timer: "00 : 47 : 04", action: "sku折扣 EN", legal: "订阅会在当前周期结束前 24 小时自动续订，可随时在账户设置中取消。", plans: [["1个月", "¥39", "¥78"], ["12个月", "¥338", "¥488"], ["终身", "¥698", "¥1198"]] },
};

function timerSeconds(value) {
  const parts = String(value ?? "").match(/\d+/g) ?? [];
  const [hours = "0", minutes = "0", seconds = "0"] = parts;
  return Math.max(0, Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds));
}

function formatTimer(seconds, format = "hh:mm:ss", separator = ":") {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  if (format === "mm:ss") return `${String(hours * 60 + minutes).padStart(2, "0")}${separator}${String(remainingSeconds).padStart(2, "0")}`;
  return `${String(hours).padStart(2, "0")}${separator}${String(minutes).padStart(2, "0")}${separator}${String(remainingSeconds).padStart(2, "0")}`;
}

function HeroMediaLayer({ config = {} }) {
  if (config.mediaState !== "custom" || !config.mediaSrc) return null;
  if (config.mediaType === "Video") return <video className="ht-hero-media" src={config.mediaSrc} autoPlay loop muted playsInline style={{ objectFit: config.mediaFit ?? "cover" }} />;
  return <img className="ht-hero-media" src={config.mediaSrc} alt="" style={{ objectFit: config.mediaFit ?? "cover" }} />;
}

function RetentionPreview({ config, onClose }) {
  const start = timerSeconds(config.timerStart ?? "71:22:22");
  const [remaining, setRemaining] = useState(start);
  useEffect(() => { setRemaining(start); const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(interval); }, [start]);
  const parts = formatTimer(remaining, "hh:mm:ss", ":").split(":");
  return <div className="ht-retention-overlay" onClick={onClose}><section className="ht-retention-card" role="dialog" aria-label="挽留弹窗" onClick={(event) => event.stopPropagation()} style={{ backgroundColor: config.backgroundColor ?? "#f7f7f7", backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined }}><h2 style={{ color: config.titleColor ?? "#111" }}>{config.title ?? "错过这次，就要多花 30%😱"}</h2>{config.imageSrc && <img className="ht-retention-image" src={config.imageSrc} alt="优惠礼物" />}<div className="ht-retention-timer" style={{ color: config.timerColor ?? "#11bf42", "--retention-timer-color": config.timerColor ?? "#11bf42" }}><strong>{config.timerLabel ?? "倒计时"}</strong><div>{parts.map((part, index) => <React.Fragment key={index}><span>{part}</span>{index < parts.length - 1 && <i>:</i>}</React.Fragment>)}</div></div><button className="ht-retention-primary" type="button" onClick={onClose} style={{ background: `linear-gradient(90deg, ${config.buttonStartColor ?? "#ff8600"}, ${config.buttonEndColor ?? "#ffcd00"})`, color: config.buttonTextColor ?? "#fff" }}>{config.buttonText ?? "立享优惠"}</button><button className="ht-retention-cancel" type="button" onClick={onClose}>{config.cancelText ?? "忍痛取消"}</button></section></div>;
}

function HelloTalkPaywall({ variant, nodes = [], activeNode, onSelect, interactive = false }) {
  const defaults = helloTalkTemplateDefaults[variant];
  const nodeById = (id) => nodes.find((item) => item.id === id);
  const value = (id, fallback) => nodeById(id)?.content || fallback;
  const configFor = (id) => nodeById(id)?.config ?? {};
  const styleFor = (id) => {
    const config = configFor(id);
    const fontFamily = config.fontFamily === "serif" ? "Georgia, serif" : config.fontFamily === "mono" ? "ui-monospace, SFMono-Regular, monospace" : undefined;
    const margin = ["Top", "Right", "Bottom", "Left"].map((edge) => `${config[`margin${edge}`] ?? 0}px`).join(" ");
    const transform = config.offsetY ? `translateY(${config.offsetY}px)` : undefined;
    return {
      ...(config.color ? { color: config.color } : {}),
      ...(config.backgroundColor ? { background: config.backgroundColor } : {}),
      ...(config.fontSize ? { fontSize: `${config.fontSize}px` } : {}),
      ...(config.fontWeight ? { fontWeight: config.fontWeight } : {}),
      ...(config.textAlign ? { textAlign: config.textAlign } : {}),
      ...(fontFamily ? { fontFamily } : {}),
      ...(config.radius !== undefined ? { borderRadius: `${config.radius}px` } : {}),
      ...(config.shadow ? { boxShadow: `0 ${Math.max(2, Math.round(config.shadow / 2))}px ${config.shadow}px #17172833` } : {}),
      ...(config.opacity !== undefined ? { opacity: config.opacity / 100 } : {}),
      ...(margin !== "0px 0px 0px 0px" ? { margin } : {}),
      ...(transform ? { transform } : {}),
      ...(config.maxLines ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: config.maxLines, overflow: "hidden" } : {}),
      ...(config.scaleText ? { overflowWrap: "anywhere" } : {}),
    };
  };
  const heroStyleFor = (id) => {
    const config = configFor(id);
    const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const heightScale = config.mediaHeight === "" ? 1 : numeric(config.mediaHeight, 100) / 100;
    return {
      ...styleFor(id),
      ...(config.mediaState === "custom" && config.mediaSrc ? { backgroundImage: "none" } : {}),
      backgroundColor: config.mediaBackgroundColor ?? ({ "blue-privilege": "#09265d", "membership-plans": "#ffe07a", "payment-recovery": "#e5f4ff" }[variant] ?? "#ffffff"),
      ...(config.mediaState === "removed" ? { backgroundImage: "none" } : {}),
      ...(config.rounded ? { borderRadius: `${config.radius ?? 0}px` } : {}),
      ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].map((edge) => [`--media-inset-${edge.toLowerCase()}`, `${Math.max(0, numeric(config[`padding${edge}`], 0))}px`])),
      "--hero-height-scale": `${heightScale}`,
      "--hero-copy-left": `${numeric(config.copyLeft, 12)}%`,
      "--hero-copy-bottom": `${numeric(config.copyBottom, 15)}%`,
      "--hero-copy-align": config.copyAlign ?? "left",
      "--hero-title-color": config.copyTitleColor ?? "#ffc524",
      "--hero-title-prefix-color": config.copyPrefixColor ?? "#ffffff",
      "--hero-title-size": `${numeric(config.copyTitleSize, 26)}px`,
      "--hero-caption-color": config.copyCaptionColor ?? "#ffffff",
      "--hero-caption-size": `${numeric(config.copyCaptionSize, 16)}px`,
    };
  };
  const mediaClass = (id) => {
    const state = configFor(id).mediaState;
    return state === "custom" ? "media-custom" : state === "removed" ? "media-removed" : "";
  };
  const productConfig = nodeById("products")?.config ?? {};
  const defaultSelectedPlan = Number.isInteger(productConfig.defaultSelected) ? productConfig.defaultSelected : (variant === "payment-recovery" ? 0 : 1);
  const [selectedPlan, setSelectedPlan] = useState(defaultSelectedPlan);
  const [retentionOpen, setRetentionOpen] = useState(false);
  const [openPrivilegeId, setOpenPrivilegeId] = useState(null);
  const retentionConfig = configFor("retention");
  useEffect(() => setRetentionOpen(activeNode === "retention" && retentionConfig.enabled === true), [activeNode, retentionConfig.enabled]);
  useEffect(() => setSelectedPlan(defaultSelectedPlan), [defaultSelectedPlan, variant]);
  const heroConfig = configFor("hero-image");
  const title = heroConfig.copyTitle ?? value("headline", defaults.title);
  const titleParts = heroTitleParts(heroConfig);
  const caption = heroConfig.copyCaption ?? value("caption", defaults.caption);
  const timerNode = nodeById("timer");
  const timer = timerNode?.content || defaults.timer;
  const timerConfig = timerNode?.config ?? {};
  const action = value("purchase", defaults.action);
  const legal = value("legal", defaults.legal);
  const links = value("links", "服务条款 · 隐私政策");
  const productNode = value("products", "");
  const plans = productNode ? productNode.split("\n").filter(Boolean).map((row, index) => {
    const [name = defaults.plans[index]?.[0] ?? "套餐", price = defaults.plans[index]?.[1] ?? "", detail = defaults.plans[index]?.[2] ?? ""] = row.split("|");
    return [name, price, detail];
  }) : defaults.plans;
  const visiblePlans = productConfig.bluePrivilege ? plans.slice(0, Math.max(1, Math.min(plans.length, Number(productConfig.visibleProductCount ?? plans.length) || 1))) : plans;
  const benefitConfig = configFor("benefits");
  const renderedBenefits = benefitConfig.bluePrivilege ? privilegeRowsFor(nodeById("benefits")) : value("benefits", "").split("\n").filter(Boolean).map((row, index) => { const [name, standard, vip] = row.split("|"); return { id: `generic-${index}`, name, standard, vip }; });
  const visibleBenefits = benefitConfig.bluePrivilege ? renderedBenefits.slice(0, Math.max(1, Math.min(renderedBenefits.length, Number(benefitConfig.maxVisibleRows ?? renderedBenefits.length) || 1))) : renderedBenefits;
  const renderBenefitValue = (row, field) => {
    const mode = row[field + "Mode"] ?? (row[field] === "受限" || row[field] === "✓" ? "icon" : "text");
    if (mode !== "icon") return row[field];
    const icon = row[field + "Icon"] ?? (field === "standard" ? "lock" : "check");
    return icon === "lock" ? <LockKeyhole size="1em" strokeWidth={2.4} aria-label="锁定" /> : <span className="ht-vip-check" aria-label="勾选">✓</span>;
  };
  const openPrivilege = renderedBenefits.find((row) => row.id === openPrivilegeId);
  const carouselConfig = nodeById("carousel")?.config ?? {};
  const carouselCount = Math.max(1, Math.min(10, Number(carouselConfig.itemCount ?? 7) || 7));
  const carouselActive = Math.min(carouselCount - 1, Math.max(0, Number(carouselConfig.initialSlide ?? 0) || 0));
  const select = (id) => (event) => {
    if (!interactive) return;
    event?.stopPropagation();
    onSelect?.(id);
  };
  const nodeClass = (id, name = "") => `ht-node ${activeNode === id ? "selected" : ""} ${name}`;
  const showOfferBadge = productConfig.showOfferBadge !== false;
  const Plan = ({ plan, index }) => {
    const config = configFor("products");
    const selectedStyle = index === selectedPlan ? config.bluePrivilege ? { borderColor: "transparent", background: `${productGradient([config.selectedBackground ?? "#ffffff", config.selectedBackground ?? "#ffffff", config.selectedBackground ?? "#ffffff"], ["#ffffff", "#ffffff", "#ffffff"])} padding-box, ${productGradient(config.selectedBorderGradient, ["#ff860a", "#ff860a", "#ff860a"])} border-box` } : config.selectedBackground ? { background: config.selectedBackground } : {} : {};
    const productStyle = config.bluePrivilege ? { "--badge-background": productGradient(config.badgeGradient, ["#ff860a", "#ffb000", "#ffd10b"]), "--save-text-color": config.saveTextColor ?? "#ff8207" } : {};
    const hasBadge = showOfferBadge && index === (config.bluePrivilege ? (config.badgeProductIndex ?? 1) : 1) && variant !== "payment-recovery" && (!config.bluePrivilege || (config.badgePosition ?? "top") === "top");
    const saving = config.bluePrivilege ? (config.planSavings?.[index] ?? ["", "节省 48%", "立减¥1000"][index]) : "";
    const original = config.bluePrivilege ? (config.planOriginalPrices?.[index] ?? ["", "", "¥1698"][index]) : "";
    return <div className={`${nodeClass("products", "ht-plan")} ${index === selectedPlan ? "chosen" : ""} ${config.bluePrivilege ? "ht-blue-plan" : ""} ${original ? "has-original" : ""}`} style={{ ...styleFor("products"), ...productStyle, ...selectedStyle, ...(!config.bluePrivilege && config.accentColor && index === selectedPlan ? { borderColor: config.accentColor } : {}) }} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} onClick={(event) => { if (!interactive) return; event.stopPropagation(); setSelectedPlan(index); onSelect?.("products"); }} key={`${plan[0]}-${index}`}><span>{hasBadge && <b>{variant === "sku-sheet" ? "sku 折扣 EN" : (config.offerBadgeLabel ?? "最受欢迎")}</b>}{original && saving && <small className="ht-plan-top-saving">{saving}</small>}<strong>{plan[0]}</strong>{original && <del>{original}</del>}{showOfferBadge && variant === "payment-recovery" && index === 0 && <small style={config.accentColor ? { background: config.accentColor } : undefined}>30% OFF</small>}</span><em>{plan[1]}</em>{saving && !original && <small className="ht-plan-saving">{saving}</small>}<i className={config.bluePrivilege && index === plans.length - 1 ? "ht-plan-save-copy" : ""}>{plan[2]}</i></div>;
  };
  const Status = () => <div className="ht-status"><b>{variant === "sku-sheet" ? "4:52" : variant === "blue-privilege" ? "15:48" : "16:48"}</b><span>••• ◔ ▰</span></div>;
  const Timer = () => {
    const startValue = timerSeconds(timer);
    const [remaining, setRemaining] = useState(startValue);
    useEffect(() => {
      setRemaining(startValue);
      if (!startValue) return undefined;
      const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
      return () => window.clearInterval(interval);
    }, [startValue, timerConfig.resetMode]);
    if (!timerNode || timerConfig.enabled === false) return null;
    const prefix = timerConfig.prefix ?? "";
    const suffix = timerConfig.suffix ?? "";
    const formatted = formatTimer(remaining, timerConfig.format ?? "hh:mm:ss", timerConfig.separator ?? ":");
    const segmentedTimer = variant === "blue-privilege" && (timerConfig.separator ?? ":") === ":";
    const timerStyle = variant === "blue-privilege" ? { ...styleFor("timer"), background: "transparent", "--timer-digit-background": timerConfig.backgroundColor ?? "#ffd16b" } : styleFor("timer");
    return <div className={nodeClass("timer", "ht-timer")} style={timerStyle} onClick={select("timer")}>{prefix && <strong>{prefix}</strong>}<span className={segmentedTimer ? "ht-timer-digits" : ""}>{segmentedTimer ? formatted.split(":").map((part, index, parts) => <React.Fragment key={`${part}-${index}`}><b>{part}</b>{index < parts.length - 1 && <i>:</i>}</React.Fragment>) : formatted}</span>{suffix && <small>{suffix}</small>}</div>;
  };
  const actionStyle = variant === "blue-privilege" ? { ...styleFor("purchase"), background: productGradient(productConfig.purchaseBackgroundGradient, ["#ff8707", "#ffb000", "#ffd10b"]) } : styleFor("purchase");
  const actionCopy = variant === "blue-privilege" ? <span className="ht-action-gradient-text" style={{ backgroundImage: productGradient(productConfig.purchaseTextGradient, ["#ffffff", "#ffffff", "#ffffff"]) }}>{action}</span> : action;
  const Action = () => interactive ? <button className={nodeClass("purchase", "ht-action")} style={actionStyle} onClick={select("purchase")}>{actionCopy}</button> : <div className="ht-action" style={actionStyle}>{actionCopy}</div>;
  const Legal = () => <p className="ht-legal"><span className={nodeClass("legal")} style={styleFor("legal")} onClick={select("legal")}>{legal}</span>{" "}<span className={nodeClass("links")} style={styleFor("links")} onClick={select("links")}>{links}</span></p>;
  const SoccerBall = () => <span className="ht-soccer-ball"><i /><i /><i /></span>;

  if (variant === "blue-privilege") { return <div className="ht-paywall ht-blue-paywall"><Status />{openPrivilege ? <div className="ht-privilege-detail"><button type="button" className="ht-detail-back" aria-label="返回特权页" onClick={() => setOpenPrivilegeId(null)}>‹</button><h1 style={{ color: openPrivilege.detail?.titleColor }}>{openPrivilege.detail?.title || openPrivilege.name}</h1>{openPrivilege.detail?.iconSrc && <img className="ht-detail-icon" src={openPrivilege.detail.iconSrc} alt="" />}{openPrivilege.detail?.images?.find((image) => image.locale === "简体中文" && image.src)?.src && <img className="ht-detail-image" src={openPrivilege.detail.images.find((image) => image.locale === "简体中文" && image.src).src} alt="" />}</div> : <>{heroConfig.bannerEnabled !== false && <section className={`${nodeClass("hero-image", "ht-blue-hero")} ${mediaClass("hero-image")}`} style={heroStyleFor("hero-image")} onClick={select("hero-image")}><HeroMediaLayer config={heroConfig} /><button className="ht-back" type="button" aria-label="返回" onClick={(event) => { event.stopPropagation(); if (retentionConfig.enabled) setRetentionOpen(true); }}>‹</button><div className="ht-blue-copy"><small>VIP</small><h1>{titleParts.prefix && <b>{titleParts.prefix}</b>}{titleParts.suffix}</h1><p>{caption}</p></div></section>}<section className={nodeClass("benefits", "ht-privilege-table")} style={{ ...styleFor("benefits"), "--privilege-header-background": benefitConfig.headerBackground, "--privilege-vip-background": benefitConfig.vipColumnBackground }} onClick={select("benefits")}><header><strong>特权名称</strong><strong>非会员</strong><b style={benefitConfig.accentColor ? { color: benefitConfig.accentColor } : undefined}>VIP</b></header>{visibleBenefits.map((row) => <div key={row.id} className={row.pageId ? "has-detail-page" : ""} onClick={(event) => { if (!interactive || !row.pageId) return; event.stopPropagation(); setOpenPrivilegeId(row.id); }}><span>{row.name}⌄</span><em className={(row.standardMode ?? (row.standard === "受限" ? "icon" : "text")) === "icon" && (row.standardIcon ?? "lock") === "lock" ? "is-locked" : ""} style={benefitConfig.secondaryColor ? { color: benefitConfig.secondaryColor } : undefined}>{renderBenefitValue(row, "standard")}</em><b style={benefitConfig.accentColor ? { color: benefitConfig.accentColor } : undefined}>{renderBenefitValue(row, "vip")}</b></div>)}</section><section className="ht-plan-shell" style={{ "--product-background": productConfig.productBackground }}>{visiblePlans.map((plan, index) => <Plan plan={plan} index={index} />)}</section><Timer /><div className="ht-action-wrap"><Action />{showOfferBadge && productConfig.badgePosition === "button" && <span className="ht-action-badge" style={{ background: productConfig.badgeBackground ?? "#11bd3d", color: productConfig.badgeTextColor ?? "#fff" }}>{productConfig.offerBadgeLabel ?? "节省$60"}</span>}</div><Legal />{retentionConfig.enabled && retentionOpen && <RetentionPreview config={retentionConfig} onClose={() => setRetentionOpen(false)} />}</>}</div>; }
  if (variant === "membership-plans") { const carouselStyle = styleFor("carousel"); const carouselConfigStyle = configFor("carousel"); return <div className="ht-paywall ht-membership-paywall"><div className="ht-member-backdrop"><Status /><span className="ht-back">‹</span><strong>我的访问</strong><b>ϟ</b><div><span>访客</span><span>谁看了我</span><span>喜欢我的人</span></div></div><section className="ht-member-sheet"><span className="ht-sheet-close">×</span><section className={`${nodeClass("hero-image", "ht-member-hero")} ${mediaClass("hero-image")}`} style={heroStyleFor("hero-image")} onClick={select("hero-image")}><HeroMediaLayer config={configFor("hero-image")} /><div className="ht-source-art"><div className="ht-eye-particles"><i /><i /><i /><i /></div><div className="ht-phone-illustration"><b>Visit Info</b><span>Visitors　Visited　Liked</span><div className="ht-phone-rows">{["Peggie", "Nilson", "Cookie", "Hampton"].map((name) => <p key={name}><i /><strong>{name}</strong><small>is <b>1km</b> away from you</small><em>Say Hi</em></p>)}</div></div></div></section><section className={nodeClass("headline", "ht-member-copy")} style={styleFor("headline")} onClick={select("headline")}><h1>{title}</h1><p className={nodeClass("caption")} style={styleFor("caption")} onClick={select("caption")}>{caption}</p><div className={nodeClass("carousel")} style={{ ...carouselStyle, gap: `${carouselConfigStyle.gap ?? 8}px` }} onClick={select("carousel")}>{Array.from({ length: carouselCount }, (_, index) => <i style={{ color: index === carouselActive ? (carouselConfigStyle.accentColor ?? undefined) : (carouselConfigStyle.secondaryColor ?? undefined) }} key={index}>{index === carouselActive ? "●" : "○"}</i>)}</div></section><header className="ht-plan-heading"><b>选择套餐</b><span>特权对比 ›</span></header><section className="ht-plan-shell">{plans.map((plan, index) => <Plan plan={plan} index={index} />)}</section><Action /><Legal /></section></div>; }
  if (variant === "payment-recovery") return <div className="ht-paywall ht-recovery-paywall"><div className="ht-recovery-backdrop"><Status /><b>‹</b><strong>我的访问</strong></div><section className={nodeClass("offer-card", "ht-recovery-sheet")} style={styleFor("offer-card")} onClick={select("offer-card")}><span className="ht-sheet-close">×</span><h1 className={nodeClass("headline")} style={styleFor("headline")} onClick={select("headline")}>{title}</h1><div className={`${nodeClass("hero-image", "ht-offer-bundle")} ${mediaClass("hero-image")}`} style={heroStyleFor("hero-image")} onClick={select("hero-image")}><HeroMediaLayer config={configFor("hero-image")} /><div className="ht-source-art"><span>30%<br />OFF</span><SoccerBall /></div></div><p className={nodeClass("caption", "ht-recovery-caption")} style={styleFor("caption")} onClick={select("caption")}>{caption}</p><section className="ht-recovery-plans">{plans.map((plan, index) => <Plan plan={plan} index={index} />)}</section><Timer /><Action /><Legal /></section></div>;
  return <div className="ht-paywall ht-sku-paywall"><div className="ht-chat-scene"><Status /><b>‹</b><strong>huangzefeng</strong><small>上午4:52</small><span>Hi</span></div><section className={nodeClass("sku-card", "ht-sku-sheet")} style={styleFor("sku-card")} onClick={select("sku-card")}><span className="ht-sheet-close">×</span><section className={`${nodeClass("hero-image", "ht-sku-promo")} ${mediaClass("hero-image")}`} style={heroStyleFor("hero-image")} onClick={select("hero-image")}><HeroMediaLayer config={configFor("hero-image")} /><small className={nodeClass("headline")} style={styleFor("headline")} onClick={select("headline")}>{title}</small><strong className={nodeClass("caption")} style={styleFor("caption")} onClick={select("caption")}>Get <em>30% Off</em><br />Annual &amp; Lifetime VIP</strong><div className="ht-source-art"><i>セール</i><b>VIP</b></div></section><Timer /><section className="ht-sku-plans">{plans.map((plan, index) => <Plan plan={plan} index={index} />)}</section><Action /><Legal /></section></div>;
}
function PaywallPreview({ nodes, template, mode, activeNode, onSelect }) {
  if (template?.documentTemplate) return <div className="phone source-template-phone"><HelloTalkPaywall variant={template.documentTemplate} nodes={nodes} activeNode={activeNode} onSelect={onSelect} interactive={mode === "editable"} /><button className="close-phone" aria-label="Close preview">×</button></div>;
  if (template && mode === "source") return <div className="phone source-template-phone"><SourceTemplateMedia template={template} /><button className="close-phone" aria-label="Close preview">×</button></div>;
  const hero = nodes.find((node) => node.type === "Hero Image");
  const children = new Map();
  const parents = new Map();
  const latestAtDepth = [];
  nodes.forEach((node) => {
    const depth = node.depth ?? 0;
    const parentId = node.parentId ?? (depth > 0 ? latestAtDepth[depth - 1] : undefined);
    if (parentId) {
      parents.set(node.id, parentId);
      children.set(parentId, [...(children.get(parentId) ?? []), node]);
    }
    latestAtDepth[depth] = node.id;
    latestAtDepth.length = depth + 1;
  });
  return <div className={`phone template-${hero?.theme ?? "lavender"}`}><button className="close-phone" aria-label="Close preview">×</button><div className="phone-content"><span className="phone-kicker">PREMIUM ACCESS</span>{nodes.filter((node) => !parents.has(node.id)).map((node) => <PreviewElement key={node.id} node={node} children={children.get(node.id) ?? []} active={node.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div></div>;
}

function PreviewElement({ node, active, activeNode, onSelect, children = [] }) {
  const select = () => onSelect(node.id);
  const wrap = (content, className = "") => <div className={`preview-node ${active ? "selected" : ""} ${className}`} onClick={select}>{content}</div>;
  const isTextLayer = ["Text", "Header", "Headline", "Subhead", "Caption", "Legal", "Top Text"].includes(node.type) || /^(HEADER|Header|Caption|Title|Repeats|Subheader) \d+$/.test(node.type);
  const isListLayer = ["List", "Feature list", "Features"].includes(node.type) || /^List \d+$/.test(node.type);
  const isListItemLayer = node.type === "List item" || node.type === "Today" || /^Item \d+$/.test(node.type) || /^Day \d+$/.test(node.type);
  const isImageLayer = ["Image", "Black Friday Image"].includes(node.type) || /^Image \d+$/.test(node.type);
  if (node.sourcePending) return wrap(<p className="preview-boundary">Source layer confirmed; field content pending</p>, "preview-copy");
  if (["Hero Image", "Hero Video"].includes(node.type)) return wrap(<div className={`preview-media visual-${node.content}`}><span>{node.type === "Hero Video" || node.config?.mediaType === "Video" ? "VIDEO" : node.content === "knowledge" ? "✦" : ""}</span></div>, "preview-hero");
  if (node.type === "Stars") return wrap(<div className="preview-stars">{node.content || "★★★★★"}</div>);
  if (node.type === "Discount") return wrap(<h2>{node.content || "Discount"}</h2>, "preview-headline");
  if (isTextLayer) return wrap(node.variant === "headline" ? <h2>{node.content || "Heading"}</h2> : node.variant === "section" ? <h3>{node.content}</h3> : <p className={node.variant === "boundary" ? "preview-boundary" : ""}>{node.content || "Supporting text"}</p>, node.variant === "headline" ? "preview-headline" : "preview-copy");
  if (isListLayer) {
    if (children.length) return wrap(<div className="preview-benefits">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-list");
    if (!node.content) return wrap(<div className="preview-list-anchor">List</div>, "preview-list-anchor-wrap");
    return wrap(<ul className="preview-benefits">{(node.content || "").split("\n").filter(Boolean).map((item) => { const [title, caption] = item.split("|"); return <li key={item}>✓ <span><strong>{title}</strong>{caption && <small>{caption}</small>}</span></li>; })}</ul>, "preview-list");
  }
  if (isListItemLayer) { const [title, caption] = (node.content || "").split("|"); return wrap(<div className="preview-list-item"><i>●</i><span><strong>{title || "Item"}</strong>{caption && <small>{caption}</small>}</span></div>, "preview-list-item-wrap"); }
  if (node.type === "Card") return children.length ? wrap(<div className="preview-card">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-card-wrap") : !node.content ? wrap(<div className="preview-card-anchor" />, "preview-card-anchor-wrap") : wrap(<div className="preview-card">{node.content.split("\n").map((row) => { const [title, copy] = row.split("|"); return <div key={row}><strong>{title}</strong>{copy && <small>{copy}</small>}</div>; })}</div>, "preview-card-wrap");
  if (["Product", "Japanese Ai - 1 Year"].includes(node.type)) { const [name, price] = (node.content || "").split("|"); return wrap(<div className="preview-product"><strong>{name || "Product"}</strong>{price && <small>{price}</small>}</div>, "preview-product-anchor-wrap"); }
  if (node.type === "App Icon") return wrap(<div className="preview-app-icon">✦</div>, "preview-app-icon-wrap");
  if (isImageLayer) return wrap(<div className="preview-image">{node.type === "Black Friday Image" ? "BLACK FRIDAY" : node.content}</div>, "preview-image-wrap");
  if (node.type === "Carousel") return children.length ? wrap(<div className="preview-carousel">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-carousel-wrap") : !node.content ? wrap(<div className="preview-card-anchor" />, "preview-card-anchor-wrap") : wrap(<PreviewCarousel content={node.content} config={node.config} />, "preview-carousel-wrap");
  if (node.type === "Timer") return node.config?.enabled === false ? null : wrap(<PreviewTimer content={node.content} config={node.config} />);
  if (node.type === "Products") {
    if (node.variant === "purchase") {
      const [label = "Continue", , price = ""] = node.content.split("|");
      return wrap(<button className="preview-cta"><span>{label}</span>{price && <small>{price}</small>}</button>, "preview-button");
    }
    if (children.length) return wrap(<div className="preview-products">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-products-wrap");
    return wrap(<PreviewProducts content={node.content} config={node.config} />, "preview-products-wrap");
  }
  if (node.type === "Toggle") return wrap(<PreviewToggle key={`${node.id}-${node.defaultState ?? "Off"}`} content={node.content} defaultState={node.defaultState} />, "preview-toggle-wrap");
  if (["Toggle On", "Toggle Off"].includes(node.type)) return wrap(<div className="preview-toggle-anchor" />, "preview-toggle-anchor-wrap");
  if (node.type === "Footer Top Part") return wrap(<div className="preview-card-anchor" />, "preview-card-anchor-wrap");
  if (node.type === "Button and Links") { const [cta, links] = (node.content || "GET FULL ACCESS|Terms · Privacy · Restore").split("|"); return wrap(<><button className="preview-cta">{cta}</button><small className="preview-links">{links}</small></>, "preview-button"); }
  if (node.type === "Button" || node.type === "Web Paywall Button" || node.type === "Purchase Button") return wrap(<button className="preview-cta">{node.content || (node.type === "Web Paywall Button" ? "Pay on web" : node.type === "Button" ? "button text" : "Continue")}</button>, "preview-button");
  if (node.type === "Links") return wrap(<small className="preview-links">{node.content || "Terms · Privacy · Restore · Login"}</small>);
  if (node.type === "Footer") return wrap(<small className="preview-footer">{node.content}</small>);
  return wrap(<p>{node.content || node.type}</p>);
}

function PreviewTimer({ content, config = {} }) {
  const startValue = timerSeconds(content || "04:59:59");
  const [remaining, setRemaining] = useState(startValue);
  useEffect(() => {
    setRemaining(startValue);
    if (!startValue) return undefined;
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [startValue, config.resetMode]);
  return <div className="preview-timer">{config.prefix && <strong>{config.prefix} </strong>}{formatTimer(remaining, config.format ?? "hh:mm:ss", config.separator ?? ":")}{config.suffix && <small> {config.suffix}</small>}</div>;
}

function PreviewCarousel({ content, config = {} }) {
  const slides = (content || "Customer story").split("\n---\n").filter(Boolean);
  const [current, setCurrent] = useState(Math.min(slides.length - 1, Math.max(0, Number(config.initialSlide) || 0)));
  useEffect(() => setCurrent(Math.min(slides.length - 1, Math.max(0, Number(config.initialSlide) || 0))), [config.initialSlide, slides.length]);
  const slide = slides[current] ?? slides[0];
  const [title, copy] = slide.split("|");
  return <div className="preview-carousel"><span>★★★★★</span><p>{copy ? <><strong>{title}</strong><small>{copy}</small></> : slide}</p><div><button aria-label="Previous review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index - 1 + slides.length) % slides.length); }}>‹</button><i>{slides.map((_, index) => <b className={index === current ? "active" : ""} key={index}>•</b>)}</i><button aria-label="Next review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index + 1) % slides.length); }}>›</button></div></div>;
}

function PreviewProducts({ content, config = {} }) {
  const rows = (content || "").split("\n").filter(Boolean).map((row) => { const [name, caption, price] = row.split("|"); return { name, caption, price: price ?? caption }; });
  const defaultChoice = Math.min(Math.max(0, Number(config.defaultSelected) || 0), Math.max(0, rows.length - 1));
  const [chosen, setChosen] = useState(defaultChoice);
  useEffect(() => setChosen(defaultChoice), [defaultChoice]);
  return <div className="preview-products">{rows.map((row, index) => <button className={index === chosen ? "chosen" : ""} onClick={(event) => { event.stopPropagation(); setChosen(index); }} key={`${row.name}-${index}`}><span><strong>{row.name}</strong>{row.caption && row.price !== row.caption && <small>{row.caption}</small>}</span><em>{row.price}</em></button>)}</div>;
}

function PreviewToggle({ content, defaultState = "Off" }) {
  const [title = "Not sure? Get free trial", secondary = "Cancel anytime"] = (content || "").split("|");
  const [enabled, setEnabled] = useState(defaultState === "On");
  return <button className={`preview-toggle ${enabled ? "enabled" : ""}`} role="switch" aria-checked={enabled} onClick={(event) => { event.stopPropagation(); setEnabled((value) => !value); }}><span><strong>{title}</strong><small>{secondary}</small></span><i><b /></i></button>;
}

createRoot(document.getElementById("root")).render(<App />);
