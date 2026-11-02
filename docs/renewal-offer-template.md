# 续费折扣页模板

入口：创建付费墙 → 样式类型“续费折扣页” → 选择模板 → “HelloTalk 续费折扣页”。

## 组件归属

- 页面：底部半窗，默认高 440、圆角 24。选中页面根层可切换全屏/半窗/居中窗口及修改尺寸。
- 页头：标题、副标题、关闭按钮；关闭为直接关闭当前付费墙，不默认绑定挽留弹窗。
- 商品套餐：单个续订套餐。内部用布局容器、图片和商品参数搭建卡面、吉祥物、商品标签、总价、周期及划线总价；保留现有价格模式与选中样式能力。
- 倒计时：套餐内的普通倒计时组件，默认每次进入后计时 5 分钟；商品联动默认关闭，可以按已有商品逻辑开启。计时结束显示“优惠已结束”，不擅自决定价格或取消购买。
- 页脚：固定底部的购买按钮、自动续订条款、隐私链接及安全区；商品卡片和其后续费价格说明不放在页脚。

价格、周期、标签用商品参数或 `product.*` 变量，不绑定 SKU、不把截图的 $71.99 和 $79.99 写成真实报价。购买仅模拟，条款和隐私沿用已有打开链接行为。背景使用中性遮罩，不复制参考图中的私聊身份和消息。

所有区域均由原有组件组成，没有新增续费专用组件、渲染器或定价逻辑；卡片里的背景遮片是为上沿曲线留白服务，不是空的业务分组。

## 配图来源

`public/renewal-template/mascot.png` 是内置 image_gen 新制作的透明配图，不是原始品牌设计文件。未裁剪、编辑或粘贴参考截图。可直接在图片组件中替换独立原图。

生成方式：内置 image_gen；最终提示如下。

```text
Create ONE isolated raster illustration asset for the corner of a HelloTalk VIP renewal offer card. Flat clean 2D vector-like mascot: a cheerful golden yellow hand-shaped creature viewed straight-on, palm forming the face, rounded upright fingers, two HUGE round dark brown puppy-like eyes surrounded by thick white rings, two white glints inside each pupil, tiny downturned curved brown mouth conveying pleading sadness. The body is only the yellow palm with a short flat bottom, with a tiny magenta purple superhero cape showing as small triangular wings behind the lower left and lower right. No arms, no legs, no stars, no objects. Keep the same simple rounded silhouette and enormous wide eyes as a mobile-app hand mascot. Warm yellow (#ffda4c) with very subtle soft shading only, flat matte 2D, NOT glossy 3D, no outlines, no shadows under it. Full mascot centered and tightly framed with a little transparent margin. Transparent background. No text, no logo, no UI, no price, no coupon. This is a small standalone decorative character asset, NOT a screenshot or a recreation of a whole screen.
```
