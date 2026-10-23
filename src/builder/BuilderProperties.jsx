import { isTextNodeType, productPackageRows, zhCopy, listRowsFor, privilegeRowsFor, agreementSegmentsFor, textRunsFor, validTextLink, helloTalkTemplateDefaults, heroTitleParts, privilegeColumnsFor, safeButtonUrl, privilegeComparisons } from './fieldModels.js';
import { PRODUCT_LAYOUTS, productLayout, PRODUCT_PART_DEFAULT_SIZES, HT_PRODUCT_DESIGN_DEFAULTS, PRODUCT_PARTS, validHexColor } from "../products/productStyleModel.js";
import { templates, initialPrivilegeRows, privilegeNames } from "../templates/templateDefinitions.js";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { linkActionFor, visibleLinkLabels } from "../linkActions.js";
import { DEMO_SKUS, PRICE_DISPLAY_MODES, billingMonths, productPriceFields, resolveProductPrice, skuById, skuCopy, templateSkuId } from "../productPricing.js";
import { PRODUCT_REGIONS, contentRegions, moveContentPart } from "../productContentOrder.js";
import { ArrowUp, ArrowDown, CircleHelp, Plus, Upload, X, Eye, EyeOff, GripVertical, Link2, Pencil, RotateCw } from "lucide-react";













