import { initialPrivilegeRows } from "../templates/templateDefinitions.js";
import { skuCopy, templateSkuId } from "../productPricing.js";

export const privilegeRowsFor = (node) => node?.config?.privilegeRows ?? initialPrivilegeRows;

export const privilegeComparisons = {
  "standard-vip": [["standard", "非会员"], ["vip", "VIP"]],
  "standard-plus": [["standard", "非会员"], ["plus", "Plus"]],
  "vip-plus": [["vip", "VIP"], ["plus", "Plus"]],
};

export const privilegeColumnsFor = (config) => privilegeComparisons[config?.comparisonMode] ?? privilegeComparisons["standard-vip"];

export function productPackageRows(productNode, variant) {
  const config = productNode?.config ?? {};
  if (Array.isArray(config.packageRows)) return config.packageRows.map((row, index) => {
    const skuId = row.skuId ?? templateSkuId(variant, index);
    return { ...skuCopy(skuId), ...row, skuId };
  });
  if (config.bluePrivilege) {
    const source = helloTalkTemplateDefaults["blue-privilege"];
    return source.plans.map(([name, price, detail], index) => ({
      name, price, skuId: templateSkuId(variant, index),
      supportingCopy: "",
      showSupportingCopy: false,
      monthlyPrice: index === 2 ? "" : detail,
      referencePrice: source.planOriginalPrices?.[index] ?? "",
      showReferencePrice: Boolean(source.planOriginalPrices?.[index]),
      saveCopy: index === 2 ? detail : "",
      showSaveCopy: index === 2,
      savingCopy: source.planSavings?.[index] ?? "",
      showSavingCopy: Boolean(source.planSavings?.[index]),
      badgeText: index === source.badgeProductIndex ? source.badgeLabel : "",
      showBadge: index === source.badgeProductIndex,
    }));
  }
  const legacyRows = (productNode?.content ?? "").split("\n").filter(Boolean);
  if (config.purchasePerCard) return legacyRows.map((line, index) => {
    const [name = "", price = "", detail = ""] = line.split("|");
    return { name, price, skuId: templateSkuId(variant, index), supportingCopy: detail, showSupportingCopy: Boolean(detail) };
  });
  return legacyRows.map((line, index) => {
    const [name = "", price = "", detail = ""] = line.split("|");
    const row = { name, price, skuId: templateSkuId(variant, index), supportingCopy: "", referencePrice: "", saveCopy: "", badgeText: "", showSupportingCopy: false, showReferencePrice: false, showSaveCopy: false, showBadge: false };
    if (variant === "sku-sheet") {
      row.referencePrice = detail;
      row.showReferencePrice = Boolean(detail);
      if (index === 1) { row.badgeText = "sku 折扣 EN"; row.showBadge = config.showOfferBadge !== false; }
    } else if (variant === "payment-recovery") {
      row.monthlyPrice = price;
      if (index === 0 && price === "¥28.17/月") row.totalPrice = "¥338";
      if (index === 0) { row.saveCopy = detail; row.showSaveCopy = config.hasSaveCopy !== false && Boolean(detail); row.badgeText = "30% OFF"; row.showBadge = config.showOfferBadge !== false; }
      else { row.supportingCopy = detail; row.showSupportingCopy = Boolean(detail); }
    } else {
      if (index === 2) { row.saveCopy = detail; row.showSaveCopy = config.hasSaveCopy !== false && Boolean(detail); }
      else if (/\/\s*月/.test(detail)) row.monthlyPrice = detail;
      else { row.supportingCopy = detail; row.showSupportingCopy = Boolean(detail); }
      if (index === 1) { row.badgeText = config.offerBadgeLabel ?? "最受欢迎"; row.showBadge = config.showOfferBadge !== false; }
    }
    if (config.saveCopyText?.trim() && index === (config.defaultSelected ?? 1)) { row.saveCopy = config.saveCopyText.trim(); row.showSaveCopy = config.hasSaveCopy !== false; }
    return row;
  });
}

