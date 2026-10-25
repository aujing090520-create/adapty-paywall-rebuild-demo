# 退出优惠与弹层

## 来源与边界

- RevenueCat普通Sheet由按钮Navigate to sheet打开，在按钮内拥有独立子树；不是退出优惠。[官方组件文档](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/components#navigate-to-sheet)
- Exit Offer在付费墙设置中选择另一个Offering及其付费墙；未购买退出时展示，关闭优惠后整个付费墙结束；多步骤只在最后一步退出时触发。[创建配置](https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls#configuring-exit-offers)、[展示流程及SDK限制](https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls#exit-offers)
- Demo没有RevenueCat后端Offering目录：一份明确保存的付费墙及其商品构成本地Offering，标识取付费墙ID。不是复制Sheet，不把相同模板ID当作同一Offering。
- 只演示配置和展示流程，不接真实购买成功、系统关闭拦截、原生SDK或Offering发布。源第38张与四张HT原始模板内容均不改。

## 使用

1. 创建另一份付费墙，配置优惠页面与商品并明确保存。
2. 打开主付费墙构建器，点击“付费墙设置”，选择“退出优惠 Offering”，保存。
3. 点击“交互预览”，关闭主付费墙，展示绑定的已保存优惠页；关闭优惠后会话结束。重新预览开始新的会话。
4. 默认“不展示退出优惠”。不显示自身、未保存或未启用记录，无商品选项禁用；目标丢失时保留绑定并提示修复，预览直接关闭而不循环拦截。

## 台账

| 编号 | 问题 | 处理 | 验证 |
| --- | --- | --- | --- |
| EXIT-01 | Sheet被混同为退出优惠 | 保留现有按钮弹层；独立付费墙设置持有退出Offering绑定 | 组件/模板源树不变；Sheet关闭不触发退出优惠 |
| EXIT-02 | 没有跨付费墙退出展示 | 读取目标明确保存文档，隔离其商品和运行时；优惠关闭结束整体会话 | 原价¥100/优惠价¥50回归，双向绑定不形成链；本地蓝色页退出展示BookApp Offer |
| EXIT-03 | 多步骤和详情导航可能误触发 | 普通Back返回上一步；Dismiss只在最终步骤触发；HT辅助详情页不当作漏斗步骤 | 单页、多步骤、详情页、Sheet、无绑定/失效绑定、重新预览回归通过 |
| EXIT-04 | 生产构建器回读慢 | 同一内部浏览器、同一生产标签按公开路径替代读取，不换权限或重复建页 | 真实阻塞：列表读取成功，进入构建器操作60秒超时；线上交互仍未验收 |

## 验证结果

- 250/250测试通过；构建3.07秒；差异检查通过。
- 独立本地域名reset-audit-20261025.localhost实际保存test 2的BookApp Offer，在test蓝色页绑定后退出展示；关闭优惠显示“付费墙已关闭”，刷新重进仍保留绑定。
- 本地实际截图：/tmp/paywall-exit-offer-local.png。未改用户localhost与原生产域名存储。
- 参数表更新至32类/3331条字段及选项说明。
- 应用52ca6c8已推送main；生产dpl_kevFRZqQAyvooAHa6G8ABzuYjhKw为READY，独立域名41o9y2rp2并绑定原主域名。原主域名HTTP入口index-CScWE1IV.js、index-DnSx8smf.css与本次构建一致。
- 内部浏览器tab11初始创建30秒超时；清单证实页面已创建，使用同标签DOM替代读取40秒后成功取得生产列表。继续进入test 2构建器操作60秒超时并重置kernel，停止重试。没有执行生产重置，不声明点击一定失败或线上交互已通过。
- 最终为部分结果：EXIT-01至03已实现并本地验证，EXIT-04线上交互回读待内部浏览器该页面的操作恢复。无需用户重复授权，其他既有全组件核对项不由此次发布自动关闭。