export function BuilderProperties({ active, previewFocus, markUnknown, boundary, templateLinks, setTemplateLinks, updateNode, removeNode, addNestedNode, isDocumentTemplate, documentTemplate, pricePreviewMode, setPricePreviewMode, retentionPreviewOpen, onPreviewRetention }) {
  const [tab, setTab] = useState("content");
  useEffect(() => {
    if (previewFocus?.id !== active?.id) {
      const panel = document.querySelector(".property-panel .property-scroll");
      if (panel) panel.scrollTop = 0;
    }
  }, [active?.id]);
  useEffect(() => {
    const panel = document.querySelector(".property-panel .property-scroll");
    panel?.querySelectorAll(".preview-field-focus").forEach((item) => item.classList.remove("preview-field-focus"));
    if (!panel || !active || !previewFocus || previewFocus.id !== active.id) return;
    const fields = [...panel.querySelectorAll(".form-field")];
    const exactField = (labels, root = panel) => labels.map((label) => fields.find((field) => root.contains(field) && field.querySelector(":scope > span")?.textContent?.trim() === label)).find(Boolean);
    const carousel = active.type === "Carousel" && Array.isArray(active.config?.slides);
    const area = carousel && previewFocus.area === "component" ? "media" : previewFocus.area;
    const slide = carousel && tab === "content" ? panel.querySelectorAll(".carousel-slide-list .product-row-editor")[previewFocus.slideIndex ?? Number(active.config.initialSlide ?? 0)] : null;
    const products = active.type === "Products";
    const productRow = products && tab === "content" ? panel.querySelectorAll(".product-package-list .product-row-editor")[previewFocus.slideIndex ?? 0] : null;
    const list = active.type === "List" || /^List \d+$/.test(active.type) || ["Feature list", "Features"].includes(active.type);
    const listRow = list && tab === "content" && previewFocus.slideIndex != null ? (active.id === "benefits" && active.config?.bluePrivilege ? panel.querySelectorAll(".privilege-row-wrap")[previewFocus.slideIndex] : panel.querySelectorAll(".product-row-editor")[previewFocus.slideIndex]) : null;
    const timerField = active.type === "Timer" ? exactField(tab === "content" ? ["Start value"] : tab === "style" ? ["时间字体颜色"] : ["Vertical offset"]) : null;
    const productStyle = products && tab === "position" ? panel.querySelector(`[data-product-part-row="${previewFocus.area?.replace(/^product-/, "")}"]`) ?? panel.querySelector(".product-part-editor") : null;
    const productLayout = products && tab === "layout" ? exactField(["布局类型"]) : null;
    const agreementRow = active.type === "Agreement" && tab === "content" && previewFocus.slideIndex != null ? panel.querySelectorAll(".agreement-segment-editor")[previewFocus.slideIndex] : null;
    const agreementField = active.type === "Agreement" ? tab === "content" ? [...panel.querySelectorAll(".switch-row")].find((field) => field.querySelector("strong")?.textContent?.trim() === "勾选后才能点击按钮") : exactField(tab === "style" ? previewFocus.area === "links" ? ["链接颜色"] : ["文字颜色"] : ["对齐方式"]) : null;
    const carouselContentLabels = { media: ["图片"], headline: ["标题"], caption: ["说明文案"], dots: ["初始展示"] };
    const carouselSection = carousel && tab !== "content" ? panel.querySelector(`[data-inspector-section="${area}"]`) : null;
    const hints = {
      content: { media: ["主视觉媒体", "Media file", "图片"], overlay: ["叠加图片"], headline: ["标题前缀", "标题"], caption: ["辅助文案", "说明文案", "描述"], price: ["商品", "展示名称"], badge: ["角标", "标签"], action: ["点击后", "按钮文案"] },
      style: { media: ["Image fit", "填充方式", "Background color"], overlay: ["图片背景"], headline: ["标题颜色", "文字颜色", "Title prefix color", "Font size"], caption: ["说明颜色", "Text color", "文字颜色"], price: ["价格颜色", "Price color"], badge: ["角标颜色", "标签颜色"], action: ["Fill color", "背景颜色"] },
      layout: { media: ["组件宽度", "组件高度"], overlay: ["距左侧"], headline: ["标题上方间距", "距左侧", "Vertical offset", "Margin"], caption: ["标题与说明间距", "Vertical offset", "Margin"], price: ["套餐最小高度", "布局类型", "Margin"], badge: ["Margin"], action: ["Margin", "Vertical offset"] },
    };
    const target = carouselSection
      ?? (slide && exactField(carouselContentLabels[area] ?? [], slide))
      ?? productRow
      ?? listRow
      ?? timerField
      ?? productStyle
      ?? productLayout
      ?? agreementRow
      ?? agreementField
      ?? exactField(hints[tab]?.[area] ?? [])
      ?? panel.querySelector(".rich-text-run, .form-field, .product-row-editor, .privilege-row-wrap");
    if (!target) return;
    target.classList.add("preview-field-focus");
    const targetBox = target.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    if (targetBox.top < panelBox.top + 88 || targetBox.bottom > panelBox.bottom - 12) panel.scrollTop += targetBox.top - panelBox.top - 88;
    return () => target.classList.remove("preview-field-focus");
  }, [active?.id, previewFocus, tab]);
  const type = active?.type ?? "Elements";
  if (!active) return <div className="property-scroll"><h3>付费墙页面</h3></div>;
  const componentBoundary = {
    ...boundary,
    feature: `${type} detailed behavior`,
    known: `The visible ${type} inspector fields are reconstructed from the observed Builder panel.`,
    unknown: "Live preview propagation, validation, persistence, and any field not captured verbatim remain unverified.",
  };

  const tabBar = <div className="property-tabs"><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>Content</button><button className={tab === "style" ? "active" : ""} onClick={() => setTab("style")}>Style</button><button className={tab === "layout" ? "active" : ""} onClick={() => setTab("layout")}>Layout</button>{type === "Products" && <button className={tab === "position" ? "active" : ""} onClick={() => setTab("position")}>内容排布</button>}</div>;
  const canEditStructure = Boolean(active);
  const nodeEditor = <EditableNodeControls active={active} updateNode={updateNode} removeNode={removeNode} canRemove={canEditStructure} />;

  if (type === "Links") {
    return <div className="property-scroll"><h3>Links</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <LinksContent active={active} updateNode={updateNode} templateLinks={templateLinks} setTemplateLinks={setTemplateLinks} />}{tab === "style" && <LinkStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Agreement") {
    return <div className="property-scroll"><h3>同意协议</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <AgreementContent active={active} updateNode={updateNode} />}{tab === "style" && <AgreementStyle active={active} updateNode={updateNode} />}{tab === "layout" && <><Field label="对齐方式"><div className="segmented">{[["left", "居左"], ["center", "居中"], ["right", "居右"]].map(([value, label]) => <button type="button" key={value} className={(active.config?.align ?? "left") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { align: value })}>{label}</button>)}</div></Field><Field label="外边距"><ConfigInsets active={active} updateNode={updateNode} /></Field><ConfigNumberField label="垂直偏移" active={active} updateNode={updateNode} name="offsetY" fallback={0} min={-120} max={120} suffix="px" /></>}</div>;
  }

  if (active?.id === "hero-image") {
    return <div className="property-scroll"><h3>Hero Image</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <HeroMediaContent active={active} updateNode={updateNode} documentTemplate={documentTemplate} />}{tab === "style" && <HeroStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <HeroLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "List item" || type === "Today" || /^Item \d+$/.test(type) || /^Day \d+$/.test(type)) {
    return <div className="property-scroll"><h3>List item</h3>{nodeEditor}{tabBar}{tab === "content" && <ListItemContent active={active} updateNode={updateNode} />}{tab === "style" && <TextStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (isTextNodeType(type)) {
    return <div className="property-scroll"><h3>Text</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && (Array.isArray(active.config?.tabContents) ? <section className="product-row-editor"><h4>标签切换文案</h4>{active.config.tabContents.map((value, index) => <Field key={index} label={`选项 ${index + 1} 文案`} required><input value={value} onChange={(event) => updateNodeConfig(active, updateNode, { tabContents: active.config.tabContents.map((item, position) => position === index ? event.target.value : item) })} /></Field>)}</section> : <TextContent active={active} updateNode={updateNode} />)}{tab === "style" && <TextStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Page Background") {
    return <div className="property-scroll"><h3>页面背景</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <MediaUploadFields active={active} updateNode={updateNode} label="背景图片" accept="image/*" required />}{tab === "style" && <HeroStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <Field label="图片位置"><select value={active.config?.mediaPosition ?? "center"} onChange={(event) => updateNodeConfig(active, updateNode, { mediaPosition: event.target.value })}><option value="top">顶部</option><option value="center">居中</option><option value="bottom">底部</option></select></Field>}</div>;
  }

  if (["Image", "Video", "Black Friday Image"].includes(type) || /^Image \d+$/.test(type)) {
    return <div className="property-scroll"><h3>{type}</h3>{nodeEditor}{tabBar}{tab === "content" && <MediaUploadFields active={active} updateNode={updateNode} label={type === "Video" ? "视频文件" : "图片文件"} accept={type === "Video" ? "video/mp4,video/quicktime" : "image/*"} required />}{tab === "style" && <HeroStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} showHeight />}</div>;
  }

  if (type === "Icon") {
    return <div className="property-scroll"><h3>图标</h3>{nodeEditor}{tabBar}{tab === "content" && <Field label="图标"><select value={active.config?.iconName ?? "star"} onChange={(event) => updateNodeConfig(active, updateNode, { iconName: event.target.value })}>{[["star", "星标"], ["heart", "喜爱"], ["check", "勾选"], ["shield", "保障"], ["users", "用户"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>}{tab === "style" && <><ConfigColorField label="图标颜色" active={active} updateNode={updateNode} name="color" fallback="#6a31e9" /><ConfigNumberField label="图标大小" active={active} updateNode={updateNode} name="iconSize" fallback={24} min={12} max={96} suffix="px" /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Timeline") {
    return <div className="property-scroll"><h3>时间线</h3>{nodeEditor}{tabBar}{tab === "content" && <TimelineContent active={active} updateNode={updateNode} />}{tab === "style" && <><ConfigColorField label="节点颜色" active={active} updateNode={updateNode} name="accentColor" fallback="#6a31e9" /><ConfigColorField label="连接线颜色" active={active} updateNode={updateNode} name="lineColor" fallback="#d9cafa" /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Social Proof") {
    return <div className="property-scroll"><h3>口碑展示</h3>{nodeEditor}{tabBar}{tab === "content" && <><Field label="人数"><ConfigInput active={active} updateNode={updateNode} name="count" fallback="50,000+" /></Field><Field label="说明"><ConfigInput active={active} updateNode={updateNode} name="caption" fallback="用户好评" /></Field><Field label="评分"><input type="number" min="0" max="5" step="0.1" value={active.config?.rating ?? 5} onChange={(event) => updateNodeConfig(active, updateNode, { rating: event.target.value })} /></Field><Field label="左侧装饰图片地址"><ConfigInput active={active} updateNode={updateNode} name="leftDecorationSrc" fallback="" /></Field><Field label="右侧装饰图片地址"><ConfigInput active={active} updateNode={updateNode} name="rightDecorationSrc" fallback="" /></Field></>}{tab === "style" && <><ConfigColorField label="星标颜色" active={active} updateNode={updateNode} name="accentColor" fallback="#ffb40d" /><TextStyleEditor active={active} updateNode={updateNode} /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Award") {
    return <div className="property-scroll"><h3>奖项展示</h3>{nodeEditor}{tabBar}{tab === "content" && <><Field label="奖项名称" required><ConfigInput active={active} updateNode={updateNode} name="title" fallback="年度精选应用" /></Field><Field label="颁发方"><ConfigInput active={active} updateNode={updateNode} name="source" fallback="编辑推荐" /></Field><Field label="左侧装饰图片地址"><ConfigInput active={active} updateNode={updateNode} name="leftDecorationSrc" fallback="" /></Field><Field label="右侧装饰图片地址"><ConfigInput active={active} updateNode={updateNode} name="rightDecorationSrc" fallback="" /></Field></>}{tab === "style" && <><ConfigColorField label="奖项颜色" active={active} updateNode={updateNode} name="accentColor" fallback="#f3a718" /><TextStyleEditor active={active} updateNode={updateNode} /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Tabs") {
    return <div className="property-scroll"><h3>选项卡</h3>{nodeEditor}{tabBar}{tab === "content" && <TabsContent active={active} updateNode={updateNode} />}{tab === "style" && <><ConfigColorField label="选中颜色" active={active} updateNode={updateNode} name="accentColor" fallback="#6a31e9" /><ConfigColorField label="背景颜色" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f5f3f9" /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Stack") {
    return <div className="property-scroll"><h3>容器</h3>{nodeEditor}{tabBar}{tab === "content" && <CardContent active={active} addNestedNode={addNestedNode} />}{tab === "style" && <CardStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <><Field label="排列方向"><div className="segmented">{[["vertical", "纵向"], ["horizontal", "横向"]].map(([value, label]) => <button type="button" key={value} className={(active.config?.axis ?? "vertical") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { axis: value })}>{label}</button>)}</div></Field><ConfigNumberField label="组件间距" active={active} updateNode={updateNode} name="gap" fallback={8} min={0} max={80} suffix="px" /><ElementLayoutEditor active={active} updateNode={updateNode} /></>}</div>;
  }

  if (type === "Screen Flow") {
    return <div className="property-scroll"><h3>多步骤页面</h3>{nodeEditor}{tabBar}{tab === "content" && <><Field label="初始页面"><input type="number" min="1" value={Number(active.config?.defaultStep ?? 0) + 1} onChange={(event) => updateNodeConfig(active, updateNode, { defaultStep: Math.max(0, Number(event.target.value) - 1) })} /></Field><button type="button" className="text-action" onClick={() => addNestedNode(active.id, "Screen")}><Plus size={15} /> 添加页面</button></>}{tab === "style" && <CardStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Screen") {
    return <div className="property-scroll"><h3>页面</h3>{nodeEditor}{tabBar}{tab === "content" && <><Field label="页面名称" required><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><div className="screen-add-controls">{["Header", "Text", "Image", "List", "Products", "Button", "Links"].map((childType) => <button type="button" className="text-action" key={childType} onClick={() => addNestedNode(active.id, childType)}><Plus size={14} /> {zhCopy[childType] ?? childType}</button>)}</div></>}{tab === "style" && <CardStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Feature Table") {
    return <div className="property-scroll"><h3>权益表格</h3>{nodeEditor}{tabBar}{tab === "content" && <FeatureTableContent active={active} updateNode={updateNode} />}{tab === "style" && <><ConfigColorField label="表头颜色" active={active} updateNode={updateNode} name="accentColor" fallback="#6a31e9" /><ConfigColorField label="背景颜色" active={active} updateNode={updateNode} name="backgroundColor" fallback="#ffffff" /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (["Button", "Purchase Button"].includes(type)) {
    return <div className="property-scroll"><h3>Button</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <ButtonContent active={active} updateNode={updateNode} />}{tab === "style" && <ButtonStyleEditor active={active} updateNode={updateNode} productOwnedColors={isDocumentTemplate && active?.id === "purchase"} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Web Paywall Button") {
    return <div className="property-scroll"><h3>Web Paywall Button</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <WebButtonContent active={active} updateNode={updateNode} />}{tab === "style" && <ButtonStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "List" || /^List \d+$/.test(type) || ["Feature list", "Features"].includes(type)) {
    return <div className="property-scroll"><h3>List</h3>{canEditStructure && nodeEditor}{tabBar}{tab === "content" && <ListContent active={active} updateNode={updateNode} addNestedNode={addNestedNode} />}{tab === "style" && <ListStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Carousel") {
    return <div className="property-scroll"><h3>轮播图</h3>{canEditStructure && nodeEditor}{tabBar}{tab === "content" && <CarouselContent active={active} updateNode={updateNode} addNestedNode={addNestedNode} />}{tab === "style" && <CarouselStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && (Array.isArray(active?.config?.slides) ? <CarouselLayoutEditor active={active} updateNode={updateNode} /> : <ElementLayoutEditor active={active} updateNode={updateNode} />)}</div>;
  }

  if (type === "Card") {
    if (active?.config?.retention) return <div className="property-scroll"><h3>挽留弹窗</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <RetentionContent active={active} updateNode={updateNode} previewOpen={retentionPreviewOpen} onPreview={onPreviewRetention} />}{tab === "style" && <RetentionStyle active={active} updateNode={updateNode} />}{tab === "layout" && <p className="property-copy">弹窗尺寸和各区域高度按 HT 基准图固定，内容变化不撑开页面。</p>}</div>;
    return <div className="property-scroll"><h3>Card</h3>{canEditStructure && nodeEditor}{tabBar}{tab === "content" && <CardContent active={active} addNestedNode={addNestedNode} />}{tab === "style" && <CardStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Timer") {
    return <div className="property-scroll"><h3>Timer</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <TimerContent active={active} updateNode={updateNode} />}{tab === "style" && <TimerStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Products") {
    return <div className="property-scroll"><h3>商品套餐</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}<div className="product-price-mode-control"><Field label="价格样式预览"><select aria-label="价格样式预览" value={pricePreviewMode} onChange={(event) => setPricePreviewMode(event.target.value)}>{PRICE_DISPLAY_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.id} · {mode.label}</option>)}</select></Field><small>仅切换编辑预览，实际展示由分发样式开关决定</small></div>{tab === "content" && <ProductsContent active={active} updateNode={updateNode} pricePreviewMode={pricePreviewMode} />}{tab === "style" && <ProductsStyleEditor active={active} updateNode={updateNode} pricePreviewMode={pricePreviewMode} previewFocus={previewFocus} />}{tab === "layout" && <ProductsLayoutEditor active={active} updateNode={updateNode} />}{tab === "position" && <ProductsPositionEditor active={active} updateNode={updateNode} pricePreviewMode={pricePreviewMode} />}</div>;
  }

  if (type === "Toggle") {
    return <div className="property-scroll"><h3>开关</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <ToggleContent node={active} updateNode={updateNode} boundary={componentBoundary} markUnknown={markUnknown} />}{tab === "style" && <><ConfigColorField label="开启颜色" active={active} updateNode={updateNode} name="onColor" fallback="#6a31e9" /><ConfigColorField label="关闭颜色" active={active} updateNode={updateNode} name="offColor" fallback="#d9dde0" /></>}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (type === "Footer") {
    return <div className="property-scroll"><h3>页脚</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}{tabBar}{tab === "content" && <Field label="页脚文案"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>}{tab === "style" && <TextStyleEditor active={active} updateNode={updateNode} />}{tab === "layout" && <ElementLayoutEditor active={active} updateNode={updateNode} />}</div>;
  }

  if (["Toggle On", "Toggle Off"].includes(type)) {
    return <div className="property-scroll"><h3>{type}</h3>{canEditStructure && <NodeDeleteControl active={active} removeNode={removeNode} />}<p className="property-copy">This is a source-observed toggle state layer.</p><InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="The state layer exists in the source tree. Its detailed fields have not been opened, so this demo does not invent them." /></div>;
  }

  if (type === "Source reference") {
    return <div className="property-scroll"><h3>Source reference</h3><p className="property-copy">This template has a captured source visual, but its exact Builder layer tree has not been verified. Editing is intentionally unavailable until the source structure is collected.</p><InspectorBoundary boundary={boundary} markUnknown={markUnknown} message="The matching source visual is shown in the device preview. No generic editable nodes are substituted for this template." /></div>;
  }

  return <div className="property-scroll"><h3>{type}</h3>{nodeEditor}{tabBar}<InspectorBoundary boundary={componentBoundary} markUnknown={markUnknown} message="This source-observed template layer can be edited as content. Its dedicated inspector fields were not captured, so the demo does not substitute a generic configuration panel." /></div>;
}

function EditableNodeControls({ active, updateNode, removeNode, canRemove = true }) {
  if (!active) return null;
  return <section className="node-editor"><Field label="Element content"><textarea value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>{canRemove && <NodeDeleteControl active={active} removeNode={removeNode} />}</section>;
}

function NodeDeleteControl({ active, removeNode }) {
  return <button className="danger" onClick={() => removeNode(active.id)}>Delete element</button>;
}

function InspectorBoundary({ boundary, markUnknown, message = "The visible entry is retained, but the next detailed behavior has not been verified." }) {
  return <div className="unknown-rule"><CircleHelp size={17} /><span>{message}<button className="text-action unknown-action" onClick={() => markUnknown(boundary)}>View evidence</button></span></div>;
}

function updateNodeConfig(active, updateNode, patch) {
  updateNode(active.id, { config: { ...active.config, ...patch } });
}



export function MediaUploadFields({ active, updateNode, label = "Media file", required = false, accept = "image/*,video/*", sourceSrc = "" }) {
  const inputRef = useRef(null);
  const config = active.config ?? {};
  const currentSrc = config.mediaState === "removed" ? "" : config.mediaSrc || sourceSrc;
  const isVideo = config.mediaType === "Video" || /^video\//.test(accept);
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeConfig(active, updateNode, { mediaState: "custom", mediaSrc: reader.result, mediaName: file.name, mediaType: file.type.startsWith("video/") ? "Video" : "Image" });
    reader.readAsDataURL(file);
  };
  return <><Field label={label} required={required}>{currentSrc && <div className="current-media-preview">{isVideo ? <video src={currentSrc} muted playsInline controls /> : <img src={currentSrc} alt="当前素材预览" />}<span>{config.mediaName || "当前模板素材"}</span></div>}<input ref={inputRef} className="visually-hidden" type="file" accept={accept} onChange={handleFile} /><button className="upload" type="button" onClick={() => inputRef.current?.click()}><Upload size={18} /> {currentSrc ? "替换素材" : isVideo ? "上传视频" : accept === "image/*" ? "上传图片" : "上传图片或视频"}<small>{isVideo ? "MP4、MOV" : accept === "image/*" ? "PNG、JPG、WebP" : "PNG、JPG、WebP、MP4"}，最大 10MB</small></button></Field>{currentSrc && <div className="media-actions"><button type="button" className="secondary" onClick={() => updateNodeConfig(active, updateNode, { mediaState: "removed", mediaSrc: "", mediaName: "" })}>删除媒体</button></div>}</>;
}

function HeroMediaContent({ active, updateNode, documentTemplate }) {
  const config = active.config ?? {};
  const hasEmbeddedCopy = config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined;
  const titleParts = heroTitleParts(config);
  const documentSources = { "blue-privilege": "/figma-paywall-assets/blue-banner.png", "payment-recovery": "/figma-paywall-assets/recovery-bg.png", "sku-sheet": "/figma-paywall-assets/sku-art-alt.png" };
  return <><MediaUploadFields active={active} updateNode={updateNode} label="Hero media" sourceSrc={documentSources[documentTemplate] ?? ""} />{hasEmbeddedCopy && <section className="embedded-copy-editor"><h4>顶部横幅</h4><Field label="横幅跳转链接"><input value={config.deepLink ?? ""} placeholder="https://" onChange={(event) => updateNodeConfig(active, updateNode, { deepLink: event.target.value })} /></Field><HeroOverlayImageField active={active} updateNode={updateNode} /><h4>主视觉内嵌文案</h4><Field label="标题前缀"><input value={titleParts.prefix} onChange={(event) => updateNodeConfig(active, updateNode, { copyPrefix: event.target.value })} /></Field><Field label="标题后缀"><input value={titleParts.suffix} onChange={(event) => updateNodeConfig(active, updateNode, { copySuffix: event.target.value })} /></Field><Field label="辅助文案"><input value={config.copyCaption ?? ""} onChange={(event) => updateNodeConfig(active, updateNode, { copyCaption: event.target.value })} /></Field></section>}</>;
}

function HeroOverlayImageField({ active, updateNode }) {
  const config = active.config ?? {};
  const inputRef = useRef(null);
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeConfig(active, updateNode, { overlayImageSrc: String(reader.result), overlayImageName: file.name, overlayImageEnabled: true });
    reader.readAsDataURL(file);
  };
  return <section className="hero-overlay-editor"><h4>叠加图片</h4><label className="switch-row"><input type="checkbox" checked={config.overlayImageEnabled !== false} onChange={(event) => updateNodeConfig(active, updateNode, { overlayImageEnabled: event.target.checked })} /><span>{config.overlayImageEnabled !== false ? "开启" : "关闭"}</span><strong>展示叠加图片</strong></label><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" onChange={upload} /><div className="hero-overlay-actions"><img src={config.overlayImageSrc || "/ht-vip-badge.svg"} alt="叠加图片预览" /><button type="button" className="secondary" onClick={() => inputRef.current?.click()}><Upload size={16} />{config.overlayImageName ? "替换图片" : "上传图片"}</button>{config.overlayImageSrc && <button type="button" className="text-action" onClick={() => updateNodeConfig(active, updateNode, { overlayImageSrc: "", overlayImageName: "" })}>恢复默认</button>}</div></section>;
}





function TextContent({ active, updateNode }) {
  const runs = textRunsFor(active);
  const commit = (nextRuns) => updateNode(active.id, { textRuns: nextRuns, content: nextRuns.map((run, index) => `${index > 0 && run.breakBefore ? "\n" : ""}${run.text}`).join("") });
  const patch = (index, change) => commit(runs.map((run, position) => position === index ? { ...run, ...change } : run));
  const move = (index, direction) => { const next = [...runs]; const other = index + direction; if (other < 0 || other >= next.length) return; [next[index], next[other]] = [next[other], next[index]]; commit(next); };
  return <div className="rich-text-editor"><h4>文本片段</h4>{runs.map((run, index) => <div className="rich-text-run" key={index}><div className="rich-text-run-head"><strong>片段 {index + 1}</strong><div><button type="button" title="上移片段" aria-label={`上移片段 ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" title="下移片段" aria-label={`下移片段 ${index + 1}`} disabled={index === runs.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" title="删除片段" aria-label={`删除片段 ${index + 1}`} disabled={runs.length === 1} onClick={() => commit(runs.filter((_, position) => position !== index))}><X size={14} /></button></div></div><textarea aria-label={`片段 ${index + 1} 文案`} value={run.text} onChange={(event) => patch(index, { text: event.target.value })} />{index > 0 && <label className="rich-text-line-break"><strong>段前换行</strong><input type="checkbox" checked={!!run.breakBefore} onChange={(event) => patch(index, { breakBefore: event.target.checked })} /><span>{run.breakBefore ? "启用" : "关闭"}</span></label>}<div className="rich-text-tools"><button type="button" title="粗体" aria-label={`片段 ${index + 1} 粗体`} aria-pressed={!!run.bold} onClick={() => patch(index, { bold: !run.bold })}><b>B</b></button><button type="button" title="斜体" aria-label={`片段 ${index + 1} 斜体`} aria-pressed={!!run.italic} onClick={() => patch(index, { italic: !run.italic })}><i>I</i></button><button type="button" title="下划线" aria-label={`片段 ${index + 1} 下划线`} aria-pressed={!!run.underline} onClick={() => patch(index, { underline: !run.underline })}><u>U</u></button><button type="button" title="链接" aria-label={`片段 ${index + 1} 链接`} aria-pressed={run.link !== undefined} onClick={() => patch(index, { link: run.link === undefined ? "" : undefined })}><Link2 size={14} /></button><input type="color" title="片段颜色" aria-label={`片段 ${index + 1} 颜色`} value={/^#[\da-fA-F]{6}$/.test(run.color ?? "") ? run.color : "#171717"} onChange={(event) => patch(index, { color: event.target.value })} /><button type="button" title="使用组件文字颜色" aria-label={`片段 ${index + 1} 重置颜色`} onClick={() => patch(index, { color: undefined })}>×</button></div><div className="rich-text-size"><label htmlFor={`rich-text-size-${index}`}>字号</label><input id={`rich-text-size-${index}`} type="number" min="8" max="72" placeholder="继承" value={run.fontSize ?? ""} onChange={(event) => patch(index, { fontSize: event.target.value || undefined })} /><span>px</span></div>{run.link !== undefined && <input type="url" aria-label={`片段 ${index + 1} 链接地址`} placeholder="https://" value={run.link} onChange={(event) => patch(index, { link: event.target.value })} />}{run.link && !validTextLink(run.link) && <small className="rich-text-error">请输入 http 或 https 地址</small>}</div>)}<button type="button" className="text-action rich-text-add" onClick={() => commit([...runs, { text: "" }])}><Plus size={15} /> 添加片段</button></div>;
}

function ConfigColorField({ label, active, updateNode, name, fallback }) {
  const value = active.config?.[name] ?? fallback;
  return <Field label={label}><div className="color-picker"><input type="color" value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /><input value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></div></Field>;
}

function ProductColorInput({ value, onChange, label }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <span className="product-color-input"><input type="color" aria-label={`${label}色块`} value={validHexColor(value) ? value : "#000000"} onChange={(event) => { setDraft(event.target.value); onChange(event.target.value); }} /><input aria-label={label} value={draft} onChange={(event) => { const next = event.target.value; setDraft(next); if (validHexColor(next)) onChange(next); }} onBlur={() => { if (validHexColor(draft)) onChange(draft); else setDraft(value); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></span>;
}

function ProductColorField({ label, active, updateNode, name, fallback, gradient = false }) {
  const value = active.config?.[name] ?? fallback;
  const colors = gradient ? (Array.isArray(value) && value.length === 3 ? value : fallback) : [value];
  return <div className="product-color-field"><strong>{label}</strong><div className={gradient ? "product-color-stops" : "product-color-single"}>{colors.map((color, index) => <ProductColorInput key={`${name}-${index}`} label={gradient ? `${label} 第${index + 1}段` : label} value={color} onChange={(next) => updateNodeConfig(active, updateNode, { [name]: gradient ? colors.map((item, position) => position === index ? next : item) : next })} />)}</div></div>;
}

function ConfigNumberField({ label, active, updateNode, name, fallback, min = 0, max = 100, step = 1, suffix = "", clampOnBlur = false }) {
  const value = active.config?.[name] ?? fallback;
  const commit = (valueToCommit) => {
    if (valueToCommit === "") return updateNodeConfig(active, updateNode, { [name]: fallback });
    const parsed = Number(valueToCommit);
    updateNodeConfig(active, updateNode, { [name]: Number.isFinite(parsed) ? clampOnBlur ? Math.min(max, Math.max(min, parsed)) : parsed : fallback });
  };
  return <Field label={label}><div className="number-unit"><input type="number" min={min} max={max} step={step} value={value} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} onBlur={(event) => commit(event.target.value)} /><span>{suffix}</span></div></Field>;
}

function ConfigInsets({ active, updateNode, prefix = "margin" }) {
  const config = active.config ?? {};
  const keys = [["Top", "上"], ["Right", "右"], ["Bottom", "下"], ["Left", "左"]];
  const isPadding = prefix.toLowerCase().includes("padding");
  return <div className="four-inputs">{keys.map(([label, key]) => {
    const name = `${prefix}${label}`;
    return <label key={name} className="inset-input"><span>{key}</span><input type="number" min={isPadding ? 0 : -80} aria-label={`${key}${isPadding ? "图片留白" : "外边距"}`} value={config[name] ?? 0} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></label>;
  })}</div>;
}

function HeroInsetEditor({ active, updateNode }) {
  const config = active.config ?? {};
  const edge = (name, label) => <label className={`hero-inset-field hero-inset-${name.toLowerCase()}`}><span>{label}</span><div className="number-unit"><input type="number" min="0" max="240" aria-label={`图片${label}留白`} value={Number(config[`padding${name}`]) || 0} onFocus={(event) => event.currentTarget.select()} onChange={(event) => updateNodeConfig(active, updateNode, { [`padding${name}`]: Math.min(240, Math.max(0, Number(event.target.value) || 0)) })} /><span>px</span></div></label>;
  return <div className="hero-inset-editor"><strong>图片四侧留白</strong><div className="hero-inset-map">{edge("Top", "上")}{edge("Left", "左")}<div className="hero-inset-center" aria-hidden="true"><span>图片</span></div>{edge("Right", "右")}{edge("Bottom", "下")}</div></div>;
}

function HeroOffsetEditor({ active, updateNode }) {
  const value = Math.max(-120, Math.min(120, Number(active.config?.offsetY) || 0));
  return <div className="hero-offset-editor"><div className="hero-offset-heading"><strong>垂直偏移</strong><button type="button" onClick={() => updateNodeConfig(active, updateNode, { offsetY: 0 })} disabled={value === 0}>重置</button></div><div className="hero-offset-control"><input type="range" min="-120" max="120" step="1" aria-label="垂直偏移滑杆" value={value} onChange={(event) => updateNodeConfig(active, updateNode, { offsetY: Number(event.target.value) })} /><div className="number-unit"><input type="number" min="-120" max="120" aria-label="垂直偏移数值" value={active.config?.offsetY ?? 0} onChange={(event) => updateNodeConfig(active, updateNode, { offsetY: event.target.value })} /><span>px</span></div></div><div className="hero-offset-scale"><span>上移</span><span>居中 0</span><span>下移</span></div></div>;
}

function TextStyleEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="fontSize" fallback={28} min={10} max={56} suffix="px" /><Field label="Align"><select value={config.textAlign ?? "center"} onChange={(event) => updateNodeConfig(active, updateNode, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></div><div className="split-fields"><Field label="Weight"><select value={config.fontWeight ?? "700"} onChange={(event) => updateNodeConfig(active, updateNode, { fontWeight: event.target.value })}><option value="400">Regular</option><option value="500">Medium</option><option value="700">Bold</option><option value="900">Heavy</option></select></Field><Field label="Font"><select value={config.fontFamily ?? "system"} onChange={(event) => updateNodeConfig(active, updateNode, { fontFamily: event.target.value })}><option value="system">System</option><option value="serif">Serif</option><option value="mono">Monospace</option></select></Field></div><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="color" fallback="#171717" /><div className="split-fields"><ConfigNumberField label="Opacity" active={active} updateNode={updateNode} name="opacity" fallback={100} min={0} max={100} suffix="%" /><ConfigNumberField label="Max lines" active={active} updateNode={updateNode} name="maxLines" fallback={2} min={1} max={8} suffix="" /></div><label className="switch-row compact-switch"><input type="checkbox" checked={config.scaleText === true} onChange={(event) => updateNodeConfig(active, updateNode, { scaleText: event.target.checked })} /><span>{config.scaleText ? "On" : "Off"}</span><strong>Scale text</strong></label></>;
}

function HeroStyleEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><h4>Visual media</h4>{(config.mediaOverflow !== "scroll" || config.mediaType === "Video") && <Field label="Image fit"><div className="segmented">{[["cover", "Cover"], ["contain", "Contain"]].map(([value, label]) => <button key={value} className={(config.mediaFit ?? "cover") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { mediaFit: value })}>{label}</button>)}</div></Field>}<ConfigColorField label="Background color" active={active} updateNode={updateNode} name="mediaBackgroundColor" fallback="#ffffff" />{(config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined) && <section className="embedded-copy-editor"><h4>Embedded headline</h4><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="copyTitleSize" fallback={30} min={8} max={96} suffix="px" /><ConfigColorField label="Title prefix color" active={active} updateNode={updateNode} name="copyPrefixColor" fallback="#ffffff" /><ConfigColorField label="Title suffix color" active={active} updateNode={updateNode} name="copyTitleColor" fallback="#ffc524" /></div><h4>Embedded supporting copy</h4><div className="split-fields"><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="copyCaptionSize" fallback={16} min={8} max={64} suffix="px" /><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="copyCaptionColor" fallback="#ffffff" /></div></section>}</>;
}

function MediaOverflowEditor({ active, updateNode }) {
  const config = active.config ?? {};
  if (config.mediaType === "Video") return null;
  return <Field label="图片超出组件时"><div className="segmented">{[["clip", "隐藏超出部分"], ["scroll", "组件内滑动"]].map(([value, label]) => <button type="button" key={value} className={(config.mediaOverflow ?? "clip") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { mediaOverflow: value })}>{label}</button>)}</div></Field>;
}

function MediaComponentSizeEditor({ active, updateNode }) {
  return <><h4>组件尺寸</h4><div className="split-fields"><ConfigNumberField label="组件宽度" active={active} updateNode={updateNode} name="mediaWidth" fallback={100} min={20} max={200} suffix="%" /><ConfigNumberField label="组件高度" active={active} updateNode={updateNode} name="mediaHeight" fallback={100} min={20} max={200} suffix="%" /></div></>;
}

function MediaImageSizeEditor({ active, updateNode }) {
  if (active.config?.mediaType === "Video") return null;
  return <><h4>图片尺寸</h4><div className="split-fields"><ConfigNumberField label="图片宽度" active={active} updateNode={updateNode} name="mediaImageWidth" fallback={active.config?.mediaScrollWidth ?? 100} min={10} max={1000} suffix="%" /><ConfigNumberField label="图片高度" active={active} updateNode={updateNode} name="mediaImageHeight" fallback={100} min={10} max={1000} suffix="%" /></div></>;
}

function ElementLayoutEditor({ active, updateNode, showHeight = false }) {
  return <>{showHeight && <><MediaComponentSizeEditor active={active} updateNode={updateNode} /><MediaImageSizeEditor active={active} updateNode={updateNode} /><MediaOverflowEditor active={active} updateNode={updateNode} /></>}<Field label="Margin"><ConfigInsets active={active} updateNode={updateNode} /></Field><ConfigNumberField label="Vertical offset" active={active} updateNode={updateNode} name="offsetY" fallback={0} min={-120} max={120} suffix="px" /></>;
}

function HeroLayoutEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <><MediaComponentSizeEditor active={active} updateNode={updateNode} /><MediaImageSizeEditor active={active} updateNode={updateNode} /><MediaOverflowEditor active={active} updateNode={updateNode} /><label className="switch-row"><input type="checkbox" checked={config.rounded === true} onChange={(event) => updateNodeConfig(active, updateNode, { rounded: event.target.checked })} /><span>{config.rounded ? "On" : "Off"}</span><strong>Rounded rectangle</strong></label>{config.rounded && <ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={0} min={0} max={64} suffix="px" />}<HeroInsetEditor active={active} updateNode={updateNode} /><HeroOffsetEditor active={active} updateNode={updateNode} />{(config.copyPrefix !== undefined || config.copySuffix !== undefined || config.copyTitle !== undefined) && <><section className="embedded-copy-editor"><h4>叠加图片位置</h4><div className="split-fields"><ConfigNumberField label="距左侧" active={active} updateNode={updateNode} name="overlayImageLeft" fallback={8} min={0} max={100} suffix="%" /><ConfigNumberField label="距顶部" active={active} updateNode={updateNode} name="overlayImageTop" fallback={27} min={0} max={100} suffix="%" /></div><ConfigNumberField label="图片宽度" active={active} updateNode={updateNode} name="overlayImageWidth" fallback={14} min={1} max={100} suffix="%" /></section><section className="embedded-copy-editor"><h4>文案位置</h4><div className="split-fields"><ConfigNumberField label="距左侧" active={active} updateNode={updateNode} name="copyLeft" fallback={12} min={0} max={100} suffix="%" /><ConfigNumberField label="距底部" active={active} updateNode={updateNode} name="copyBottom" fallback={15} min={0} max={100} suffix="%" /></div><Field label="Align"><select value={config.copyAlign ?? "left"} onChange={(event) => updateNodeConfig(active, updateNode, { copyAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></section></>}</>;
}

function ButtonStyleEditor({ active, updateNode, productOwnedColors = false }) {
  return <>{!productOwnedColors && <div className="split-fields"><ConfigColorField label="Fill color" active={active} updateNode={updateNode} name="backgroundColor" fallback="#6b2df3" /><ConfigColorField label="Text color" active={active} updateNode={updateNode} name="color" fallback="#ffffff" /></div>}<ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={24} min={0} max={48} suffix="px" /></>;
}

function LinkStyleEditor({ active, updateNode }) {
  return <><div className="split-fields"><ConfigColorField label="Link color" active={active} updateNode={updateNode} name="color" fallback="#8b8b8b" /><ConfigNumberField label="Font size" active={active} updateNode={updateNode} name="fontSize" fallback={11} min={8} max={20} suffix="px" /></div><Field label="Align"><select value={active.config?.textAlign ?? "left"} onChange={(event) => updateNodeConfig(active, updateNode, { textAlign: event.target.value })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></Field></>;
}

function ListStyleEditor({ active, updateNode }) {
  if (active.config?.bluePrivilege) return <><ConfigColorField label="列表背景" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f5f5f5" /><ConfigColorField label="表头背景" active={active} updateNode={updateNode} name="headerBackground" fallback="#f1f1f1" /><div className="split-fields"><ConfigColorField label="VIP 列背景" active={active} updateNode={updateNode} name="vipColumnBackground" fallback="#ffffff" /><ConfigColorField label="VIP 文字" active={active} updateNode={updateNode} name="accentColor" fallback="#ffb40d" /></div><div className="split-fields"><ConfigColorField label="Plus 列背景" active={active} updateNode={updateNode} name="plusColumnBackground" fallback="#fff6d9" /><ConfigColorField label="Plus 文字" active={active} updateNode={updateNode} name="plusColor" fallback="#9b6b1f" /></div><div className="split-fields"><ConfigColorField label="非会员文字" active={active} updateNode={updateNode} name="secondaryColor" fallback="#bdbdbd" /><ConfigColorField label="Plus 勾选" active={active} updateNode={updateNode} name="plusCheckColor" fallback="#00c5aa" /></div></>;
  return <><ConfigColorField label="Background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f5f5f5" /><div className="split-fields"><ConfigColorField label="Standard color" active={active} updateNode={updateNode} name="secondaryColor" fallback="#bdbdbd" /><ConfigColorField label="VIP color" active={active} updateNode={updateNode} name="accentColor" fallback="#ffb40d" /></div></>;
}

function CardStyleEditor({ active, updateNode }) {
  return <><ConfigColorField label="Background" active={active} updateNode={updateNode} name="backgroundColor" fallback="#ffffff" /><div className="split-fields"><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={22} min={0} max={48} suffix="px" /><ConfigNumberField label="Shadow" active={active} updateNode={updateNode} name="shadow" fallback={16} min={0} max={40} suffix="px" /></div></>;
}

function TimerStyleEditor({ active, updateNode }) {
  return <><ConfigColorField label="倒计时文案颜色" active={active} updateNode={updateNode} name="prefixColor" fallback={active.config?.color ?? "#19ad34"} /><div className="split-fields"><ConfigColorField label="时间字体颜色" active={active} updateNode={updateNode} name="digitColor" fallback={active.config?.color ?? "#19ad34"} /><ConfigColorField label="时间背景颜色" active={active} updateNode={updateNode} name="digitBackgroundColor" fallback={active.config?.backgroundColor ?? "#ffd16b"} /></div><ConfigNumberField label="时间背景透明度" active={active} updateNode={updateNode} name="digitBackgroundOpacity" fallback={100} min={0} max={100} suffix="%" /><div className="split-fields"><ConfigNumberField label="前缀字号" active={active} updateNode={updateNode} name="prefixFontSize" fallback="" min={8} max={72} suffix="px" /><ConfigNumberField label="数字字号" active={active} updateNode={updateNode} name="fontSize" fallback="" min={8} max={72} suffix="px" /></div><ConfigNumberField label="后缀字号" active={active} updateNode={updateNode} name="suffixFontSize" fallback="" min={8} max={72} suffix="px" /><ConfigNumberField label="Corner radius" active={active} updateNode={updateNode} name="radius" fallback={6} min={0} max={24} suffix="px" /></>;
}

function CarouselStyleEditor({ active, updateNode }) {
  const config = active.config ?? {};
  const updateConfig = (patch) => updateNodeConfig(active, updateNode, patch);
  return <>{Array.isArray(config.slides) && <><section className="inspector-section" data-inspector-section="media"><h4>图片</h4><Field label="填充方式"><div className="segmented">{[["fill", "拉伸"], ["cover", "铺满"], ["contain", "完整显示"]].map(([value, label]) => <button type="button" key={value} className={(config.imageFit ?? "fill") === value ? "active" : ""} onClick={() => updateConfig({ imageFit: value })}>{label}</button>)}</div></Field><ConfigColorField label="图片背景" active={active} updateNode={updateNode} name="imageBackground" fallback="#e5f1ff" /><ConfigNumberField label="图片圆角" active={active} updateNode={updateNode} name="imageRadius" fallback={0} min={0} max={48} suffix="px" /></section><section className="inspector-section" data-inspector-section="headline"><h4>标题</h4><div className="split-fields"><ConfigColorField label="标题颜色" active={active} updateNode={updateNode} name="titleColor" fallback="#f68920" /><ConfigNumberField label="标题字号" active={active} updateNode={updateNode} name="titleFontSize" fallback={29} min={10} max={72} suffix="px" /></div><Field label="标题字重"><select value={config.titleWeight ?? "700"} onChange={(event) => updateConfig({ titleWeight: event.target.value })}><option value="400">常规</option><option value="500">中等</option><option value="700">加粗</option><option value="900">特粗</option></select></Field></section><section className="inspector-section" data-inspector-section="caption"><h4>说明文案</h4><div className="split-fields"><ConfigColorField label="说明颜色" active={active} updateNode={updateNode} name="captionColor" fallback="#a4a4a4" /><ConfigNumberField label="说明字号" active={active} updateNode={updateNode} name="captionFontSize" fallback={18} min={10} max={48} suffix="px" /></div><Field label="说明字重"><select value={config.captionWeight ?? "400"} onChange={(event) => updateConfig({ captionWeight: event.target.value })}><option value="400">常规</option><option value="500">中等</option><option value="700">加粗</option></select></Field></section></>}<section className="inspector-section" data-inspector-section="dots"><h4>进度点</h4><div className="split-fields"><ConfigColorField label="当前页圆点" active={active} updateNode={updateNode} name="accentColor" fallback="#111111" /><ConfigColorField label="其他页圆点" active={active} updateNode={updateNode} name="secondaryColor" fallback="#dedede" /></div><ConfigNumberField label="圆点大小" active={active} updateNode={updateNode} name="dotSize" fallback={10} min={4} max={32} suffix="px" /></section></>;
}

function CarouselLayoutEditor({ active, updateNode }) {
  const config = active.config ?? {};
  return <>
    <section className="inspector-section" data-inspector-section="media"><h4>图片</h4><ConfigNumberField label="图片高度" active={active} updateNode={updateNode} name="imageHeight" fallback={100} min={30} max={200} suffix="%" /><Field label="图片四侧留白"><ConfigInsets active={active} updateNode={updateNode} prefix="imagePadding" /></Field></section>
    <section className="inspector-section" data-inspector-section="headline"><h4>文字</h4><Field label="对齐方式"><div className="segmented">{[["left", "居左"], ["center", "居中"], ["right", "居右"]].map(([value, label]) => <button type="button" key={value} className={(config.copyAlign ?? "center") === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { copyAlign: value })}>{label}</button>)}</div></Field><ConfigNumberField label="文字左右留白" active={active} updateNode={updateNode} name="copyPaddingX" fallback={19} min={0} max={100} suffix="px" /><ConfigNumberField label="图片与标题间距" active={active} updateNode={updateNode} name="titleTopGap" fallback={10} min={0} max={100} suffix="px" /></section>
    <section className="inspector-section" data-inspector-section="caption"><h4>说明文案</h4><ConfigNumberField label="标题与说明间距" active={active} updateNode={updateNode} name="captionTopGap" fallback={7} min={0} max={100} suffix="px" /></section>
    <section className="inspector-section" data-inspector-section="dots"><h4>进度点</h4><Field label="显示位置"><select aria-label="进度点显示位置" value={config.dotsPlacement ?? "inside"} onChange={(event) => updateNodeConfig(active, updateNode, { dotsPlacement: event.target.value })}><option value="inside">卡片内</option><option value="below">卡片下方</option></select></Field><Field label="样式"><select aria-label="进度点样式" value={config.dotsVariant ?? "dots"} onChange={(event) => updateNodeConfig(active, updateNode, { dotsVariant: event.target.value })}><option value="dots">圆点</option><option value="progress">短横线</option></select></Field><Field label="相邻页预览"><div className="segmented">{[[false, "不显示"], [true, "显示"]].map(([value, label]) => <button type="button" key={label} className={Boolean(config.peekAdjacent) === value ? "active" : ""} onClick={() => updateNodeConfig(active, updateNode, { peekAdjacent: value })}>{label}</button>)}</div></Field><div className="split-fields"><ConfigNumberField label="圆点间距" active={active} updateNode={updateNode} name="gap" fallback={8} min={0} max={48} suffix="px" /><ConfigNumberField label="说明与圆点间距" active={active} updateNode={updateNode} name="dotTopGap" fallback={11} min={0} max={100} suffix="px" /></div><ConfigNumberField label="圆点下方留白" active={active} updateNode={updateNode} name="dotBottomGap" fallback={6} min={0} max={100} suffix="px" /></section>
    <section className="inspector-section" data-inspector-section="component"><h4>组件位置</h4><Field label="外边距"><ConfigInsets active={active} updateNode={updateNode} /></Field><ConfigNumberField label="垂直偏移" active={active} updateNode={updateNode} name="offsetY" fallback={0} min={-120} max={120} suffix="px" /></section>
  </>;
}

function previewColor(value) {
  if (validHexColor(value)) return value.toLowerCase();
  const rgb = value?.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return rgb ? `#${rgb.slice(1).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}` : "#222222";
}

function useProductPreviewDefaults(active, pricePreviewMode) {
  const [defaults, setDefaults] = useState({ parts: {}, frame: {} });
  useLayoutEffect(() => {
    const cards = [...document.querySelectorAll(".phone [data-product-card]")].filter((card) => card.dataset.productNodeId === active.id);
    const card = cards.find((item) => item.classList.contains("chosen")) ?? cards[0];
    if (!card) return;
    const design = HT_PRODUCT_DESIGN_DEFAULTS[active.config?.productTemplate];
    const scale = design ? card.closest(".ht-paywall").clientWidth / 390 : 1;
    const parts = {};
    PRODUCT_PARTS.forEach(([part]) => {
      const element = card.querySelector(`[data-inspector-area="product-${part}"]`) ?? cards.map((item) => item.querySelector(`[data-inspector-area="product-${part}"]`)).find(Boolean);
      if (!element || !element.getClientRects().length) return;
      const target = part === "price" && element.querySelector("strong") || element;
      const style = getComputedStyle(target);
      const layout = productLayout(active.config);
      const parent = element.closest("[data-product-card]");
      const stacked = ["horizontal", "standard"].includes(layout);
      const region = stacked ? "body" : part === "marker" ? "marker" : part === "badge" && layout !== "info-row" ? "heading" : element.closest(".ht-info-row-main, .ht-vertical-main, .ht-split-summary-copy") || element.classList.contains("ht-compact-name") ? "left" : "right";
      parts[part] = { fontSize: Math.round(parseFloat(style.fontSize) / scale * 10) / 10, color: previewColor(style.color), region, sequence: element.getBoundingClientRect().top - parent.getBoundingClientRect().top };
    });
    const style = getComputedStyle(card);
    const parentWidth = card.parentElement?.getBoundingClientRect().width || card.getBoundingClientRect().width;
    setDefaults({ parts, frame: { planWidth: Math.round(card.getBoundingClientRect().width / parentWidth * 100), planHeight: Math.round(parseFloat(style.minHeight) || 0), ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].map((side) => [`planPadding${side}`, Math.round((parseFloat(style[`padding${side}`]) || 0) * 10) / 10])) } });
  }, [active.id, active.config, pricePreviewMode]);
  return defaults;
}

function ProductPriceModeStyleEditor({ active, updateNode, pricePreviewMode, defaults }) {
  const config = active.config ?? {};
  const styles = config.priceModeStyles ?? {};
  const current = styles[pricePreviewMode] ?? {};
  const patch = (change) => updateNodeConfig(active, updateNode, { priceModeStyles: { ...styles, [pricePreviewMode]: { ...current, ...change } } });
  const commitNumber = (event) => {
    const input = event.target;
    if (input.type !== "number") return;
    const key = input.getAttribute("aria-label")?.startsWith("划线价") ? "strikeFontSize" : "mainFontSize";
    const parsed = Number(input.value);
    if (!input.value || !Number.isFinite(parsed)) {
      const next = { ...current };
      delete next[key];
      updateNodeConfig(active, updateNode, { priceModeStyles: { ...styles, [pricePreviewMode]: next } });
    } else if (parsed < 8 || parsed > 64) patch({ [key]: Math.min(64, Math.max(8, parsed)) });
  };
  const number = (label, key, fallback, max = 64) => <Field label={label}><input type="number" min="8" max={max} aria-label={`${label}（当前价格样式）`} value={current[key] ?? fallback} onChange={(event) => patch({ [key]: event.target.value })} /></Field>;
  const color = (label, key, fallback) => <Field label={label}><div className="product-mode-color"><ProductColorInput label={`${label}（当前价格样式）`} value={current[key] ?? fallback} onChange={(next) => patch({ [key]: next })} /></div></Field>;
  const hasStrike = ["3", "4", "6", "7"].includes(pricePreviewMode);
  return <div className="product-mode-style" onBlurCapture={commitNumber}><div className="product-mode-style-heading"><h4>当前价格模式专属样式</h4><button type="button" className="text-action" disabled={!styles[pricePreviewMode]} onClick={() => { const next = { ...styles }; delete next[pricePreviewMode]; updateNodeConfig(active, updateNode, { priceModeStyles: next }); }}>恢复通用样式</button></div><small>这里的设置优先于上方主价格、参考价的通用设置。</small><div className="split-fields">{number("主价字号", "mainFontSize", defaults.price?.fontSize ?? PRODUCT_PART_DEFAULT_SIZES.price)}{color("主价颜色", "mainColor", defaults.price?.color ?? "#161616")}</div>{hasStrike && <div className="split-fields">{number("划线价字号", "strikeFontSize", defaults.reference?.fontSize ?? PRODUCT_PART_DEFAULT_SIZES.reference)}{color("划线价颜色", "strikeColor", defaults.reference?.color ?? "#999999")}</div>}</div>;
}

function ProductPartStyleEditor({ active, updateNode, defaults }) {
  const styles = active.config?.productPartStyles ?? {};
  const patch = (part, key, value) => updateNodeConfig(active, updateNode, { productPartStyles: { ...styles, [part]: { ...styles[part], [key]: value } } });
  return <section className="product-part-editor"><h4>商品文字</h4>{PRODUCT_PARTS.filter(([part]) => defaults[part]).map(([part, label]) => {
    const current = styles[part] ?? {};
    return <div className="product-part-row" data-product-part-row={part} key={part}><div className="product-part-row-heading"><strong>{label}</strong><button type="button" className="product-part-reset" title={`恢复${label}文字样式`} aria-label={`恢复${label}文字样式`} disabled={!current.fontSize && !current.color} onClick={() => { const next = { ...current }; delete next.fontSize; delete next.color; updateNodeConfig(active, updateNode, { productPartStyles: { ...styles, [part]: next } }); }}><RotateCw size={14} /></button></div><div className="split-fields"><label><span>字号</span><div className="number-unit"><input type="number" min="8" max="64" aria-label={`${label}字号`} value={current.fontSize ?? defaults[part].fontSize} onChange={(event) => patch(part, "fontSize", event.target.value)} onBlur={(event) => patch(part, "fontSize", Math.max(8, Math.min(64, Number(event.target.value) || defaults[part].fontSize)))} /><span>px</span></div></label><label><span>颜色</span><div className="product-mode-color"><ProductColorInput label={`${label}颜色`} value={current.color ?? defaults[part].color} onChange={(color) => patch(part, "color", color)} /></div></label></div></div>;
  })}</section>;
}

function ProductsPositionEditor({ active, updateNode, pricePreviewMode }) {
  const { parts } = useProductPreviewDefaults(active, pricePreviewMode);
  const drag = useRef(null);
  const [dragging, setDragging] = useState(null);
  const layout = productLayout(active.config);
  const regions = contentRegions(layout, parts, active.config?.productContentOrders?.[layout]);
  const labels = Object.fromEntries(PRODUCT_PARTS);
  const label = PRODUCT_LAYOUTS.find((item) => item.id === layout)?.label;
  const move = (part, region, index) => updateNodeConfig(active, updateNode, { productContentOrders: { ...active.config?.productContentOrders, [layout]: moveContentPart(regions, part, region, index) } });
  const dropTarget = (event) => {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-content-part], [data-content-region]");
    if (!target || !event.currentTarget.contains(target)) return null;
    const region = target.dataset.contentRegion ?? target.closest("[data-content-region]")?.dataset.contentRegion;
    const targetPart = target.dataset.contentPart;
    return region ? { region, index: targetPart ? regions[region].indexOf(targetPart) : regions[region].length } : null;
  };
  return <section className="product-arrangement-editor product-content-order" onPointerMove={(event) => { if (drag.current) drag.current.target = dropTarget(event); }} onPointerUp={(event) => { const source = drag.current; if (!source) return; const target = dropTarget(event) ?? source.target; drag.current = null; setDragging(null); if (target) move(source.part, target.region, target.index); }} onPointerCancel={() => { drag.current = null; setDragging(null); }}><div className="product-part-row-heading"><h4>{label}</h4><button type="button" className="icon" title="恢复当前布局排布" aria-label="恢复当前布局排布" onClick={() => { const next = { ...active.config?.productContentOrders }; delete next[layout]; updateNodeConfig(active, updateNode, { productContentOrders: next }); }}><RotateCw size={15} /></button></div>{(PRODUCT_REGIONS[layout] ?? []).map(([region, title]) => <section className="product-content-region" data-content-region={region} key={region}><h4>{title}</h4>{regions[region].map((part, index) => <div className={`product-content-order-row${dragging === part ? " dragging" : ""}`} data-content-part={part} key={part}><button type="button" className="content-sort-grip" aria-label={`拖动${labels[part]}`} title={`拖动${labels[part]}`} onPointerDown={(event) => { event.preventDefault(); drag.current = { part }; setDragging(part); event.currentTarget.closest(".product-content-order").setPointerCapture(event.pointerId); }}><GripVertical size={16} /></button><span>{labels[part]}</span>{Object.keys(regions).length > 1 && part !== "marker" && <select aria-label={`${labels[part]}所在分区`} value={region} onChange={(event) => move(part, event.target.value, regions[event.target.value].length)}>{(PRODUCT_REGIONS[layout] ?? []).filter(([id]) => id !== "marker").map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}<button type="button" className="icon" title="上移" aria-label={`上移${labels[part]}`} disabled={index === 0} onClick={() => move(part, region, index - 1)}><ArrowUp size={14} /></button><button type="button" className="icon" title="下移" aria-label={`下移${labels[part]}`} disabled={index === regions[region].length - 1} onClick={() => move(part, region, index + 1)}><ArrowDown size={14} /></button></div>)}</section>)}</section>;
}

function ProductsStyleEditor({ active, updateNode, pricePreviewMode, previewFocus }) {
  const verticalBlue = productLayout(active.config) === "vertical";
  const defaults = useProductPreviewDefaults(active, pricePreviewMode);
  return <div className="product-color-settings" data-product-layout={active.config?.purchasePerCard ? "credit" : "plan"}>
    <h4>商品框体</h4><div className="split-fields"><ConfigNumberField label="框体宽度" active={active} updateNode={updateNode} name="planWidth" fallback={100} min={40} max={100} suffix="%" clampOnBlur /><ConfigNumberField label="框体最小高度" active={active} updateNode={updateNode} name="planHeight" fallback={defaults.frame.planHeight ?? 0} min={0} max={300} suffix="px" clampOnBlur /></div>
    <ProductPartStyleEditor active={active} updateNode={updateNode} defaults={defaults.parts} />
    {!active.config?.purchasePerCard && <><h4>选中态与标签颜色</h4>
    <ProductColorField label={verticalBlue ? "商品角标颜色" : "商品标签颜色"} active={active} updateNode={updateNode} name="badgeGradient" fallback={["#ff860a", "#ffb000", "#ffd10b"]} gradient />
    <ProductColorField label="商品选中框颜色" active={active} updateNode={updateNode} name="selectedBorderGradient" fallback={["#ff860a", "#ff860a", "#ff860a"]} gradient />
    <ProductColorField label="商品选中背景颜色" active={active} updateNode={updateNode} name="selectedBackground" fallback="#ffffff" />
    <ProductColorField label={verticalBlue ? "优惠信息文字颜色" : "商品SAVE文字颜色"} active={active} updateNode={updateNode} name="saveTextColor" fallback="#ff8207" />
    <label className="switch-row"><input type="checkbox" checked={Boolean(active.config?.saveBackgroundColor)} onChange={(event) => updateNodeConfig(active, updateNode, { saveBackgroundColor: event.target.checked ? "#ffffff" : "" })} /><span>{active.config?.saveBackgroundColor ? "开启" : "关闭"}</span><strong>SAVE 背景</strong></label>
    {active.config?.saveBackgroundColor && <ProductColorField label="SAVE 背景颜色" active={active} updateNode={updateNode} name="saveBackgroundColor" fallback="#ffffff" />}</>}
    {(active.config?.bluePrivilege || active.config?.productColors) ? <><ProductColorField label="购买按钮文字颜色" active={active} updateNode={updateNode} name="purchaseTextGradient" fallback={["#ffffff", "#ffffff", "#ffffff"]} gradient /><ProductColorField label="购买按钮背景颜色" active={active} updateNode={updateNode} name="purchaseBackgroundGradient" fallback={["#ff8707", "#ffb000", "#ffd10b"]} gradient /></> : <small>购买按钮的颜色在左侧选择「按钮」组件后设置。</small>}
    <ProductPriceModeStyleEditor active={active} updateNode={updateNode} pricePreviewMode={pricePreviewMode} defaults={defaults.parts} />
  </div>;
}

function ProductsLayoutEditor({ active, updateNode }) {
  const config = active.config ?? {};
  const layout = productLayout(config);
  return <>
    <h4>套餐布局</h4>
    <label className="switch-row"><input type="checkbox" checked={config.showCards !== false} onChange={(event) => updateNodeConfig(active, updateNode, { showCards: event.target.checked })} /><span>{config.showCards === false ? "仅绑定" : "展示"}</span><strong>展示套餐选择卡</strong></label>
    {config.showCards !== false && <>
      <Field label="布局类型"><select aria-label="布局类型" value={layout} onChange={(event) => updateNodeConfig(active, updateNode, { packageLayout: event.target.value })}>{PRODUCT_LAYOUTS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>
    </>}
    <h4>组件位置</h4><ElementLayoutEditor active={active} updateNode={updateNode} />
  </>;
}

function CardContent({ active, addNestedNode, allowAdd = true }) {
  const [open, setOpen] = useState(false);
  const allowed = ["List", "Button", "Image", "Text", "Timer"];
  return allowAdd ? <><h4>Card items</h4><div className="nested-add-wrap"><button className="text-action" onClick={() => setOpen((value) => !value)}><Plus size={15} /> Add element</button>{open && <div className="nested-add-menu">{allowed.map((type) => <button key={type} onClick={() => { addNestedNode(active.id, type); setOpen(false); }}>{type}</button>)}</div>}</div></> : <p className="property-copy">当前模板的卡片结构由已采集的固定画面组成；任意新增子组件尚未形成可回写的预览规则。</p>;
}

function TimerContent({ active, updateNode }) {
  const config = active.config ?? {};
  const updateConfig = (patch) => updateNode(active.id, { config: { ...config, ...patch } });
  return <><label className="switch-row"><input type="checkbox" checked={config.enabled !== false} onChange={(event) => updateConfig({ enabled: event.target.checked })} /><span>{config.enabled !== false ? "On" : "Off"}</span><strong>Show timer</strong></label><h4>Time format</h4><div className="split-fields"><Field label="Format"><select value={config.format ?? "hh:mm:ss"} onChange={(event) => updateConfig({ format: event.target.value })}><option value="hh:mm:ss">hh:mm:ss</option><option value="mm:ss">mm:ss</option></select></Field><Field label="Time separator"><select value={config.separator ?? ":"} onChange={(event) => updateConfig({ separator: event.target.value })}><option value=":">Colon</option><option value="·">Dot</option><option value=" ">Space</option></select></Field></div><h4>Timer text</h4><Field label="Start value" required><input value={active.content ?? "04:59:59"} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field><div className="split-fields"><Field label="Text before"><ConfigInput active={active} updateNode={updateNode} name="prefix" fallback="" placeholder="Enter text here" /></Field><Field label="Text after"><ConfigInput active={active} updateNode={updateNode} name="suffix" fallback="" placeholder="Enter text here" /></Field></div><h4>Timer mode</h4><Field label=""><select value={config.resetMode ?? "Reset timer on every paywall view"} onChange={(event) => updateConfig({ resetMode: event.target.value })}><option>Reset timer on every paywall view</option></select></Field></>;
}

function ToggleContent({ node, updateNode }) {
  const [title = "", secondary = ""] = (node.content ?? "").split("|");
  const defaultState = node.defaultState ?? "Off";
  const updateCopy = (nextTitle, nextSecondary) => updateNode(node.id, { content: `${nextTitle}|${nextSecondary}` });
  return <>
    <Field label="Default toggle state"><div className="segmented"><button className={defaultState === "Off" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "Off" })}>Off</button><button className={defaultState === "On" ? "active" : ""} onClick={() => updateNode(node.id, { defaultState: "On" })}>On</button></div></Field>
    <Field label="Title text" required><textarea value={title} onChange={(event) => updateCopy(event.target.value, secondary)} /></Field><Field label="Secondary text"><textarea value={secondary} onChange={(event) => updateCopy(title, event.target.value)} /></Field>{node.config?.onContent !== undefined && <Field label="开启时文案" required><input value={node.config.onContent} onChange={(event) => updateNodeConfig(node, updateNode, { onContent: event.target.value })} /></Field>}
  </>;
}

function ButtonContent({ active, updateNode }) {
  const action = active.config?.action ?? (active.type === "Purchase Button" ? "Purchase" : active.type === "Web Paywall Button" ? "WebCheckout" : "None");
  const url = active.config?.actionUrl ?? "";
  const validUrl = !url || safeButtonUrl(url);
  return <><Field label="按钮文案" required><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>{active.config?.linkedToggleId && <Field label="开关开启时按钮文案" required><input value={active.config.onContent ?? ""} onChange={(event) => updateNodeConfig(active, updateNode, { onContent: event.target.value })} /></Field>}<Field label="点击后"><select value={action} onChange={(event) => updateNodeConfig(active, updateNode, { action: event.target.value })}><option value="None">无动作</option><option value="Purchase">唤起支付</option><option value="WebCheckout">浏览器网页结账</option><option value="OfferCodeRedemption">打开优惠码兑换页</option><option value="RestorePurchases">恢复购买</option><option value="Dismiss">关闭付费墙</option><option value="NextScreen">进入下一页</option><option value="OpenPage">打开内置页面</option><option value="OpenURL">打开链接</option></select></Field>{action === "OpenPage" && <Field label="目标页面" required><select value={active.config?.actionPage ?? "ht-blue-privilege"} onChange={(event) => updateNodeConfig(active, updateNode, { actionPage: event.target.value })}>{templates.filter((item) => item.documentTemplate).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>}{action === "OpenURL" && <><Field label="目标链接" required><input type="url" placeholder="https://" value={url} onChange={(event) => updateNodeConfig(active, updateNode, { actionUrl: event.target.value })} aria-invalid={!validUrl} /></Field>{!validUrl && <p className="property-copy" role="alert">请输入以 https:// 或 http:// 开头的有效链接</p>}</>}{action === "Purchase" && <p className="property-copy">预览将展示所选商品的支付确认页，不会发起真实支付。</p>}{action === "WebCheckout" && <><label className="switch-row"><input type="checkbox" checked={active.config?.autoDismiss !== false} onChange={(event) => updateNodeConfig(active, updateNode, { autoDismiss: event.target.checked })} /><span>{active.config?.autoDismiss !== false ? "开启" : "关闭"}</span><strong>结账后自动关闭付费墙</strong></label><p className="property-copy">来源模板使用 RevenueCat Billing 网页结账；本地仅预览交互，未连接真实结账。</p></>}{action === "OfferCodeRedemption" && <p className="property-copy">打开优惠码兑换页预览；兑换结果需要 RevenueCat 服务验证。</p>}{action === "RestorePurchases" && <p className="property-copy">预览不会请求 App Store 或 Google Play 的购买记录。</p>}</>;
}

function WebButtonContent({ active, updateNode }) {
  return <ButtonContent active={active} updateNode={updateNode} />;
}



function LinksContent({ active, updateNode }) {
  const labels = visibleLinkLabels(active.content);
  const actions = active.config?.linkActions ?? [];
  const updateAction = (index, patch) => {
    const next = [...actions];
    next[index] = { ...linkActionFor(labels[index], next[index]), ...patch };
    updateNodeConfig(active, updateNode, { linkActions: next });
  };
  return <><Field label="链接文案" required><input value={active.content ?? ""} onChange={(event) => updateNode(active.id, { content: event.target.value })} /></Field>{labels.map((label, index) => {
    const item = linkActionFor(label, actions[index]);
    return <div className="link-action-fields" key={`${index}-${label}`}><h4>{label}</h4><Field label="点击后"><select value={item.action} onChange={(event) => updateAction(index, { action: event.target.value })}><option value="OpenURL">打开链接</option><option value="RestorePurchases">恢复购买</option></select></Field>{item.action === "OpenURL" && <Field label="目标链接" required><input type="url" placeholder="https://" value={item.actionUrl ?? ""} aria-invalid={Boolean(item.actionUrl) && !safeButtonUrl(item.actionUrl)} onChange={(event) => updateAction(index, { actionUrl: event.target.value })} /></Field>}</div>;
  })}<p className="property-copy">未填写目标链接时，预览会提示尚未配置；不会打开猜测的页面。恢复购买仅展示交互预览。</p></>;
}



function AgreementContent({ active, updateNode }) {
  const config = active.config ?? {};
  const segments = agreementSegmentsFor(active);
  const commit = (next) => updateNodeConfig(active, updateNode, { segments: next });
  const patch = (index, change) => commit(segments.map((segment, position) => position === index ? { ...segment, ...change } : segment));
  const move = (index, direction) => { const next = [...segments]; const other = index + direction; [next[index], next[other]] = [next[other], next[index]]; commit(next); };
  const add = (type) => commit([...segments, { id: crypto.randomUUID(), type, text: "", ...(type === "link" ? { url: "" } : {}) }]);
  const showCheckbox = config.showCheckbox !== false;
  return <>
    <h4>协议文案片段</h4>
    <div className="agreement-segment-list">{segments.map((segment, index) => <section className="agreement-segment-editor" key={segment.id}>
      <header><strong>第 {index + 1} 段 · {segment.type === "link" ? "链接" : "普通文字"}</strong><div>
        <button type="button" title="上移" aria-label={`上移第 ${index + 1} 段`} disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
        <button type="button" title="下移" aria-label={`下移第 ${index + 1} 段`} disabled={index === segments.length - 1} onClick={() => move(index, 1)}>↓</button>
        <button type="button" title="删除" aria-label={`删除第 ${index + 1} 段`} disabled={segments.length === 1} onClick={() => commit(segments.filter((_, position) => position !== index))}><X size={15} /></button>
      </div></header>
      <Field label="片段类型"><select value={segment.type} onChange={(event) => patch(index, { type: event.target.value })}><option value="text">普通文字</option><option value="link">可点击链接</option></select></Field>
      <Field label="显示文案" required><input value={segment.text} onChange={(event) => patch(index, { text: event.target.value })} /></Field>
      {segment.type === "link" && <Field label="跳转链接" required><input type="url" placeholder="https://" value={segment.url ?? ""} aria-invalid={Boolean(segment.url && !safeButtonUrl(segment.url))} onChange={(event) => patch(index, { url: event.target.value })} /></Field>}
    </section>)}</div>
    <div className="agreement-segment-actions"><button type="button" className="text-action" onClick={() => add("text")}><Plus size={15} /> 添加文字</button><button type="button" className="text-action" onClick={() => add("link")}><Plus size={15} /> 添加链接</button></div>
    <label className="switch-row"><strong>显示勾选框</strong><input type="checkbox" checked={showCheckbox} onChange={(event) => updateNodeConfig(active, updateNode, { showCheckbox: event.target.checked, ...(!event.target.checked ? { required: false } : {}) })} /><span>{showCheckbox ? "开启" : "关闭"}</span></label>
    <label className="switch-row"><strong>勾选后才能点击按钮</strong><input type="checkbox" checked={showCheckbox && config.required !== false} disabled={!showCheckbox} onChange={(event) => updateNodeConfig(active, updateNode, { required: event.target.checked })} /><span>{showCheckbox && config.required !== false ? "开启" : "关闭"}</span></label>
  </>;
}

function AgreementStyle({ active, updateNode }) {
  return <><ConfigColorField label="文字颜色" active={active} updateNode={updateNode} name="color" fallback="#777777" /><ConfigColorField label="链接颜色" active={active} updateNode={updateNode} name="linkColor" fallback="#3069d3" /><ConfigColorField label="勾选颜色" active={active} updateNode={updateNode} name="checkColor" fallback="#1677ff" /><ConfigNumberField label="字号" active={active} updateNode={updateNode} name="fontSize" fallback={12} min={9} max={24} suffix="px" /></>;
}

function ListContent({ active, updateNode, addNestedNode, allowAdd = true }) {
  if (active.id === "benefits" && active.config?.bluePrivilege) return <><PrivilegeComparisonEditor active={active} updateNode={updateNode} />{allowAdd && <button type="button" className="text-action" onClick={() => addNestedNode(active.id, "List item")}><Plus size={15} /> 添加独立子组件</button>}</>;
  if (active.config?.listVariant === "testimonials") {
    const reviews = active.config.testimonialRows ?? [];
    const commitReviews = (next) => updateNodeConfig(active, updateNode, { testimonialRows: next });
    const patchReview = (index, patch) => commitReviews(reviews.map((row, position) => position === index ? { ...row, ...patch } : row));
    return <><Field label="展示形式"><select value="testimonials" onChange={(event) => updateNodeConfig(active, updateNode, { listVariant: event.target.value })}><option value="benefits">特权列表</option><option value="testimonials">评价列表</option></select></Field><h4>评价</h4>{reviews.map((row, index) => <section className="product-row-editor" key={index}><header><strong>评价 {index + 1}</strong><button type="button" className="icon" aria-label={`删除评价 ${index + 1}`} onClick={() => commitReviews(reviews.filter((_, position) => position !== index))}><X size={15} /></button></header><Field label="标题" required><input value={row.title} onChange={(event) => patchReview(index, { title: event.target.value })} /></Field><Field label="评价正文" required><textarea value={row.quote} onChange={(event) => patchReview(index, { quote: event.target.value })} /></Field><Field label="署名"><input value={row.author} onChange={(event) => patchReview(index, { author: event.target.value })} /></Field></section>)}<button type="button" className="text-action" onClick={() => commitReviews([...reviews, { title: "", quote: "", author: "" }])}><Plus size={15} /> 添加评价</button></>;
  }
  const rows = listRowsFor(active);
  const commit = (nextRows) => updateNodeConfig(active, updateNode, { listRows: nextRows });
  const patchRow = (index, patch) => commit(rows.map((row, position) => position === index ? { ...row, ...patch } : row));
  const move = (index, direction) => { const next = [...rows]; const other = index + direction; if (other < 0 || other >= next.length) return; [next[index], next[other]] = [next[other], next[index]]; commit(next); };
  return <><Field label="展示形式"><select value="benefits" onChange={(event) => updateNodeConfig(active, updateNode, { listVariant: event.target.value, testimonialRows: listRowsFor(active).map((row) => ({ title: row.title, quote: row.caption, author: "" })) })}><option value="benefits">特权列表</option><option value="testimonials">评价列表</option></select></Field><h4>特权行</h4>{rows.map((row, index) => <section className="product-row-editor" key={index}><header><strong>第 {index + 1} 行</strong><div><button type="button" title="上移" disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button type="button" title="下移" disabled={index === rows.length - 1} onClick={() => move(index, 1)}>↓</button><button type="button" title="删除" onClick={() => commit(rows.filter((_, position) => position !== index))}><X size={15} /></button></div></header><Field label="标题"><input value={row.title} onChange={(event) => patchRow(index, { title: event.target.value })} /></Field><label className="switch-row"><input type="checkbox" checked={row.showCaption !== false} onChange={(event) => patchRow(index, { showCaption: event.target.checked })} /><strong>显示描述</strong></label>{row.showCaption !== false && <Field label="描述"><input value={row.caption} onChange={(event) => patchRow(index, { caption: event.target.value })} /></Field>}<Field label="行首内容"><select value={row.leadingMode ?? "icon"} onChange={(event) => patchRow(index, { leadingMode: event.target.value })}><option value="icon">图标</option><option value="text">文字</option><option value="none">不显示</option></select></Field>{row.leadingMode !== "none" && <Field label={row.leadingMode === "text" ? "行首文字" : "图标字符"}><input value={row.leading ?? "✓"} onChange={(event) => patchRow(index, { leading: event.target.value })} /></Field>}</section>)}<button type="button" className="text-action" onClick={() => commit([...rows, { title: "", caption: "", leadingMode: "icon", leading: "✓", showCaption: true }])}><Plus size={15} /> 添加特权行</button>{allowAdd && <button type="button" className="text-action" onClick={() => addNestedNode(active.id, "List item")}><Plus size={15} /> 添加独立子组件</button>}</>;
}

function TabsContent({ active, updateNode }) {
  const tabs = active.config?.tabs ?? [];
  const update = (next, selected = active.config?.defaultTab ?? 0) => updateNodeConfig(active, updateNode, { tabs: next, defaultTab: Math.min(selected, next.length - 1) });
  return <><Field label="默认选项"><select value={active.config?.defaultTab ?? 0} onChange={(event) => updateNodeConfig(active, updateNode, { defaultTab: Number(event.target.value) })}>{tabs.map((tab, index) => <option key={tab.id} value={index}>{tab.title || `选项 ${index + 1}`}</option>)}</select></Field>{tabs.map((tab, index) => <section className="product-row-editor" key={tab.id}><header><strong>选项 {index + 1}</strong><button type="button" className="icon" title="删除选项" aria-label={`删除选项 ${index + 1}`} disabled={tabs.length <= 1} onClick={() => update(tabs.filter((_, position) => position !== index), Math.max(0, Math.min(active.config?.defaultTab ?? 0, tabs.length - 2)))}><X size={15} /></button></header><Field label="选项名称"><input value={tab.title} onChange={(event) => update(tabs.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></Field><Field label="选项内容"><textarea value={tab.description ?? ""} onChange={(event) => update(tabs.map((item, position) => position === index ? { ...item, description: event.target.value } : item))} /></Field></section>)}<button type="button" className="text-action" onClick={() => update([...tabs, { id: crypto.randomUUID(), title: `选项 ${tabs.length + 1}`, description: "" }])}><Plus size={15} /> 添加选项</button></>;
}

function FeatureTableContent({ active, updateNode }) {
  const columns = active.config?.columns ?? ["会员"];
  const rows = active.config?.rows ?? [];
  const commit = (patch) => updateNodeConfig(active, updateNode, patch);
  const featureList = active.config?.tableVariant === "feature-list";
  const patchRow = (index, patch) => commit({ rows: rows.map((row, position) => position === index ? { ...row, ...patch } : row) });
  return <>
    <Field label="展示形式"><select value={active.config?.tableVariant ?? "comparison"} onChange={(event) => commit({ tableVariant: event.target.value })}><option value="comparison">权益对比表</option><option value="feature-list">图标权益列表</option></select></Field>
    {!featureList && <><h4>对比列</h4>{columns.map((column, index) => <Field label={`第 ${index + 1} 列`} key={index} required><input value={column} onChange={(event) => commit({ columns: columns.map((item, position) => position === index ? event.target.value : item) })} /></Field>)}<div className="screen-add-controls"><button type="button" className="text-action" disabled={columns.length >= 3} onClick={() => commit({ columns: [...columns, "新列"], rows: rows.map((row) => ({ ...row, values: [...(row.values ?? []), ""] })) })}><Plus size={14} /> 添加列</button><button type="button" className="text-action" disabled={columns.length <= 1} onClick={() => commit({ columns: columns.slice(0, -1), rows: rows.map((row) => ({ ...row, values: (row.values ?? []).slice(0, -1) })) })}>移除末列</button></div></>}
    <h4>权益行</h4>{rows.map((row, index) => <section className="product-row-editor" key={index}>
      <header><strong>第 {index + 1} 行</strong><button type="button" className="icon" aria-label={`删除第 ${index + 1} 行`} onClick={() => commit({ rows: rows.filter((_, position) => position !== index) })}><X size={15} /></button></header>
      {featureList && <Field label="图标"><select value={row.icon ?? "star"} onChange={(event) => patchRow(index, { icon: event.target.value })}><option value="telescope">望远镜</option><option value="rocket">火箭</option><option value="star">星星</option><option value="orbit">行星</option><option value="bell">通知</option></select></Field>}
      <Field label="权益名称" required><input value={row.name} onChange={(event) => patchRow(index, { name: event.target.value })} /></Field>
      {columns.map((column, columnIndex) => <Field label={featureList ? "说明" : column} key={columnIndex}><input value={row.values?.[columnIndex] ?? ""} onChange={(event) => patchRow(index, { values: columns.map((_, valueIndex) => valueIndex === columnIndex ? event.target.value : row.values?.[valueIndex] ?? "") })} /></Field>)}
    </section>)}
    <button type="button" className="text-action" onClick={() => commit({ rows: [...rows, { name: "新权益", icon: "star", values: columns.map(() => "") }] })}><Plus size={15} /> 添加权益行</button>
  </>;
}

function TimelineContent({ active, updateNode }) {
  const rows = listRowsFor(active);
  const commit = (next) => updateNodeConfig(active, updateNode, { listRows: next });
  return <><Field label="显示时间线"><input type="checkbox" checked={active.config?.enabled !== false} onChange={(event) => updateNodeConfig(active, updateNode, { enabled: event.target.checked })} /></Field><h4>时间节点</h4>{rows.map((row, index) => <section className="product-row-editor" key={index}><header><strong>节点 {index + 1}</strong><button type="button" className="icon" title="删除节点" aria-label={`删除节点 ${index + 1}`} disabled={rows.length <= 1} onClick={() => commit(rows.filter((_, position) => position !== index))}><X size={15} /></button></header><Field label="标题" required><input value={row.title} onChange={(event) => commit(rows.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></Field><Field label="说明"><textarea value={row.caption ?? ""} onChange={(event) => commit(rows.map((item, position) => position === index ? { ...item, caption: event.target.value } : item))} /></Field><Field label="节点标记"><select value={row.marker ?? "number"} onChange={(event) => commit(rows.map((item, position) => position === index ? { ...item, marker: event.target.value } : item))}><option value="number">数字</option><option value="lock">锁</option><option value="bell">提醒</option><option value="star">星标</option></select></Field></section>)}<button type="button" className="text-action" onClick={() => commit([...rows, { title: `节点 ${rows.length + 1}`, caption: "", marker: "number" }])}><Plus size={15} /> 添加节点</button></>;
}



function PrivilegeComparisonEditor({ active, updateNode }) {
  const rows = privilegeRowsFor(active);
  const columns = privilegeColumnsFor(active.config);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const draggedId = useRef(null);
  const commit = (nextRows) => updateNodeConfig(active, updateNode, { privilegeRows: nextRows });
  const patchRow = (id, patch) => commit(rows.map((row) => row.id === id ? { ...row, ...patch } : row));
  const moveRow = (fromId, toId) => {
    const next = [...rows];
    const from = next.findIndex((row) => row.id === fromId);
    const to = next.findIndex((row) => row.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    next.splice(to, 0, next.splice(from, 1)[0]);
    commit(next);
  };
  const openEditor = (row) => { setEditingId(row.id); setDraft(JSON.parse(JSON.stringify(row.detail))); };
  const closeEditor = () => { setEditingId(null); setDraft(null); };
  const patchDraft = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const upload = (file, callback) => { if (!file) return; const reader = new FileReader(); reader.onload = () => callback(String(reader.result)); reader.readAsDataURL(file); };
  const setImage = (index, patch) => patchDraft({ images: draft.images.map((image, position) => position === index ? { ...image, ...patch } : image) });
  const valueEditor = (row, field, label) => {
    const mode = row[field + "Mode"] ?? (row[field] === "受限" || row[field] === "✓" ? "icon" : "text");
    const icon = row[field + "Icon"] ?? (field === "standard" ? "lock" : "check");
    return <label className="privilege-value-field"><span>{label}</span><select aria-label={label + "显示方式 " + row.name} value={mode} onChange={(event) => patchRow(row.id, { [field + "Mode"]: event.target.value })}><option value="text">文字</option><option value="icon">图标</option></select>{mode === "icon" ? <select aria-label={label + "图标 " + row.name} value={icon} onChange={(event) => patchRow(row.id, { [field + "Icon"]: event.target.value })}><option value="lock">锁定</option><option value="check">勾选</option></select> : <input aria-label={label + "文字 " + row.name} value={row[field] ?? ""} onChange={(event) => patchRow(row.id, { [field]: event.target.value })} />}</label>;
  };
  return <section className="privilege-editor">
    <div className="privilege-editor-heading"><h4>特权行</h4><button type="button" className="text-action" onClick={() => commit([...rows, { id: "privilege-" + Date.now(), name: "新特权", type: "", standard: "", vip: "", plus: "", standardMode: "text", vipMode: "text", plusMode: "text", pageId: "", detail: { positions: ["蓝色特权页"], title: "", iconSrc: "", images: [{ locale: "Chinese", src: "" }], titleColor: "#F6C85F", copyKey: "", descriptionColor: "#FFF8E7", descriptionKey: "" } }])}><Plus size={15} /> 添加特权</button></div>
    <Field label="对比样式"><select aria-label="特权对比样式" value={active.config?.comparisonMode ?? "standard-vip"} onChange={(event) => updateNodeConfig(active, updateNode, { comparisonMode: event.target.value })}><option value="standard-vip">非会员 / VIP</option><option value="standard-plus">非会员 / Plus</option><option value="vip-plus">VIP / Plus</option></select></Field>
    <Field label="显示行数"><input type="number" min="1" max={rows.length} value={active.config?.maxVisibleRows ?? 5} onChange={(event) => updateNodeConfig(active, updateNode, { maxVisibleRows: Math.max(1, Math.min(rows.length, Number(event.target.value) || 1)) })} /></Field>
    {rows.map((row, index) => <div className="privilege-row-wrap" key={row.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveRow(draggedId.current, row.id); draggedId.current = null; }}>
      <div className="privilege-row"><button type="button" className="privilege-drag" aria-label={"拖动排序 " + row.name} title="拖动排序" draggable onDragStart={(event) => { draggedId.current = row.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", row.id); }} onDragEnd={() => { draggedId.current = null; }}><GripVertical size={16} /></button><label className="privilege-row-name"><span>特权名称</span><input aria-label={"特权 " + (index + 1)} value={row.name} onChange={(event) => patchRow(row.id, { name: event.target.value })} /></label><button type="button" className="row-remove" aria-label={"删除特权 " + row.name} onClick={() => commit(rows.filter((item) => item.id !== row.id))}><X size={14} /></button></div>
      <div className="privilege-values">{columns.map(([field, label]) => <React.Fragment key={field}>{valueEditor(row, field, label)}</React.Fragment>)}</div>
      <div className="privilege-row-management"><label>特权页管理<select aria-label={"特权页管理 " + row.name} value={row.pageId ?? ""} onChange={(event) => patchRow(row.id, { pageId: event.target.value })}><option value="">未绑定</option><option value="detail">当前特权详情页</option></select></label><button type="button" aria-label={"编辑特权 " + row.name} title="编辑特权" onClick={() => openEditor(row)}><Pencil size={15} /></button></div>
    </div>)}
    {editingId && draft && <div className="ht-admin-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><div className="ht-admin-dialog" role="dialog" aria-modal="true" aria-label="编辑特权配置" data-no-translate>
      <header className="ht-admin-header"><h2>编辑</h2><button type="button" aria-label="关闭" onClick={closeEditor}><X size={22} /></button></header>
      <div className="ht-admin-scroll"><div className="ht-admin-form">
        <div className="ht-admin-line"><label className="ht-admin-label required">paywall位置</label><div className="ht-admin-positions">{["会员套餐页", "蓝色特权页", "VIP分级页面-VIP", "VIP分级页面-VIPPlus"].map((position) => <label key={position}><input type="checkbox" checked={(draft.positions ?? []).includes(position)} onChange={(event) => patchDraft({ positions: event.target.checked ? [...(draft.positions ?? []), position] : (draft.positions ?? []).filter((item) => item !== position) })} />{position}</label>)}</div></div>
        <div className="ht-admin-line title-line"><label className="ht-admin-label required" htmlFor="privilege-config-title">特权配置标题</label><div><div className="ht-admin-input-clear"><input id="privilege-config-title" value={draft.title ?? ""} onChange={(event) => patchDraft({ title: event.target.value })} /><button type="button" aria-label="清空特权配置标题" onClick={() => patchDraft({ title: "" })}><X size={14} /></button></div><p className="ht-admin-hint">*用于展示会员套餐页模板添加特权&顺序选择项</p></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required" htmlFor="privilege-config-type">特权类型</label><select id="privilege-config-type" value={draft.type ?? rows.find((row) => row.id === editingId)?.type ?? ""} disabled={Boolean(rows.find((row) => row.id === editingId)?.type)} onChange={(event) => patchDraft({ type: event.target.value })}><option value="">选择特权类型</option>{privilegeNames.map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className="ht-admin-line icon-line"><label className="ht-admin-label">特权图标</label><div><div className="ht-admin-upload"><input aria-label="特权图标地址" value={draft.iconSrc ?? ""} onChange={(event) => patchDraft({ iconSrc: event.target.value })} /><label className="ht-admin-upload-button"><Upload size={17} />上传<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (src) => patchDraft({ iconSrc: src }))} /></label></div>{draft.iconSrc && <img className="ht-admin-icon-preview" src={draft.iconSrc} alt="特权图标预览" />}</div></div>
        <div className="ht-admin-line image-line"><label className="ht-admin-label required">Image</label><div>{(draft.images ?? []).map((image, index) => <div className={"ht-admin-image-row" + (!image.src ? " is-empty" : "")} key={index}><div className="ht-admin-image-controls"><select aria-label={"图片语言 " + (index + 1)} value={image.locale} onChange={(event) => setImage(index, { locale: event.target.value })}><option>English</option><option>Chinese</option><option>简体中文</option><option>Français</option></select><input aria-label={"图片地址 " + (index + 1)} value={image.src} onChange={(event) => setImage(index, { src: event.target.value })} /><label className="ht-admin-upload-button"><Upload size={17} />上传<input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0], (src) => setImage(index, { src }))} /></label>{index > 0 && <button type="button" className="ht-admin-image-delete" aria-label={"删除图片语言 " + (index + 1)} onClick={() => patchDraft({ images: draft.images.filter((_, position) => position !== index) })}><X size={20} /></button>}</div>{image.src && <img className="ht-admin-image-preview" src={image.src} alt={image.locale + "预览"} />}</div>)}<div className="ht-admin-add-group"><button type="button" className="ht-admin-add" onClick={() => patchDraft({ images: [...(draft.images ?? []), { locale: "English", src: "" }] })}><Plus size={17} />追加</button><button type="button" className="ht-admin-add-more" aria-label="更多图片操作" onClick={() => setImageMenuOpen(!imageMenuOpen)}>···</button>{imageMenuOpen && <button type="button" className="ht-admin-add-popover" onClick={() => { patchDraft({ images: [...(draft.images ?? []), { ...(draft.images?.at(-1) ?? { locale: "English", src: "" }) }] }); setImageMenuOpen(false); }}>复制上一项</button>}</div><div className="ht-admin-size-note">旧UI尺寸：355px*260px<br />新UI尺寸：390px*260px</div></div></div>
        <div className="ht-admin-line color-line-admin"><label className="ht-admin-label required">特权文案色值</label><div className="ht-admin-color"><input aria-label="特权文案色值" value={draft.titleColor ?? "#F6C85F"} onChange={(event) => patchDraft({ titleColor: event.target.value })} /><input type="color" aria-label="选择特权文案颜色" value={draft.titleColor ?? "#F6C85F"} onChange={(event) => patchDraft({ titleColor: event.target.value })} /></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required">特权文案(占位符)</label><div className="ht-admin-key"><input aria-label="特权文案占位符" value={draft.copyKey ?? ""} onChange={(event) => patchDraft({ copyKey: event.target.value })} /><button type="button" aria-label="编辑特权文案" onClick={(event) => event.currentTarget.previousSibling.focus()}><Pencil size={18} /></button></div></div>
        <div className="ht-admin-line color-line-admin"><label className="ht-admin-label required">描述文案色值</label><div className="ht-admin-color"><input aria-label="描述文案色值" value={draft.descriptionColor ?? "#FFF8E7"} onChange={(event) => patchDraft({ descriptionColor: event.target.value })} /><input type="color" aria-label="选择描述文案颜色" value={draft.descriptionColor ?? "#FFF8E7"} onChange={(event) => patchDraft({ descriptionColor: event.target.value })} /></div></div>
        <div className="ht-admin-line"><label className="ht-admin-label required">描述文案(占位符)</label><div className="ht-admin-key"><input aria-label="描述文案占位符" value={draft.descriptionKey ?? ""} onChange={(event) => patchDraft({ descriptionKey: event.target.value })} /><button type="button" aria-label="编辑描述文案" onClick={(event) => event.currentTarget.previousSibling.focus()}><Pencil size={18} /></button></div></div>
      </div></div>
      <footer className="ht-admin-footer"><button type="button" onClick={closeEditor}>取消</button><button type="button" onClick={() => { patchRow(editingId, { detail: draft, type: draft.type ?? rows.find((row) => row.id === editingId)?.type }); closeEditor(); }}>确认</button></footer>
    </div></div>}
  </section>;
}

function ListItemContent({ active, updateNode }) {
  const [title = "", caption = ""] = (active.content ?? "").split("|");
  const updateCopy = (nextTitle, nextCaption) => updateNode(active.id, { content: `${nextTitle}|${nextCaption}` });
  return <><Field label="Title" required><textarea value={title} onChange={(event) => updateCopy(event.target.value, caption)} /></Field><Field label="Caption"><textarea value={caption} onChange={(event) => updateCopy(title, event.target.value)} /></Field><p className="property-copy">自定义图标与连接线样式尚未接入预览，不显示为可编辑字段。</p></>;
}

function CarouselContent({ active, updateNode, addNestedNode, allowAdd = true }) {
  const config = active.config ?? {};
  const updateConfig = (patch) => updateNode(active.id, { config: { ...config, ...patch } });
  if (Array.isArray(config.slides)) {
    const slides = config.slides;
    const updateSlides = (next, initialSlide = config.initialSlide ?? 0) => updateConfig({ slides: next, initialSlide: Math.min(Math.max(0, initialSlide), next.length - 1) });
    const updateSlide = (index, patch) => updateSlides(slides.map((slide, position) => position === index ? { ...slide, ...patch } : slide));
    const uploadSlide = (index, file) => {
      if (!file?.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => updateSlide(index, { image: String(reader.result) });
      reader.readAsDataURL(file);
    };
    const moveSlide = (index, direction) => {
      const next = [...slides];
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      const initial = config.initialSlide ?? 0;
      updateSlides(next, initial === index ? index + direction : initial === index + direction ? index : initial);
    };
    return <><Field label="初始展示"><select value={Math.min(config.initialSlide ?? 0, slides.length - 1)} onChange={(event) => updateConfig({ initialSlide: Number(event.target.value) })}>{slides.map((slide, index) => <option key={slide.id} value={index}>第 {index + 1} 页</option>)}</select></Field><div className="carousel-slide-list">{slides.map((slide, index) => <section className="product-row-editor" key={slide.id}><header><strong>第 {index + 1} 页</strong><div><button type="button" title="上移" disabled={index === 0} onClick={() => moveSlide(index, -1)}>↑</button><button type="button" title="下移" disabled={index === slides.length - 1} onClick={() => moveSlide(index, 1)}>↓</button><button type="button" title="删除此页" disabled={slides.length === 1} onClick={() => updateSlides(slides.filter((_, position) => position !== index), (config.initialSlide ?? 0) > index ? (config.initialSlide ?? 0) - 1 : config.initialSlide)}><X size={15} /></button></div></header><Field label="图片"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadSlide(index, event.target.files?.[0])} />{slide.image && <img className="carousel-slide-thumbnail" src={slide.image} alt={`第 ${index + 1} 页图片`} />}</Field><Field label="标题"><input value={slide.title ?? ""} onChange={(event) => updateSlide(index, { title: event.target.value })} /></Field><Field label="说明文案"><textarea value={slide.caption ?? ""} onChange={(event) => updateSlide(index, { caption: event.target.value })} /></Field></section>)}</div><button type="button" className="text-action" onClick={() => updateSlides([...slides, { id: `slide-${Date.now()}`, image: "", title: "", caption: "" }])}><Plus size={15} /> 添加一页</button></>;
  }
  return <><h4>轮播设置</h4><div className="split-fields"><Field label="轮播页数"><input type="number" min="1" max="10" value={config.itemCount ?? active.content ?? 1} onChange={(event) => updateConfig({ itemCount: Math.max(1, Math.min(10, Number(event.target.value) || 1)) })} /></Field><Field label="初始展示页"><input type="number" min="0" max={Math.max(0, (config.itemCount ?? active.content ?? 1) - 1)} value={config.initialSlide ?? 0} onChange={(event) => updateConfig({ initialSlide: Math.max(0, Number(event.target.value) || 0) })} /></Field></div>{allowAdd && <><h4>轮播内容</h4><button className="text-action" onClick={() => addNestedNode(active.id, "Card")}><Plus size={15} /> 添加组件</button></>}</>;
}

function ProductsContent({ active, updateNode, pricePreviewMode }) {
  const config = active.config ?? {};
    const variant = config.productTemplate ?? (config.bluePrivilege ? "blue-privilege" : active.content?.includes("¥1198") ? "sku-sheet" : active.content?.includes("新用户立省") ? "payment-recovery" : "membership-plans");
    const rows = productPackageRows(active, variant);
    const updateRows = (nextRows, patch = {}) => updateNode(active.id, { config: { ...config, productTemplate: variant, packageRows: nextRows, ...patch } });
    const updateRow = (index, patch) => updateRows(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
    const linked = config.linkedProducts === true;
    const removeRow = (index) => {
      if (rows.length <= 1) return;
      const selected = config.defaultSelected ?? (config.bluePrivilege ? 1 : 0);
      const nextSelected = selected > index ? selected - 1 : selected === index ? Math.min(index, rows.length - 2) : selected;
      updateRows(rows.filter((_, rowIndex) => rowIndex !== index), { defaultSelected: nextSelected });
    };
    const missing = rows.map((row, index) => !row.emptySlot && resolveProductPrice(row, pricePreviewMode).missing ? index + 1 : null).filter(Boolean);
    return <>
      {config.priceSummary && <><p className="property-copy">未绑定 SKU 时，价格预览沿用源模板；绑定后使用商品价格。</p><div className="split-fields"><Field label="源模板参考价"><input value={config.sourceComparePrice ?? ""} onChange={(event) => updateNodeConfig(active, updateNode, { sourceComparePrice: event.target.value })} /></Field><Field label="源模板现价"><input value={config.sourceCurrentPrice ?? ""} onChange={(event) => updateNodeConfig(active, updateNode, { sourceCurrentPrice: event.target.value })} /></Field></div></>}
      {linked ? <p className="product-price-warning">商品、顺序及默认选中由基础设置统一控制；这里配置套餐样式。</p> : <Field label="默认选中商品"><select value={String(Math.min(config.defaultSelected ?? (config.bluePrivilege ? 1 : 0), Math.max(0, rows.length - 1)))} onChange={(event) => updateRows(rows, { defaultSelected: Number(event.target.value) })}>{rows.map((row, index) => <option key={index} value={index}>{row.name || `套餐 ${index + 1}`}</option>)}</select></Field>}
      {missing.length > 0 && <p className="product-price-warning">套餐 {missing.join("、")} 未关联有效 SKU；请先选择 SKU ID。</p>}
      <div className="product-package-list">{rows.map((row, index) => {
        if (linked && row.emptySlot) return <section className="product-row-editor" key={index}><header><strong>套餐 {index + 1} · 空坑位</strong></header></section>;
        const fields = productPriceFields(row);
        const months = billingMonths(row);
        const groupLabel = config.linkedTabsId && index % Number(config.groupSize) === 0 ? config.tabGroupLabels?.[Math.floor(index / Number(config.groupSize))] : null;
        return <section className="product-row-editor" key={index}>
          {groupLabel && <h4>{groupLabel}</h4>}
          <header><strong>套餐 {index + 1}</strong>{!linked && !config.linkedTabsId && <button type="button" className="icon" title={rows.length <= 1 ? "至少保留一个套餐" : "删除套餐"} aria-label={`删除套餐 ${index + 1}`} disabled={rows.length <= 1} onClick={() => removeRow(index)}><X size={15} /></button>}</header>
          {linked ? <div className="product-sku-summary"><span>{row.name}</span><span>SKU：{row.skuId}</span></div> : <div className="split-fields"><Field label="展示名称"><input aria-label={`套餐 ${index + 1} 名称`} value={row.name} onChange={(event) => updateRow(index, { name: event.target.value })} /></Field><Field label="SKU ID（演示映射）"><select aria-label={`套餐 ${index + 1} SKU ID`} value={row.skuId ?? ""} onChange={(event) => { const previous = skuById(row.skuId); const next = skuById(event.target.value); updateRow(index, { skuId: event.target.value, name: !row.name || row.name === previous?.displayName ? next?.displayName ?? row.name : row.name }); }}><option value="">请选择 SKU</option>{DEMO_SKUS.map((sku) => <option key={sku.id} value={sku.id}>{sku.id} · {sku.label}</option>)}</select></Field></div>}
          <div className="product-sku-summary" aria-label={`套餐 ${index + 1} SKU 商品信息`}><span>周期：{months === 0 ? "终身" : months ? `${months} 个月` : "未关联"}</span><span>总价：{fields.total || "未关联"}</span>{months !== 0 && <span>月均价：{fields.monthly || "未关联"}</span>}{fields.referenceTotal && <span>参考价：{fields.referenceTotal}</span>}</div>
        </section>;
      })}</div>
      {!linked && !config.linkedTabsId && <button type="button" className="text-action" onClick={() => updateRows([...rows, { name: "新套餐", skuId: "", supportingCopy: "", savingCopy: "", saveCopy: "", badgeText: "", showSupportingCopy: false, showReferencePrice: false, showSavingCopy: false, showSaveCopy: false, showBadge: false }])}><Plus size={15} /> 添加套餐</button>}
    </>;
}

function RetentionImageField({ active, updateNode, name, label, fallback }) {
  const inputRef = useRef(null);
  const current = active.config?.[name] ?? fallback;
  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => updateNodeConfig(active, updateNode, { [name]: reader.result });
    reader.readAsDataURL(file);
  };
  return <Field label={label}><div className="retention-image-field"><input ref={inputRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /><button type="button" className="secondary" onClick={() => inputRef.current?.click()}>{current ? "替换图片" : "上传图片"}</button>{current && <button type="button" className="secondary" onClick={() => updateNodeConfig(active, updateNode, { [name]: "" })}>移除</button>}{current && <img src={current} alt="当前素材" />}</div></Field>;
}

function RetentionContent({ active, updateNode, previewOpen, onPreview }) {
  const config = active.config ?? {};
  const field = (name, label, fallback = "") => <Field label={label} key={name} required={["title", "buttonText", "cancelText"].includes(name)}><input value={config[name] ?? fallback} onChange={(event) => updateNodeConfig(active, updateNode, { [name]: event.target.value })} /></Field>;
  return <><button type="button" className="secondary retention-preview-button" onClick={onPreview}>{previewOpen ? <EyeOff size={16} /> : <Eye size={16} />}{previewOpen ? "关闭预览" : "预览弹窗"}</button>{field("title", "标题", "错过这次，就要多花 30%😱")}<RetentionImageField active={active} updateNode={updateNode} name="backgroundImage" label="弹窗背景图片" fallback="" /><RetentionImageField active={active} updateNode={updateNode} name="imageSrc" label="主视觉图片" fallback="/ht-retention-gift.png" />{field("timerLabel", "倒计时文案", "倒计时")}{field("timerStart", "倒计时初始值", "71:22:22")}{field("buttonText", "主按钮文案", "立享优惠")}{field("cancelText", "取消按钮文案", "忍痛取消")}</>;
}

function RetentionStyle({ active, updateNode }) {
  return <><ConfigColorField label="弹窗背景颜色" active={active} updateNode={updateNode} name="backgroundColor" fallback="#f7f7f7" /><ConfigColorField label="标题文字颜色" active={active} updateNode={updateNode} name="titleColor" fallback="#111111" /><ConfigColorField label="倒计时文字颜色" active={active} updateNode={updateNode} name="timerColor" fallback="#11bf42" /><div className="split-fields"><ConfigColorField label="按钮起始颜色" active={active} updateNode={updateNode} name="buttonStartColor" fallback="#ff8600" /><ConfigColorField label="按钮结束颜色" active={active} updateNode={updateNode} name="buttonEndColor" fallback="#ffcd00" /></div><ConfigColorField label="按钮文字颜色" active={active} updateNode={updateNode} name="buttonTextColor" fallback="#ffffff" /></>;
}

function ConfigInput({ active, updateNode, name, fallback, ...props }) {
  const value = active.config?.[name] ?? fallback;
  return <input value={value} onChange={(event) => updateNode(active.id, { config: { ...active.config, [name]: event.target.value } })} {...props} />;
}

export function Field({ label, children, required = false, optional = false }) {
  const requiredLabels = ["标题", "描述", "图片", "行首文字", "图标字符", "SKU ID（演示映射）", "Plans", "组件名称", "Terms of Service URL", "Privacy Policy URL"];
  const isRequired = !optional && (required || label?.endsWith(" *") || requiredLabels.includes(label));
  const displayLabel = label?.endsWith(" *") ? label.slice(0, -2) : label;
  return <label className={`form-field${isRequired ? " required" : ""}`}><span aria-label={isRequired ? `${displayLabel}，必填` : undefined}>{displayLabel}</span>{children}</label>;
}
