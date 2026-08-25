import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  Bell,
  Blocks,
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
  RotateCw,
} from "lucide-react";
import "./styles.css";

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
];

const componentCatalog = ["Text", "Image", "Card", "Web Paywall Button", "Button", "List", "Links", "Timer", "Carousel", "Products"];

const sourceTreeObserved = new Set(["knowledge", "trial", "connection", "family", "premium-access", "document", "yoga", "black-friday", "black-friday-timer", "christmas", "halloween", "new-year", "report", "avatar", "mindfulness", "trial-white", "trial-blue", "fitness-trial", "access", "weather", "workout", "audiobooks", "herbs", "video-access", "design-life", "full-app", "item-placeholder", "item-placeholder-dark", "fantasy-access", "editing-plan", "training"]);

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
  const hero = () => node("hero-image", "Hero Image", template.visual, 0, { theme: template.theme });
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
  return { id: `added-${type.toLowerCase().replace(/[^a-z]+/g, "-")}-${index}`, type, label: "", depth: 0, content: contentByType[type] ?? "" };
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
  "Element content": "元素内容", "Layer label": "图层标签", "Delete element": "删除元素", "Preview orientation": "预览方向", "Preview visibility": "预览可见性",
  "No locally reconstructed templates match this filter combination.": "没有本地还原模板符合当前筛选组合。", "All paywalls": "全部付费墙", "Popular": "热门", "Seasonal": "季节活动",
  "No locally captured Adapty templates match this filter combination.": "没有已采集的 Adapty 真实模板符合当前筛选组合。",
  "Don't have a design? Our AI will create a unique paywall for you from scratch.": "还没有设计？AI 会从零为你生成一张独特的付费墙。",
  "Reuse a design you've built with Paywall Builder in another app.": "复用你在其他应用中通过付费墙构建器创建的设计。", "Get Free Access": "免费开始使用",
  "1 product · Trial timeline · Reviews": "1 个产品 · 试用时间线 · 评价", "1 product · Image": "1 个产品 · 图片", "1 product · Free trial toggle": "1 个产品 · 免费试用开关",
  "Text Required": "文本内容", "Max lines": "最大行数", "Overflow": "溢出处理", "Scale text": "缩放文字", "Close preview": "关闭预览",
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
  "Terms of Service": "服务条款", "Privacy Policy": "隐私政策",
  "Read the docs": "查看文档", "All placements": "全部展示位置", "States (3)": "状态（3）", "Live": "已发布", "Draft": "草稿", "Inactive": "未启用",
  "Search by paywall name": "按付费墙名称搜索", "Proceeds": "实收款项", "Net proceeds": "净实收款项", "1 - 2 of 2": "第 1 - 2 项，共 2 项",
  "Create a draft and configure it with products and a no-code builder.": "创建草稿，并在产品套餐与无代码构建器中完成设置。",
  "Actions for test": "test 的操作", "Actions for test 2": "test 2 的操作", "Edit": "编辑",
  "No switch (all products are visible)": "不切换（展示所有产品）", "Selected product": "选中的产品", "Products grouping": "产品分组",
  "Custom media ID": "自定义媒体 ID", "Background image": "背景图片", "Fill": "填充", "Border": "边框", "Corner radius": "圆角",
  "Height": "高度", "Aspect": "宽高比", "Original": "原始比例", "Cover": "覆盖", "Padding": "内边距", "Vertical offset": "垂直偏移",
  "Format": "格式", "Separator": "分隔符", "Starting value": "初始值", "Text before": "前置文案", "Text after": "后置文案", "Reset on every opening": "每次打开时重置",
  "Default icon": "默认图标", "Icon position": "图标位置", "Connector": "连接线", "Autoplay": "自动播放", "Timing": "时长", "Transition": "切换效果", "Pause on user interaction": "用户操作时暂停",
  "Toggle color": "开关颜色", "Active color": "开启颜色", "Title text": "标题文案", "Text spacing": "文字间距",
  "Pagination dots": "分页圆点", "Dot color": "圆点颜色", "Dot size": "圆点尺寸", "Dot spacing": "圆点间距", "Horizontal": "横向", "Vertical": "纵向",
  "Opacity": "透明度", "Top padding": "上内边距", "Right padding": "右内边距", "Bottom padding": "下内边距", "Left padding": "左内边距",
  "PAYWALL": "付费墙", "✓ Unlimited conversations": "✓ 无限对话", "✓ Personalized learning plan": "✓ 个性化学习计划",
  "$49.99 / year": "$49.99 / 年", "$8.99 / month": "$8.99 / 月", "Terms of service · Privacy policy · Restore": "服务条款 · 隐私政策 · 恢复购买",
  "2 products · Reviews": "2 个产品 · 评价", "1 product · Timer": "1 个产品 · 倒计时", "2 products · Image": "2 个产品 · 图片",
  "2 products · Timer": "2 个产品 · 倒计时", "1 product · No media": "1 个产品 · 无媒体", "Icon": "图标", "Align": "对齐", "Left": "左侧",
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
    setTemplateSelected(templateIndex);
    setAppliedTemplate(templateIndex);
    setBuilderNodes(createBuilderNodes(template.id));
    setActiveNode("headline");
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
          onOpenBuilder={(templateIndex) => { const template = templates[templateIndex]; applyTemplate(templateIndex); setModal(null); setView("builder"); notify(sourceTreeObserved.has(template.id) ? "已应用基于源端核心结构的可编辑复现。" : "已应用源端预览内容；精确节点树仍在采集。"); }}
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
  useEffect(() => setPreviewMode("source"), [appliedTemplate]);
  if (view === "builder") {
    const active = builderNodes.find((node) => node.id === activeNode);
    const builderBoundary = missingItems.find((item) => item.id === "B-01");
    const addElement = (type) => {
      const next = createComponentNode(type, builderNodes.filter((node) => node.id.startsWith("added-")).length + 1);
      setBuilderNodes((current) => [...current, next]);
      setActiveNode(next.id);
      setBuilderTab("tree");
      setAddElementOpen(false);
      notify(`${type} 已添加到构建器，并可在右侧继续编辑。`);
    };
    const addNestedElement = (parentId, type) => {
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
      if (appliedTemplate !== null && sourceTreeObserved.has(templates[appliedTemplate].id)) setPreviewMode("editable");
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
        {appliedTemplate !== null && <div className={`template-context ${sourceTreeObserved.has(templates[appliedTemplate].id) ? "observed-tree" : "preview-only"}`}><span>Template</span><strong>{templates[appliedTemplate].title}</strong><small>{sourceTreeObserved.has(templates[appliedTemplate].id) ? "源端已观察核心结构；本地可编辑复现" : "源端已采集预览内容；精确节点树待采集"}</small><button className="secondary" onClick={() => setModal({ kind: "templates" })}><LayoutTemplate size={15} /> Change template</button></div>}
        <div className="builder">
          <aside className="node-panel">
            <label className="device-toggle"><input type="checkbox" defaultChecked /> <span>On</span> Show on device</label>
            <div className="panel-tabs"><button className={builderTab === "settings" ? "active" : ""} onClick={() => setBuilderTab("settings")}>Layout settings</button><button className={builderTab === "tree" ? "active" : ""} onClick={() => setBuilderTab("tree")}>Elements</button></div>
            <div className="add-element-wrap"><button className="add-element" onClick={() => setAddElementOpen((open) => !open)}><Plus size={17} /> Add element</button>{addElementOpen && <div className="add-element-menu">{componentCatalog.map((item) => <button key={item} onClick={() => addElement(item)}>{item}</button>)}</div>}</div>
            <div className="node-list">{builderNodes.map((node) => {
              const isDragging = dragState?.id === node.id;
              const dropClass = dragState?.targetId === node.id ? `drop-${dragState.position}` : "";
              return <button type="button" data-node-id={node.id} style={{ paddingLeft: `${7 + (node.depth ?? 0) * 15}px` }} className={`node ${activeNode === node.id ? "selected" : ""} ${isDragging ? "dragging" : ""} ${dropClass}`} onPointerDown={(event) => beginNodeDrag(event, node.id)} onPointerMove={updateNodeDropTarget} onPointerUp={dropNode} onPointerCancel={() => setDragState(null)} onClick={() => { setBuilderTab("tree"); setActiveNode(node.id); }} key={node.id} aria-grabbed={isDragging}><span className="drag-handle" aria-hidden="true"><GripVertical size={14} /></span><i>{node.type[0]}</i><strong>{node.type}</strong><small>{node.label}</small></button>;
            })}</div>
            <div className="builder-locales"><div><strong>Localization</strong><button className="icon tiny unknown-action" onClick={() => markUnknown(builderBoundary)}><Plus size={15} /></button></div><button className="locale-row">English <i /></button><button className="locale-row selected">French <i /></button><button className="locale-row">Simplified Chinese <i /></button><button className="add-locale unknown-action" onClick={() => markUnknown(builderBoundary)}>Add locale</button></div>
          </aside>
          <div className="canvas-area"><div className="device-controls"><button><Smartphone size={16} /> iPhone 15 Pro <ChevronDown size={14} /></button>{appliedTemplate !== null && <div className="preview-mode" aria-label="Preview mode"><button className={previewMode === "source" ? "active" : ""} onClick={() => setPreviewMode("source")}>Source visual</button><button className={previewMode === "editable" ? "active" : ""} disabled={!sourceTreeObserved.has(templates[appliedTemplate].id)} onClick={() => setPreviewMode("editable")}>Editable structure</button></div>}<button className="icon" title="Preview orientation"><RotateCw size={15} /></button><button className="icon" title="Preview visibility"><Eye size={15} /></button></div><PaywallPreview nodes={builderNodes} template={appliedTemplate !== null ? templates[appliedTemplate] : null} mode={previewMode} activeNode={activeNode} onSelect={(id) => { setActiveNode(id); setBuilderTab("tree"); }} />{appliedTemplate !== null && previewMode === "source" && <p className="source-preview-note">源端模板画面，与模板库卡片一一对应。</p>}{appliedTemplate !== null && previewMode === "editable" && <p className="source-preview-note">源端已观察核心结构的本地可编辑复现。</p>}<p className="preview-disclaimer">All prices, titles, and offers displayed are placeholders. The actual data from App Store and Google Play will be shown in the app.</p></div>
          <aside className="property-panel">{builderTab === "settings" ? <LayoutSettings markUnknown={markUnknown} boundary={builderBoundary} setModal={setModal} appliedTemplate={appliedTemplate} /> : <BuilderProperties active={active} setBuilderTab={setBuilderTab} markUnknown={markUnknown} boundary={builderBoundary} templateLinks={templateLinks} setTemplateLinks={setTemplateLinks} updateNode={updateBuilderNode} removeNode={removeBuilderNode} addNestedNode={addNestedElement} />}</aside>
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

function BuilderProperties({ active, setBuilderTab, markUnknown, boundary, templateLinks, setTemplateLinks, updateNode, removeNode, addNestedNode }) {
  const [tab, setTab] = useState("content");
  const type = active?.type ?? "Elements";
  const componentBoundary = {
    ...boundary,
    feature: `${type} detailed behavior`,
    known: `The visible ${type} inspector fields are reconstructed from the observed Builder panel.`,
    unknown: "Live preview propagation, validation, persistence, and any field not captured verbatim remain unverified.",
  };

  const tabBar = <div className="property-tabs"><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>Content</button><button className={tab === "style" ? "active" : ""} onClick={() => setTab("style")}>Style</button><button className={tab === "layout" ? "active" : ""} onClick={() => setTab("layout")}>Layout</button></div>;
  const nodeEditor = <EditableNodeControls active={active} updateNode={updateNode} removeNode={removeNode} />;

  if (type === "Links") {
    return <div className="property-scroll"><h3>Links</h3>{nodeEditor}{tabBar}{tab === "content" ? <><LinkOption title="Terms of service" checked fields={[["Link text", "Terms"], ["Link URL", templateLinks.terms, (value) => setTemplateLinks((current) => ({ ...current, terms: value }))]]} /><LinkOption title="Privacy policy" checked fields={[["Link text", "Privacy"], ["Link URL", templateLinks.privacy, (value) => setTemplateLinks((current) => ({ ...current, privacy: value }))]]} /><LinkOption title="Restore button" checked fields={[["Button text", "Restore"], ["Action ID", "Restore"]]} /><LinkOption title="Login button" fields={[]} /></> : <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (active?.id === "hero-image") {
    return <div className="property-scroll"><h3>Hero Image</h3>{nodeEditor}{tabBar}{tab === "content" && <HeroMediaContent active={active} updateNode={updateNode} />}{tab === "style" && <HeroMediaStyle />}{tab === "layout" && <HeroMediaLayout />}</div>;
  }

  if (type === "List item" || type === "Today" || /^Item \d+$/.test(type) || /^Day \d+$/.test(type)) {
    return <div className="property-scroll"><h3>List item</h3>{nodeEditor}{tabBar}{tab === "content" && <ListItemContent active={active} updateNode={updateNode} />}{tab === "style" && <ListItemStyle />}{tab === "layout" && <ListItemLayout />}</div>;
  }

  if (["Text", "Header", "Headline", "Subhead", "Caption", "Legal", "Top Text"].includes(type) || /^(HEADER|Header|Caption|Title|Repeats|Subheader) \d+$/.test(type)) {
    return <div className="property-scroll"><h3>Text</h3>{nodeEditor}{tabBar}{tab === "content" && <TextContent active={active} updateNode={updateNode} />}{tab === "style" && <TextStyle />}{tab === "layout" && <TextLayout />}</div>;
  }

  if (["Image", "Black Friday Image"].includes(type) || /^Image \d+$/.test(type)) {
    return <div className="property-scroll"><h3>Image</h3>{nodeEditor}{tabBar}{tab === "content" && <ImageContent active={active} updateNode={updateNode} />}{tab === "style" && <ImageStyle />}{tab === "layout" && <ImageLayout />}</div>;
  }

  if (["Button", "Purchase Button"].includes(type)) {
    return <div className="property-scroll"><h3>Button</h3>{nodeEditor}{tabBar}{tab === "content" && <ButtonContent type={type} active={active} updateNode={updateNode} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (type === "Web Paywall Button") {
    return <div className="property-scroll"><h3>Web Paywall Button</h3>{nodeEditor}{tabBar}{tab === "content" && <WebButtonContent active={active} updateNode={updateNode} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (type === "List" || /^List \d+$/.test(type) || ["Feature list", "Features"].includes(type)) {
    return <div className="property-scroll"><h3>List</h3>{nodeEditor}{tabBar}{tab === "content" && <ListContent active={active} addNestedNode={addNestedNode} />}{tab === "style" && <ListStyle />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (type === "Carousel") {
    return <div className="property-scroll"><h3>Carousel</h3>{nodeEditor}{tabBar}{tab === "content" && <CarouselContent active={active} addNestedNode={addNestedNode} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (type === "Card") {
    return <div className="property-scroll"><h3>Card</h3>{nodeEditor}{tabBar}{tab === "content" && <CardContent active={active} addNestedNode={addNestedNode} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="Card has a Style tab, but its exact field labels were not retained in the inspection notes." />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="Card has a Layout tab, but its exact field labels were not retained in the inspection notes." />}</div>;
  }

  if (type === "Timer") {
    return <div className="property-scroll"><h3>Timer</h3>{nodeEditor}{tabBar}{tab === "content" && <TimerContent active={active} updateNode={updateNode} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
  }

  if (type === "Products") {
    return <div className="property-scroll"><h3>Products</h3>{nodeEditor}{tabBar}{tab === "content" && <ProductsContent active={active} boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "style" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "layout" && <InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} />}</div>;
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

  return <div className="property-scroll"><h3>{type}</h3>{nodeEditor}{tabBar}<InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="This source-observed template layer can be edited as content and a layer label. Its dedicated inspector fields were not captured, so the demo does not substitute a generic configuration panel." /></div>;
}

function EditableNodeControls({ active, updateNode, removeNode }) {
  if (!active) return null;
  return <section className="node-editor"><Field label="Element content"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><Field label="Layer label"><input value={active.label ?? ""} onChange={(event) => updateNode(active.id, { label: event.target.value })} /></Field><button className="danger" onClick={() => removeNode(active.id)}>Delete element</button></section>;
}

function InspectorBoundary({ boundary, markUnknown, message = "The visible entry is retained, but the next detailed behavior has not been verified." }) {
  return <div className="unknown-rule"><CircleHelp size={17} /><span>{message}<button className="text-action unknown-action" onClick={() => markUnknown(boundary)}>View evidence</button></span></div>;
}

function HeroMediaContent({ active, updateNode }) {
  const kind = active.config?.mediaType ?? "Image";
  const updateConfig = (patch) => updateNode(active.id, { config: { ...active.config, ...patch } });
  return <><Field label="Media"><div className="segmented"><button className={kind === "Image" ? "active" : ""} onClick={() => updateConfig({ mediaType: "Image" })}>Image</button><button className={kind === "Video" ? "active" : ""} onClick={() => updateConfig({ mediaType: "Video" })}>Video</button></div></Field><Field label={`${kind} file`}><button className="upload"><Upload size={18} /> Click here or drag the file to this area to upload<small>PNG, JPG, max size 10MB.</small></button></Field><Field label="Custom media ID"><input value={active.config?.customMediaId ?? ""} placeholder="Enter custom media ID" onChange={(event) => updateConfig({ customMediaId: event.target.value })} /></Field></>;
}

function TextContent({ active, updateNode }) {
  return <><Field label="Text Required"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><Field label="Max lines"><ConfigInput active={active} updateNode={updateNode} name="maxLines" fallback="2" /></Field><Field label="Overflow"><div className="select-like">Scale text <ChevronDown size={14} /></div></Field></>;
}

function ImageContent({ active, updateNode }) {
  const useCustomMediaId = Boolean(active.config?.useCustomMediaId);
  const updateConfig = (patch) => updateNode(active.id, { config: { ...active.config, ...patch } });
  return <><Field label="Image file"><button className="upload"><Upload size={18} /> Click here or drag the file to this area to upload<small>PNG, JPG, max size 10MB.</small></button></Field><label className="switch-row"><input type="checkbox" checked={useCustomMediaId} onChange={(event) => updateConfig({ useCustomMediaId: event.target.checked })} /><span>{useCustomMediaId ? "On" : "Off"}</span><strong>Use custom media ID</strong></label>{useCustomMediaId && <Field label="Custom media ID"><input value={active.config?.customMediaId ?? ""} placeholder="Enter custom media ID" onChange={(event) => updateConfig({ customMediaId: event.target.value })} /></Field>}</>;
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

function CardContent({ active, addNestedNode }) {
  const [open, setOpen] = useState(false);
  const allowed = ["List", "Button", "Image", "Text", "Timer"];
  return <><h4>Card items</h4><div className="nested-add-wrap"><button className="text-action" onClick={() => setOpen((value) => !value)}><Plus size={15} /> Add element</button>{open && <div className="nested-add-menu">{allowed.map((type) => <button key={type} onClick={() => { addNestedNode(active.id, type); setOpen(false); }}>{type}</button>)}</div>}</div></>;
}

function TimerContent({ active, updateNode }) {
  return <><h4>Time format</h4><div className="split-fields"><Field label="Format"><div className="select-like">hh:mm:ss <ChevronDown size={14} /></div></Field><Field label="Time separator"><div className="select-like">Colon <ChevronDown size={14} /></div></Field></div><h4>Timer text</h4><Field label="Start value"><input value={active.content ?? "04:59:59"} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><div className="split-fields"><Field label="Text before"><ConfigInput active={active} updateNode={updateNode} name="textBefore" fallback="" placeholder="Enter text here" /></Field><Field label="Text after"><ConfigInput active={active} updateNode={updateNode} name="textAfter" fallback="" placeholder="Enter text here" /></Field></div><h4>Timer mode</h4><Field label=""><div className="select-like">Reset timer on every paywall view <ChevronDown size={14} /></div></Field></>;
}

function ToggleContent({ node, updateNode, boundary, markUnknown }) {
  const [title = "", secondary = ""] = (node.content ?? "").split("|");
  const defaultState = node.defaultState ?? "Off";
  const updateCopy = (nextTitle, nextSecondary) => updateNode(node.id, { content: `${nextTitle}|${nextSecondary}` });
  return <>
    <Field label="Default toggle state"><div className="segmented"><button className={defaultState === "Off" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "Off" })}>Off</button><button className={defaultState === "On" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "On" })}>On</button></div></Field>
    <h4 className="inspector-heading">Style</h4><Field label="Fill color"><ColorOpacity color="#ffffff" opacity="100" /></Field><Field label="Border color"><ColorOpacity color="#efeef4" opacity="100" /></Field><Field label="Border thickness"><input defaultValue="1" /></Field><Field label="Corner radius"><input defaultValue="19" /></Field>
    <h4 className="inspector-heading">Toggle color</h4><Field label="Active color"><ColorOpacity color="#c2f01e" opacity="100" /></Field>
    <h4 className="inspector-heading">Text</h4><div className="toggle-state-tabs"><button className="active">Inactive</button><button className="unknown-action" onClick={() => markUnknown(boundary)}>Active</button></div><Field label="Title text"><textarea value={title} onChange={(event) => updateCopy(event.target.value, secondary)} /></Field><Field label="Secondary text"><textarea value={secondary} onChange={(event) => updateCopy(title, event.target.value)} /></Field>
    <h4 className="inspector-heading">Layout</h4><Field label="Padding"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field><h4 className="inspector-heading">Content layout</h4><Field label="Padding"><PaddingInputs values={[16, 16, 16, 16]} /></Field><Field label="Text spacing"><input defaultValue="0" /></Field>
  </>;
}

function TextStyle() {
  return <><Field label="Font"><div className="select-like">System (SF Pro, Roboto) Regular <ChevronDown size={14} /></div></Field><div className="split-fields"><Field label="Size"><input defaultValue="28" /></Field><Field label="Align"><div className="select-like">Center <ChevronDown size={14} /></div></Field></div><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field></>;
}

function TextLayout() {
  return <><Field label="Margin"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field></>;
}

function ButtonContent({ type, active, updateNode }) {
  const purchase = type === "Purchase Button";
  return <><Field label="Button action"><div className="select-like">{purchase ? "Purchase" : "Custom"} <ChevronDown size={14} /></div></Field><Field label="Button action ID"><ConfigInput active={active} updateNode={updateNode} name="actionId" fallback={purchase ? "purchase" : ""} /></Field><Field label="Text"><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field></>;
}

function WebButtonContent({ active, updateNode }) {
  return <><Field label="Open paywall in"><div className="select-like">External browser <ChevronDown size={14} /></div></Field><Field label="Offer"><div className="select-like">Default <ChevronDown size={14} /></div></Field><Field label="Button text"><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><Field label="Secondary text"><ConfigInput active={active} updateNode={updateNode} name="secondaryText" fallback="" placeholder="Enter text here" /></Field></>;
}

function ListContent({ active, addNestedNode }) {
  return <><h4>List items</h4><button className="text-action" onClick={() => addNestedNode(active.id, "List item")}><Plus size={15} /> Add element</button></>;
}

function ListItemContent({ active, updateNode }) {
  const [title = "", caption = ""] = (active.content ?? "").split("|");
  const updateCopy = (nextTitle, nextCaption) => updateNode(active.id, { content: `${nextTitle}|${nextCaption}` });
  return <><Field label="Custom icon"><button className="upload"><Upload size={18} /> Click here or drag the file to this area to upload<small>PNG, JPG, max size 0.5MB.</small></button></Field><h4>Connector</h4><Field label="Thickness"><input defaultValue="0" /></Field><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field><h4>Text</h4><Field label="Title"><textarea value={title} onChange={(event) => updateCopy(event.target.value, caption)} /></Field><Field label="Caption"><textarea value={caption} onChange={(event) => updateCopy(title, event.target.value)} /></Field></>;
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

function CarouselContent({ active, addNestedNode }) {
  return <><h4>Carousel items</h4><button className="text-action" onClick={() => addNestedNode(active.id, "Card")}><Plus size={15} /> Add element</button></>;
}

function ProductsContent({ active, boundary, markUnknown }) {
  return <><Field label="Products grouping"><div className="select-like muted-select">No switch (all products are visible) <ChevronDown size={14} /></div></Field><Field label="Selected product"><div className="select-like">Japanese Ai - 1 Year <ChevronDown size={14} /></div></Field><h4>Products</h4>{active.content ? <p className="property-copy">This template's product content is represented by its Builder layer.</p> : <p className="property-copy">No products added.</p>}<button className="secondary full unknown-action" onClick={() => markUnknown(boundary)}>Add product</button></>;
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
  return <div className="property-scroll layout-settings"><h3>Layout settings</h3><Field label="Template"><div className="inline-select"><span>{appliedTemplate !== null ? templates[appliedTemplate].title : "X template #19"}</span><button className="secondary" onClick={() => setModal({ kind: "templates" })}>Change template</button></div></Field><Field label="Purchase flow"><div className="select-like">Products as list + purchase button <ChevronDown size={14} /></div></Field><Field label="Background color"><div className="color-with-opacity"><div className="color-line"><i /> #212121</div><input defaultValue="100" aria-label="Background opacity" /></div></Field><label className="switch-row"><input type="checkbox" /><span>Off</span><strong>Enable Dark mode</strong></label><Field label="Default font"><div className="select-like">System (SF Pro, Roboto) Regular <ChevronDown size={14} /></div></Field><h4>Content layout</h4><Field label="Default child margin"><div className="four-inputs"><input defaultValue="16" /><input defaultValue="16" /><input defaultValue="0" /><input defaultValue="16" /></div></Field><Field label="Spacing"><input defaultValue="0" /></Field><button className="secondary unknown-action" onClick={() => markUnknown(boundary)}>Add max width</button><section className="top-button"><label className="switch-row"><input type="checkbox" defaultChecked /><span>On</span><strong>Top button 1</strong></label><Field label="Action"><div className="select-like">Close <ChevronDown size={14} /></div></Field><Field label="Action ID"><input disabled defaultValue="Close" /></Field><div className="split-fields"><Field label="Style"><div className="select-like">Icon <ChevronDown size={14} /></div></Field><Field label="Align"><div className="select-like">Left <ChevronDown size={14} /></div></Field></div><Field label="Show after delay"><input type="range" min="0" max="3000" defaultValue="0" /><small>0 ms</small></Field><h4>Style</h4><Field label="Fill color"><div className="color-with-opacity"><div className="color-line"><i /> #121212</div><input defaultValue="50" /></div></Field><Field label="Border color"><div className="color-with-opacity"><div className="color-line"><i /> #121212</div><input defaultValue="100" /></div></Field><Field label="Border thickness"><input defaultValue="0" /></Field><h4>Icon</h4><Field label="Icon"><div className="select-like">Close <ChevronDown size={14} /></div></Field><Field label="Icon color"><div className="color-with-opacity"><div className="color-line light"><i /> #fcffe0</div><input defaultValue="80" /></div></Field></section><label className="switch-row"><input type="checkbox" /><span>Off</span><strong>Top button 2</strong></label></div>;
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
    products: ["1 product"],
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
  const displayTags = (template) => sourceTreeObserved.has(template.id) ? template.tags : ["Source preview", "Structure pending"];
  const filteredTemplates = templates.filter((template) => {
    const productMatch = !filters.products.length || filters.products.some((item) => template.productCount === (item === "1 product" ? 1 : 2));
    const mediaMatch = filters.media === "All" || (filters.media === "With Image or Video" ? ["image", "video"].includes(template.media) : template.media === "none");
    const componentMatch = filters.components.every((item) => sourceVerifiedTemplateComponents[template.id]?.includes(item));
    const lengthMatch = filters.length === "All" || (filters.length === "Short" ? template.title.length < 28 : template.title.length >= 28);
    const backgroundMatch = filters.background === "All" || (filters.background === "Dark" ? ["night", "black", "midnight", "ocean", "halloween"].includes(template.theme) : !["night", "black", "midnight", "ocean", "halloween"].includes(template.theme));
    const categoryMatch = filters.category === "All" || template.category === filters.category;
    return productMatch && mediaMatch && componentMatch && lengthMatch && backgroundMatch && categoryMatch;
  });
  return <Modal title="Choose a template" onClose={onClose} wide><div className="template-modal"><aside><div className="filter-heading"><strong>Filters</strong><span className="filter-count">{filteredTemplates.length}</span></div><p>Number of products</p><Filter group="products" value="1 product" list>1 product (31)</Filter><Filter group="products" value="More than 1 product" list>More than 1 product (56)</Filter><p>Image / video</p><Filter group="media" value="All">All</Filter><Filter group="media" value="With Image or Video">With Image or Video (77)</Filter><Filter group="media" value="No media">No media (3)</Filter><p>Components</p><Filter group="components" value="Free trial toggle" list>Free trial toggle (5)</Filter><Filter group="components" value="Trial timeline" list>Trial timeline (24)</Filter><Filter group="components" value="Reviews" list>Reviews (7)</Filter><Filter group="components" value="Timer" list>Timer (5)</Filter><p>Length</p><Filter group="length" value="All">All</Filter><Filter group="length" value="Short">Short</Filter><Filter group="length" value="Long">Long</Filter><p>Background theme</p><Filter group="background" value="All">All</Filter><Filter group="background" value="Light">Light</Filter><Filter group="background" value="Dark">Dark</Filter><p>Category</p><Filter group="category" value="All">All paywalls</Filter><Filter group="category" value="Popular">Popular</Filter><Filter group="category" value="Seasonal">Seasonal</Filter></aside><div className="template-content"><div className="template-entries"><button className="secondary" onClick={onOpenAi}><WandSparkles size={18} /><span><strong>Generate a Design with AI</strong><small>Don't have a design? Our AI will create a unique paywall for you from scratch.</small></span></button><button onClick={() => markUnknown(missingItems[3])}><Copy size={18} /><span><strong>Copy a Design from Your Apps</strong><small>Reuse a design you've built with Paywall Builder in another app.</small></span></button></div><div className="template-selection-summary">{pendingTemplate ? <><span>Selected template</span><strong>{pendingTemplate.title}</strong><small>{displayTags(pendingTemplate).join(" · ")}</small></> : <span>No template selected</span>}</div><div className="template-grid rich-template-grid">{filteredTemplates.map((template) => { const index = templates.indexOf(template); return <button aria-pressed={pendingSelected === index} className={`template template-${template.theme} ${pendingSelected === index ? "selected" : ""}`} onClick={() => setPendingSelected(index)} key={template.id}><div className="template-source-preview"><SourceTemplateMedia template={template} /></div><strong>{template.title}</strong><small>{displayTags(template).join(" · ")}</small></button>; })}</div>{!filteredTemplates.length && <div className="template-empty">No locally captured Adapty templates match this filter combination.</div>}<div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={pendingSelected === null} onClick={() => onOpenBuilder(pendingSelected)}>Open in Builder</button></div></div></div></Modal>;
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
  const assets = template.assetParts ?? [template.asset];
  if (assets.length === 1) return <img src={assets[0]} alt={`Adapty template: ${template.title}`} />;
  return <div className="source-template-stack">{assets.map((asset) => <img src={asset} alt="" key={asset} />)}</div>;
}
function PaywallPreview({ nodes, template, mode, activeNode, onSelect }) {
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
  if (["Hero Image", "Hero Video"].includes(node.type)) return wrap(<div className="preview-media"><span>{node.type === "Hero Video" || node.config?.mediaType === "Video" ? "VIDEO" : node.content === "knowledge" ? "✦" : ""}</span></div>, "preview-hero");
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
  if (node.type === "Carousel") return children.length ? wrap(<div className="preview-carousel">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-carousel-wrap") : !node.content ? wrap(<div className="preview-card-anchor" />, "preview-card-anchor-wrap") : wrap(<PreviewCarousel content={node.content} />, "preview-carousel-wrap");
  if (node.type === "Timer") return wrap(<div className="preview-timer">{node.content || "04:59:59"}</div>);
  if (node.type === "Products") {
    if (node.variant === "purchase") {
      const [label = "Continue", , price = ""] = node.content.split("|");
      return wrap(<button className="preview-cta"><span>{label}</span>{price && <small>{price}</small>}</button>, "preview-button");
    }
    if (children.length) return wrap(<div className="preview-products">{children.map((child) => <PreviewElement key={child.id} node={child} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} />)}</div>, "preview-products-wrap");
    return wrap(<PreviewProducts content={node.content} />, "preview-products-wrap");
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

function PreviewCarousel({ content }) {
  const slides = (content || "Customer story").split("\n---\n").filter(Boolean);
  const [current, setCurrent] = useState(0);
  const slide = slides[current] ?? slides[0];
  const [title, copy] = slide.split("|");
  return <div className="preview-carousel"><span>★★★★★</span><p>{copy ? <><strong>{title}</strong><small>{copy}</small></> : slide}</p><div><button aria-label="Previous review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index - 1 + slides.length) % slides.length); }}>‹</button><i>{slides.map((_, index) => <b className={index === current ? "active" : ""} key={index}>•</b>)}</i><button aria-label="Next review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index + 1) % slides.length); }}>›</button></div></div>;
}

function PreviewProducts({ content }) {
  const rows = (content || "").split("\n").filter(Boolean).map((row) => { const [name, caption, price] = row.split("|"); return { name, caption, price: price ?? caption }; });
  const [chosen, setChosen] = useState(0);
  return <div className="preview-products">{rows.map((row, index) => <button className={index === chosen ? "chosen" : ""} onClick={(event) => { event.stopPropagation(); setChosen(index); }} key={`${row.name}-${index}`}><span><strong>{row.name}</strong>{row.caption && row.price !== row.caption && <small>{row.caption}</small>}</span><em>{row.price}</em></button>)}</div>;
}

function PreviewToggle({ content, defaultState = "Off" }) {
  const [title = "Not sure? Get free trial", secondary = "Cancel anytime"] = (content || "").split("|");
  const [enabled, setEnabled] = useState(defaultState === "On");
  return <button className={`preview-toggle ${enabled ? "enabled" : ""}`} role="switch" aria-checked={enabled} onClick={(event) => { event.stopPropagation(); setEnabled((value) => !value); }}><span><strong>{title}</strong><small>{secondary}</small></span><i><b /></i></button>;
}

createRoot(document.getElementById("root")).render(<App />);
