# 会员套餐页模板问题处理

## 来源与边界

- 请求：逐条检查并修复飞书“四、会员套餐页模板问题（2026-10-29）”。
- 飞书节点 O6BRw8LPTiQ1RxkZYhUcvEY1nJc，文档 NTdddeAOfo2AsAxTVRvchvCLnsc，读取revision 851；本节只有02/04/05/06四条，不补造缺失编号。
- 已读取会员套餐设计示意 image-09.png 与仓库会员套餐截图；来源图片保持不变。
- 引用RevenueCat项目在当前账号显示Error loading project，未把引用页标为已核对。
- 修改范围为会员模板默认结构与对应回归；不强制改写已有保存的个性化记录，不改蓝色特权页等模板的商品归属，不改真实支付逻辑，不写回飞书文档。
- 发布授权：本次用户修复请求 -> 当前adapty-paywall-rebuild-demo工作树 -> origin aujing090520-create/adapty-paywall-rebuild-demo.git -> main -> 已配置Vercel项目adapty-paywall-rebuild-demo -> https://adapty-paywall-rebuild-demo.vercel.app/。无账号、权限、受众变更；不包含未跟踪test-results。

## 问题台账

| 编号 | 状态 | 证据与处理 | 验收 |
| --- | --- | --- | --- |
| 02 | 本地验证通过 | member/plans-heading和products已移至根Screen的Footer，其他模板保持原布局 | 正文scrollTop从0到30，Footer top=478.896保持不变；3个Package均在Footer，外层滚动保持0 |
| 04 | 本地验证通过 | member/compare-label保留为按钮文字，父Button打开拥有的BottomSheet；内容仅用基础Stack/Text/Icon/Button | 关闭图标及返回套餐按钮均返回；终身Package仍选中，未修改商品数据；独立弹层画板可编辑 |
| 05 | 本地验证通过 | 移除会员默认倒计时及模板Timer标签，补完整续订Text，保留独立取消说明和条款/隐私Button | 模板无Countdown，原三档套餐及其他模板倒计时保留；835项测试与构建通过 |
| 06 | 已按用户确认处理 | 用户选择第1项：沿用固定组件类型与悬停/选中定位，不采用本节的业务名+重命名建议 | 保留统一组件名称及组合折叠；套餐区移至Footer后移除空的member/purchase-area，不减少有独立排版作用的容器 |

## 数据与兼容说明

- 对比弹层默认内容复用项目已有的五项VIP权益；没有声称这些行文案取自无法读取的RevenueCat项目。
- 新结构是普通基础组件树，不添加内部结构固定的特权对比组件；页面展示方式、按钮动作和商品参数仍使用已有配置模型。
- 已保存记录不做强制结构迁移；创建新会员模板或显式更换为会员模板才应用这组默认值。
- 对比内容的媒体与外部权威文案未新增；真实支付与原生SDK不在本轮验收内。
