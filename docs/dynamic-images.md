# 动态图片与访客模板

官方模板新增「孙铭阳定制模版1」，复用页面、页头、图片、文字、布局、商品套餐、商品参数、购买按钮及页脚，不新增专属头像组件。价格沿用模板字段占位展示，不绑定真实SKU。

## 配置

选中任意图片：素材 > 媒体类型「图片」> 图片来源「变量图片」> 图片地址变量。候选为工作区已定义的文字型业务变量；默认图片支持上传或地址输入。固定图片、变量图片、PAG之间切换不删除其他模式的配置。

昵称和说明仍用普通文字的“插入变量”。本模板每位语伴有三个独立参数，共九个：`visitor_1_avatar`、`visitor_1_nickname`、`visitor_1_description`，以及同结构的2、3。变量名称与演示默认值在“条件与联动 > 业务变量”中查看和修改。变量重命名、复制组件、另存模板均保留对应引用。

## 运行时接入

宿主将规则返回的参数作为 `ComponentPreview` 的 `businessParameters` 传入，键与工作区变量键一致：

```jsx
<ComponentPreview
  document={templateDocument}
  businessParameters={{
    visitor_1_avatar: 'https://example.com/avatar.jpg',
    visitor_1_nickname: '语伴昵称',
    visitor_1_description: '规则下发的交流说明',
  }}
/>
```

参数更新时头像与文字同步更新。未传某个键沿用演示默认值；明确传入null或空字符串不偷偷使用演示用户资料。头像为空、非安全图片地址或加载失败时使用组件默认图片；默认图片也失败或未配置时保持原尺寸占位。允许HTTP(S)、站内绝对路径和图片Data URL，拒绝脚本、协议相对地址和带用户名密码的地址。

宿主负责接口鉴权、请求、规则运算和刷新，本次未连接真实用户资料接口。运行时参数不写入模板或本地存储，也不随共享模板上传。普通构建器展示的是可修改的演示默认值，模板另存与共享仍会包含这些显式默认值，不能填入真实用户隐私。

演示头像为独立示例素材，不是参考图中用户的真实资料：
- `/visitor-connection-template/avatar-1.jpg`：https://images.unsplash.com/photo-1534528741775-53994a69daeb
- `/visitor-connection-template/avatar-2.jpg`：https://images.unsplash.com/photo-1500648767791-00dcc994a43e
- `/visitor-connection-template/avatar-3.jpg`：https://images.unsplash.com/photo-1494790108377-be9c29b29330
