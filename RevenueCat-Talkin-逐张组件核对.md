# Talkin RevenueCat 逐张组件核对

来源：2026-10-21 登录 Talkin 项目 RevenueCat 的 `Select template` 画廊，逐张读取可见文字、组件选择标签和图片资源，记录于 `src/revenueCatObserved.json`。用户授权后，逐张创建并保留未发布草稿，核对源编辑器 Layers：41 张中 40 张有 Layers 记录，见 `src/revenueCatEditorObserved.json`；第 38 张 `RevenueCat themed` 的选择动作只生成了空白草稿，源组件结构**未核实**。下表描述预览可见内容与本地映射，不等于源编辑器的逐字段配置。源端真实 SKU、支付结果、优惠码核销、网页跳转目标和完整嵌套关系尚未逐张核验。标题和价格为源模板示例，不应作为 HelloTalk 商品数据。

| 序号 | 源模板 | 可见组件与本地映射 |
| --- | --- | --- |
| 1 | Multi-step Paywall | 三页流程、图片、标题、权益列表、口碑数字、年付/周付套餐、翻页/购买按钮、协议链接 |
| 2 | AstroApp Offer | 背景图片、优惠标题、说明与价格文案、按钮、协议链接；无可见套餐选择卡。编辑器 Layers 已确认还有 `Package`、`Purchase button`、`Footer buttons` 等隐藏层级 |
| 3 | BookApp Offer | 图片、优惠标题/角标、说明与价格文案、按钮、协议链接；无可见套餐选择卡 |
| 4 | Wide badge style | 图片、标题、评价轮播、年付/月付套餐、按钮、协议链接 |
| 5 | Offer code 01 | 标题、优惠码与价格文案、领取按钮、协议链接；无可见套餐选择卡 |
| 6 | Offer code 03 | 图片、标题、优惠码与价格文案、领取按钮、协议链接；无可见套餐选择卡 |
| 7 | Switch - Free trial | 图片、标题、评价轮播、`Enable Family Sharing` 开关、年付/月付套餐、按钮、协议链接 |
| 8 | Switch - Family plans | 图片、标题、权益列表、`Show family plans` 开关、月付/年付套餐、按钮、协议链接 |
| 9 | Switch - Free trial 1 package | 图片、标题、单个年价文案、`Enable Family Sharing` 开关、按钮、协议链接；无可见套餐选择卡 |
| 10 | Virtual currencies OTP | 图片、标题、5 个一次性点数档位、协议链接；预览未显示购买按钮 |
| 11 | Virtual currencies subscription | 图片、标题、权益列表、评分/评价数、6 个月/月付套餐、按钮、协议链接 |
| 12 | Multi-tier 1 | 图片、标题、Standard/Premium 档位切换、权益列表、年付/月付套餐、按钮、协议链接 |
| 13 | Recipe book [Web] | 图片、标题、权益列表、年付/月付套餐、应用内按钮、网页购买入口、协议链接 |
| 14 | Social proof [Web] | 图片、标题、评价轮播、30 天/12 个月/终身套餐、应用内按钮、网页购买入口、协议链接 |
| 15 | StarFinder [Web] | 图片、标题、权益列表、应用内按钮、网页购买入口、协议链接；无可见套餐选择卡 |
| 16 | CatGPT Plus w/ header image | 顶部图片、标题、权益列表、免费试用按钮、协议链接；无可见套餐选择卡 |
| 17 | ConcertBuddy | 背景图片、标题、权益列表、单个年价文案、按钮、协议链接；无可见套餐选择卡 |
| 18 | Wabi Sabi v2 | 图片、双语标题/说明、月/季/年三档套餐、按钮、协议链接 |
| 19 | Social proof carousel | 图片、标题、奖项、评价轮播、30 天/12 个月/终身套餐、按钮、协议链接 |
| 20 | Mindful moments | 图片/内容轮播、月付/年付套餐、按钮、协议链接 |
| 21 | Gradient timeline | 图片、标题、三段时间线、年付/月付套餐、按钮、协议链接 |
| 22 | Vertical list of reviews | 图片、标题、奖项、纵向评价列表、30 天/12 个月/终身套餐、按钮、协议链接 |
| 23 | Sharp red background | 红色背景、标题、年付/月付套餐、权益列表、按钮、协议链接 |
| 24 | CatGPT Dev Tools | 图片、标题、开发权益、年付/月付套餐卡、按钮、协议链接 |
| 25 | Cat.io | 图片、标题、权益列表、年付/月付套餐、按钮、协议链接 |
| 26 | Timeline | 图片、标题、三段时间线、单个年价文案、按钮、协议链接；无可见套餐选择卡 |
| 27 | What's included table | 图片、标题、年付/月付套餐、权益说明卡/表、按钮、协议链接 |
| 28 | Plane background | 背景图片、标题、说明、年付/月付套餐、按钮、协议链接 |
| 29 | Comparison table | 图片、标题、FREE/PRO 权益对比表、单个年价文案、按钮、协议链接；无可见套餐选择卡 |
| 30 | Begin your journey | 标题、说明、权益列表、月付/年付/终身套餐、按钮、协议链接 |
| 31 | Recipe book | 图片、标题、权益列表、年付/月付套餐、按钮、协议链接 |
| 32 | OG Template | 顶部图片、标题/说明、月付/年付套餐、按钮、续订说明与协议链接 |
| 33 | Trail running | 图片、标题/说明、权益列表、月付/年付套餐、按钮、协议链接 |
| 34 | Gym app | 图片、标题/说明、权益列表、月付/年付套餐、按钮、协议链接 |
| 35 | Template 004 | 标题、权益列表、月付/年付套餐、按钮、恢复购买入口 |
| 36 | Lock icon | 图标、标题/说明、权益列表、月付/年付套餐、按钮、协议链接 |
| 37 | Feature List | 图片、标题、权益列表、年付/月付套餐、按钮、协议链接 |
| 38 | RevenueCat themed | 图片、标题/说明、权益列表、年付/月付价格选项、按钮、法律文案/协议链接 |
| 39 | snowflake | 图标、标题/说明、权益列表、单个年价文案、按钮、协议链接；无可见套餐选择卡 |
| 40 | Untitled Paywall | 标题、权益列表、静态评价引述、月付/年付套餐、按钮、协议链接 |
| 41 | Boxer | 图片、评分/评价数、标题、权益列表、单个年价文案、按钮、协议链接；无可见套餐选择卡 |