export function isTextNodeType(type) {
  return ["Text", "Header", "Headline", "Subhead", "Caption", "Legal", "Top Text"].includes(type) || /^(HEADER|Header|Caption|Title|Repeats|Subheader) \d+$/.test(type);
}

export const zhCopy = {
  'Paywall screen': '付费墙页面', 'Welcome Screen': '欢迎页面', 'Step': '步骤', 'Slide': '轮播页', 'Tab': '标签页',
  'Title': '标题', 'Description': '描述', 'Continue button': '继续按钮', 'Close button': '关闭按钮', 'Restore Purchases': '恢复购买',
  'Next step': '下一步骤', 'Previous step': '上一步骤', 'Select a screen': '选择页面', 'Add step': '添加步骤', 'Initial step': '初始步骤',
  'Edit paywall': '编辑付费墙', 'Total': '总计', 'No Data': '暂无数据', 'Japanese': '日语',
  'Paywall': '付费墙', 'Done': '完成', 'Beta': '测试版', 'Not captured': '尚未采集', 'Date range': '日期范围',
  'July 2026': '2026年7月', 'August 2026': '2026年8月', 'No offers for this product': '该商品暂无优惠', 'Black Friday': '黑色星期五',
  'Open the preview with your device camera or copy this test link.': '使用设备相机打开预览，或复制此测试链接。',
  'I confirm this paywall complies with App Store Review Guidelines and Google Play Developer Program Policies.': '我确认此付费墙符合 App Store 审核指南和 Google Play 开发者政策。',
  'Remember this confirmation for all future paywalls.': '后续付费墙沿用本次确认。',
  'This action cannot be undone. Type the complete paywall name to continue.': '此操作无法撤销，请输入完整付费墙名称后继续。',
  'Chats': '对话', 'Examples': '示例', 'Describe your Perfect Paywall': '描述你期望的付费墙',
  'Create paywalls in seconds - no manual setup needed! Generate instantly, customize easily, and launch effortlessly. Save time and stay in control!': '通过描述生成付费墙，并继续自定义配置。',
  "How it works: We combine your prompt with your app's store data to create the most relevant paywalls for you.": '生成方式：结合你的描述与应用商店信息创建付费墙。',
  'Browse examples': '浏览示例', 'Surprise me': '随机示例', 'Generate': '生成', 'Use prompt': '使用此描述',
  'Observed example entry; the prompt body was not opened.': '已观察到示例入口，但尚未查看描述正文。',
  'Copy only the visual Builder configuration. Products and other paywall configuration are not copied.': '仅复制可视化构建器配置，不复制商品及其他付费墙配置。',
  'No source application available': '暂无可用的来源应用', 'Select a Builder paywall': '选择构建器付费墙',
  'Remember to test custom fonts on a device, as they may not display correctly.': '请在设备上测试自定义字体，确认显示正常。',
  'The observed account had no other application design candidate, so this Demo does not invent one.': '当前账户没有其他应用的设计来源，演示不提供虚构候选内容。',
  'Copy Selected Paywall': '复制所选付费墙', 'Observed': '已验证', 'Not reproduced': '尚未复现', 'NEW': '新增',
  'This demo keeps the entry point but does not invent its result.': '演示保留此入口，不模拟未经验证的结果。',
  'Multi-step Paywall': '多步骤付费墙', 'AstroApp Offer': 'AstroApp 优惠模板', 'BookApp Offer': 'BookApp 优惠模板',
  'Wide badge style': '宽角标样式', 'Offer code 01': '优惠码样式 01', 'Offer code 03': '优惠码样式 03',
  'Switch - Free trial': '免费试用开关', 'Switch - Family plans': '家庭套餐开关', 'Switch - Free trial 1 package': '单套餐免费试用开关',
  'Virtual currencies OTP': '一次性点数购买', 'Virtual currencies subscription': '点数订阅', 'Multi-tier 1': '多等级会员样式 1',
  'Recipe book [Web]': '食谱网页购买', 'Social proof [Web]': '口碑网页购买', 'StarFinder [Web]': 'StarFinder 网页购买',
  'CatGPT Plus w/ header image': 'CatGPT 顶图会员模板', 'ConcertBuddy': 'ConcertBuddy 演唱会模板', 'Wabi Sabi v2': '侘寂风格样式 2',
  'Social proof carousel': '口碑评价轮播', 'Mindful moments': '正念时刻', 'Gradient timeline': '渐变时间线',
  'Vertical list of reviews': '纵向评价列表', 'Sharp red background': '鲜红背景', 'CatGPT Dev Tools': 'CatGPT 开发工具模板', 'Cat.io': 'Cat.io 模板',
  "What's included table": '权益说明表', 'Plane background': '飞机背景', 'Comparison table': '权益对比表', 'Begin your journey': '开启你的旅程',
  'Recipe book': '食谱模板', 'OG Template': '经典模板', 'Trail running': '越野跑模板', 'Gym app': '健身应用模板', 'Template 004': '模板 004',
  'Lock icon': '锁定图标样式', 'Feature List': '权益列表', 'RevenueCat themed': 'RevenueCat 主题', 'snowflake': '雪花模板', 'Untitled Paywall': '未命名付费墙', 'Boxer': '拳击模板',
  'Build deeper connections, one conversation at a time': '通过每次对话建立更深的连接',
  "Transform how you communicate and understand each other's needs": '改善沟通，理解彼此需求', 'Speak Easy with Family Plan': '全家轻松学语言',
  'Get premium document management at an exclusive price': '以专属价格解锁高级文档管理', '7-day renewal timeline': '七天续订时间线',
  'START YOUR YOGA JOURNEY TODAY!': '今天开始你的瑜伽之旅', 'Exclusive Weather Insights: Unlock Premium Forecast': '专属天气洞察与高级预报',
  'BE FEARLESS!': '勇敢无畏', 'BLACK FRIDAY 50% OFF': '黑色星期五五折优惠', 'Weekly Activity Planner': '每周活动计划',
  'BEGIN THE NEW YEAR': '开启新的一年', '50% OFF': '五折优惠', 'Make the season brighter!': '点亮这个节日季', 'Limited time only': '限时优惠',
  'Lifetime Access': '终身访问', 'EXPIRES IN: 04:59:59': '剩余时间：04:59:59', 'Choose the plan that works best for you!': '选择适合你的套餐',
  'AI-powered edits': 'AI 智能编辑', 'Get access to collection of audiobooks for kids': '解锁儿童有声书合集', 'Hand-on labs with lecturers': '讲师实践课堂',
  'Get Full Access to The Guide of Medicinal Herbs': '解锁完整草药指南', 'The collection of over 5,000 plants': '收录超过五千种植物',
  'Popular VIP content': '热门会员内容', 'Get Full Access': '解锁完整访问', 'Faster video processing': '更快的视频处理',
  'Design your life': '规划你的生活', 'A beautiful week': '美好的一周', 'Start training today': '今天开始训练', 'Access to premium art styles': '解锁高级艺术风格',
  'Premium Access': '高级访问', 'Less Work More Relaxing with Robot': '让机器人分担工作，轻松生活', 'Unlock the full app with 50% off': '五折解锁完整应用',
  'All lessons unlocked': '解锁全部课程', 'Item One': '示例项目一', 'This is a brief description for the first placeholder item.': '第一个示例项目的简短说明。',
  'Transparent template #3': '透明模板 3', 'Advantageous offer': '专属优惠',
  'RevenueCat · Gradient timeline': 'RevenueCat · 渐变时间线', 'RevenueCat · Switch - Family plans': 'RevenueCat · 家庭套餐开关',
  'RevenueCat · Offer code 01': 'RevenueCat · 优惠码样式 01', 'RevenueCat · Social proof carousel': 'RevenueCat · 口碑评价轮播',
  'RevenueCat · Multi-tier 1': 'RevenueCat · 多等级会员样式 1', 'RevenueCat · Multi-step Paywall': 'RevenueCat · 多步骤付费墙',
  'RevenueCat · Virtual currencies OTP': 'RevenueCat · 一次性点数购买', 'RevenueCat · Recipe book [Web]': 'RevenueCat · 食谱网页购买',
  "RevenueCat · What's included table": 'RevenueCat · 权益说明表', 'RevenueCat · Comparison table': 'RevenueCat · 权益对比表',
  'RevenueCat · Vertical list of reviews': 'RevenueCat · 纵向评价列表',
  "Stack": "容器", "Screen Flow": "多步骤页面", "Screen": "页面", "Feature Table": "权益表格", "Timeline": "时间线", "Social Proof": "口碑展示", "Award": "奖项展示", "Tabs": "选项卡",
  "Paywalls": "付费墙", "Test": "测试",
  "Evidence & gaps": "已验证与缺口", "Only observed behavior is reproduced. These routes are deliberately not invented.": "仅复刻已观察到的行为；未验证的结果不会被编造。",
  "Create paywall": "创建付费墙", "General": "基础设置", "Products": "商品套餐",
  "Paywall name": "付费墙名称", "Paywall screenshot": "付费墙截图", "Upload screenshot": "上传截图",
  "Build no-code paywall": "使用无代码构建器", "Choose a template": "选择模板", "Generate Paywall with AI": "使用 AI 生成付费墙",
  "Copy a Design from Your Apps": "从其他应用复制设计", "Builder & Generator": "构建器与生成器", "Choose how to start": "选择创建方式",
  "Start with the visual Builder.": "从可视化构建器开始。", "Observed template library and filters.": "查看已观察到的模板库与筛选项。",
  "Entry is known; generation output is not.": "入口已验证，生成结果尚未验证。", "Visual Builder configuration only.": "仅复制可视化构建器配置。",
  "Metrics": "指标", "View in analytics": "在分析中查看", "Duplicate": "复制", "Test on Device": "在设备上测试", "Archive": "归档",
  "State": "状态", "Started at": "创建时间", "Open Builder": "打开构建器",
  "Discard": "放弃更改", "Save": "保存", "Save & publish": "保存并发布", "Add product": "添加产品",
  "Template": "模板", "Change template": "更换模板", "Layout settings": "布局设置", "Elements": "组件",
  "Source visual": "源端画面", "Editable structure": "可编辑结构", "Source reference": "源端参考画面",
  "Source preview": "源端画面", "Structure pending": "结构待采集",
  "This template has a captured source visual, but its exact Builder layer tree has not been verified. Editing is intentionally unavailable until the source structure is collected.": "该模板已采集源端画面，但精确的构建器图层树尚未验证；在采集完成前，不开放伪造的编辑能力。",
  "The matching source visual is shown in the device preview. No generic editable nodes are substituted for this template.": "设备预览显示与模板卡一致的源端画面；不会用通用可编辑节点替代该模板。",
  "On": "开启", "Add element": "添加组件", "Localization": "本地化", "English": "英语", "French": "法语", "Simplified Chinese": "简体中文",
  "Add locale": "添加语言", "Content": "内容", "Style": "样式", "Layout": "布局", "Text": "文本", "Image": "图片", "Page Background": "页面背景", "Card": "卡片",
  "Web Paywall Button": "网页付费按钮", "Button": "按钮", "List": "特权列表", "Links": "链接", "Agreement": "同意协议", "Timer": "倒计时", "Carousel": "轮播图",
  "Toggle": "试用开关", "Toggle On": "开关开启状态", "Toggle Off": "开关关闭状态", "Default toggle state": "默认开关状态", "Active": "已开启",
  "Hero Image": "主视觉图片", "Header": "标题", "Headline": "主标题", "Subhead": "副标题", "Caption": "说明文案", "Legal": "法律说明", "Top Text": "顶部文案", "Feature list": "特权列表", "List item": "特权项", "Product": "产品", "Purchase Button": "购买按钮", "Stars": "星级", "Black Friday Image": "黑色星期五图片", "Footer": "底部区域", "Purchase": "购买", "Continue": "继续", "Terms of service": "服务条款",
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
  "Element content": "组件内容", "Delete element": "删除组件", "Preview orientation": "预览方向", "Preview visibility": "预览可见性",
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
  "Enable Dark mode": "启用深色模式", "Content layout": "内容布局", "Default child margin": "子组件默认边距", "Spacing": "间距", "Add max width": "添加最大宽度",
  "Show after delay": "延迟显示", "Fill color": "填充颜色", "Border color": "边框颜色", "Border thickness": "边框粗细", "Icon color": "图标颜色",
  "Upload image": "上传图片", "Upload video": "上传视频", "Choose a file from your computer": "从电脑中选择文件", "Enter custom media ID": "输入自定义媒体 ID",
  "Media": "媒体", "Video": "视频", "Display": "展示方式", "Overlay": "叠加", "Transparent": "透明", "Flat": "平铺", "Tint": "色调",
  "Tint opacity": "色调透明度", "Image height": "图片高度",
  "Terms of Service": "服务条款", "Privacy Policy": "隐私政策",
  "Read the docs": "查看文档", "All placements": "全部展示位置", "States (3)": "状态（3）", "Live": "已发布", "Draft": "草稿", "Inactive": "未启用",
  "Search by paywall name": "按付费墙名称搜索", "Proceeds": "实收款项", "Net proceeds": "净实收款项", "1 - 2 of 2": "第 1 - 2 项，共 2 项",
  "Create a draft and configure it with products and a no-code builder.": "创建草稿，并在商品套餐与无代码构建器中完成设置。",
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
  "Hero media": "主视觉媒体", "Top banner": "顶部横幅", "Language": "语言", "Audience": "用户类型", "Banner deep link": "横幅跳转链接",
  "Copy embedded in this visual": "主视觉内嵌文案", "Supporting copy": "辅助文案", "The headline and supporting copy are composited in the hero image layer, not independent text components.": "主标题与辅助文案属于主视觉图层，不作为独立文本组件。",
  "Privilege rows": "特权行", "Add privilege": "添加特权", "Visible rows": "显示行数", "Privilege": "特权", "Non-member": "非会员", "Each row maps directly to the three columns in the current paywall preview. You can add or remove a privilege without converting the component into free-form text.": "每一行都会直接映射到当前付费墙预览的三列，可独立新增或删除，不会退化为自由文本。",
  "Product packages": "商品套餐", "Visible packages": "显示套餐数", "Default selected": "默认选中", "Show selected package badge": "展示已选套餐角标", "Package": "套餐", "Price": "价格", "Add package": "添加套餐", "Remove package": "删除套餐",
  "List background": "列表背景", "Header background": "表头背景", "VIP column background": "VIP 列背景", "Non-member text": "非会员文字", "VIP text": "VIP 文字", "Product area background": "套餐区域背景", "Selected background": "选中背景", "Selected border": "选中边框", "Badge background": "角标背景", "Badge text": "角标文字",
  "Page behavior": "页面行为", "Confirm before closing": "关闭前二次确认", "This is a page-exit rule, so it is stored with the template but does not alter the resting device preview. Module order is changed directly by dragging items in the Elements panel.": "这是离开页面时生效的规则，会保存到模板中；静态设备预览不会伪造弹窗。组件顺序可在组件面板中直接拖动调整。",
  "Replace": "替换", "Remove media": "删除媒体", "Upload image or video": "上传图片或视频", "PNG, JPG, WebP, MP4, max size 10MB.": "支持 PNG、JPG、WebP、MP4，最大 10MB。",
  "Source media": "源素材", "Français": "法语", "System": "系统", "Serif": "衬线", "Monospace": "等宽", "Colon": "冒号", "Dot": "圆点", "Space": "空格",
  "Limited": "受限", "Included": "已包含", "New privilege": "新增特权", "New package": "新增套餐",
  "Font size": "字号", "Font": "字体", "Weight": "字重", "Regular": "常规", "Medium": "中等", "Bold": "粗体", "Heavy": "特粗", "Center": "居中", "Right": "右对齐",
  "Time format": "时间格式", "Time separator": "时间分隔符", "Timer text": "倒计时文案", "Start value": "初始值", "Timer mode": "倒计时模式", "Reset timer on every paywall view": "每次打开付费墙时重置", "Show timer": "展示倒计时",
  "Background": "背景", "Color": "颜色", "Standard color": "标准颜色", "Text color": "文字颜色", "Title size": "标题字号", "Title font": "标题字体", "Caption size": "说明字号", "Caption font": "说明字体", "Selection color": "选中颜色", "Link color": "链接颜色", "Shadow": "阴影", "Margin": "外边距", "Rounded rectangle": "圆角矩形",
  "Visible link labels": "可见链接文案", "Default selected product": "默认选中产品", "Show offer badge": "展示优惠角标", "Plans": "套餐内容", "One plan per line. Use “name|price|supporting copy” to map each visible plan.": "每行一个套餐，使用“名称|价格|辅助文案”映射预览内容。",
  "Preview mode": "预览模式", "Document style": "文档样式",
  "1 - ": "第 1 - ", " of ": "，共 "
};

