import { revenueCatGallery } from "../revenueCatGallery.js";
import { createSourceTemplateNodes } from "../revenueCatSourceBlueprints.js";

export const privilegeNames = ["解锁谁看了我", "无广告", "更多特权", "隐身访问", "搜索全世界的语伴", "搜索附近的人", "性别搜索", "更多语伴沟通", "增加曝光机会", "无限翻译&字幕", "匹配不同母语语伴", "直播语聊无限时长", "解锁谁赞了我(6140及以后版本废弃)", "发送VIP表情包", "直播语聊房更多语言", "附近帖子"];

export const knownPrivilegeValues = { "解锁谁看了我": ["受限", "✓"], "搜索附近的人": ["受限", "✓"], "增加曝光机会": ["受限", "高达 9 倍"], "无限翻译&字幕": ["10次/天", "无限"], "匹配不同母语语伴": ["各 1 门", "各 3 门"] };

export const initialPrivilegeOrder = ["无限翻译&字幕", "解锁谁看了我", "搜索附近的人", "增加曝光机会", "匹配不同母语语伴", ...privilegeNames.filter((name) => !["无限翻译&字幕", "解锁谁看了我", "搜索附近的人", "增加曝光机会", "匹配不同母语语伴"].includes(name))];

export const referencePrivilegeIcon = "https://ali-global-cdn.hellotalk8.com/testing/vip-manage/8d364b655008356c68732afdcdcd1543.png";

export const initialPrivilegeRows = initialPrivilegeOrder.map((name, index) => ({ id: `privilege-${index}`, name: name === "无限翻译&字幕" ? "无限 AI 翻译&字幕" : name === "增加曝光机会" ? "9倍曝光助推" : name, type: name, standard: knownPrivilegeValues[name]?.[0] ?? "", vip: knownPrivilegeValues[name]?.[1] ?? "", standardMode: knownPrivilegeValues[name]?.[0] === "受限" ? "icon" : "text", standardIcon: "lock", vipMode: knownPrivilegeValues[name]?.[1] === "✓" ? "icon" : "text", vipIcon: "check", pageId: "", detail: { positions: ["蓝色特权页"], title: name === "解锁谁看了我" ? "中秋月夜 | 谁看了我" : name, iconSrc: name === "解锁谁看了我" ? referencePrivilegeIcon : "", images: name === "解锁谁看了我" ? [{ locale: "English", src: "" }, { locale: "Chinese", src: referencePrivilegeIcon }] : [{ locale: "Chinese", src: "" }], titleColor: "#F6C85F", copyKey: name === "解锁谁看了我" ? "Unlock_Visitors_page" : "", descriptionColor: "#FFF8E7", descriptionKey: name === "解锁谁看了我" ? "Unlock_Visitors_page_desc" : "" } }));