## 源编辑器组件核对

以下数量来自已打开的 Talkin 草稿 Layers，不是根据截图推断。每张还有 `Text`、`Image`、`Icon`、`Stack`、`Button` 等基础层；这里单列最容易被预览误判的商品、购买按钮和交互组件。`Purchase button` 是源 Layers 的名称，并不证明本地已连通支付。第 27、29 张的表格视觉由嵌套 `Stack/Text/Icon` 构成，源端没有独立 `table` facet。

| 序号 | 源模板 | Package | Purchase button | 其他关键源层 |
| --- | --- | ---: | ---: | --- |
| 1 | Multi-step Paywall | 2 | 1 | Timeline ×1，Item ×3 |
| 2 | AstroApp Offer | 1 | 1 | 无可见套餐卡 |
| 3 | BookApp Offer | 1 | 1 | 无可见套餐卡 |
| 4 | Wide badge style | 2 | 1 | Carousel ×1 |
| 5 | Offer code 01 | 1 | 0 | 无可见套餐卡，优惠码动作未核 |
| 6 | Offer code 03 | 1 | 0 | 无可见套餐卡，优惠码动作未核 |
| 7 | Switch - Free trial | 2 | 1 | Carousel、Toggle、Tab、Tab control 各 ×1 |
| 8 | Switch - Family plans | 2 | 1 | Toggle、Tab、Tab control 各 ×1 |
| 9 | Switch - Free trial 1 package | 1 | 1 | Toggle、Tab、Tab control 各 ×1；无可见套餐卡 |
| 10 | Virtual currencies OTP | 5 | 5 | 每档各有 Purchase button |
| 11 | Virtual currencies subscription | 2 | 1 | 通用文本/图片层 |
| 12 | Multi-tier 1 | 2 | 1 | Tabs、Tab、Tab control 各 ×1，Tab control button ×2 |
| 13 | Recipe book [Web] | 2 | 2 | 两个购买入口位于套餐列表之后，分别为 App 内继续与网页优惠；不是每个套餐一个购买按钮，目标未核 |
| 14 | Social proof [Web] | 3 | 2 | Carousel ×1；两个购买入口，目标未核 |
| 15 | StarFinder [Web] | 1 | 2 | 无可见套餐卡；两个购买入口，目标未核 |
| 16 | CatGPT Plus w/ header image | 1 | 1 | 无可见套餐卡 |
| 17 | ConcertBuddy | 1 | 1 | 无可见套餐卡 |
| 18 | Wabi Sabi v2 | 3 | 1 | 通用文本/图片层 |
| 19 | Social proof carousel | 3 | 1 | Carousel ×1 |
| 20 | Mindful moments | 2 | 1 | Carousel ×1 |
| 21 | Gradient timeline | 2 | 1 | Timeline ×1，Item ×3 |
| 22 | Vertical list of reviews | 3 | 1 | 非 Carousel，评价为纵向层 |
| 23 | Sharp red background | 2 | 1 | 通用文本层 |
| 24 | CatGPT Dev Tools | 2 | 1 | 通用文本/图标层 |
| 25 | Cat.io | 2 | 1 | 通用文本/图标层 |
| 26 | Timeline | 1 | 1 | Timeline ×1，Item ×3；无可见套餐卡 |
| 27 | What's included table | 2 | 1 | 表格视觉由 Stack/Text/Icon 组成 |
| 28 | Plane background | 2 | 1 | 通用文本/图片层 |
| 29 | Comparison table | 1 | 1 | 表格视觉由 Stack/Text/Icon 组成；无可见套餐卡 |
| 30 | Begin your journey | 3 | 1 | 通用文本/图标层 |
| 31 | Recipe book | 2 | 1 | 通用文本/图片层 |
| 32 | OG Template | 2 | 1 | 通用文本/图片层 |
| 33 | Trail running | 2 | 1 | 通用文本/图片层 |
| 34 | Gym app | 2 | 1 | 通用文本/图片层 |
| 35 | Template 004 | 2 | 1 | 通用文本/图标层 |
| 36 | Lock icon | 2 | 1 | 通用文本/图标层 |
| 37 | Feature List | 2 | 1 | 通用文本/图片层 |
| 38 | RevenueCat themed | 未核实 | 未核实 | 只见画廊预览；选择后生成空白草稿 |
| 39 | snowflake | 1 | 1 | 无可见套餐卡 |
| 40 | Untitled Paywall | 2 | 1 | 通用文本/图标层 |
| 41 | Boxer | 1 | 1 | 无可见套餐卡 |

本地还原状态：40 张已将源端 Package 数量与关键交互层逐张对到通用组件节点。无可见选择卡的模板保留商品绑定，但不显示套餐卡；第 10 张复用商品组件的“每档购买”配置。源端字段、视觉尺寸、交互条件及动作目标尚不能称为完整功能复刻。第 38 张仍按预览做临时映射，未标为编辑器已核实。四张 HelloTalk 手动模板不在本轮修改范围。