export function heroTitleParts(config) {
  const legacyTitle = config.copyTitle ?? "";
  const legacyPrefix = legacyTitle.startsWith("VIP") ? "VIP" : "";
  return {
    prefix: config.copyPrefix ?? legacyPrefix,
    suffix: config.copySuffix ?? (legacyPrefix ? legacyTitle.slice(3).trimStart() : legacyTitle),
  };
}

export const textRunsFor = (node) => Array.isArray(node?.textRuns) ? node.textRuns : [{ text: node?.content ?? "" }];

export const validTextLink = (value) => {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
};

export function safeButtonUrl(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function agreementSegmentsFor(node) {
  if (Array.isArray(node.config?.segments)) return node.config.segments;
  return [
    { id: "intro", type: "text", text: `${node.content || "我已阅读并同意"} ` },
    { id: "terms", type: "link", text: node.config?.termsLabel ?? "服务条款", url: node.config?.termsUrl ?? "" },
    { id: "separator", type: "text", text: "和" },
    { id: "privacy", type: "link", text: node.config?.privacyLabel ?? "隐私政策", url: node.config?.privacyUrl ?? "" },
  ];
}

export function listRowsFor(node) {
  if (Array.isArray(node.config?.listRows)) return node.config.listRows;
  return (node.content ?? "").split("\n").filter(Boolean).map((line) => { const [title = "", caption = ""] = line.split("|"); return { title, caption, showCaption: true, leadingMode: "icon", leading: "✓" }; });
}

export const helloTalkTemplateDefaults = {
  "blue-privilege": { title: "VIP 7折大促", caption: "HelloTalk 世界杯", timer: "18 : 32 : 25", action: "立即领取优惠", legal: "如果当前缴费期前 24 小时没有取消续订，系统会自动续订。", plans: [["1个月", "¥78", "¥78/月"], ["12个月", "¥488", "¥40.67/月"], ["终身", "¥698", "永久会员权益"]], selectedProductIndex: 1, badgeProductIndex: 1, badgeLabel: "🔥 30% OFF", planSavings: ["", "节省 48%", "立减¥1000"], planOriginalPrices: ["", "", "¥1698"] },
  "membership-plans": { title: "解锁谁看了我", caption: "找到志同道合的学习语伴！", timer: "", action: "继续", legal: "如果当前缴费期前 24 小时没有取消续订，系统会自动续订。", plans: [["1个月", "¥78", "¥78/月"], ["12个月", "¥488", "节省48%"], ["终身", "¥998", "永久会员权益"]] },
  "payment-recovery": { title: "错过就要恢复原价了", caption: "现在购买，立享 VIP 专属特权，助力你语言学习", timer: "71:49:28", action: "立即领取优惠", legal: "首年 ¥338，次年系统会以 ¥488 自动续订，可随时取消。", plans: [["1年", "¥28.17/月", "新用户立省 64%"], ["1个月", "¥78/月", ""]] },
  "sku-sheet": { title: "Golden Week Special Offer", caption: "Get 30% Off Annual & Lifetime VIP", timer: "00 : 47 : 04", action: "领取限时优惠", legal: "订阅会在当前周期结束前 24 小时自动续订，可随时在账户设置中取消。", plans: [["12个月", "¥338", "¥488"], ["终身", "¥698", "¥1198"]] },
};
