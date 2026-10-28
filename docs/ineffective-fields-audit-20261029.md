# 组件无效配置字段复查

## 范围与判断

检查现有33类原生组件的实际配置面板、存储字段及预览消费链路。按“不适用却仍显示 / 控件没有接入渲染 / 被其他字段覆盖”分类，不因内容相同、空间不足或父级约束导致暂时看不出差异而删除合法能力。

保护边界：不重建模板，不调整商品参数、订阅与终身适配规则、价格显示交互和文案来源；不保存用户测试草稿，不接入真实支付或用户接口，既有未跟踪test-results不纳入提交。

## 问题台账

| ID | 级别 | 证据与原因 | 调整及验证 | 状态 |
| --- | --- | --- | --- | --- |
| CF01 | P1 | Stack的横向滚动分支只由dataSource/collapsible激活；普通容器单独开启horizontalScroll未设置overflow | 独立横滑可生效；220px容器、423px内容实际scrollLeft达到203；关闭后移除overflow | 已验证 |
| CF02 | P1 | 折叠容器强制外壳column，原轴向被覆盖；内容没有独立布局空间 | 折叠按钮与内容分开，内容接收轴向/对齐/分布/间距，并分配剩余高度；row/grid/column、gap及分布回归通过 | 已验证 |
| CF03 | P1 | Flow只改defaultIndex，旧initialStepId优先，重新预览或重开后恢复旧页面；面板初值也不一致 | 默认页读取实际初始步骤，选择时同步两个字段；浏览器第二步切第一步、保存读回通过 | 已验证 |
| CF04 | P1 | Icon颜色/不透明度走普通patch，即使正在编辑选中态仍修改默认字段 | 颜色共用既有状态样式通路；图标类型/数字仍为共有内容；选中红色40%与默认原色独立 | 已验证 |
| CF05 | P2 | 旧HTML iframe不消费loadingHeight，却展示加载初始高度字段 | 仅在ZIP/未上传组件适应内容高度时显示；HTML旧值保留，不清空数据；占位高度240px回归通过 | 已验证 |
| CF06 | P2 | TimelineItem末项或相邻项无标记时不绘制连接线，但面板仍展示线宽/颜色/留白 | 按当前结构隐藏不适用的连接线设置，重排恢复原值；浏览器末项0控件、首项1组；7px旧值保留 | 已验证 |
| CF07 | P1 | 倒计时日期只监听change，原生input路径可能只更新外观未写配置 | input/change共用UTC写入，秒精度和清空保留；实际填写过去日期后显示时间到分支 | 已验证 |

## 检查覆盖

- 布局及页面：Screen、Stack、Header、Footer、BottomSheet、Flow。
- 内容及媒体：Text、ProductParameter、Image、Video、Icon、Custom。
- 商品及动作：Package、PurchaseButton、Button、ExpressCheckout、CheckoutState、Wallet。
- 标签与轮播：Tabs、Tab、TabControl、TabButton、Carousel、Slide、PageControl、Indicators。
- 时间及状态：Timeline、TimelineItem、Switch、SwitchCase、Toggle、Countdown、CountdownState。
- 33类真实浏览器面板遍历无控制台错误；对上述问题进行实际控件操作及DOM/样式读回。并非每个字段所有组合均做了浏览器穷举。
- 87份模板、3792节点结构检查通过；每份模板实际挂载React Preview，并对其中活跃的普通Stack执行独立横向滚动字段回归，源文档不变。
- 最终706项测试通过；构建通过。参数参考HTML/Markdown/CSV同步了适用条件与Flow字段归属。

## 保留与限制

填满需要父级可用尺寸、分布需要剩余空间、遮罩需要媒体、默认/选中态需要对应交互状态，这些不是无效字段。只读业务字段及明确标注的Demo动作也未被当作接口已联通。

无真实业务PAG素材，未声称真实PAG播放验收；未验证真实支付、用户画像或服务端接口。不把结构检查与测试数量等同于所有像素或组合绝对无问题。

自动回归见tests/ineffectiveFields.test.js；行为检查清单见docs/evidence/ineffective-fields-20261029.json。
