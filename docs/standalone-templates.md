# 单独售卖模板

三个独立模板及同名创建样式类型：单独售卖-访客、单独售卖-学习语言、单独售卖-直播语聊。创建付费墙后选择对应模板即可；不修改旧模板或用户记录。

## 组件边界

- Screen 全屏，固定 Header 包含状态栏示意与返回/关闭按钮，正文含主视觉、三项 Package 与权益内容，Footer 固定购买范围说明和购买按钮。
- Package 负责商品选择，默认选中第二项；内部使用通用 ProductParameter 展示时长、标签、节省比例和价格。购买按钮沿现有逻辑购买当前选择，返回/关闭也沿现有 Dismiss 行为，仅模拟交易。
- 访客和直播语聊：上方周均价，下方总价；学习语言：上方总价，下方月均价。新增“周价”通用商品参数 ¥{周价}/周，未新增手工价格或 SKU 输入。原价格模式切换保持不变，不改辅助周价；终身商品自动隐藏与已有总价重复的周价，切回订阅可恢复。
- 正文和素材为可编辑文字、图片、图标与布局容器，不是自定义整页组件。三款均提供中文、英文内容，默认中文；切 English 可看参考图英文文案，缺失语言回退中文。商品参数继续使用中文字段名占位。
- 访客数量是示意字段占位，不接入真实访客数据；不显示实际用户的画像或隐私数据。三个范围说明明确不包含其他 VIP 权益。

## 素材

独立 AI 生成素材，不裁剪、贴入或编辑用户整页截图：public/standalone-template/visitor.png、languages.png、live-voice.png。可以在图片组件内替换为原始业务素材；当前版本不冒称与原插画完全相同。

## 生成记录

工具：内置 image_gen。最终提示词如下。
### 访客人物

Create a standalone portrait photograph asset for a mobile visitor-privilege paywall, not a UI screenshot. A friendly young adult East Asian woman in an ivory turtleneck and simple sleeveless knit vest, shoulder-length dark hair, outdoors in a sunlit green park, natural candid smile toward camera, waist-up framing. Clean realistic photography, bright soft daylight. Portrait aspect ratio approximately 3:4. Subject centered with a little space around shoulders. No text, no logo, no frame, no icons, no borders, no phone, no UI. This is a fictional adult person. Opaque photograph background.

### 学习语言

Standalone soft 3D illustration asset for a mobile language-learning subscription page. Square composition. A white round speech bubble in the center contains an open book icon with two bright golden yellow/orange pages. Around it, at diagonal angles, large white speech bubbles partially extend beyond the canvas, containing pale golden greetings: "Hello", "Hola", "こんにちは", "안녕하세요". Very light cool-gray background (#f7f7f7), faint pale lavender shadows, cheerful yellow tones, no purple dominant palette. Center book at x50% y48%, edge bubbles spacious and softly fading. High-quality clean dimensional app illustration, not a page mockup. No phone, no status bar, no buttons, no prices, no headings, no watermark. The artwork must work at mobile width 390px and height250px; avoid dense details.

### 直播语聊

Create one isolated transparent-background 3D app illustration for a voice-room/live-chat paywall. Central large glossy purple round microphone medallion with a white microphone symbol. Around it a pale translucent lavender circular orbit, three small round avatars of diverse friendly fictional adult cartoon people wearing headphones, one purple speech bubble with a white sound waveform upper left, one blue-purple bubble with a white video camera right. Soft polished clay/3D style, clean white highlights, very light lavender translucent rings. Composition fills a square asset, all details legible at 180px. No text, no letters, no UI screenshot, no phone, no page background, no pricing, no buttons, no watermark. Transparent background.