export const templates = [
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
  { id: "rc-gradient-timeline", title: "渐变权益时间线", subtitle: "RevenueCat · Gradient timeline", tags: ["2 products", "Trial timeline"], productCount: 2, media: "none", components: ["Trial timeline"], category: "Popular", theme: "clean", visual: "rc-gradient-timeline", previewTone: "teal", sourceProvider: "RevenueCat", sourceTemplate: "Gradient timeline", isNew: true },
  { id: "rc-family-plans", title: "家庭套餐开关", subtitle: "RevenueCat · Switch - Family plans", tags: ["2 products", "Toggle"], productCount: 2, media: "none", components: ["Toggle"], category: "Popular", theme: "clean", visual: "rc-family-plans", previewTone: "blue", sourceProvider: "RevenueCat", sourceTemplate: "Switch - Family plans", isNew: true },
  { id: "rc-offer-code", title: "优惠码促销", subtitle: "RevenueCat · Offer code 01", tags: ["1 product", "Offer code"], productCount: 1, media: "none", components: ["Offer code"], category: "Seasonal", theme: "sale", visual: "rc-offer-code", previewTone: "coral", sourceProvider: "RevenueCat", sourceTemplate: "Offer code 01", isNew: true },
  { id: "rc-social-proof", title: "口碑评价轮播", subtitle: "RevenueCat · Social proof carousel", tags: ["3 products", "Reviews", "Social Proof", "Award"], productCount: 3, media: "none", components: ["Reviews", "Social Proof", "Award"], category: "Popular", theme: "clean", visual: "rc-social-proof", previewTone: "olive", sourceProvider: "RevenueCat", sourceTemplate: "Social proof carousel", isNew: true },
  { id: "rc-multi-tier", title: "会员等级与套餐", subtitle: "RevenueCat · Multi-tier 1", tags: ["2 products", "Tabs"], productCount: 2, media: "none", components: ["Tabs"], category: "Popular", theme: "clean", visual: "rc-multi-tier", previewTone: "purple", sourceProvider: "RevenueCat", sourceTemplate: "Multi-tier 1", isNew: true },
  { id: "rc-multi-step", title: "多步骤付费墙", subtitle: "RevenueCat · Multi-step Paywall", tags: ["2 products", "Multi-step"], productCount: 2, media: "none", components: ["Multi-step"], category: "Popular", theme: "clean", visual: "rc-multi-step", previewTone: "blue", sourceProvider: "RevenueCat", sourceTemplate: "Multi-step Paywall", isNew: true },
  { id: "rc-credits-onetime", title: "一次性点数商品", subtitle: "RevenueCat · Virtual currencies OTP", tags: ["5 products", "Credits"], productCount: 5, media: "none", components: ["Credits"], category: "Popular", theme: "clean", visual: "rc-credits-onetime", previewTone: "teal", sourceProvider: "RevenueCat", sourceTemplate: "Virtual currencies OTP", isNew: true },
  { id: "rc-web-purchase", title: "双渠道购买", subtitle: "RevenueCat · Recipe book [Web]", tags: ["2 products", "Web purchase"], productCount: 2, media: "none", components: ["Web purchase"], category: "Popular", theme: "clean", visual: "rc-web-purchase", previewTone: "olive", sourceProvider: "RevenueCat", sourceTemplate: "Recipe book [Web]", isNew: true },
  { id: "rc-feature-table", title: "权益说明表", subtitle: "RevenueCat · What's included table", tags: ["2 products", "Feature table"], productCount: 2, media: "none", components: ["Feature table"], category: "Popular", theme: "clean", visual: "rc-feature-table", previewTone: "purple", sourceProvider: "RevenueCat", sourceTemplate: "What's included table", isNew: true },
  { id: "rc-comparison-table", title: "权益对比表", subtitle: "RevenueCat · Comparison table", tags: ["1 product", "Feature table"], productCount: 1, media: "none", components: ["Feature table"], category: "Popular", theme: "clean", visual: "rc-comparison-table", previewTone: "blue", sourceProvider: "RevenueCat", sourceTemplate: "Comparison table", isNew: true },
  { id: "rc-review-list", title: "纵向评价列表", subtitle: "RevenueCat · Vertical list of reviews", tags: ["3 products", "Reviews", "Award"], productCount: 3, media: "none", components: ["Reviews", "Award"], category: "Popular", theme: "clean", visual: "rc-review-list", previewTone: "coral", sourceProvider: "RevenueCat", sourceTemplate: "Vertical list of reviews", isNew: true },
  ...revenueCatGallery,
  { id: "ht-blue-privilege", title: "蓝色特权页", subtitle: "蓝色特权对比与商品套餐", tags: ["3 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-blue", visual: "ht-blue", documentTemplate: "blue-privilege", prdScreenshot: "/ht-prd-screenshots/blue-privilege.png" },
  { id: "ht-membership-plans", title: "HelloTalk 会员套餐页", subtitle: "会员订阅方案与访客示例轮播", tags: ["3 products", "Carousel"], productCount: 3, media: "image", components: ["Carousel"], category: "Popular", theme: "ht-plans", visual: "ht-plans", documentTemplate: "membership-plans", prdScreenshot: "/ht-prd-screenshots/membership-plans.jpg" },
  { id: "ht-payment-recovery", title: "HelloTalk 支付未完成页", subtitle: "支付恢复与倒计时优惠", tags: ["2 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-recovery", visual: "ht-recovery", documentTemplate: "payment-recovery", prdScreenshot: "/ht-prd-screenshots/payment-recovery.png" },
  { id: "ht-sku-sheet", title: "HelloTalk SKU 半窗", subtitle: "横版促销视觉与套餐选择", tags: ["2 products", "Timer"], productCount: 2, media: "image", components: ["Timer"], category: "Popular", theme: "ht-sku", visual: "ht-sku", documentTemplate: "sku-sheet", prdScreenshot: "/ht-prd-screenshots/sku-sheet.jpg" },
];

export const node = (id, type, content = "", depth = 0, extra = {}) => ({ id, type, label: "", content, depth, ...extra });

export const documentProductColors = {
  productColors: true,
  badgeGradient: ["#003bec", "#3ed6ea", "#bbff62"],
  selectedBorderGradient: ["#003bec", "#3ed6ea", "#bbff62"],
  selectedBackground: "#ffffff",
  saveTextColor: "#2e89ff",
  purchaseTextGradient: ["#ffffff", "#ffffff", "#ffffff"],
  purchaseBackgroundGradient: ["#003bec", "#3ed6ea", "#bbff62"],
};

export function createBuilderNodes(templateId = "knowledge") {
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const hero = (depth = 0) => node("hero-image", "Hero Image", template.visual, depth, { theme: template.theme });
  const pending = (id, type, depth = 0) => node(id, type, "", depth, { sourcePending: true });

  if (template.isGallery) return createSourceTemplateNodes(template, node);

  if (template.id === "rc-gradient-timeline") {
    return [
      node("rc-timeline-header", "Header", "解锁完整会员体验", 0, { variant: "headline" }),
      node("rc-timeline-steps", "Timeline", "", 0, { config: { accentColor: "#458d7a", lineColor: "#c5ded6", listRows: [{ title: "现在", caption: "立即使用全部功能" }, { title: "抢先体验", caption: "新功能开放测试时收到提醒" }, { title: "专属支持", caption: "获得问题反馈与帮助" }] } }),
      node("rc-timeline-products", "Products", "年度|$69.99/年|约 $5.83/月\n月度|$9.99/月|按月订阅", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-timeline-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#458d7a" } }),
      node("rc-timeline-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-family-plans") {
    return [
      node("rc-family-header", "Header", "解锁所有训练功能", 0, { variant: "headline" }),
      node("rc-family-benefits", "List", "个性化训练|根据你的进度调整每日计划\n进度追踪|预测比赛表现并查看训练曲线\n专业训练|力量与灵活性课程", 0),
      node("rc-family-toggle", "Toggle", "显示家庭套餐|切换套餐类型", 0, { defaultState: "Off", config: { onColor: "#6c78d8", offColor: "#d9dde0", linkedProductsId: "rc-family-products" } }),
      node("rc-family-products", "Products", "月度|$9.99/月|按月订阅\n年度|$69.99/年|约 $5.83/月\n家庭月度||\n家庭年度||", 0, { config: { defaultSelected: 1, packageLayout: "vertical", productTemplate: "rc-family-plans", linkedToggleId: "rc-family-toggle", groupSize: 2 } }),
      node("rc-family-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#6c78d8" } }),
      node("rc-family-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-offer-code") {
    return [
      node("rc-offer-header", "Header", "一份特别优惠", 0, { variant: "headline" }),
      node("rc-offer-caption", "Text", "以当前配置的商品与优惠为准", 0, { variant: "body" }),
      node("rc-offer-code-text", "Text", "25OFFSUMMER", 0, { variant: "section", config: { color: "#a82b43", backgroundColor: "#ffe3ea" } }),
      node("rc-offer-products", "Products", "年度优惠|$44.99/年|原价 $59.99", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-offer-action", "Button", "领取优惠", 0, { config: { action: "Purchase", backgroundColor: "#a82b43" } }),
      node("rc-offer-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-social-proof") {
    return [
      node("rc-social-header", "Header", "看看会员体验", 0, { variant: "headline" }),
      node("rc-social-caption", "Text", "评价与荣誉内容为模板示例，请替换为真实材料", 0, { variant: "body" }),
      node("rc-social-award", "Award", "年度应用奖", 0, { config: { title: "年度应用奖", source: "模板示例", accentColor: "#9a7a27" } }),
      node("rc-social-reviews", "Carousel", "评价示例一|这里展示第一条用户反馈\n---\n评价示例二|这里展示第二条用户反馈\n---\n评价示例三|这里展示第三条用户反馈", 0, { config: { itemCount: 3, initialSlide: 0 } }),
      node("rc-social-products", "Products", "30 天|$9.99|短期体验\n12 个月|$69.99|年度订阅\n终身|$119.99|一次购买", 0, { config: { defaultSelected: 1, packageLayout: "horizontal" } }),
      node("rc-social-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#637b3e" } }),
      node("rc-social-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-multi-tier") {
    return [
      node("rc-tier-header", "Header", "升级高级会员", 0, { variant: "headline" }),
      node("rc-tier-tabs", "Tabs", "", 0, { config: { tabs: [{ id: "standard", title: "标准", description: "基础权益" }, { id: "premium", title: "高级", description: "全部权益与优先支持" }], defaultTab: 1 } }),
      node("rc-tier-benefits", "List", "无广告星图|随时查看夜空\n实时提醒|追踪卫星与空间站\n观测记录|保存个人观测笔记\n直播与社区|参加互动活动", 0),
      node("rc-tier-products", "Products", "年度|$69.99/年|约 $5.83/月\n月度|$9.99/月|按月订阅", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-tier-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#7a50ad" } }),
      node("rc-tier-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-multi-step") {
    return [
      node("rc-flow", "Screen Flow", "", 0, { config: { defaultStep: 0 } }),
      node("rc-flow-intro", "Screen", "第一屏：权益", 1),
      node("rc-flow-intro-title", "Header", "开始你的免费体验", 2, { variant: "headline" }),
      node("rc-flow-intro-list", "List", "睡得更好|放松身心、改善睡眠\n专注当下|养成每日练习习惯\n开启清晨|用更轻松的方式开始一天", 2),
      node("rc-flow-intro-next", "Button", "继续", 2, { config: { action: "NextScreen", backgroundColor: "#3787a8" } }),
      node("rc-flow-proof", "Screen", "第二屏：口碑", 1),
      node("rc-flow-proof-title", "Header", "短时练习，持续改变", 2, { variant: "headline" }),
      node("rc-flow-proof-rating", "Social Proof", "模板演示评分", 2, { config: { rating: 4.8, count: "示例数据", caption: "请替换为真实评价" } }),
      node("rc-flow-proof-next", "Button", "继续", 2, { config: { action: "NextScreen", backgroundColor: "#3787a8" } }),
      node("rc-flow-offer", "Screen", "第三屏：套餐", 1),
      node("rc-flow-offer-title", "Header", "解锁完整体验", 2, { variant: "headline" }),
      node("rc-flow-offer-list", "List", "助眠内容|睡前引导练习\n习惯养成|提醒与连续记录\n进步反馈|查看练习变化", 2),
      node("rc-flow-offer-products", "Products", "年度|$69.99/年|年度订阅\n每周|$2.99/周|按周订阅", 2, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-flow-offer-action", "Button", "继续", 2, { config: { action: "Purchase", backgroundColor: "#3787a8" } }),
      node("rc-flow-offer-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 2),
    ];
  }

  if (template.id === "rc-credits-onetime") {
    return [
      node("rc-credits-title", "Header", "为账户添加点数", 0, { variant: "headline" }),
      node("rc-credits-note", "Text", "一次性商品；点数与价格由所选 SKU 决定", 0, { variant: "body" }),
      node("rc-credits-products", "Products", "25 点|$2.99|约 5 秒视频\n50 点|$9.99|约 10 秒视频\n100 点|$17.99|约 20 秒视频\n250 点|$24.99|约 50 秒视频\n500 点|$39.99|约 100 秒视频", 0, { config: { defaultSelected: 0, packageLayout: "vertical", productTemplate: "rc-credits-onetime" } }),
      node("rc-credits-action", "Button", "购买点数", 0, { config: { action: "Purchase", backgroundColor: "#147a84" } }),
      node("rc-credits-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-web-purchase") {
    return [
      node("rc-web-title", "Header", "解锁全部内容", 0, { variant: "headline" }),
      node("rc-web-benefits", "List", "精选内容|获得完整内容库\n持续更新|不断获得新推荐\n优先支持|更快得到帮助", 0),
      node("rc-web-products", "Products", "年度|$69.99/年|按年订阅\n月度|$9.99/月|按月订阅", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-web-app", "Button", "在应用内继续", 0, { config: { action: "Purchase", backgroundColor: "#607c44" } }),
      node("rc-web-caption", "Text", "或者选择网页购买", 0, { variant: "body" }),
      node("rc-web-link", "Web Paywall Button", "前往网页购买", 0, { config: { action: "WebCheckout", autoDismiss: true, backgroundColor: "#355a74" } }),
      node("rc-web-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-feature-table") {
    return [
      node("rc-included-title", "Header", "会员包含哪些权益", 0, { variant: "headline" }),
      node("rc-included-products", "Products", "年度|$69.99/年|约 $5.83/月\n月度|$9.99/月|按月订阅", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-included-table", "Feature Table", "", 0, { config: { columns: ["权益"], rows: [{ name: "AI 观星指南", values: ["识别星空中的天体"] }, { name: "实时任务", values: ["追踪卫星与空间站"] }, { name: "沉浸式探索", values: ["查看宇宙可视化内容"] }, { name: "行星追踪", values: ["交互查看天体位置"] }, { name: "事件提醒", values: ["不错过重要天象"] }] } }),
      node("rc-included-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#7654a7" } }),
      node("rc-included-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-comparison-table") {
    return [
      node("rc-compare-title", "Header", "升级你的学习体验", 0, { variant: "headline" }),
      node("rc-compare-table", "Feature Table", "", 0, { config: { columns: ["免费", "Pro"], rows: [{ name: "作业追踪", values: ["✓", "✓"] }, { name: "AI 学习计划", values: ["—", "✓"] }, { name: "更多卡片", values: ["受限", "无限"] }, { name: "番茄钟", values: ["—", "✓"] }, { name: "笔记整理", values: ["基础", "高级"] }] } }),
      node("rc-compare-products", "Products", "年度|$69.99/年|按年订阅", 0, { config: { defaultSelected: 0, packageLayout: "vertical" } }),
      node("rc-compare-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#315fc2" } }),
      node("rc-compare-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "rc-review-list") {
    return [
      node("rc-review-title", "Header", "看看用户的体验", 0, { variant: "headline" }),
      node("rc-review-award", "Award", "编辑推荐", 0, { config: { title: "编辑推荐", source: "模板示例，请替换真实奖项", accentColor: "#cf6a45" } }),
      node("rc-review-items", "List", "用户评价 1|这里展示第一条用户评价\n用户评价 2|这里展示第二条用户评价\n用户评价 3|这里展示第三条用户评价", 0, { config: { listRows: [{ title: "用户评价 1", caption: "这里展示第一条用户评价", leadingMode: "text", leading: "★" }, { title: "用户评价 2", caption: "这里展示第二条用户评价", leadingMode: "text", leading: "★" }, { title: "用户评价 3", caption: "这里展示第三条用户评价", leadingMode: "text", leading: "★" }] } }),
      node("rc-review-products", "Products", "30 天|$9.99|短期体验\n12 个月|$69.99|年度订阅\n终身|$119.99|一次购买", 0, { config: { defaultSelected: 1, packageLayout: "vertical" } }),
      node("rc-review-action", "Button", "继续", 0, { config: { action: "Purchase", backgroundColor: "#cf6a45" } }),
      node("rc-review-links", "Links", "恢复购买 · 服务条款 · 隐私政策", 0),
    ];
  }

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
      node("hero-image", "Hero Image", template.visual, 0, { theme: template.theme, config: { copyPrefix: "VIP", copySuffix: "7折大促", copyCaption: "HelloTalk 世界杯", deepLink: "", overlayImageEnabled: true, overlayImageLeft: 8, overlayImageTop: 27, overlayImageWidth: 14 } }),
      node("benefits", "List", "", 0, { label: "特权对比", config: { bluePrivilege: true, privilegeRows: initialPrivilegeRows, maxVisibleRows: 5, headerBackground: "#f1f1f1", vipColumnBackground: "#ffffff", backgroundColor: "#f5f5f5", secondaryColor: "#bdbdbd", accentColor: "#ffb40d" } }),
      node("products", "Products", "", 0, { config: { bluePrivilege: true, productTemplate: "blue-privilege", packageLayout: "horizontal", badgeGradient: ["#003bec", "#3ed6ea", "#bbff62"], selectedBorderGradient: ["#003bec", "#3ed6ea", "#bbff62"], selectedBackground: "#ffffff", saveTextColor: "#2e89ff", purchaseTextGradient: ["#ffffff", "#ffffff", "#ffffff"], purchaseBackgroundGradient: ["#6783d8", "#bbff62", "#bbff62"] } }),
      node("timer", "Timer", "18:32:25", 0, { config: { bluePrivilege: true, enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view", locale: "English", prefixColor: "#303487", digitColor: "#303487", digitBackgroundColor: "#8ced75" } }),
      node("agreement", "Agreement", "我已阅读并同意", 0, { config: { showCheckbox: true, required: true, termsLabel: "服务条款", termsUrl: "", privacyLabel: "隐私政策", privacyUrl: "" } }),
      node("purchase", "Button", "立即领取优惠", 0, { config: { action: "Purchase" } }),
      node("retention", "Card", "", 0, { label: "挽留弹窗", config: { retention: true, title: "错过这次，就要多花 30%😱", timerLabel: "倒计时", timerStart: "71:22:22", buttonText: "立享优惠", cancelText: "忍痛取消", backgroundColor: "#f7f7f7", buttonStartColor: "#ff8600", buttonEndColor: "#ffcd00", buttonTextColor: "#ffffff", titleColor: "#111111", timerColor: "#11bf42", imageSrc: "/ht-retention-gift.png", backgroundImage: "" } }),
      node("legal", "Text", "如果当前缴费期前 24 小时没有取消续订，系统会自动续订，费用将从你的 iTunes 账户收取，你可随时前往 iTunes 商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的服务条款 · 隐私政策", 0, { label: "续订说明", variant: "legal", textRuns: [
        { text: "如果当前缴费期前 24 小时没有取消续订，系统会自动续订，费用将从你的 iTunes 账户收取，你可随时前往 iTunes 商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的" },
        { text: "服务条款", link: "" },
        { text: " · " },
        { text: "隐私政策", link: "" },
      ] }),
    ];
  }

  if (template.id === "ht-membership-plans") {
    return [
      node("carousel", "Carousel", "", 0, { label: "访客示例轮播", config: { initialSlide: 0, slides: [{ id: "member-slide-1", image: "/figma-paywall-assets/member-hero.png", title: "解锁谁看了我", caption: "找到志同道合的学习语伴！" }] } }),
      node("products", "Products", "1个月|¥78|¥78/月\n12个月|¥488|节省48%\n终身|¥998|永久会员权益", 0, { config: { ...documentProductColors, productTemplate: "membership-plans", packageLayout: "standard", defaultSelected: 1, showOfferBadge: true } }),
      node("purchase", "Button", "继续", 0, { config: { action: "Purchase" } }),
      node("legal", "Text", "如果当前缴费期前24小时没有取消续订，系统会自动续订，费用将从你的iTunes账户收取，你可随时前往iTunes商店的设置界面管理自己的订阅设定。有关详细信息，请访问我们的服务条款及隐私政策。", 0, { label: "续订说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 0),
    ];
  }

  if (template.id === "ht-payment-recovery") {
    return [
      node("offer-card", "Card", "", 0, { label: "支付恢复弹窗" }),
      node("headline", "Headline", "错过就要恢复原价了", 1, { variant: "headline", config: { color: "#333333" } }),
      hero(1),
      node("caption", "Text", "现在领取优惠，继续解锁 VIP 专属权益", 1, { variant: "body", config: { color: "#333333" } }),
      node("products", "Products", "1年会员|¥28.17/月|新用户立省 64%\n1个月会员|¥78/月|", 1, { config: { ...documentProductColors, productTemplate: "payment-recovery", packageLayout: "compact", defaultSelected: 0, showOfferBadge: true, selectedBorderGradient: ["#0180ff", "#0180ff", "#0180ff"], selectedBackground: "#d3edff", saveTextColor: "#ffffff", saveBackgroundColor: "#0180ff", purchaseBackgroundGradient: ["#014dff", "#0180ff", "#4ec4ff"] } }),
      node("timer", "Timer", "71:49:28", 1, { config: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view", prefixColor: "#0180ff", digitColor: "#0180ff" } }),
      node("purchase", "Button", "立即领取优惠", 1, { config: { action: "Purchase" } }),
      node("legal", "Text", "首年优惠价，次年按标准价格续订，可随时取消。", 1, { label: "续订说明", variant: "legal" }),
      node("links", "Links", "服务条款 · 隐私政策", 1),
    ];
  }

  if (template.id === "ht-sku-sheet") {
    return [
      node("sku-card", "Card", "", 0, { label: "SKU 半窗" }),
      hero(1),
      node("headline", "Headline", "Golden Week Special Offer", 1, { variant: "headline", config: { color: "#151515" } }),
      node("caption", "Text", "Get 30% Off\nAnnual & Lifetime VIP", 1, { variant: "body", config: { color: "#8f8f8f" }, textRuns: [{ text: "Get " }, { text: "30% Off", color: "#ee3981" }, { text: "Annual & Lifetime VIP", breakBefore: true }] }),
      node("timer", "Timer", "00:47:04", 1, { config: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "倒计时", suffix: "", resetMode: "Reset timer on every paywall view", prefixColor: "#ff842c", digitColor: "#ff842c", digitBackgroundColor: "#000000", digitBackgroundOpacity: 3 } }),
      node("products", "Products", "12个月|¥338|¥488\n终身|¥698|¥1198", 1, { config: { ...documentProductColors, productTemplate: "sku-sheet", packageLayout: "standard", defaultSelected: 0, showOfferBadge: true, hasSaveCopy: false, badgeGradient: ["#ff6a00", "#ff6a00", "#ff6a00"], selectedBorderGradient: ["#ff6a00", "#ffaf02", "#ffcc00"], purchaseBackgroundGradient: ["#ff6a00", "#ffaf02", "#ffcc00"] } }),
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
