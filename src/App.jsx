import ComponentEditor from './builder/ComponentEditor.jsx';
import { Field } from './builder/BuilderProperties.jsx';
import { isTextNodeType, productPackageRows, listRowsFor, privilegeRowsFor, agreementSegmentsFor, textRunsFor, validTextLink, helloTalkTemplateDefaults, heroTitleParts, privilegeColumnsFor, safeButtonUrl } from './builder/fieldModels.js';
import { PRODUCT_LAYOUTS, productLayout, PRODUCT_PART_DEFAULT_SIZES, HT_PRODUCT_DESIGN_DEFAULTS, PRODUCT_PARTS, productFontSize, validHexColor, productGradient, productPartStyle } from './products/productStyleModel.js';
import { useProductCardPlacement } from './products/useProductCardPlacement.js';
import { ProductPackageCard } from './products/ProductPackageCard.jsx';
import { createBuilderNodes, templates, node, initialPrivilegeRows, documentProductColors, initialPrivilegeOrder, knownPrivilegeValues, referencePrivilegeIcon, privilegeNames } from './templates/templateDefinitions.js';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { linkActionFor, visibleLinkLabels } from "./linkActions.js";

import { DEMO_SKUS, PRICE_DISPLAY_MODES, billingMonths, productPriceFields, resolveProductPrice, skuById, skuCopy, templateSkuId } from "./productPricing.js";
import { clearLocalDemoSettings, beginLocalDemoReset, cancelLocalDemoReset } from "./templateStorage.js";
import { listSavedPaywalls, readSavedPaywall, savePaywallBatch, removeSavedPaywall } from './paywallStorage.js';
import { DEFAULT_VERTICAL_PAYWALL, DEFAULT_ROW_PAYWALL, readConfiguredPaywall } from './defaultPaywalls.js';
import { savedOfferings, createExitOffer, workspaceExitOfferIds, exitOfferId, bindExitOffer } from './builder/exitOffers.js';
import { workflowContext } from './builder/workflow.js';
import { indexDocument, importComponentDocument } from './builder/componentDocument.js';
import { clearCustomBundles } from "./builder/customStorage.js";
import { localizeInterface } from './interfaceLocalization.js';
import { productTranslation } from "./productPlacement.js";
import { productArrangement } from "./productArrangement.js";
import { PRODUCT_REGIONS, contentRegions, moveContentPart, contentSlot } from "./productContentOrder.js";
import { revenueCatGallery } from "./revenueCatGallery.js";
import { createSourceTemplateNodes, observedTemplate, sourceBlueprints } from "./revenueCatSourceBlueprints.js";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Armchair,
  Archive,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Ban,
  Bell,
  Blocks,
  Clock3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Image as ImageIcon,
  LayoutTemplate,
  MoreVertical,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Upload,
  WandSparkles,
  X,
  Download,
  Dumbbell,
  FolderOpen,
  Gift,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  GalleryHorizontal,
  Link2,
  LogIn,
  LockKeyhole,
  List,
  Map as MapIcon,
  MousePointerClick,
  Moon,
  Flower2,
  Package,
  Pencil,
  PersonStanding,
  RectangleHorizontal,
  RotateCw,
  ScanSearch,
  Signal,
  Type,
  Star,
  Heart,
  ShieldCheck,
  Shirt,
  Ticket,
  Telescope,
  Rocket,
  Orbit,
  Users,
  Weight,
  Wifi,
  BatteryFull,
} from "lucide-react";











const originalPaywalls = [
  { id: "test", name: "test", state: "Live", products: 3, startedAt: "3 Apr 2026", icon: false },
  { id: "test-2", name: "test 2", state: "Draft", products: 2, startedAt: "25 Mar 2026", icon: true },
  DEFAULT_VERTICAL_PAYWALL,
  DEFAULT_ROW_PAYWALL,
];

const nav = [
  ["Paywalls", Smartphone],
];

const missingItems = [
  {
    id: "M-01",
    feature: "Live 发布与回退",
    known: "Live 的 General 页在有改动时显示 Save & publish；从 Live Duplicate、命名、Save 后会出现 Paywall publishing confirmation，Accept 后副本以 Live 状态打开。Draft 的 Save 不出现发布确认，点击后仍为 Draft；Draft 额外有 Test on Device。",
    unknown: "Draft 直接升 Live、审核、版本快照、Rollback 与 Inactivate 逻辑未实测。",
  },
  {
    id: "M-02",
    feature: "AI 生成提交",
    known: "已见 Chats / Examples、提示词、8 个风格标签与示例入口。提交实际提示词后，当前账号返回：无法检测 App Store 应用，需在 iOS SDK settings 填写 Apple App ID。",
    unknown: "填写有效 Apple App ID 后的生成结果、耗时、额度、覆盖与编辑规则未实测。",
  },
  {
    id: "M-03",
    feature: "模板应用与 Change template",
    known: "选择模板后 Open in Builder 可用，已实际进入 Builder；首次保存会提示 Custom Fonts，并要求 Links 中的 Terms of Service / Privacy Policy URL。",
    unknown: "模板覆盖范围、撤销、与既有节点的合并规则未实测。",
  },
  {
    id: "M-04",
    feature: "Copy a Design 最终复制",
    known: "入口打开 Search 与 Copy Selected Paywall（未选择时禁用）；说明为仅复制视觉 Builder 配置。当前账号没有可选择的其他应用设计候选。",
    unknown: "有来源候选时的最终复制、资产、字体、组件与错误恢复规则未实测。",
  },
  {
    id: "M-05",
    feature: "SDK 与真实交易",
    known: "产品首笔交易后被锁定；Test on Device 会提供二维码与 mobile-app.adapty.io/paywall-preview 链接。",
    unknown: "设备测试、购买、恢复、权益、事件归因与非零报表未实测。",
  },
  {
    id: "G-01",
    feature: "应用切换",
    known: "顶部存在当前应用切换入口。",
    unknown: "应用目录、权限范围、切换后的数据刷新和异常处理未实测。",
  },
  {
    id: "B-01",
    feature: "Builder 属性保存",
    known: "已见 Layout settings、Links 的 Content 字段/开关、Hero Image、Card、Timer、Products 的 Content / Style / Layout 面板、设备预览与语言列表。十个 Add element 入口均已逐项点击：Text 默认 text；Image/Card/List/Carousel/Products 默认空容器；Web Paywall Button 默认 Pay on web；Button 默认 button text；Links 默认 Terms/Privacy/Restore/Login；Timer 默认 04:59:59。Save 会要求 Paywall publishing confirmation，确认后重载仍存在。",
    unknown: "字段校验、多语言覆盖、Discard / Undo 以及未逐项记录的 Card 布局字段未实测。",
  },
  {
    id: "MT-01",
    feature: "Metrics 数据结果与导出",
    known: "已见日期、粒度、State、Product、Audience 与 install date 控件，以及零数据卡片和明细表。",
    unknown: "真实指标口径、归因、筛选结果、非零数据与下载导出未实测。",
  },
];



const componentCatalog = ["Text", "Header", "Image", "Page Background", "Video", "Icon", "Card", "Stack", "Screen Flow", "Web Paywall Button", "Button", "List", "Feature Table", "Timeline", "Social Proof", "Award", "Tabs", "Toggle", "Links", "Agreement", "Timer", "Carousel", "Products", "Footer"];

const sourceTreeObserved = new Set(["knowledge", "trial", "connection", "family", "premium-access", "document", "yoga", "black-friday", "black-friday-timer", "christmas", "halloween", "new-year", "report", "avatar", "mindfulness", "trial-white", "trial-blue", "fitness-trial", "access", "weather", "workout", "audiobooks", "herbs", "video-access", "design-life", "full-app", "item-placeholder", "item-placeholder-dark", "fantasy-access", "editing-plan", "training"]);
const documentStyleTemplateIds = new Set(["ht-blue-privilege", "ht-membership-plans", "ht-payment-recovery", "ht-sku-sheet"]);
const curatedSourceTemplateIds = new Set(["knowledge", "trial", "family", "document", "mindfulness", "editing-plan", "black-friday-timer", "halloween"]);
const catalogTemplates = templates.filter((template) => template.documentTemplate || template.isGallery);
const isEditableTemplate = (template) => template.isNew || sourceTreeObserved.has(template.id) || documentStyleTemplateIds.has(template.id);
const templateEditableStatus = (template) => template.isGallery ? [5, 6].includes(template.sourceOrder) ? `Talkin RevenueCat 第 ${template.sourceOrder} 张：已按源画面重建并本地验收；价格仍为预览数据` : template.editorVerified ? `Talkin RevenueCat 第 ${template.sourceOrder} 张：源编辑器组件已核对；视觉仍待逐张对照验收` : `Talkin RevenueCat 第 ${template.sourceOrder} 张：只有预览证据，源编辑器与视觉尚未核实` : template.sourceProvider === "RevenueCat" ? `Talkin 项目中的 RevenueCat 模板画廊：${template.sourceTemplate}；本地可编辑复现` : template.isNew ? "本地组合模板；组件均可编辑" : documentStyleTemplateIds.has(template.id) ? "飞书交付文档已定义样式与字段；本地可编辑复现" : "源端已观察核心结构；本地可编辑复现";

// Source-template filters reflect observed Builder trees; local combinations use their own component lists.
const sourceVerifiedTemplateComponents = Object.freeze({
  knowledge: ["Trial timeline", "Reviews"],
  trial: ["Trial timeline"],
  "trial-white": ["Trial timeline"],
  "trial-blue": ["Trial timeline"],
  "fitness-trial": ["Trial timeline"],
  "premium-access": ["Trial timeline"],
  halloween: ["Reviews"],
  mindfulness: ["Free trial toggle"],
  "ht-blue-privilege": ["Timer"],
  "ht-membership-plans": ["Carousel"],
  "ht-payment-recovery": ["Timer"],
  "ht-sku-sheet": ["Timer"],
});



function nodeParentId(nodes, index) {
  const current = nodes[index];
  if (current?.parentId) return current.parentId;
  const depth = current?.depth ?? 0;
  if (!depth) return null;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if ((nodes[cursor].depth ?? 0) === depth - 1) return nodes[cursor].id;
  }
  return null;
}

function nodeSubtreeEnd(nodes, start) {
  const depth = nodes[start]?.depth ?? 0;
  let end = start + 1;
  while (end < nodes.length && (nodes[end].depth ?? 0) > depth) end += 1;
  return end;
}

function canMoveBuilderNode(nodes, sourceId, targetId) {
  const sourceIndex = nodes.findIndex((node) => node.id === sourceId);
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
  if (targetIndex >= sourceIndex && targetIndex < nodeSubtreeEnd(nodes, sourceIndex)) return false;
  return nodeParentId(nodes, sourceIndex) === nodeParentId(nodes, targetIndex);
}

function moveBuilderNode(nodes, sourceId, targetId, position) {
  if (!canMoveBuilderNode(nodes, sourceId, targetId)) return nodes;
  const sourceIndex = nodes.findIndex((node) => node.id === sourceId);
  const sourceEnd = nodeSubtreeEnd(nodes, sourceIndex);
  const moving = nodes.slice(sourceIndex, sourceEnd);
  const remaining = [...nodes.slice(0, sourceIndex), ...nodes.slice(sourceEnd)];
  const targetIndex = remaining.findIndex((node) => node.id === targetId);
  const insertAt = position === "before" ? targetIndex : nodeSubtreeEnd(remaining, targetIndex);
  return [...remaining.slice(0, insertAt), ...moving, ...remaining.slice(insertAt)];
}

function PreviewReorderHandle({ onDragStart, onDragEnd }) {
  return <span className="preview-reorder-handle" draggable title="拖动调整组件顺序" aria-label="拖动调整组件顺序" onClick={(event) => event.stopPropagation()} onDragStart={onDragStart} onDragEnd={onDragEnd}><GripVertical size={15} /></span>;
}















function createComponentNode(type, index) {
  const contentByType = {
    Text: "text", Header: "标题", Image: "", "Page Background": "", Video: "", Icon: "", Card: "", Stack: "", "Screen Flow": "", Screen: "新页面", "Feature Table": "", "Web Paywall Button": "Pay on web", Button: "button text", List: "", Timeline: "", "Social Proof": "超过 50,000 位用户选择了我们", Award: "年度精选应用", Tabs: "", Toggle: "启用免费试用|可随时取消", Footer: "可随时取消", "List item": "title|caption", Links: "Terms · Privacy · Restore · Login", Agreement: "我已阅读并同意", Timer: "04:59:59", Carousel: "", Products: "",
  };
  const configByType = {
    Timer: { enabled: true, format: "hh:mm:ss", separator: ":", prefix: "", suffix: "", resetMode: "Reset timer on every paywall view" },
    Carousel: { initialSlide: 0, slides: [{ id: `slide-${index}-1`, image: "", title: "", caption: "" }] },
    Products: { defaultSelected: 0, showOfferBadge: true },
    Button: { action: "Purchase" },
    Agreement: { showCheckbox: true, required: true, termsLabel: "服务条款", termsUrl: "", privacyLabel: "隐私政策", privacyUrl: "" },
    Icon: { iconName: "star", iconSize: 24, color: "#6a31e9" },
    "Page Background": { mediaFit: "cover", mediaBackgroundColor: "#ffffff" },
    Timeline: { listRows: [{ title: "今天", caption: "立即解锁全部权益" }, { title: "第 2 天", caption: "收到订阅提醒" }, { title: "第 3 天", caption: "订阅开始，可随时取消" }] },
    Tabs: { tabs: [{ id: `tab-${index}-1`, title: "月度", description: "月度套餐" }, { id: `tab-${index}-2`, title: "年度", description: "年度套餐" }], defaultTab: 0 },
    Stack: { axis: "vertical", gap: 8 },
    "Screen Flow": { defaultStep: 0 },
    "Feature Table": { columns: ["会员"], rows: [{ name: "权益名称", values: ["权益说明"] }] },
    "Social Proof": { count: "50,000+", caption: "用户好评", rating: 5 },
    Award: { title: "年度精选应用", source: "编辑推荐", accentColor: "#f3a718" },
    Toggle: { onColor: "#6a31e9", offColor: "#d9dde0" },
  };
  return { id: `added-${type.toLowerCase().replace(/[^a-z]+/g, "-")}-${index}`, type, label: "", depth: 0, content: contentByType[type] ?? "", config: configByType[type], ...(type === "Header" ? { variant: "headline" } : {}), ...(type === "Toggle" ? { defaultState: "Off" } : {}) };
}



function BuilderNodeIcon({ type }) {
  const icons = { Timer: Clock3, Products: Package, Award: Star, Toggle: Check, Timeline: Clock3, Tabs: LayoutTemplate, "Screen Flow": LayoutTemplate, Screen: RectangleHorizontal, "Feature Table": List, "Social Proof": Users, Icon: Star, Stack: Blocks, Video: ImageIcon, Links: Link2, Agreement: Check, Carousel: GalleryHorizontal, Card: RectangleHorizontal, List, Footer: Type };
  const Icon = icons[type] ?? (["Button", "Purchase Button", "Web Paywall Button"].includes(type) ? MousePointerClick : ["Hero Image", "Image", "Page Background"].includes(type) ? ImageIcon : isTextNodeType(type) ? Type : Blocks);
  return <Icon size={13} strokeWidth={2.15} />;
}

const productOptions = [
  "月度会员 / Monthly",
  "Japanese ai / 3 months",
  "Japanese Ai - 1 Year / Annual",
];

const paywallBusinessTypes = ["6 - 会员", "83 - 特权类VIP"];
const paywallScenesByBusinessType = {
  "83 - 特权类VIP": ["48 - 直播语聊无限时长特权"],
  "6 - 会员": ["3 - 新会员特权页-蓝色", "40 - SKU半窗", "16 - 访客", "17 - 附近", "18 - 城市特权"],
};
const paywallPublicAccounts = ["11000 - ht_vip", "11001 - hello_hellotalky", "15304 - ht_vip_plus", "11006 - hey_livea"];
const paywallProductCatalog = DEMO_SKUS.map((sku) => ({ id: sku.id, name: sku.label }));

function linkedPackageNode(productNode, offerRows, defaultProductId, variant) {
  if (!productNode || !Array.isArray(offerRows)) return productNode;
  const originalRows = productPackageRows(productNode, variant);
  const slotCount = { "blue-privilege": 3, "membership-plans": 3, "payment-recovery": 2, "sku-sheet": 2, "rc-family-plans": 4, "rc-credits-onetime": 5 }[variant] ?? originalRows.length;
  const packageRows = Array.from({ length: slotCount }, (_, index) => {
    const row = offerRows[index];
    const existing = originalRows.find((item) => item.skuId && item.skuId === row?.id) ?? {};
    return row?.id ? { ...existing, skuId: row.id, name: skuById(row.id)?.displayName ?? row.name, emptySlot: false } : { ...existing, skuId: "", name: "", emptySlot: true };
  });
  return { ...productNode, config: { ...productNode.config, linkedProducts: true, packageRows, defaultSelected: packageRows.findIndex((row) => row.skuId === defaultProductId) } };
}
const emptyPaywallOfferRow = () => ({ key: crypto.randomUUID(), id: "", name: "", offer: "0", offerLabel: "不展示", unselectedTopLabel: "", selectedTopLabel: "", selectedButtonCopy: "", selectedButtonTagCopy: "不展示", giftPack: "0" });
const defaultPaywallOfferRows = () => ["DEMO-BLUE-MONTH", "DEMO-BLUE-YEAR", "DEMO-BLUE-LIFETIME"].map((id) => ({ ...emptyPaywallOfferRow(), id, name: paywallProductCatalog.find((product) => product.id === id)?.name ?? "" }));

const observedProductRows = [
  { product: "Japanese Ai - 1 Year", period: "Annual", offer: "Black Friday" },
  { product: "Japanese ai", period: "3 months", offer: "No offers for this product" },
  { product: "月度会员", period: "Monthly", offer: "springsale" },
];

const localeLabels = {
  en: "English",
  zh: "Simplified Chinese",
  ja: "Japanese",
};



const freshPaywallDraft = () => ({
  name: 'RESEARCH - Rebuild Draft', businessType: paywallBusinessTypes[0], businessScene: paywallScenesByBusinessType[paywallBusinessTypes[0]][0], publicAccount: paywallPublicAccounts[0], note: '', offerRows: defaultPaywallOfferRows(), defaultProductId: 'DEMO-BLUE-YEAR', products: [],
});

export default function App() {
  const [view, setViewNow] = useState("list");
  const [paywalls, setPaywalls] = useState(() => {
    const saved = listSavedPaywalls(window.localStorage).map((record) => record.paywall).filter((paywall)=>!paywall.id.startsWith('local-exit-'));
    return [...originalPaywalls.map((item) => saved.find((record) => record.id === item.id) ?? item), ...saved.filter((item) => !originalPaywalls.some((original) => original.id === item.id))];
  });
  const [selectedId, setSelectedId] = useState("test-2");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("Live,Draft,Inactive");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [draft, setDraft] = useState(freshPaywallDraft);
  const [compliance, setCompliance] = useState(false);
  const [rememberCompliance, setRememberCompliance] = useState(false);
  const [templateSelected, setTemplateSelected] = useState(null);
  const [appliedTemplate, setAppliedTemplate] = useState(null);
  const [templateLinks, setTemplateLinks] = useState({ terms: "terms-link", privacy: "privacy-link" });
  const [builderNodes, setBuilderNodes] = useState(() => createBuilderNodes());
  const [builderDocument, setBuilderDocument] = useState(null);
  const [savedDocument, setSavedDocument] = useState(null);
  const [exitOfferDrafts, setExitOfferDrafts] = useState({});
  const [builderRevision, setBuilderRevision] = useState(0);
  const [resetPending, setResetPending] = useState(false);
  const [builderOrigin, setBuilderOrigin] = useState("existing");
  const [activeNode, setActiveNode] = useState("links");
  const [unknownOpen, setUnknownOpen] = useState(false);
  const [placementFilter, setPlacementFilter] = useState([]);
  const [placementDraft, setPlacementDraft] = useState([]);
  const [placementMenuOpen, setPlacementMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [locale, setLocale] = useState("zh-CN");
  const [generalName, setGeneralName] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const workspaceDirty = Boolean(builderDocument && JSON.stringify(builderDocument) !== JSON.stringify(savedDocument) || Object.keys(exitOfferDrafts).length || generalName !== null);
  const needsExitGuard = () => ['builder','general'].includes(view) && workspaceDirty || view === 'create';
  const requestWorkspaceAction = (run, title = '有尚未保存的修改', replace = false) => {
    if (needsExitGuard()) setPendingAction({ run, title, replace });
    else run();
  };
  const setView = (next) => ['list','metrics'].includes(next) ? requestWorkspaceAction(() => setViewNow(next)) : setViewNow(next);
  useEffect(() => {
    const beforeUnload = (event) => { if (needsExitGuard()) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [view, workspaceDirty]);

  useEffect(() => {
    const root = document.querySelector(".app");
    document.documentElement.lang = locale === "zh-CN" ? "zh-CN" : "en";
    localizeInterface(root, locale);
    let scheduled = false;
    let disposed = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => { scheduled = false; if (disposed) return; observer.disconnect(); localizeInterface(root, locale); if (root) observer.observe(root, { childList: true, subtree: true, characterData: true }); });
    });
    if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => { disposed = true; observer.disconnect(); };
  }, [locale]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const filteredPaywalls = useMemo(() => {
    const allowedStates = stateFilter.split(",");
    return paywalls.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && allowedStates.includes(item.state));
  }, [paywalls, search, stateFilter]);

  const selected = paywalls.find((item) => item.id === selectedId) ?? paywalls[0];
  const savedRecords = useMemo(() => listSavedPaywalls(window.localStorage), [paywalls]);
  const offerings = useMemo(() => savedOfferings([...savedRecords.filter((record) => !exitOfferDrafts[record.paywall.id]), ...Object.values(exitOfferDrafts)], builderOrigin === 'create' ? undefined : selectedId), [savedRecords, exitOfferDrafts, builderOrigin, selectedId]);
  const changeExitOffer = React.useCallback((id, document) => {
    setExitOfferDrafts((current) => {
      if (current[id]?.document === document) return current;
      const record = current[id] ?? readSavedPaywall(window.localStorage, id);
      if (!record || !current[id] && JSON.stringify(record.document) === JSON.stringify(document)) return current;
      const name = indexDocument(document).nodes.get(document.settings?.presentationSurfaceId)?.name ?? document.root.name;
      return { ...current, [id]: { ...record, document, paywall: { ...record.paywall, name: name || record.paywall.name, products: Object.keys(document.products).length } } };
    });
  }, []);
  const prepareExitOffer = React.useCallback((document, surfaceId, selection, sourceId) => {
    const id = `local-exit-${crypto.randomUUID()}`;
    const result = createExitOffer(document, id, surfaceId, selection, sourceId);
    if (!result) return null;
    const record = { version: 1, templateId: result.offerDocument.templateId, document: result.offerDocument, paywall: { id, name: result.name, state: 'Draft', products: Object.keys(result.offerDocument.products).length, startedAt: new Date().toLocaleDateString('zh-CN') } };
    setExitOfferDrafts((current) => ({ ...current, [id]: record }));
    return result.mainDocument;
  }, []);

  const restoreBuilder = (record = null) => {
    setGeneralName(null);
    setExitOfferDrafts({});
    const index = record ? templates.findIndex((template) => template.id === record.templateId) : -1;
    setAppliedTemplate(index < 0 ? null : index);
    setTemplateSelected(index < 0 ? null : index);
    setBuilderNodes(index < 0 ? [] : createBuilderNodes(record.templateId));
    setBuilderDocument(record?.document ?? null);
    setSavedDocument(record?.document ?? null);
    setBuilderRevision((value) => value + 1);
  };

  const startCreation = () => requestWorkspaceAction(() => {
    restoreBuilder();
    setDraft(freshPaywallDraft());
    setBuilderOrigin('create');
    setViewNow('create');
  });

  const openPaywall = (item) => requestWorkspaceAction(() => {
    restoreBuilder(readConfiguredPaywall(window.localStorage, item.id));
    setSelectedId(item.id);
    setBuilderOrigin("existing");
    setViewNow("general");
  });

  useEffect(() => {
    if (view === "create") setBuilderOrigin("create");
  }, [view]);

  const duplicate = (source = selected) => {
    if (!source?.id) source = selected;
    const original = source;
    requestWorkspaceAction(() => {
      const record = readConfiguredPaywall(window.localStorage, original.id);
      let content = structuredClone(record?.document ?? importComponentDocument([], { id: 'blank' }));
      const copies = {};
      for (const id of workspaceExitOfferIds(content)) {
        const linked = readSavedPaywall(window.localStorage, id);
        if (!linked) continue;
        const newId = `local-exit-${crypto.randomUUID()}`;
        copies[newId] = { ...structuredClone(linked), paywall: { ...structuredClone(linked.paywall), id: newId, name: `${linked.paywall.name} (Copy)` } };
        for (const page of workflowContext(content).steps) if (exitOfferId(content, page.id) === id) content = bindExitOffer(content, page.id, newId);
        if(content.settings?.retainedPopupIds?.includes(id))content={...content,settings:{...content.settings,retainedPopupIds:content.settings.retainedPopupIds.map((item)=>item===id?newId:item)}};
      }
      const index = templates.findIndex((template) => template.id === content.templateId);
      restoreBuilder(); setBuilderOrigin('create');
      setDraft({ ...freshPaywallDraft(), ...structuredClone(record?.paywall.config ?? {}), name: `${record?.paywall.name ?? original.name} (Copy)` });
      setAppliedTemplate(index < 0 ? null : index); setTemplateSelected(index < 0 ? null : index);
      setBuilderNodes(index < 0 ? [] : createBuilderNodes(content.templateId));
      setBuilderDocument(content); setSavedDocument(null); setViewNow('builder');
      setExitOfferDrafts(copies);
      notify('已复制画布，副本尚未保存。');
    });
  };

  const archiveCurrent = () => {
    if (!removeSavedPaywall(window.localStorage, selected.id)) return notify('本地归档失败，原记录仍保留。');
    setPaywalls((current) => current.filter((item) => item.id !== selected.id));
    setView("list");
    setModal(null);
    notify("Paywall successfully archived.");
  };

  const markUnknown = (item) => {
    setModal({ kind: "unknown", item });
  };

  const updateBuilderNode = (id, patch) => setBuilderNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  const removeBuilderNode = (id) => {
    const removed = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      builderNodes.forEach((node, index) => {
        if (!removed.has(node.id) && removed.has(nodeParentId(builderNodes, index))) {
          removed.add(node.id);
          changed = true;
        }
      });
    }
    const remaining = builderNodes.filter((node) => !removed.has(node.id));
    setBuilderNodes(remaining);
    setActiveNode((current) => removed.has(current) ? (remaining[0]?.id ?? null) : current);
  };
  const applyTemplate = (templateIndex) => {
    setExitOfferDrafts({});
    const template = templates[templateIndex];
    const nextNodes = createBuilderNodes(template.id);
    setBuilderDocument(null);
    setBuilderRevision((value) => value + 1);
    setTemplateSelected(templateIndex);
    setAppliedTemplate(templateIndex);
    setBuilderNodes(nextNodes);
    if (template.id === "rc-credits-onetime") setDraft((current) => {
      const unchangedDemoProducts = current.offerRows?.map((row) => row.id).join("|") === "DEMO-BLUE-MONTH|DEMO-BLUE-YEAR|DEMO-BLUE-LIFETIME";
      if (!unchangedDemoProducts) return current;
      const ids = [25, 50, 100, 250, 500].map((amount) => `DEMO-CREDIT-${amount}`);
      return { ...current, offerRows: ids.map((id) => ({ ...emptyPaywallOfferRow(), id, name: skuById(id)?.label ?? "" })), defaultProductId: ids[0] };
    });
    // Templates do not share a universal node id; select the first real layer.
    setActiveNode(nextNodes[0]?.id ?? "links");
  };

  const saveBuilder = () => {
    if (!builderDocument) { notify('请先打开构建器，确认页面内容后保存。'); return false; }
    if (generalName !== null && !generalName.trim()) { notify('请填写付费墙名称'); return false; }
    const paywall = builderOrigin === 'create' ? { id: `local-${crypto.randomUUID()}`, name: draft.name.trim() || '未命名付费墙', state: 'Draft', products: Object.keys(builderDocument.products).length, startedAt: new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }), config: structuredClone(draft) } : { ...selected, name: generalName?.trim() || selected.name, products: Object.keys(builderDocument.products).length };
    const exitDrafts = workspaceExitOfferIds(builderDocument).map((id) => exitOfferDrafts[id]).filter(Boolean);
    const records = [...exitDrafts, { version: 1, paywall, templateId: builderDocument.templateId, document: builderDocument }];
    if (!savePaywallBatch(window.localStorage, records)) { notify('本地保存失败，修改仍保留。'); return false; }
    setPaywalls((items) => records.filter((record)=>!record.paywall.id.startsWith('local-exit-')).reduce((all, record) => all.some((item) => item.id === record.paywall.id) ? all.map((item) => item.id === record.paywall.id ? record.paywall : item) : [...all, record.paywall], items));
    setExitOfferDrafts({});
    setSelectedId(paywall.id);
    setBuilderOrigin('existing');
    setSavedDocument(builderDocument);
    setGeneralName(null);
    notify('付费墙已保存到本地。');
    return true;
  };

  const saveGeneral = () => {
    const name = (generalName ?? selected.name).trim();
    if (!name) { notify('请填写付费墙名称'); return false; }
    if (builderDocument) return saveBuilder();
    const record = readConfiguredPaywall(window.localStorage, selected.id);
    const content = builderDocument ?? record?.document ?? importComponentDocument([], { id: 'blank' });
    const paywall = { ...selected, name };
    if (!savePaywallBatch(window.localStorage, [{ version: 1, paywall, templateId: content.templateId, document: content }])) { notify('保存失败，修改仍保留。'); return false; }
    setPaywalls((items) => items.map((item) => item.id === paywall.id ? paywall : item));
    setBuilderDocument(content); setSavedDocument(content); setGeneralName(null); notify('付费墙已保存到本地。'); return true;
  };

  const discardBuilder = () => {
    const record = builderOrigin === 'existing' ? readConfiguredPaywall(window.localStorage, selected.id) : null;
    if (record) restoreBuilder(record);
    else { setGeneralName(null); setExitOfferDrafts({}); setBuilderDocument(null); setBuilderNodes(appliedTemplate === null ? [] : createBuilderNodes(templates[appliedTemplate].id)); setBuilderRevision((value) => value + 1); }
    notify(record ? '已恢复上次保存的付费墙。' : '已恢复模板默认内容。');
  };

  const resetLocal = async () => {
    if (resetPending) return;
    setResetPending(true);
    beginLocalDemoReset(window.localStorage);
    try {
      await clearCustomBundles();
      if (!clearLocalDemoSettings(window.localStorage)) throw new Error('storage');
      window.location.reload();
    } catch {
      cancelLocalDemoReset(window.localStorage);
      setResetPending(false);
      notify('本地设定清除失败，请检查浏览器存储权限。');
    }
  };

  return (
    <div className={`app ${unknownOpen ? "" : "evidence-collapsed"}`}>
      <aside className="sidebar">
        <div className="brand">a</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button className={`nav-item ${label === "Paywalls" ? "active" : ""}`} key={label} onClick={() => label === "Paywalls" && setView("list")}>
              <Icon size={18} />
              <span>{label}</span>
              {label === "Flows" && <em>Beta</em>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="app-switcher"><b>T</b> Test</div>
          <div className="top-actions"><div className="language-console" data-no-translate><span>{locale === "zh-CN" ? "界面语言" : "Interface language"}</span><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "zh-CN" ? "active" : ""} onClick={() => setLocale("zh-CN")}>中文</button></div><button type="button" className="local-reset-button" onClick={() => setModal({ kind: "local-reset" })}><RotateCw size={14} /> 重置</button></div>
        </header>

        <div className="content">
          {view === "list" && (
            <PaywallList
              paywalls={filteredPaywalls}
              search={search}
              setSearch={setSearch}
              stateFilter={stateFilter}
              setStateFilter={setStateFilter}
              placementFilter={placementFilter}
              setPlacementFilter={setPlacementFilter}
              placementDraft={placementDraft}
              setPlacementDraft={setPlacementDraft}
              placementMenuOpen={placementMenuOpen}
              setPlacementMenuOpen={setPlacementMenuOpen}
              rowMenuId={rowMenuId}
              setRowMenuId={setRowMenuId}
              openPaywall={openPaywall}
              onCreate={startCreation}
              setView={setView}
              setModal={setModal}
              duplicate={duplicate}
              locale={locale}
            />
          )}
          {view === "create" && (
            <CreatePaywall
              draft={draft}
              setDraft={setDraft}
              setView={setView}
              setModal={setModal}
              markUnknown={markUnknown}
            />
          )}
          {view === "general" && (
            <PaywallWorkspace
              selected={selected}
              draft={draft}
              setDraft={setDraft}
              view={view}
              setView={setView}
              duplicate={duplicate}
              setModal={setModal}
              markUnknown={markUnknown}
              builderNodes={builderNodes}
              builderDocument={builderDocument}
              setBuilderDocument={setBuilderDocument}
              builderRevision={builderRevision}
              builderDirty={workspaceDirty}
              generalName={generalName ?? selected.name}
              onGeneralNameChange={setGeneralName}
              saveGeneral={saveGeneral}
              discardGeneral={discardBuilder}
              saveBuilder={saveBuilder}
              discardBuilder={discardBuilder}
              offerings={offerings}
              prepareExitOffer={prepareExitOffer}
              changeExitOffer={changeExitOffer}
              setBuilderNodes={setBuilderNodes}
              updateBuilderNode={updateBuilderNode}
              removeBuilderNode={removeBuilderNode}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              templateSelected={templateSelected}
              setTemplateSelected={setTemplateSelected}
              appliedTemplate={appliedTemplate}
              templateLinks={templateLinks}
              setTemplateLinks={setTemplateLinks}
              notify={notify}
            />
          )}
          {view === "builder" && (
            <PaywallWorkspace
              selected={builderOrigin === "create" ? { ...selected, name: draft.name } : selected}
              isNew={builderOrigin === "create"}
              draft={draft}
              setDraft={setDraft}
              view={view}
              setView={setView}
              duplicate={duplicate}
              setModal={setModal}
              markUnknown={markUnknown}
              builderNodes={builderNodes}
              builderDocument={builderDocument}
              setBuilderDocument={setBuilderDocument}
              builderRevision={builderRevision}
              builderDirty={workspaceDirty}
              saveBuilder={saveBuilder}
              discardBuilder={discardBuilder}
              offerings={offerings}
              prepareExitOffer={prepareExitOffer}
              changeExitOffer={changeExitOffer}
              setBuilderNodes={setBuilderNodes}
              updateBuilderNode={updateBuilderNode}
              removeBuilderNode={removeBuilderNode}
              activeNode={activeNode}
              setActiveNode={setActiveNode}
              templateSelected={templateSelected}
              setTemplateSelected={setTemplateSelected}
              appliedTemplate={appliedTemplate}
              templateLinks={templateLinks}
              setTemplateLinks={setTemplateLinks}
              notify={notify}
            />
          )}
          {view === "metrics" && <Metrics setView={setView} markUnknown={markUnknown} />}
        </div>
      </main>

      <aside className={`evidence-panel ${unknownOpen ? "open" : ""}`}>
        <button className="evidence-head" aria-expanded={unknownOpen} title={unknownOpen ? "收起已验证与缺口" : "展开已验证与缺口"} onClick={() => setUnknownOpen((open) => !open)}>
          <span><CircleHelp size={17} /> <span className="evidence-title">Evidence & gaps</span></span>
          <ChevronRight size={16} />
        </button>
        {unknownOpen && (
          <div className="evidence-body">
            <p>Only observed behavior is reproduced. These routes are deliberately not invented.</p>
            {missingItems.map((item) => (
              <button className="gap-card" key={item.id} onClick={() => markUnknown(item)}>
                <small>{item.id}</small>
                <strong>{item.feature}</strong>
                <span>{item.unknown}</span>
              </button>
            ))}
          </div>
        )}
      </aside>

      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
      {modal?.kind === "local-reset" && <div className="modal-backdrop"><section className="modal local-reset-modal" role="dialog" aria-modal="true" aria-label="重置本地设定"><header><h2>重置本地设定</h2><button type="button" className="icon" aria-label="关闭" disabled={resetPending} onClick={() => setModal(null)}><X size={19} /></button></header><p>将清除当前浏览器保存的付费墙、模板修改、组件库和自定义 ZIP，并还原本 Demo 的默认页面。此操作无法撤销。</p><div className="modal-actions"><button type="button" className="secondary" disabled={resetPending} onClick={() => setModal(null)}>取消</button><button type="button" className="primary" disabled={resetPending} onClick={resetLocal}>{resetPending ? '正在重置…' : '确认重置'}</button></div></section></div>}
      {modal?.kind === "builder-save" && (
        <ComplianceModal
          compliance={compliance}
          setCompliance={setCompliance}
          rememberCompliance={rememberCompliance}
          setRememberCompliance={setRememberCompliance}
          onClose={() => setModal(null)}
          onAccept={() => { setModal(null); setCompliance(false); saveBuilder(); }}
          context="builder"
        />
      )}
      {modal?.kind === "template-requirements" && (
        <TemplateRequirementsModal
          onClose={() => setModal(null)}
          onContinue={(links) => { setTemplateLinks(links); setModal({ kind: "builder-save" }); }}
        />
      )}
      {modal?.kind === "archive" && <ArchiveModal name={selected.name} onClose={() => setModal(null)} onArchive={archiveCurrent} />}
      {modal?.kind === "device-test" && <DeviceTestModal onClose={() => setModal(null)} />}
      {modal?.kind === "templates" && (
        <TemplatesModal
          selected={templateSelected}
          setSelected={setTemplateSelected}
          onClose={() => setModal(null)}
          onOpenBuilder={(templateIndex) => {
            const run = () => { applyTemplate(templateIndex); setModal(null); setViewNow('builder'); notify('已应用模板，尚未保存。'); };
            if (workspaceDirty && builderDocument?.root.children.length) setPendingAction({ run, title: '替换当前画布？', replace: true }); else run();
          }}
        />
      )}
      {modal?.kind === "ai" && <AiModal onClose={() => setModal(null)} markUnknown={markUnknown} />}
      {pendingAction && <div className="modal-backdrop workspace-confirm-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label={pendingAction.title}><header><h2>{pendingAction.title}</h2></header><p>{pendingAction.replace?'当前未保存的画布内容将被所选模板替换。':'离开后，尚未保存的修改不会保留。'}</p><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setPendingAction(null)}>{pendingAction.replace?'取消':'继续编辑'}</button><button type="button" className="secondary danger-outline" onClick={()=>{const next=pendingAction;setPendingAction(null);if(!next.replace)discardBuilder();next.run();}}>{pendingAction.replace?'替换画布':'放弃并继续'}</button>{!pendingAction.replace&&(builderDocument||view==='general')&&<button type="button" className="primary" onClick={()=>{if((builderDocument?saveBuilder:saveGeneral)()){const next=pendingAction;setPendingAction(null);next.run();}}}>保存并继续</button>}</div></section></div>}
      {modal?.kind === "migration" && (
        <MigrationModal
          onClose={() => setModal(null)}
          markUnknown={markUnknown}
        />
      )}
      {modal?.kind === "unknown" && <UnknownModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  );
}

function PaywallList({
  onCreate,
  paywalls,
  search,
  setSearch,
  stateFilter,
  setStateFilter,
  placementFilter,
  setPlacementFilter,
  placementDraft,
  setPlacementDraft,
  placementMenuOpen,
  setPlacementMenuOpen,
  rowMenuId,
  setRowMenuId,
  openPaywall,
  setView,
  setModal,
  duplicate,
  locale,
}) {
  const placementName = placementFilter.length ? placementFilter.join(", ") : "All placements";
  const paginationText = locale === "zh-CN" ? `第 1 - ${paywalls.length} 项，共 ${paywalls.length} 项` : `1 - ${paywalls.length} of ${paywalls.length}`;
  const togglePlacement = (placement) => setPlacementDraft((current) => current.includes(placement) ? current.filter((item) => item !== placement) : [...current, placement]);
  const applyPlacementFilter = () => {
    setPlacementFilter(placementDraft);
    setPlacementMenuOpen(false);
  };

  return (
    <section>
      <div className="page-heading">
        <div><h1>Paywalls <span>↗</span></h1><p>Read the docs</p></div>
        <button className="primary" onClick={onCreate}>Create paywall</button>
      </div>
      <div className="list-controls">
        <label className="search"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by paywall name" /></label>
        <div className="placement-filter">
          <button className="select" onClick={() => { setPlacementDraft(placementFilter); setPlacementMenuOpen((open) => !open); }}>{placementName} <ChevronDown size={17} /></button>
          {placementMenuOpen && (
            <div className="placement-menu">
              <label><input type="checkbox" checked={placementDraft.includes("test placement1")} onChange={() => togglePlacement("test placement1")} /> test placement1</label>
              <div><button className="secondary" onClick={() => setPlacementMenuOpen(false)}>Cancel</button><button className="primary" onClick={applyPlacementFilter}>Apply</button></div>
            </div>
          )}
        </div>
        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}>
          <option value="Live,Draft,Inactive">States (3)</option>
          <option value="Live">Live</option>
          <option value="Draft">Draft</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th><span aria-hidden="true">⌄</span> <span>Paywall name</span> <Sort /></th><th><Help /> Revenue</th><th><Help /> Proceeds</th><th><Help /> Net proceeds</th><th><Help /> Purchases</th><th><Help /> Trials</th><th><Help /> Refunds</th><th><Help /> Products</th><th>Started at <Sort /></th><th>State <Sort /></th><th /></tr></thead>
          <tbody>
            {paywalls.map((item) => (
              <tr key={item.id} onClick={() => openPaywall(item)}>
                <td><ChevronDown size={16} /> <strong>{item.name}</strong> {item.icon && <ImageIcon size={16} color="#71717a" />}</td>
                <td>$0</td><td>$0</td><td>$0</td><td>0</td><td>0</td><td>0</td><td>{item.products}</td><td>{item.startedAt}</td>
                <td><StateBadge state={item.state} /></td>
                <td className="row-actions">
                  <button className="icon tiny" aria-label={`Actions for ${item.name}`} onClick={(event) => { event.stopPropagation(); setRowMenuId((current) => current === item.id ? null : item.id); }}><MoreVertical size={19} /></button>
                  {rowMenuId === item.id && (
                    <div className="row-menu">
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); setView("metrics"); }}>Metrics</button>
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); }}>Edit</button>
                      <button onClick={(event) => { event.stopPropagation(); setRowMenuId(null); duplicate(item); }}>Duplicate</button>
                      <button className="danger-menu" onClick={(event) => { event.stopPropagation(); setRowMenuId(null); openPaywall(item); setModal({ kind: "archive" }); }}>Archive</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>{paginationText}</span><div><button disabled><ChevronLeft size={18} /></button><button className="current">1</button><button disabled><ChevronRight size={18} /></button></div></div>
    </section>
  );
}

function CreatePaywall({ draft, setDraft, setView, setModal }) {
  const rows = draft.offerRows ?? [];
  const [labelPicker, setLabelPicker] = useState(null);
  const [labelQuery, setLabelQuery] = useState("");
  const [giftEditor, setGiftEditor] = useState(null);
  const [giftQuery, setGiftQuery] = useState("");
  const [offerEditor, setOfferEditor] = useState(null);
  const [offerQuery, setOfferQuery] = useState("");
  const patch = (next) => setDraft((current) => ({ ...current, ...next }));
  const patchRow = (index, next) => setDraft((current) => ({ ...current, offerRows: (current.offerRows ?? []).map((row, position) => position === index ? { ...row, ...next } : row) }));
  const labelInput = (row, index, key, label) => <div className="create-label-picker"><input aria-label={`商品 ${index + 1} ${label}`} placeholder="多语言 key" value={row[key] ?? ""} onChange={(event) => patchRow(index, { [key]: event.target.value })} /><button type="button" onClick={() => { setLabelPicker({ index, key, label }); setLabelQuery(row[key] ?? ""); }}>选择</button></div>;
  const addProduct = () => patch({ offerRows: [...rows, emptyPaywallOfferRow()] });
  const removeProduct = (index) => patch({ offerRows: rows.filter((_, position) => position !== index), defaultProductId: draft.defaultProductId === rows[index].id ? "" : draft.defaultProductId });
  return (
    <section className="create">
      <button className="back" onClick={() => setView("list")}><ArrowLeft size={18} /> Paywalls</button>
      <div className="create-header"><div><h1>Create paywall</h1><p>配置业务信息与商品，选择模板后进入构建器。</p></div></div>
      <div className="start-card">
        <span className="eyebrow">Builder & Generator</span><h2>Choose how to start</h2>
        <button onClick={() => setView("builder")}><Blocks size={22} /><span><strong>Build no-code paywall</strong><small>Start with the visual Builder.</small></span><ChevronRight size={18} /></button>
        <button onClick={() => setModal({ kind: "templates" })}><LayoutTemplate size={22} /><span><strong>Choose a template</strong><small>Observed template library and filters.</small></span><ChevronRight size={18} /></button>
      </div>
      <div className="create-grid">
        <div className="form-card">
          <h2>General</h2>
          <div className="create-fields">
            <Field label="业务类型 *"><select value={draft.businessType ?? ""} onChange={(event) => patch({ businessType: event.target.value, businessScene: paywallScenesByBusinessType[event.target.value][0] })}>{paywallBusinessTypes.map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="公众号 *"><select value={draft.publicAccount ?? ""} onChange={(event) => patch({ publicAccount: event.target.value })}>{paywallPublicAccounts.map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="业务场景 *"><select value={draft.businessScene ?? ""} onChange={(event) => patch({ businessScene: event.target.value })}>{(paywallScenesByBusinessType[draft.businessType] ?? []).map((value) => <option key={value}>{value}</option>)}</select></Field>
            <Field label="Paywall 名称 *"><input value={draft.name} onChange={(event) => patch({ name: event.target.value })} /></Field>
            <Field label="描述" optional><textarea value={draft.note ?? ""} onChange={(event) => patch({ note: event.target.value })} /></Field>
          </div>
          <div className="create-offers">
            <div className="create-offers-heading"><h3>商品信息：</h3><button type="button" onClick={addProduct}>+ 添加商品</button></div>
            <div className="create-offers-scroll">
              <table>
                <thead><tr><th>商品</th><th>优惠</th><th>优惠标签</th><th>默认<br />选中</th><th>推荐标签(未选中)</th><th>推荐标签(选中态)</th><th>选中按钮文案</th><th>按钮标签类型</th><th>赠送</th><th>操作</th></tr></thead>
                <tbody>{rows.map((row, index) => <tr key={row.key}>
                  <td><select aria-label={`商品 ${index + 1}`} value={row.id} onChange={(event) => { const product = paywallProductCatalog.find((item) => item.id === event.target.value); setDraft((current) => ({ ...current, defaultProductId: current.defaultProductId === row.id ? "" : current.defaultProductId, offerRows: current.offerRows.map((item, position) => position === index ? { ...item, id: product?.id ?? "", name: product?.name ?? "" } : item) })); }}><option value="">请选择商品</option>{paywallProductCatalog.map((product) => <option key={product.id} value={product.id} disabled={rows.some((item, position) => position !== index && item.id === product.id)}>{product.id} - {product.name}</option>)}</select></td>
                  <td><div className="create-gift-controls"><input aria-label={`商品 ${index + 1} 优惠`} value={row.offer ?? "0"} readOnly /><button type="button" title="编辑优惠" aria-label={`编辑商品 ${index + 1} 优惠`} onClick={() => { setOfferEditor(index); setOfferQuery(row.offer ?? "0"); }}><Pencil size={15} /></button></div></td>
                  <td><select aria-label={`商品 ${index + 1} 优惠标签`} value={row.offerLabel} onChange={(event) => patchRow(index, { offerLabel: event.target.value })}><option>不展示</option><option>展示推荐标签</option></select></td>
                  <td><input type="checkbox" aria-label={`默认选中商品 ${index + 1}`} checked={Boolean(row.id) && draft.defaultProductId === row.id} disabled={!row.id} onChange={() => patch({ defaultProductId: draft.defaultProductId === row.id ? "" : row.id })} /></td>
                  <td>{labelInput(row, index, "unselectedTopLabel", "推荐标签(未选中)")}</td>
                  <td>{labelInput(row, index, "selectedTopLabel", "推荐标签(选中态)")}</td>
                  <td>{labelInput(row, index, "selectedButtonCopy", "选中按钮文案")}</td>
                  <td><select aria-label={`商品 ${index + 1} 按钮标签类型`} value={row.selectedButtonTagCopy} onChange={(event) => patchRow(index, { selectedButtonTagCopy: event.target.value })}><option>不展示</option><option>展示</option></select></td>
                  <td><div className="create-gift-controls"><input aria-label={`商品 ${index + 1} 赠送`} value={row.giftPack ?? "0"} readOnly /><button type="button" title="编辑赠送" aria-label={`编辑商品 ${index + 1} 赠送`} onClick={() => { setGiftEditor(index); setGiftQuery(row.giftPack ?? "0"); }}>+</button></div></td>
                  <td><div className="create-offer-actions"><button type="button" onClick={() => patchRow(index, { ...rows[index - 1], key: row.key, id: row.id, name: row.name })} disabled={index === 0}>复制上条配置</button><button type="button" onClick={() => removeProduct(index)}>删除</button></div></td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {labelPicker && <div className="modal-backdrop"><section className="modal create-label-modal" role="dialog" aria-label={`选择${labelPicker.label}`}><header><h2>选择{labelPicker.label}</h2><button type="button" className="icon" aria-label="关闭" onClick={() => setLabelPicker(null)}><X size={19} /></button></header><div className="create-label-modal-body"><Field label="多语言 key"><input autoFocus value={labelQuery} placeholder="输入或粘贴多语言 key" onChange={(event) => setLabelQuery(event.target.value)} /></Field><p>当前为本地 Demo，未接入线上多语言词条目录。</p></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setLabelPicker(null)}>取消</button><button type="button" className="primary" onClick={() => { patchRow(labelPicker.index, { [labelPicker.key]: labelQuery.trim() }); setLabelPicker(null); }}>确认</button></div></section></div>}
      {giftEditor !== null && <div className="modal-backdrop"><section className="modal create-label-modal" role="dialog" aria-label="编辑赠送礼包"><header><h2>编辑赠送礼包</h2><button type="button" className="icon" aria-label="关闭" onClick={() => setGiftEditor(null)}><X size={19} /></button></header><div className="create-label-modal-body"><Field label="礼包名称"><input autoFocus value={giftQuery} onChange={(event) => setGiftQuery(event.target.value)} /></Field></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setGiftEditor(null)}>取消</button><button type="button" className="primary" onClick={() => { patchRow(giftEditor, { giftPack: giftQuery.trim() }); setGiftEditor(null); }}>确认</button></div></section></div>}
      {offerEditor !== null && <div className="modal-backdrop"><section className="modal create-label-modal" role="dialog" aria-label="编辑优惠"><header><h2>编辑优惠</h2><button type="button" className="icon" aria-label="关闭" onClick={() => setOfferEditor(null)}><X size={19} /></button></header><div className="create-label-modal-body"><Field label="优惠"><input autoFocus value={offerQuery} onChange={(event) => setOfferQuery(event.target.value)} /></Field></div><div className="modal-actions"><button type="button" className="secondary" onClick={() => setOfferEditor(null)}>取消</button><button type="button" className="primary" onClick={() => { patchRow(offerEditor, { offer: offerQuery.trim() || "0" }); setOfferEditor(null); }}>确认</button></div></section></div>}
    </section>
  );
}

function PaywallWorkspace({ selected, isNew = false, draft, setDraft, view, setView, duplicate, setModal, markUnknown, builderNodes, setBuilderNodes, updateBuilderNode, removeBuilderNode, activeNode, setActiveNode, appliedTemplate, builderDocument, setBuilderDocument, builderRevision, builderDirty, saveBuilder, discardBuilder, offerings, prepareExitOffer, changeExitOffer, templateLinks, setTemplateLinks, notify, generalName, onGeneralNameChange, saveGeneral, discardGeneral }) {
  const configuredProducts = builderDocument ? Object.values(builderDocument.products) : selected.config?.offerRows ?? [];
  if (view === "builder") {
    const template = appliedTemplate !== null ? templates[appliedTemplate] : { id: "blank", title: "空白页面" };
    const initialNodes = appliedTemplate !== null ? builderNodes : [];
    return <section className="builder-page">
      {isNew ? <><button className="back" onClick={() => setView("create")}><ArrowLeft size={18} /> 创建付费墙</button><div className="workspace-heading"><div><span className="eyebrow">新建付费墙</span><h1>{selected.name}</h1></div></div></> : <WorkspaceHeader selected={selected} setView={setView} duplicate={duplicate} setModal={setModal} markUnknown={markUnknown} />}
      <div className="detail-tabs"><button onClick={() => setView(isNew ? "create" : "general")}>General</button><button className="active">Builder & Generator</button></div>
      <div className="template-context observed-tree"><span>模板</span><strong>{template.title}</strong><button className="secondary" onClick={() => setModal({ kind: "templates" })}><LayoutTemplate size={15} /> 更换模板</button><div className="builder-save-actions"><span role="status">{builderDirty ? '未保存' : '已保存'}</span><button type="button" className="secondary" onClick={discardBuilder}>放弃修改</button><button type="button" className="primary" onClick={saveBuilder}><Save size={15}/>保存</button></div></div>
      <ComponentEditor key={`${template.id}:${builderRevision}`} template={template} initialNodes={initialNodes} initialDocument={builderDocument} onDocumentChange={setBuilderDocument} persistence="session" offerings={offerings} currentPaywallId={isNew ? undefined : selected.id} onCreateExitOffer={prepareExitOffer} onExitOfferChange={changeExitOffer}/>
    </section>;
  }


  return (
    <section>
      <WorkspaceHeader selected={selected} setView={setView} duplicate={duplicate} setModal={setModal} markUnknown={markUnknown} />
      <div className="detail-tabs"><button className="active">General</button><button onClick={() => setView("builder")}>Builder & Generator</button></div>
      <div className="detail-layout">
        <div className="form-card detail-form"><h2>General</h2><Field label="Paywall name"><input aria-label="付费墙名称" value={generalName ?? selected.name} onChange={(event)=>onGeneralNameChange?.(event.target.value)}/></Field><Field label="Products">{configuredProducts.map((row,index)=><div className="product-sku-summary" key={row.key??row.id??index}><span>{row.name||row.label||'未命名商品'}</span><span>SKU：{row.skuId??row.id??'未绑定'}</span></div>)}{!configuredProducts.length&&<span className="empty-copy">尚未配置画布商品</span>}<button type="button" className="secondary" onClick={()=>setView('builder')}><Package size={16}/>编辑画布商品</button></Field></div>
        <aside className="detail-aside"><div><span className="eyebrow">State</span><StateBadge state={selected.state} /></div><div><span className="eyebrow">Products</span><strong>{configuredProducts.length}</strong></div><div><span className="eyebrow">Started at</span><strong>{selected.startedAt}</strong></div><button className="secondary full" onClick={() => setView("builder")}><Blocks size={16} /> Open Builder</button></aside>
      </div>
      <div className="builder-footer"><span role="status">{builderDirty?'未保存':'已保存'}</span><button type="button" className="secondary" onClick={discardGeneral}>放弃修改</button><button type="button" className="primary" onClick={saveGeneral}>保存</button></div>
    </section>
  );
}






















function RichText({ node, fallback = "", interactive = false }) {
  const runs = node ? textRunsFor(node) : [{ text: fallback }];
  if (!node && fallback) return <span>{fallback}</span>;
  return runs.map((run, index) => {
    const style = { fontWeight: run.bold ? 700 : undefined, fontStyle: run.italic ? "italic" : undefined, textDecoration: run.underline || run.link !== undefined ? "underline" : undefined, color: /^#[\da-fA-F]{6}$/.test(run.color ?? "") ? run.color : undefined, fontSize: Number.isFinite(Number(run.fontSize)) && Number(run.fontSize) >= 8 && Number(run.fontSize) <= 72 ? `${run.fontSize}px` : undefined };
    const content = run.link !== undefined && validTextLink(run.link)
      ? <a href={run.link} target="_blank" rel="noopener noreferrer" style={style} onClick={interactive ? (event) => event.preventDefault() : undefined}>{run.text}</a>
      : <span style={style}>{run.text}</span>;
    return <React.Fragment key={index}>{index > 0 && run.breakBefore && <br />}{content}</React.Fragment>;
  });
}



function ImageContent({ active, updateNode }) {
  return <MediaUploadFields active={active} updateNode={updateNode} label="Image file" required />;
}





































































function ImageStyle() {
  return <Field label="Aspect"><div className="select-like">Fill <ChevronDown size={14} /></div></Field>;
}

function HeroMediaStyle() {
  const [mode, setMode] = useState("Overlay");
  return <><Field label="Display"><div className="segmented">{["Overlay", "Transparent", "Flat"].map((item) => <button className={mode === item ? "active" : ""} onClick={() => setMode(item)} key={item}>{item}</button>)}</div></Field><Field label="Tint"><ColorOpacity color="#212121" opacity="0" /></Field></>;
}

function HeroMediaLayout() {
  return <><Field label="Image height"><input placeholder="Not captured" /></Field><label className="switch-row"><input type="checkbox" /><span>Not captured</span><strong>Rounded rectangle</strong></label><Field label="Corner radius"><input placeholder="Not captured" /></Field><Field label="Padding"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field><div className="unknown-rule"><CircleHelp size={17} /><span>Hero Image 的这些字段入口已见，但本轮没有保留它们的源端默认值。</span></div></>;
}

function ImageLayout() {
  return <Field label="Image height"><input defaultValue="100" /></Field>;
}







function TextStyle() {
  return <><Field label="Font"><div className="select-like">System (SF Pro, Roboto) Regular <ChevronDown size={14} /></div></Field><div className="split-fields"><Field label="Size"><input defaultValue="28" /></Field><Field label="Align"><div className="select-like">Center <ChevronDown size={14} /></div></Field></div><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field></>;
}

function TextLayout() {
  return <><Field label="Margin"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field></>;
}





























function ListItemStyle() {
  return <><Field label="Title font"><div className="select-like">Nunito Extrabold <ChevronDown size={14} /></div></Field><Field label="Title size"><input defaultValue="17" /></Field><Field label="Caption font"><div className="select-like">Nunito Medium <ChevronDown size={14} /></div></Field><Field label="Caption size"><input defaultValue="15" /></Field><Field label="Icon placement"><div className="select-like">Left <ChevronDown size={14} /></div></Field></>;
}

function ListItemLayout() {
  return <><Field label="Margin"><PaddingInputs /></Field><Field label="Vertical offset"><input defaultValue="0" /></Field></>;
}

function ListStyle() {
  return <><Field label="Default icon"><div className="select-like">Default icon <ChevronDown size={14} /></div></Field><Field label="Icon placement"><div className="select-like">Left <ChevronDown size={14} /></div></Field><Field label="Icon color"><ColorOpacity color="#000000" opacity="100" /></Field><h4>Connector</h4><Field label="Thickness"><input defaultValue="0" /></Field><Field label="Color"><ColorOpacity color="#000000" opacity="100" /></Field><Field label="Icon size"><input placeholder="Not captured" /></Field><h4>Title</h4><Field label="Font"><div className="select-like">Nunito Extrabold <ChevronDown size={14} /></div></Field><Field label="Size"><input defaultValue="17" /></Field><h4>Caption</h4><Field label="Font"><div className="select-like">Nunito Medium <ChevronDown size={14} /></div></Field><Field label="Size"><input defaultValue="15" /></Field></>;
}













function ColorOpacity({ color, opacity }) {
  return <div className="color-with-opacity"><div className="color-line"><i style={{ background: color }} /> {color}</div><input defaultValue={opacity} aria-label="Opacity" /></div>;
}

function PaddingInputs({ values = [0, 0, 0, 0] }) {
  return <div className="four-inputs"><input aria-label="Top padding" defaultValue={values[0]} /><input aria-label="Right padding" defaultValue={values[1]} /><input aria-label="Bottom padding" defaultValue={values[2]} /><input aria-label="Left padding" defaultValue={values[3]} /></div>;
}

function LinkOption({ title, checked = false, fields }) {
  return <section className="link-option"><label className="switch-row"><input type="checkbox" defaultChecked={checked} /><span>{checked ? "On" : "Off"}</span><strong>{title}</strong></label>{checked && fields.map(([label, value, onValueChange]) => <Field label={label} key={label}><input {...(onValueChange ? { value, onChange: (event) => onValueChange(event.target.value) } : { defaultValue: value })} /></Field>)}</section>;
}

function WorkspaceHeader({ selected, setView, duplicate, setModal, markUnknown }) {
  return (
    <><button className="back" onClick={() => setView("list")}><ArrowLeft size={18} /> Paywalls</button><div className="workspace-heading"><div><span className="eyebrow">Paywall</span><h1>{selected.name}</h1></div><div className="workspace-actions"><button className="secondary" onClick={() => setView("metrics")}><BarChart3 size={16} /> Metrics</button><button className="secondary unknown-action" onClick={() => markUnknown({ id: "A-01", feature: "View in analytics", known: "The action opens Analytics with paywall_id in the URL.", unknown: "The complete Analytics destination state is outside this reconstruction." })}>View in analytics</button><button className="secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>{selected.state === "Draft" && <button className="secondary" onClick={() => setModal({ kind: "device-test" })}><Smartphone size={16} /> Test on Device</button>}<button className="secondary danger-outline" onClick={() => setModal({ kind: "archive" })}><Archive size={16} /> Archive</button></div></div></>
  );
}

function DeviceTestModal({ onClose }) {
  const previewUrl = "https://mobile-app.adapty.io/paywall-preview?app_id=4044295d-a03a-4c32-9b41-d057fe635445&paywall_id=research-paywall&current_locale=en&locales=en&cluster=us";
  return <Modal title="Test on Device" onClose={onClose}><div className="device-test"><div className="device-qr">▦</div><p className="modal-copy">Open the preview with your device camera or copy this test link.</p><div className="test-link"><input value={previewUrl} readOnly /><button className="icon" title="Copy"><Copy size={16} /></button></div><div className="modal-actions"><button className="primary" onClick={onClose}>Done</button></div></div></Modal>;
}

function ProductRow({ product, offer, onProductChange, onRemove, markUnknown, readOnly = false }) {
  const defaultOffer = offer ?? (product.includes("1 Year") ? "Black Friday" : "No offers for this product");
  const offerBoundary = {
    id: "P-01",
    feature: "Product offer selection",
    known: "已实测：Japanese Ai - 1 Year（Annual）显示 Black Friday；Japanese ai（3 months）显示 No offers for this product。",
    unknown: "其余 Offer 选项、优惠资格校验、切换后的保存规则与最终交易结果未实测。",
  };
  return (
    <div className="product-row">
      <select value={product} disabled={readOnly} onChange={(event) => onProductChange?.(event.target.value)}>
        {readOnly ? <option>{product}</option> : productOptions.map((option) => <option key={option}>{option}</option>)}
      </select>
      <select className="unknown-action" value={defaultOffer} onClick={() => markUnknown(offerBoundary)} onChange={() => markUnknown(offerBoundary)}>
        <option>Black Friday</option><option>No offers for this product</option>
      </select>
      <button className={`icon ${readOnly ? "unknown-action" : ""}`} onClick={() => readOnly ? markUnknown(offerBoundary) : onRemove?.()}><X size={17} /></button>
    </div>
  );
}

function Metrics({ setView, markUnknown }) {
  const [filterMenu, setFilterMenu] = useState(false);
  const [stateFilter, setStateFilter] = useState(false);
  const [statePanel, setStatePanel] = useState(false);
  const [datePanel, setDatePanel] = useState(false);
  const [groupMenu, setGroupMenu] = useState(false);
  const [audienceMenu, setAudienceMenu] = useState(false);
  const boundary = missingItems.find((item) => item.id === "MT-01");
  const metrics = ["Revenue", "Unique views", "ARPAS", "Trials", "Purchases", "Refunds"];
  const columns = ["Audience", "Revenue", "Proceeds", "Net proceeds", "ARPPU", "ARPAS", "Unique CR purchases", "CR purchases", "Unique CR trials", "CR trials", "Purchases", "Trials", "Trials cancelled", "Refunds", "Refund rate", "Views", "Unique views"];
  return <section className="metrics-page"><button className="back" onClick={() => setView("general")}><ArrowLeft size={18} /> Paywall</button><div className="workspace-heading"><div><span className="eyebrow">Paywall</span><h1>Metrics</h1></div><div className="workspace-actions"><button className="secondary" onClick={() => setView("general")}>Edit paywall</button><button className="secondary unknown-action" onClick={() => markUnknown(boundary)}>View in analytics</button></div></div><div className="metrics-controls"><div className="metrics-popover-wrap"><button className="select" onClick={() => setDatePanel((open) => !open)}>Last month <ChevronDown size={16} /></button>{datePanel && <DatePopover />}</div><button className="select">week <ChevronDown size={16} /></button><div className="metrics-popover-wrap"><button className="select" onClick={() => setGroupMenu((open) => !open)}>Group by Product <ChevronDown size={16} /></button>{groupMenu && <div className="metric-menu"><button>Product</button></div>}</div><div className="metrics-popover-wrap"><button className={`secondary ${stateFilter ? "" : ""}`} onClick={() => stateFilter ? setStatePanel((open) => !open) : setFilterMenu((open) => !open)}>{stateFilter ? "State" : <><Plus size={16} /> Add filter</>}</button>{filterMenu && <div className="metric-menu"><button onClick={() => { setStateFilter(true); setFilterMenu(false); setStatePanel(true); }}>State</button></div>}{statePanel && <div className="state-filter-panel"><label className="search"><Search size={15} /><input placeholder="Search" /></label><label><input type="checkbox" defaultChecked /> State</label><div><button className="secondary" onClick={() => { setStateFilter(false); setStatePanel(false); }}>Reset</button><button className="primary" onClick={() => setStatePanel(false)}>Apply</button></div></div>}</div><div className="metrics-popover-wrap"><button className="select" onClick={() => setAudienceMenu((open) => !open)}>Audience based <ChevronDown size={16} /></button>{audienceMenu && <div className="metric-menu"><button className="unknown-action" onClick={() => markUnknown(boundary)}>Audience based</button></div>}</div><label className="install-filter"><input type="checkbox" /> Filter metrics by install date</label><button className="icon unknown-action" onClick={() => markUnknown(boundary)}><Download size={17} /></button></div><div className="metric-grid">{metrics.map((metric) => <div className={`metric-card ${metric === "Revenue" ? "revenue-card" : ""}`} key={metric}><span>{metric}</span><strong>{metric === "Revenue" ? "No Data" : "0"}</strong></div>)}</div><div className="table-wrap metrics-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody><tr>{columns.map((column, index) => <td key={column}>{index === 0 ? "Total" : column.includes("Revenue") || column.includes("Proceeds") || column === "ARPPU" || column === "ARPAS" ? "$0" : "0"}</td>)}</tr></tbody></table></div></section>;
}

function DatePopover() {
  return <div className="date-popover"><strong>Date range</strong><button className="date-preset">Last month <ChevronDown size={14} /></button><h3>21 Jul - 20 Aug</h3><div className="date-fields"><input defaultValue="21.07.2026" /><input defaultValue="20.08.2026" /></div><div className="calendar-preview"><div><strong>July 2026</strong><div className="calendar-grid">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", ...Array.from({ length: 31 }, (_, index) => String(index + 1))].map((day) => <span key={`j${day}`}>{day}</span>)}</div></div><div><strong>August 2026</strong><div className="calendar-grid">{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", ...Array.from({ length: 31 }, (_, index) => String(index + 1))].map((day) => <span key={`a${day}`}>{day}</span>)}</div></div></div><div className="grain-row">{["Year", "Quarter", "Month", "Week", "Day"].map((grain) => <button className={grain === "Week" ? "active" : ""} key={grain}>{grain}</button>)}</div><div className="date-actions"><button className="primary">Apply</button></div></div>;
}

function ComplianceModal({ compliance, setCompliance, rememberCompliance, setRememberCompliance, onClose, onAccept, context = "draft" }) {
  const policies = ["Do not make misleading claims about unlocking content.", "Clearly show price and duration.", "Clearly disclose purchase details before purchase.", "Make cross-platform content available immediately.", "Clearly show Terms & Conditions.", "Do not link to external purchase options."];
  return <Modal title="Paywall publishing confirmation" onClose={onClose}><p className="modal-copy">{context === "builder" ? "Publishing paywall you confirm that it meets the guidelines of the stores." : "This confirmation was observed before creating a Draft, despite its publishing wording."}</p><ul className="policy-list">{policies.map((item) => <li key={item}><Check size={16} /> {item}</li>)}</ul><label className="check-row"><input type="checkbox" checked={compliance} onChange={(event) => setCompliance(event.target.checked)} /> <span>I confirm this paywall complies with App Store Review Guidelines and Google Play Developer Program Policies.</span></label><label className="check-row optional"><input type="checkbox" checked={rememberCompliance} onChange={(event) => setRememberCompliance(event.target.checked)} /> <span>Remember this confirmation for all future paywalls.</span></label><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!compliance} onClick={onAccept}>Accept</button></div></Modal>;
}

function TemplateRequirementsModal({ onClose, onContinue }) {
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const isComplete = termsUrl.trim().length > 0 && privacyUrl.trim().length > 0;
  return <Modal title="Complete template setup" onClose={onClose}>
    <p className="modal-copy">The first template save was observed to surface Custom Fonts and require Terms of Service and Privacy Policy URLs in Links.</p>
    <div className="template-requirements">
      <div><strong>Custom Fonts</strong><span>Review the font setup before saving this template.</span></div>
      <Field label="Terms of Service URL"><input value={termsUrl} onChange={(event) => setTermsUrl(event.target.value)} placeholder="https://example.com/terms" /></Field>
      <Field label="Privacy Policy URL"><input value={privacyUrl} onChange={(event) => setPrivacyUrl(event.target.value)} placeholder="https://example.com/privacy" /></Field>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!isComplete} onClick={() => onContinue({ terms: termsUrl, privacy: privacyUrl })}>Continue</button></div>
  </Modal>;
}

function ArchiveModal({ name, onClose, onArchive }) {
  const [value, setValue] = useState("");
  return <Modal title="Archive paywall" onClose={onClose}><p className="modal-copy">This action cannot be undone. Type the complete paywall name to continue.</p><Field label={`Type "${name}"`}><input value={value} onChange={(event) => setValue(event.target.value)} /></Field><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="danger-button" disabled={value !== name} onClick={onArchive}>Archive paywall</button></div></Modal>;
}

function TemplatesModal({ selected, setSelected, onClose, onOpenBuilder }) {
  const [pendingSelected, setPendingSelected] = useState(selected);
  const [filters, setFilters] = useState({
    // Start unfiltered so the HelloTalk document templates are discoverable on first open.
    products: [],
    media: "All",
    components: [],
    length: "All",
    background: "All",
    category: "All",
  });
  const toggleListFilter = (key, value) => setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const setSingleFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const Filter = ({ children, value, group, list = false }) => {
    const checked = list ? filters[group].includes(value) : filters[group] === value;
    return <label className="filter-option"><input type={list ? "checkbox" : "radio"} name={list ? undefined : group} checked={checked} onChange={() => list ? toggleListFilter(group, value) : setSingleFilter(group, value)} /> {children}</label>;
  };
  const pendingTemplate = pendingSelected === null ? null : templates[pendingSelected];
  const tagLabels = { "1 product": "1 个商品", "2 products": "2 个商品", "3 products": "3 个商品", "4 products": "4 个商品", "5 products": "5 个商品", "Multi-step": "多步骤", Credits: "点数商品", "Web purchase": "网页购买", "Feature table": "权益表格", Reviews: "评价", Award: "奖项", Timer:'倒计时', Carousel:'轮播', Toggle:'普通开关', Tabs:'标签页', 'Trial timeline':'试用时间线', 'Offer code':'优惠码', 'Social Proof':'口碑展示' };
  const displayTags = (template) => isEditableTemplate(template) ? template.tags.map((tag) => tagLabels[tag] ?? tag) : ["Source preview", "Structure pending"];
  const countBy = (matches) => catalogTemplates.filter(matches).length;
  const componentOptions = [["Free trial toggle", "免费试用开关"], ["Trial timeline", "试用时间线"], ["Reviews", "评价"], ["Timer", "倒计时"], ["Toggle", "普通开关"], ["Social Proof", "口碑展示"], ["Award", "奖项展示"], ["Tabs", "标签页"], ["Offer code", "优惠码"], ["Multi-step", "多步骤"], ["Credits", "点数商品"], ["Web purchase", "网页购买"], ["Feature table", "权益表格"]];
  const filteredTemplates = catalogTemplates.filter((template) => {
    const productMatch = !filters.products.length || filters.products.some((item) => item === "1 product" ? template.productCount === 1 : template.productCount > 1);
    const mediaMatch = filters.media === "All" || (filters.media === "With Image or Video" ? ["image", "video"].includes(template.media) : template.media === "none");
    const componentMatch = filters.components.every((item) => (template.isNew ? template.components : sourceVerifiedTemplateComponents[template.id])?.includes(item));
    const lengthMatch = filters.length === "All" || (filters.length === "Short" ? template.title.length < 28 : template.title.length >= 28);
    const backgroundMatch = filters.background === "All" || (filters.background === "Dark" ? ["night", "black", "midnight", "ocean", "halloween"].includes(template.theme) : !["night", "black", "midnight", "ocean", "halloween"].includes(template.theme));
    const categoryMatch = filters.category === "All" || template.category === filters.category;
    return productMatch && mediaMatch && componentMatch && lengthMatch && backgroundMatch && categoryMatch;
  });
  const documentTemplates = filteredTemplates.filter((template) => template.documentTemplate);
  const prioritizedTemplates = [...documentTemplates, ...filteredTemplates.filter((template) => template.isNew), ...filteredTemplates.filter((template) => !template.documentTemplate && !template.isNew)];
  return <Modal title="Choose a template" onClose={onClose} wide>
    <div className="template-modal"><aside>
      <div className="filter-heading"><strong>Filters</strong><span className="filter-count">{filteredTemplates.length}</span></div>
      <p>Number of products</p>
      <Filter group="products" value="1 product" list>{`1 product (${countBy((item) => item.productCount === 1)})`}</Filter>
      <Filter group="products" value="More than 1 product" list>{`More than 1 product (${countBy((item) => item.productCount > 1)})`}</Filter>
      <p>Image / video</p>
      <Filter group="media" value="All">All</Filter>
      <Filter group="media" value="With Image or Video">{`With Image or Video (${countBy((item) => item.media !== "none")})`}</Filter>
      <Filter group="media" value="No media">{`No media (${countBy((item) => item.media === "none")})`}</Filter>
      <p>Components</p>
      {componentOptions.map(([value, label]) => <Filter key={value} group="components" value={value} list>{label} ({countBy((item) => (item.isNew ? item.components : sourceVerifiedTemplateComponents[item.id])?.includes(value))})</Filter>)}
      <p>Length</p><Filter group="length" value="All">All</Filter><Filter group="length" value="Short">Short</Filter><Filter group="length" value="Long">Long</Filter>
      <p>Background theme</p><Filter group="background" value="All">All</Filter><Filter group="background" value="Light">Light</Filter><Filter group="background" value="Dark">Dark</Filter>
      <p>Category</p><Filter group="category" value="All">All paywalls</Filter><Filter group="category" value="Popular">Popular</Filter><Filter group="category" value="Seasonal">Seasonal</Filter>
    </aside><div className="template-content"><div className="template-scroll-content">
      <div className="template-selection-summary">{pendingTemplate ? <><span>Selected template</span><strong>{pendingTemplate.title}</strong><small>{pendingTemplate.isGallery ? `${pendingTemplate.editorVerified ? "源编辑器 Layers 已核对" : "仅源预览"}：${pendingTemplate.observedComponents.join(" · ")}。SKU 和字段配置待核验。` : displayTags(pendingTemplate).join(" · ")}</small></> : <span>No template selected</span>}</div>
      <div className="template-grid rich-template-grid">{prioritizedTemplates.map((template) => {
        const index = templates.indexOf(template);
        return <div role="button" tabIndex={0} aria-pressed={pendingSelected === index} className={`template template-${template.theme} ${pendingSelected === index ? "selected" : ""}`} onClick={() => setPendingSelected(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPendingSelected(index); } }} key={template.id}>
          <div className="template-source-preview" inert=""><DeferredTemplateMedia template={template} /></div><strong>{template.title}</strong>{template.isGallery ? <small className="template-origin">RevenueCat · #{template.sourceOrder}</small> : template.sourceTemplate && <small className="template-origin">RevenueCat · {template.sourceTemplate}</small>}<small>{displayTags(template).join(" · ")}</small>
        </div>;
      })}</div>
      {!filteredTemplates.length && <div className="template-empty">没有符合筛选条件的模板</div>}
    </div><div className="modal-actions template-modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={pendingSelected === null} onClick={() => onOpenBuilder(pendingSelected)}>Open in Builder</button></div></div></div>
  </Modal>;
}

function AiModal({ onClose, markUnknown }) {
  const [tab, setTab] = useState("chats");
  const [style, setStyle] = useState("");
  const examples = ["Trusted Choice", "Push Forward", "Black&white", "Playful Vibes", "Pro Level", "Kind & Supportive", "Exclusive Access", "Welcome Aboard"];
  const surprise = () => {
    window.alert("We couldn't detect your app in app store. Please make sure that the Apple App ID is filled in settings in the iOS SDK section.");
  };
  return <Modal title="Describe your Perfect Paywall" onClose={onClose}>
    <div className="segmented"><button className={tab === "chats" ? "active" : ""} onClick={() => setTab("chats")}>Chats</button><button className={tab === "examples" ? "active" : ""} onClick={() => setTab("examples")}>Examples</button></div>
    {tab === "chats" ? <><div className="ai-empty"><Sparkles size={30} /><h3>Describe your Perfect Paywall</h3><p>Create paywalls in seconds - no manual setup needed! Generate instantly, customize easily, and launch effortlessly. Save time and stay in control!</p></div><div className="chips">{["Trusted", "Playful", "Black&white", "Professional", "Motivational", "Supportive", "Onboarding", "Exclusive"].map((chip) => <button className={style === chip ? "active" : ""} onClick={() => setStyle(chip)} key={chip}>{chip}</button>)}</div><textarea className="prompt" placeholder={'e.g., "A dark-mode paywall for a fitness app, focus on the annual plan"...'} /><p className="ai-how-it-works">How it works: We combine your prompt with your app's store data to create the most relevant paywalls for you.</p><div className="modal-actions"><button className="secondary" onClick={() => setTab("examples")}>Browse examples</button><button className="secondary" onClick={surprise}>Surprise me</button><button className="primary" onClick={surprise}>Generate</button></div></> : <div className="ai-examples">{examples.map((example) => <article key={example}><div><strong>{example}</strong><small>Observed example entry; the prompt body was not opened.</small></div><button className="secondary unknown-action" onClick={() => markUnknown(missingItems[1])}>Use prompt</button></article>)}</div>}
  </Modal>;
}

function MigrationModal({ onClose, markUnknown }) {
  return <Modal title="Migrate paywall's design" onClose={onClose}><p className="modal-copy">Copy only the visual Builder configuration. Products and other paywall configuration are not copied.</p><label className="form-field"><span>1. Select application</span><select disabled><option>No source application available</option></select></label><label className="form-field"><span>2. Select a Builder paywall</span><select disabled><option>Select a Builder paywall</option></select></label><div className="migration-warning"><CircleHelp size={18} /> Remember to test custom fonts on a device, as they may not display correctly.</div><p className="unknown-rule"><CircleHelp size={16} /> The observed account had no other application design candidate, so this Demo does not invent one.</p><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary unknown-action" disabled onClick={() => markUnknown(missingItems[3])}>Copy Selected Paywall</button></div></Modal>;
}

function UnknownModal({ item, onClose }) {
  return <Modal title={`${item.id} · Known boundary`} onClose={onClose}><div className="unknown"><span className="eyebrow">Observed</span><p>{item.known}</p><span className="eyebrow">Not reproduced</span><p>{item.unknown}</p><div className="unknown-rule"><CircleHelp size={18} /> This demo keeps the entry point but does not invent its result.</div></div><div className="modal-actions"><button className="primary" onClick={onClose}>Close</button></div></Modal>;
}

function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);
  return <div className="modal-backdrop"><section className={`modal ${wide ? "wide" : ""}`}><header><h2>{title}</h2><button className="icon" onClick={onClose}><X size={19} /></button></header>{children}</section></div>;
}

function StateBadge({ state }) { return <span className={`state ${state.toLowerCase()}`}><i /> {state}</span>; }
function Sort() { return <span className="sort">↕</span>; }
function Help() { return <CircleHelp size={15} className="help" />; }
function IntegratedTemplateMedia({ template }) {
  const nodes = createBuilderNodes(template.id);
  const heading = nodes.find((entry) => entry.type === "Header")?.content ?? template.title;
  const caption = nodes.find((entry) => entry.type === "Text")?.content ?? template.subtitle;
  const products = nodes.find((entry) => entry.type === "Products")?.content?.split("\n") ?? [];
  const action = nodes.find((entry) => entry.type === "Button")?.content ?? "继续";
  const details = nodes.filter((entry) => ["Screen Flow", "Feature Table", "Web Paywall Button", "List", "Timeline", "Timer", "Social Proof", "Award", "Carousel", "Tabs", "Toggle"].includes(entry.type) || entry.id === "rc-offer-code-text").slice(0, 4);
  const detailText = (entry) => {
    if (entry.type === "List") return entry.content.split("\n").slice(0, 2).map((row) => row.split("|")[0]).join(" · ");
    if (entry.type === "Timeline") return entry.config?.listRows?.slice(0, 3).map((row) => row.title).join(" → ");
    if (entry.type === "Timer") return `${entry.config?.prefix ?? ""} ${entry.content}`;
    if (entry.type === "Social Proof") return `★★★★★ ${entry.config?.count ?? ""}`;
    if (entry.type === "Award") return `★ ${entry.config?.title ?? entry.content}`;
    if (entry.type === "Carousel") return `★★★★★ ${entry.content.split("|")[0]}`;
    if (entry.type === "Tabs") return entry.config?.tabs?.map((tab) => tab.title).join("  /  ");
    if (entry.type === "Screen Flow") return "多步骤引导";
    if (entry.type === "Feature Table") return `权益表格 · ${entry.config?.rows?.length ?? 0} 行`;
    if (entry.type === "Web Paywall Button") return "网页购买入口";
    return entry.content.split("|")[0];
  };
  return <div className={`new-template-preview tone-${template.previewTone ?? "teal"}`}>
    <span className="new-template-badge">NEW</span>
    <div className="new-template-preview-content">
      <strong>{heading}</strong><small>{caption}</small>
      <div className="new-template-preview-details">{details.map((entry) => <span key={entry.id}>{detailText(entry)}</span>)}</div>
      <div className="new-template-preview-plans">{products.slice(0, 2).map((row, index) => { const parts = row.split("|"); return <div className="new-template-preview-plan" key={index}>{parts[0]} <b>{parts.find((part) => /[¥$€£]/.test(part)) ?? ""}</b></div>; })}</div>
      <div className="new-template-preview-button">{action}</div>
    </div>
  </div>;
}
function DeferredTemplateMedia({ template }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { setVisible(true); observer.disconnect(); } }, { root: ref.current?.closest(".template-scroll-content"), rootMargin: "300px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ width: "100%", height: "100%" }}>{visible && <SourceTemplateMedia template={template} />}</div>;
}

function SourceTemplateMedia({ template }) {
  if (template.isGallery) return <GalleryTemplateMedia template={template} />;
  if (template.isNew) return <IntegratedTemplateMedia template={template} />;
  if (template.prdScreenshot) return <img className="prd-template-screenshot" src={template.prdScreenshot} alt={`${template.title} PRD screenshot`} />;
  if (template.documentTemplate) return <HelloTalkPaywall variant={template.documentTemplate} interactive={false} />;
  const assets = template.assetParts ?? [template.asset];
  if (assets.length === 1) return <img src={assets[0]} alt={`Adapty template: ${template.title}`} />;
  return <div className="source-template-stack">{assets.map((asset) => <img src={asset} alt="" key={asset} />)}</div>;
}

function GalleryTemplateMedia({ template }) {
  if (template.sourceOrder !== 38) return <div className="rc-gallery-live" aria-hidden="true">
    <div className="rc-gallery-live-scale"><PaywallPreview nodes={createSourceTemplateNodes(template, node)} template={template} mode="editable" pricePreviewMode="1" onSelect={() => {}} /></div>
    <span className="rc-gallery-new">NEW</span>
  </div>;
  const profile = template.profile;
  const dark = ["full", "dark", "red"].includes(template.art);
  const source = observedTemplate(template.sourceOrder);
  const plan = sourceBlueprints[template.sourceOrder - 1];
  const lines = source.text.split("\n");
  const features = template.featureLines;
  const previewProducts = plan.flow ? [] : plan.products ?? [];
  return <div className={`rc-gallery-preview art-${template.art} profile-${profile}`} style={{ "--rc-accent": template.accent, "--rc-ink": dark ? "#fff" : "#1c1d23" }}>
    <span className="rc-gallery-new">NEW</span>
    {template.heroAsset && <div className="rc-gallery-art"><img src={template.heroAsset} alt="" loading="lazy" /></div>}
    <div className="rc-gallery-content">
      <strong>{template.headline}</strong>
      {profile === "offer" && lines.find((line) => /\d+%\s*off/i.test(line) && line !== template.headline) && <b className="rc-gallery-offer">{lines.find((line) => /\d+%\s*off/i.test(line) && line !== template.headline)}</b>}
      {plan.toggle !== undefined && <span className="rc-gallery-toggle">{lines[plan.toggle]}<i /></span>}
      {plan.reviews && <span className="rc-gallery-review">{lines[plan.reviews[0]]}</span>}
      {profile === "steps" && <span className="rc-gallery-steps">● ── ● ── ●</span>}
      {!!features.length && <div className="rc-gallery-features">{features.slice(0, 5).map((item) => <span key={item}><i />{item.split("|")[0]}</span>)}</div>}
      {!!previewProducts.length && <div className={`rc-gallery-plans count-${Math.min(previewProducts.length, 3)}`}>{previewProducts.slice(0, 3).map((row, index) => { const [name, price] = row.split("|"); return <span key={`${index}-${name}`}>{name}<b>{price}</b></span>; })}</div>}
      {plan.cta !== undefined && <div className="rc-gallery-cta">{lines[plan.cta]}</div>}
    </div>
  </div>;
}



function timerSeconds(value) {
  const parts = String(value ?? "").match(/\d+/g) ?? [];
  const [hours = "0", minutes = "0", seconds = "0"] = parts;
  return Math.max(0, Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds));
}

function formatTimer(seconds, format = "hh:mm:ss", separator = ":") {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  if (format === "mm:ss") return `${String(hours * 60 + minutes).padStart(2, "0")}${separator}${String(remainingSeconds).padStart(2, "0")}`;
  return `${String(hours).padStart(2, "0")}${separator}${String(minutes).padStart(2, "0")}${separator}${String(remainingSeconds).padStart(2, "0")}`;
}

function mediaDimensions(config = {}) {
  const width = Math.max(20, Math.min(200, Number(config.mediaWidth) || 100));
  const height = Math.max(20, Math.min(200, Number(config.mediaHeight) || 100));
  const imageScaleWidth = Math.max(10, Number(config.mediaImageWidth ?? config.mediaScrollWidth) || 100);
  const imageScaleHeight = Math.max(10, Number(config.mediaImageHeight) || 100);
  return { width, height, imageScaleWidth, imageScaleHeight, imageWidth: `${imageScaleWidth * 100 / width}%`, imageHeight: `${imageScaleHeight * 100 / height}%` };
}

function ScrollImage({ src, alt, dimensions }) {
  const imageRef = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const image = imageRef.current;
    const frame = image?.parentElement;
    if (!image || !frame) return undefined;
    const measure = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const style = getComputedStyle(frame);
      const contentWidth = frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const contentHeight = frame.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const minWidth = contentWidth * dimensions.imageScaleWidth / dimensions.width;
      const minHeight = contentHeight * dimensions.imageScaleHeight / dimensions.height;
      const scale = Math.max(minWidth / image.naturalWidth, minHeight / image.naturalHeight);
      const width = Math.round(image.naturalWidth * scale * 100) / 100;
      const height = Math.round(image.naturalHeight * scale * 100) / 100;
      setSize((previous) => previous?.width === width && previous?.height === height ? previous : { width, height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    image.addEventListener("load", measure);
    measure();

    let drag = null;
    const pointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || (frame.scrollWidth <= frame.clientWidth && frame.scrollHeight <= frame.clientHeight)) return;
      drag = { x: event.clientX, y: event.clientY, left: frame.scrollLeft, top: frame.scrollTop };
      frame.setPointerCapture(event.pointerId);
    };
    const pointerMove = (event) => {
      if (!drag) return;
      frame.scrollLeft = Math.max(0, Math.min(frame.scrollWidth - frame.clientWidth, drag.left - (event.clientX - drag.x)));
      frame.scrollTop = Math.max(0, Math.min(frame.scrollHeight - frame.clientHeight, drag.top - (event.clientY - drag.y)));
    };
    const pointerEnd = (event) => {
      drag = null;
      if (frame.hasPointerCapture(event.pointerId)) frame.releasePointerCapture(event.pointerId);
    };
    frame.addEventListener("pointerdown", pointerDown);
    frame.addEventListener("pointermove", pointerMove);
    frame.addEventListener("pointerup", pointerEnd);
    frame.addEventListener("pointercancel", pointerEnd);
    return () => {
      observer.disconnect();
      image.removeEventListener("load", measure);
      frame.removeEventListener("pointerdown", pointerDown);
      frame.removeEventListener("pointermove", pointerMove);
      frame.removeEventListener("pointerup", pointerEnd);
      frame.removeEventListener("pointercancel", pointerEnd);
    };
  }, [src, dimensions.width, dimensions.height, dimensions.imageScaleWidth, dimensions.imageScaleHeight]);

  return <img ref={imageRef} src={src} alt={alt} draggable={false} style={size ? { width: `${size.width}px`, height: `${size.height}px` } : { width: dimensions.imageWidth, height: dimensions.imageHeight }} />;
}

function HeroMediaLayer({ config = {}, sourceSrc = "" }) {
  const scrollable = config.mediaOverflow === "scroll" && config.mediaType !== "Video";
  const src = config.mediaState === "removed" ? "" : config.mediaState === "custom" ? config.mediaSrc : sourceSrc;
  const dimensions = mediaDimensions(config);
  const resized = dimensions.width !== 100 || dimensions.height !== 100 || dimensions.imageScaleWidth !== 100 || dimensions.imageScaleHeight !== 100;
  // Uploaded images need a fixed frame even at 100% for object-fit: contain.
  if ((scrollable || resized || config.mediaState === "custom") && src && config.mediaType !== "Video") return <div className={`ht-hero-media ht-hero-media-frame${scrollable ? " ht-hero-media-scroll" : ""}`} data-inspector-area="media" style={{ backgroundColor: config.mediaBackgroundColor ?? "#f5f5f5" }}>{scrollable ? <ScrollImage src={src} alt="" dimensions={dimensions} /> : <img src={src} alt="" style={{ width: dimensions.imageWidth, height: dimensions.imageHeight, objectFit: config.mediaFit ?? "cover" }} />}</div>;
  if (config.mediaState === "custom" && config.mediaSrc && config.mediaType === "Video") return <video className="ht-hero-media" src={config.mediaSrc} autoPlay loop muted playsInline style={{ objectFit: config.mediaFit ?? "cover" }} />;
  return null;
}

function RetentionPreview({ config, onClose }) {
  const start = timerSeconds(config.timerStart ?? "71:22:22");
  const [remaining, setRemaining] = useState(start);
  useEffect(() => { setRemaining(start); const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(interval); }, [start]);
  const parts = formatTimer(remaining, "hh:mm:ss", ":").split(":");
  return <div className="ht-retention-overlay" onClick={onClose}><section className="ht-retention-card" role="dialog" aria-label="挽留弹窗" onClick={(event) => event.stopPropagation()} style={{ backgroundColor: config.backgroundColor ?? "#f7f7f7", backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined }}><h2 style={{ color: config.titleColor ?? "#111" }}>{config.title ?? "错过这次，就要多花 30%😱"}</h2>{config.imageSrc && <img className="ht-retention-image" src={config.imageSrc} alt="优惠礼物" />}<div className="ht-retention-timer" style={{ color: config.timerColor ?? "#11bf42", "--retention-timer-color": config.timerColor ?? "#11bf42" }}><strong>{config.timerLabel ?? "倒计时"}</strong><div>{parts.map((part, index) => <React.Fragment key={index}><span>{part}</span>{index < parts.length - 1 && <i>:</i>}</React.Fragment>)}</div></div><button className="ht-retention-primary" type="button" onClick={onClose} style={{ background: `linear-gradient(90deg, ${config.buttonStartColor ?? "#ff8600"}, ${config.buttonEndColor ?? "#ffcd00"})`, color: config.buttonTextColor ?? "#fff" }}>{config.buttonText ?? "立享优惠"}</button><button className="ht-retention-cancel" type="button" onClick={onClose}>{config.cancelText ?? "忍痛取消"}</button></section></div>;
}

function carouselSlideStyles(config = {}) {
  const px = (value) => `${Math.max(0, Number(value) || 0)}px`;
  const imageFit = config.imageFit ?? "fill";
  return {
    image: {
      backgroundColor: config.imageBackground ?? "#e5f1ff",
      backgroundSize: imageFit === "fill" ? "100% 100%" : imageFit,
    },
    hero: {
      "--hero-height-scale": String((Number(config.imageHeight) || 100) / 100),
      ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].map((edge) => [`--media-inset-${edge.toLowerCase()}`, px(config[`imagePadding${edge}`])])),
      borderRadius: px(config.imageRadius),
      overflow: config.imageRadius ? "hidden" : undefined,
    },
    title: { color: config.titleColor, fontSize: config.titleFontSize ? px(config.titleFontSize) : undefined, fontWeight: config.titleWeight, textAlign: config.copyAlign ?? "center", paddingLeft: config.copyPaddingX === undefined ? undefined : px(config.copyPaddingX), paddingRight: config.copyPaddingX === undefined ? undefined : px(config.copyPaddingX), paddingTop: config.titleTopGap === undefined ? undefined : px(config.titleTopGap) },
    caption: { color: config.captionColor, fontSize: config.captionFontSize ? px(config.captionFontSize) : undefined, fontWeight: config.captionWeight, textAlign: config.copyAlign ?? "center", paddingLeft: config.copyPaddingX === undefined ? undefined : px(config.copyPaddingX), paddingRight: config.copyPaddingX === undefined ? undefined : px(config.copyPaddingX), paddingTop: config.captionTopGap === undefined ? undefined : px(config.captionTopGap) },
    dots: { gap: px(config.gap ?? 8), paddingTop: config.dotTopGap === undefined ? undefined : px(config.dotTopGap), paddingBottom: config.dotBottomGap === undefined ? undefined : px(config.dotBottomGap), fontSize: config.dotSize ? px(config.dotSize) : undefined },
  };
}

function HelloTalkPaywall({ variant, nodes, activeNode, layerContext, onSelect, onButtonAction, onUpdateHeroPosition, onReorder, retentionPreviewOpen = false, onOpenRetention, onCloseRetention, pricePreviewMode = "1", interactive = false }) {
  const heroCopyDrag = useRef(null);
  const heroOverlayDrag = useRef(null);
  const defaults = helloTalkTemplateDefaults[variant];
  const renderedNodes = nodes ?? createBuilderNodes(templates.find((item) => item.documentTemplate === variant));
  const nodeById = (id) => renderedNodes.find((item) => item.id === id);
  const value = (id, fallback) => nodeById(id)?.content ?? fallback;
  const configFor = (id) => nodeById(id)?.config ?? {};
  const styleFor = (id) => {
    const config = configFor(id);
    const fontFamily = config.fontFamily === "serif" ? "Georgia, serif" : config.fontFamily === "mono" ? "ui-monospace, SFMono-Regular, monospace" : undefined;
    const margin = ["Top", "Right", "Bottom", "Left"].map((edge) => `${config[`margin${edge}`] ?? 0}px`).join(" ");
    const transform = config.offsetY ? `translateY(${config.offsetY}px)` : undefined;
    return {
      ...(config.color ? { color: config.color } : {}),
      ...(config.backgroundColor ? { background: config.backgroundColor } : {}),
      ...(config.fontSize ? { fontSize: `${config.fontSize}px` } : {}),
      ...(config.fontWeight ? { fontWeight: config.fontWeight } : {}),
      ...(config.textAlign ? { textAlign: config.textAlign } : {}),
      ...(fontFamily ? { fontFamily } : {}),
      ...(config.radius !== undefined ? { borderRadius: `${config.radius}px` } : {}),
      ...(config.shadow ? { boxShadow: `0 ${Math.max(2, Math.round(config.shadow / 2))}px ${config.shadow}px #17172833` } : {}),
      ...(config.opacity !== undefined ? { opacity: config.opacity / 100 } : {}),
      ...(margin !== "0px 0px 0px 0px" ? { margin } : {}),
      ...(transform ? { transform } : {}),
      ...(config.maxLines ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: config.maxLines, overflow: "hidden" } : {}),
      ...(config.scaleText ? { overflowWrap: "anywhere" } : {}),
    };
  };
  const heroStyleFor = (id) => {
    const config = configFor(id);
    const numeric = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
    const dimensions = mediaDimensions(config);
    const heightScale = dimensions.height / 100;
    const width = dimensions.width;
    return {
      ...styleFor(id),
      ...(config.mediaWidth !== undefined ? { width: `${width}%`, alignSelf: "center" } : {}),
      ...(config.mediaState === "custom" && config.mediaSrc ? { backgroundImage: "none" } : {}),
      backgroundColor: config.mediaBackgroundColor ?? ({ "blue-privilege": "#09265d", "membership-plans": "#ffe07a", "payment-recovery": "#e5f4ff" }[variant] ?? "#ffffff"),
      ...(config.mediaState === "removed" ? { backgroundImage: "none" } : {}),
      ...(config.rounded ? { borderRadius: `${config.radius ?? 0}px` } : {}),
      ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].map((edge) => [`--media-inset-${edge.toLowerCase()}`, `${Math.max(0, numeric(config[`padding${edge}`], 0))}px`])),
      "--hero-height-scale": `${heightScale}`,
      "--hero-copy-left": `${((width - 100) / 2 + numeric(config.copyLeft, 12)) * 100 / width}%`,
      "--hero-copy-bottom": `${(heightScale * 100 - 100 + numeric(config.copyBottom, 15)) / heightScale}%`,
      "--hero-copy-align": config.copyAlign ?? "left",
      "--hero-title-color": config.copyTitleColor ?? "#ffc524",
      "--hero-title-prefix-color": config.copyPrefixColor ?? "#ffffff",
      "--hero-title-size": `${numeric(config.copyTitleSize, 26)}px`,
      "--hero-caption-color": config.copyCaptionColor ?? "#ffffff",
      "--hero-caption-size": `${numeric(config.copyCaptionSize, 16)}px`,
    };
  };
  const mediaClass = (id) => {
    const config = configFor(id);
    const state = config.mediaState;
    const dimensions = mediaDimensions(config);
    return [state === "custom" ? "media-custom" : state === "removed" ? "media-removed" : "", config.mediaOverflow === "scroll" && config.mediaType !== "Video" ? "media-scroll" : "", config.mediaType !== "Video" && (dimensions.width !== 100 || dimensions.height !== 100 || dimensions.imageScaleWidth !== 100 || dimensions.imageScaleHeight !== 100) ? "media-resized" : ""].filter(Boolean).join(" ");
  };
  const productConfig = nodeById("products")?.config ?? {};
  const packageLayout = productLayout(productConfig, variant);
  const agreementNode = renderedNodes.find((entry) => entry.type === "Agreement");
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementMessage, setAgreementMessage] = useState("");
  useEffect(() => { setAgreementChecked(false); setAgreementMessage(""); }, [variant, agreementNode?.id, agreementNode?.config?.showCheckbox]);
  const defaultSelectedPlan = Number.isInteger(productConfig.defaultSelected) ? productConfig.defaultSelected : variant === "blue-privilege" ? defaults.selectedProductIndex : (["payment-recovery", "sku-sheet"].includes(variant) ? 0 : 1);
  const [selectedPlan, setSelectedPlan] = useState(defaultSelectedPlan);
  const [openPrivilegeId, setOpenPrivilegeId] = useState(null);
  const retentionConfig = configFor("retention");
  const hasRetention = Boolean(nodeById("retention"));
  useEffect(() => setSelectedPlan(defaultSelectedPlan), [defaultSelectedPlan, variant]);
  const heroConfig = configFor("hero-image");
  const title = heroConfig.copyTitle ?? value("headline", defaults.title);
  const titleParts = heroTitleParts(heroConfig);
  const caption = heroConfig.copyCaption ?? value("caption", defaults.caption);
  const timerNode = nodeById("timer");
  const timer = timerNode?.content || defaults.timer;
  const timerConfig = timerNode?.config ?? {};
  const action = value("purchase", defaults.action);
  const legal = value("legal", defaults.legal);
  const links = value("links", "服务条款 · 隐私政策");
  const visiblePlans = productPackageRows(nodeById("products"), variant);
  const benefitConfig = configFor("benefits");
  const benefitColumns = privilegeColumnsFor(benefitConfig);
  const renderedBenefits = benefitConfig.bluePrivilege ? privilegeRowsFor(nodeById("benefits")) : value("benefits", "").split("\n").filter(Boolean).map((row, index) => { const [name, standard, vip] = row.split("|"); return { id: `generic-${index}`, name, standard, vip }; });
  const visibleBenefits = benefitConfig.bluePrivilege ? renderedBenefits.slice(0, Math.max(1, Math.min(renderedBenefits.length, Number(benefitConfig.maxVisibleRows ?? renderedBenefits.length) || 1))) : renderedBenefits;
  const renderBenefitValue = (row, field) => {
    const mode = row[field + "Mode"] ?? (row[field] === "受限" || row[field] === "✓" ? "icon" : "text");
    if (mode !== "icon") return row[field] ?? "";
    const icon = row[field + "Icon"] ?? (field === "standard" ? "lock" : "check");
    return icon === "lock" ? <LockKeyhole size="1em" strokeWidth={2.4} aria-label="锁定" /> : <span className="ht-vip-check" aria-label="勾选">✓</span>;
  };
  const openPrivilege = renderedBenefits.find((row) => row.id === openPrivilegeId);
  const carouselConfig = nodeById("carousel")?.config ?? {};
  const carouselStyles = carouselSlideStyles(carouselConfig);
  const carouselSlides = Array.isArray(carouselConfig.slides) ? carouselConfig.slides : [];
  const carouselCount = carouselSlides.length || Math.max(1, Math.min(10, Number(carouselConfig.itemCount ?? 7) || 7));
  const [activeCarouselSlide, setActiveCarouselSlide] = useState(Number(carouselConfig.initialSlide ?? 0) || 0);
  useEffect(() => { if (layerContext?.nodeId === "carousel" && layerContext.rowIndex !== undefined) setActiveCarouselSlide(layerContext.rowIndex); }, [layerContext]);
  useEffect(() => setActiveCarouselSlide(Math.min(carouselCount - 1, Math.max(0, Number(carouselConfig.initialSlide ?? 0) || 0))), [carouselConfig.initialSlide, carouselCount, variant]);
  const carouselActive = Math.min(carouselCount - 1, Math.max(0, activeCarouselSlide));
  const select = (id) => (event) => {
    if (!interactive) return;
    event?.stopPropagation();
    const indexed = event?.target instanceof Element ? event.target.closest("[data-inspector-slide], [data-inspector-row]") : null;
    const slideValue = indexed?.getAttribute(indexed.hasAttribute("data-inspector-row") ? "data-inspector-row" : "data-inspector-slide");
    onSelect?.(id, previewClickArea(event), slideValue == null ? null : Number(slideValue));
  };
  const canDragHeroCopy = interactive && variant === "blue-privilege" && Boolean(onUpdateHeroPosition);
  const heroCopyPointerDown = (event) => {
    if (!canDragHeroCopy || event.button !== 0) return;
    const copyRect = event.currentTarget.getBoundingClientRect();
    const heroRect = event.currentTarget.parentElement.getBoundingClientRect();
    heroCopyDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: (copyRect.left - heroRect.left) / heroRect.width * 100,
      bottom: (heroRect.bottom - copyRect.bottom) / heroRect.height * 100,
      maxLeft: Math.max(0, (heroRect.width - copyRect.width) / heroRect.width * 100),
      maxBottom: Math.max(0, (heroRect.height - copyRect.height) / heroRect.height * 100),
      width: heroRect.width,
      height: heroRect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
    onSelect?.("hero-image");
  };
  const heroCopyPointerMove = (event) => {
    const drag = heroCopyDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const clamp = (value, maximum) => Math.min(maximum, Math.max(0, value));
    onUpdateHeroPosition({
      copyLeft: Math.round(clamp(drag.left + (event.clientX - drag.startX) / drag.width * 100, drag.maxLeft) * 10) / 10,
      copyBottom: Math.round(clamp(drag.bottom - (event.clientY - drag.startY) / drag.height * 100, drag.maxBottom) * 10) / 10,
    });
  };
  const heroCopyPointerUp = (event) => {
    if (heroCopyDrag.current?.pointerId !== event.pointerId) return;
    heroCopyDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const heroCopyProps = canDragHeroCopy ? {
    title: "拖动调整文案位置",
    onPointerDown: heroCopyPointerDown,
    onPointerMove: heroCopyPointerMove,
    onPointerUp: heroCopyPointerUp,
    onPointerCancel: heroCopyPointerUp,
    onLostPointerCapture: () => { heroCopyDrag.current = null; },
  } : {};
  const heroOverlayProps = canDragHeroCopy ? {
    title: "拖动调整叠加图片位置",
    onPointerDown: (event) => {
      if (event.button !== 0) return;
      const overlay = event.currentTarget.getBoundingClientRect();
      const hero = event.currentTarget.parentElement.getBoundingClientRect();
      heroOverlayDrag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: (overlay.left - hero.left) / hero.width * 100, top: (overlay.top - hero.top) / hero.height * 100, maxLeft: (hero.width - overlay.width) / hero.width * 100, maxTop: (hero.height - overlay.height) / hero.height * 100, width: hero.width, height: hero.height };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopPropagation();
      onSelect?.("hero-image");
    },
    onPointerMove: (event) => {
      const drag = heroOverlayDrag.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const clamp = (value, max) => Math.min(Math.max(0, max), Math.max(0, value));
      onUpdateHeroPosition({ overlayImageLeft: Math.round(clamp(drag.left + (event.clientX - drag.startX) / drag.width * 100, drag.maxLeft) * 10) / 10, overlayImageTop: Math.round(clamp(drag.top + (event.clientY - drag.startY) / drag.height * 100, drag.maxTop) * 10) / 10 });
    },
    onPointerUp: (event) => { if (heroOverlayDrag.current?.pointerId !== event.pointerId) return; heroOverlayDrag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); },
    onPointerCancel: () => { heroOverlayDrag.current = null; },
  } : {};
  const nodeClass = (id, name = "") => `ht-node ${activeNode === id ? "selected" : ""} ${name}`;
  const Status = () => <div className="ht-status"><b>{variant === "sku-sheet" ? "4:52" : variant === "blue-privilege" ? "15:48" : "16:48"}</b><span>••• ◔ ▰</span></div>;
  const Timer = ({ dragProps, reorderHandle } = {}) => {
    const startValue = timerSeconds(timer);
    const [remaining, setRemaining] = useState(startValue);
    useEffect(() => {
      setRemaining(startValue);
      if (!startValue) return undefined;
      const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
      return () => window.clearInterval(interval);
    }, [startValue, timerConfig.resetMode]);
    if (!timerNode || timerConfig.enabled === false) return null;
    const prefix = timerConfig.prefix ?? "";
    const suffix = timerConfig.suffix ?? "";
    const formatted = formatTimer(remaining, timerConfig.format ?? "hh:mm:ss", timerConfig.separator ?? ":");
    const segmentedTimer = ["blue-privilege", "membership-plans"].includes(variant) && (timerConfig.separator ?? ":") === ":";
    const prefixColor = timerConfig.prefixColor ?? timerConfig.color;
    const digitColor = timerConfig.digitColor ?? timerConfig.color;
    const digitBackground = timerConfig.digitBackgroundColor ?? timerConfig.backgroundColor;
    const opacity = Math.max(0, Math.min(100, Number(timerConfig.digitBackgroundOpacity ?? 100) || 0));
    const background = digitBackground ? `color-mix(in srgb, ${digitBackground} ${opacity}%, transparent)` : "transparent";
    const timerStyle = { ...styleFor("timer"), background: "transparent", "--timer-digit-background": background, "--timer-digit-color": digitColor ?? "currentColor" };
    return <div {...dragProps} className={`${nodeClass("timer", "ht-timer")} ${dragProps?.className ?? ""}`} style={timerStyle} onClick={select("timer")}>{reorderHandle}{prefix && <strong style={{ ...(timerConfig.prefixFontSize ? { fontSize: `${timerConfig.prefixFontSize}px` } : {}), ...(prefixColor ? { color: prefixColor } : {}) }}>{prefix}</strong>}<span className={segmentedTimer ? "ht-timer-digits" : ""} style={{ ...(timerConfig.fontSize ? { fontSize: `${timerConfig.fontSize}px` } : {}), ...(digitColor ? { color: digitColor } : {}), ...(!segmentedTimer && digitBackground ? { backgroundColor: background } : {}) }}>{segmentedTimer ? formatted.split(":").map((part, index, parts) => <React.Fragment key={`${part}-${index}`}><b>{part}</b>{index < parts.length - 1 && <i>:</i>}</React.Fragment>) : formatted}</span>{suffix && <small style={timerConfig.suffixFontSize ? { fontSize: `${timerConfig.suffixFontSize}px` } : undefined}>{suffix}</small>}</div>;
  };
  const productColorsEnabled = productConfig.bluePrivilege || productConfig.productColors;
  const actionStyle = productColorsEnabled ? { ...styleFor("purchase"), background: productGradient(productConfig.purchaseBackgroundGradient, ["#ff8707", "#ffb000", "#ffd10b"]) } : styleFor("purchase");
  const actionCopy = productColorsEnabled ? <span className="ht-action-gradient-text" style={{ backgroundImage: productGradient(productConfig.purchaseTextGradient, ["#ffffff", "#ffffff", "#ffffff"]) }}>{action}</span> : action;
  const actionNeedsAgreement = Boolean(agreementNode) && agreementNode.config?.showCheckbox !== false && agreementNode.config?.required !== false && !agreementChecked;
  const Action = ({ dragProps, reorderHandle } = {}) => interactive ? <button {...dragProps} className={`${nodeClass("purchase", "ht-action")} ${actionNeedsAgreement ? "ht-action-gated" : ""} ${dragProps?.className ?? ""}`} aria-disabled={actionNeedsAgreement} style={actionStyle} onClick={(event) => { select("purchase")(event); if (actionNeedsAgreement) { setAgreementMessage("请先勾选同意协议"); return; } onButtonAction?.(nodeById("purchase"), visiblePlans[selectedPlan]); }}>{reorderHandle}{actionCopy}</button> : <div className="ht-action" style={actionStyle}>{actionCopy}</div>;
  const Agreement = ({ entry, dragProps, reorderHandle }) => {
    const config = entry.config ?? {};
    const segments = agreementSegmentsFor(entry);
    const openAgreementLink = (event, segment, index) => {
      event.stopPropagation();
      if (!interactive) return;
      onSelect?.(entry.id, "links", index);
      const url = safeButtonUrl(segment.url ?? "");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setAgreementMessage(`请先配置${segment.text || "此处"}链接`);
    };
    return <div {...dragProps} className={`${nodeClass(entry.id, "ht-agreement")} ${dragProps?.className ?? ""}`} style={{ ...styleFor(entry.id), "--agreement-link-color": config.linkColor ?? "#3069d3", "--agreement-check-color": config.checkColor ?? "#1677ff" }} onClick={select(entry.id)}>
      {reorderHandle}
      <div className={`ht-agreement-line agreement-align-${config.align ?? "left"} ${config.showCheckbox === false ? "no-checkbox" : ""}`}>{config.showCheckbox !== false && <input type="checkbox" id={`ht-agreement-${entry.id}`} aria-label="同意协议" checked={agreementChecked} disabled={!interactive} onChange={(event) => { setAgreementChecked(event.target.checked); setAgreementMessage(""); }} />}<span className="ht-agreement-copy">{segments.map((segment, index) => segment.type === "link" ? <button type="button" key={segment.id} data-inspector-area="links" data-inspector-row={index} disabled={!interactive} onClick={(event) => openAgreementLink(event, segment, index)}>{segment.text}</button> : <span key={segment.id} data-inspector-area="copy" data-inspector-row={index} onClick={(event) => { if (!interactive) return; event.stopPropagation(); onSelect?.(entry.id, "copy", index); }}>{segment.text}</span>)}</span></div>
      {agreementMessage && <p className="ht-agreement-message" role="alert">{agreementMessage}</p>}
    </div>;
  };
  const Legal = ({ dragProps, reorderHandle } = {}) => <p {...dragProps} className={`${nodeClass("legal", "ht-legal")} ${dragProps?.className ?? ""}`} style={styleFor("legal")} onClick={select("legal")}>{reorderHandle}<RichText node={nodeById("legal")} fallback={legal} interactive={interactive} /></p>;
  const Links = ({ dragProps, reorderHandle } = {}) => <p {...dragProps} className={`${nodeClass("links", "ht-links")} ${dragProps?.className ?? ""}`} style={styleFor("links")} onClick={select("links")}>{reorderHandle}{links}</p>;
  const SoccerBall = () => <span className="ht-soccer-ball"><i /><i /><i /></span>;

  const reorderable = (entry) => {
    const element = renderModule(entry);
    if (!onReorder || !React.isValidElement(element)) return element;
    const dragProps = {
      className: `${element.props.className ?? ""} preview-reorderable`.trim(),
      onDragOver: (event) => onReorder.over(entry.id, event),
      onDrop: (event) => onReorder.drop(entry.id, event),
    };
    const reorderHandle = <PreviewReorderHandle onDragStart={(event) => onReorder.start(entry.id, event)} onDragEnd={onReorder.end} />;
    if (typeof element.type === "function") return React.cloneElement(element, { dragProps, reorderHandle });
    return React.cloneElement(element, dragProps, reorderHandle, element.props.children);
  };
  const renderChildren = (parentId) => renderedNodes.map((entry, index) =>
    nodeParentId(renderedNodes, index) === parentId
      ? <React.Fragment key={entry.id}>{reorderable(entry)}</React.Fragment>
      : null
  );
  const skuHeroIndex = renderedNodes.findIndex((entry) => entry.id === "hero-image");
  const skuOverlayIds = [];
  if (variant === "sku-sheet" && skuHeroIndex >= 0) {
    for (let index = skuHeroIndex + 1; index < renderedNodes.length; index += 1) {
      if (!["headline", "caption"].includes(renderedNodes[index].id)) break;
      skuOverlayIds.push(renderedNodes[index].id);
    }
  }
  const renderSkuCopy = (id) => id === "headline"
    ? <small className={nodeClass(id, "ht-sku-headline")} style={styleFor(id)} onClick={select(id)}><RichText node={nodeById(id)} fallback={title} interactive={interactive} /></small>
    : <strong className={nodeClass(id, "ht-sku-caption")} style={styleFor(id)} onClick={select(id)}><RichText node={nodeById(id)} fallback={caption} interactive={interactive} /></strong>;
  const renderModule = (entry) => {
    const id = entry.id;
    if (id === "retention") return null;
    if (id === "offer-card") return <section className={nodeClass(id, "ht-recovery-sheet")} style={styleFor(id)} onClick={select(id)}><span className="ht-sheet-close">×</span>{renderChildren(id)}</section>;
    if (id === "sku-card") return <section className={nodeClass(id, "ht-sku-sheet")} style={styleFor(id)} onClick={select(id)}><span className="ht-sheet-close">×</span>{renderChildren(id)}</section>;
    if (id === "hero-image") {
      if (variant === "blue-privilege") { const dimensions = mediaDimensions(heroConfig); return <section className={nodeClass(id, "ht-blue-hero") + " " + mediaClass(id)} style={heroStyleFor(id)} onClick={select(id)}><HeroMediaLayer config={heroConfig} sourceSrc="/figma-paywall-assets/blue-banner.png" /><div className="ht-source-art" /><button className="ht-back" type="button" aria-label="返回" onClick={(event) => { event.stopPropagation(); if (hasRetention) onOpenRetention?.(); }}>‹</button>{heroConfig.overlayImageEnabled !== false && <img data-inspector-area="overlay" className={"ht-hero-overlay-image" + (canDragHeroCopy ? " can-drag" : "")} src={heroConfig.overlayImageSrc || "/ht-vip-badge.svg"} alt="VIP 标识" style={{ left: `${((dimensions.width - 100) / 2 + Number(heroConfig.overlayImageLeft ?? 8)) * 100 / dimensions.width}%`, top: `${Number(heroConfig.overlayImageTop ?? 27) * 100 / dimensions.height}%`, width: `${Number(heroConfig.overlayImageWidth ?? 14) * 100 / dimensions.width}%` }} {...heroOverlayProps} />}<div className={"ht-blue-copy " + (canDragHeroCopy ? "can-drag" : "")} {...heroCopyProps}><h1 data-inspector-area="headline">{titleParts.prefix && <b>{titleParts.prefix}</b>}{titleParts.suffix}</h1><p data-inspector-area="caption">{caption}</p></div></section>; }
      if (variant === "membership-plans") return <section className={nodeClass(id, "ht-member-hero") + " " + mediaClass(id)} style={heroStyleFor(id)} onClick={select(id)}><HeroMediaLayer config={heroConfig} sourceSrc="/figma-paywall-assets/member-hero.png" /><div className="ht-source-art"><div className="ht-eye-particles"><i /><i /><i /><i /></div><div className="ht-phone-illustration"><b>Visit Info</b><span>Visitors　Visited　Liked</span><div className="ht-phone-rows">{["Peggie", "Nilson", "Cookie", "Hampton"].map((name) => <p key={name}><i /><strong>{name}</strong><small>is <b>1km</b> away from you</small><em>Say Hi</em></p>)}</div></div></div></section>;
      if (variant === "payment-recovery") return <div className={nodeClass(id, "ht-offer-bundle") + " " + mediaClass(id)} style={heroStyleFor(id)} onClick={select(id)}><HeroMediaLayer config={heroConfig} sourceSrc="/figma-paywall-assets/recovery-bg.png" /><div className="ht-source-art"><span>30%<br />OFF</span><SoccerBall /></div></div>;
      return <section className={nodeClass(id, "ht-sku-promo") + " " + mediaClass(id)} style={heroStyleFor(id)} onClick={select(id)}><HeroMediaLayer config={heroConfig} sourceSrc="/figma-paywall-assets/sku-art-alt.png" /><div className="ht-source-art"><i>セール</i><b>VIP</b></div>{skuOverlayIds.map((copyId) => <React.Fragment key={copyId}>{renderSkuCopy(copyId)}</React.Fragment>)}</section>;
    }
    if (id === "headline") {
      if (variant === "payment-recovery") return <h1 className={nodeClass(id)} style={styleFor(id)} onClick={select(id)}><RichText node={entry} fallback={title} interactive={interactive} /></h1>;
      if (variant === "sku-sheet") return skuOverlayIds.includes(id) ? null : renderSkuCopy(id);
      return <h1 className={nodeClass(id, "ht-member-headline")} style={styleFor(id)} onClick={select(id)}><RichText node={entry} fallback={title} interactive={interactive} /></h1>;
    }
    if (id === "caption") {
      if (variant === "payment-recovery") return <p className={nodeClass(id, "ht-recovery-caption")} style={styleFor(id)} onClick={select(id)}><RichText node={entry} fallback={caption} interactive={interactive} /></p>;
      if (variant === "sku-sheet") return skuOverlayIds.includes(id) ? null : renderSkuCopy(id);
      return <p className={nodeClass(id, "ht-member-caption")} style={styleFor(id)} onClick={select(id)}><RichText node={entry} fallback={caption} interactive={interactive} /></p>;
    }
    if (id === "carousel") {
      const slide = carouselSlides[carouselActive];
      if (variant === "membership-plans" && slide) return <div className={nodeClass(id, "ht-member-slide")} data-inspector-slide={carouselActive} style={styleFor(id)} onClick={select(id)}><div data-inspector-area="media" className="ht-member-hero" style={carouselStyles.hero}><div className="ht-source-art" style={{ ...carouselStyles.image, backgroundImage: slide.image ? `url(${JSON.stringify(slide.image)})` : "none" }} /></div><h1 data-inspector-area="headline" className="ht-member-headline" style={carouselStyles.title}>{slide.title}</h1><p data-inspector-area="caption" className="ht-member-caption" style={carouselStyles.caption}>{slide.caption}</p><div data-inspector-area="dots" className="ht-member-carousel" style={carouselStyles.dots}>{carouselSlides.map((item, index) => <button type="button" key={item.id} aria-label={`查看第 ${index + 1} 页`} aria-current={index === carouselActive ? "true" : undefined} style={{ color: index === carouselActive ? carouselConfig.accentColor : carouselConfig.secondaryColor }} onClick={(event) => { event.stopPropagation(); setActiveCarouselSlide(index); if (interactive) onSelect?.(id, "dots", index); }}>{index === carouselActive ? "●" : "○"}</button>)}</div>{renderChildren(id)}</div>;
      return <div className={nodeClass(id, "ht-member-carousel")} style={{ ...styleFor(id), gap: String(carouselConfig.gap ?? 8) + "px" }} onClick={select(id)}>{Array.from({ length: carouselCount }, (_, index) => <i style={{ color: index === carouselActive ? carouselConfig.accentColor : carouselConfig.secondaryColor }} key={index}>{index === carouselActive ? "●" : "○"}</i>)}{renderChildren(id)}</div>;
    }
    if (entry.type === "Carousel" && Array.isArray(entry.config?.slides)) return <section className={nodeClass(id, "ht-added-carousel")} style={styleFor(id)} onClick={select(id)}><PreviewSlideCarousel slides={entry.config.slides} initialSlide={entry.config.initialSlide ?? 0} config={entry.config} onDotSelect={(index) => onSelect?.(id, "dots", index)} /></section>;
    if (id === "benefits") {
      const columnColor = (field) => field === "standard" ? benefitConfig.secondaryColor ?? "#bdbdbd" : field === "plus" ? benefitConfig.plusColor ?? "#9b6b1f" : benefitConfig.accentColor ?? "#ffb40d";
      const [left, right] = benefitColumns;
      return <section className={nodeClass(id, "ht-privilege-table") + (right[0] === "plus" ? " is-plus-right" : "")} style={{ ...styleFor(id), "--privilege-header-background": benefitConfig.headerBackground, "--privilege-vip-background": right[0] === "plus" ? benefitConfig.plusColumnBackground ?? "#fff6d9" : benefitConfig.vipColumnBackground, "--privilege-plus-check": benefitConfig.plusCheckColor ?? "#00c5aa" }} onClick={select(id)}>
        <header><strong>特权名称</strong><strong style={left[0] === "vip" ? { color: columnColor(left[0]) } : undefined}>{left[1]}</strong><b style={{ color: columnColor(right[0]) }}>{right[1]}</b></header>
        {visibleBenefits.map((row, index) => <div key={row.id} data-inspector-row={index} className={row.pageId ? "has-detail-page" : ""} onClick={(event) => { if (!interactive || !row.pageId) return; event.stopPropagation(); setOpenPrivilegeId(row.id); }}><span>{row.name}⌄</span><em style={{ color: columnColor(left[0]) }}>{renderBenefitValue(row, left[0])}</em><b style={{ color: columnColor(right[0]) }}>{renderBenefitValue(row, right[0])}</b></div>)}
        {renderChildren(id)}
      </section>;
    }
    if (id === "products") {
      const plans = <>{visiblePlans.map((plan, index) => <ProductPackageCard key={index} plan={plan} index={index} config={productConfig} layout={packageLayout} selected={index === selectedPlan} focused={activeNode === "products" && index === selectedPlan} interactive={interactive} priceMode={pricePreviewMode} onChoose={setSelectedPlan} onInspect={(event, row) => onSelect?.("products", previewClickArea(event), row)} />)}</>;
      const shellClass = `product-layout-${packageLayout} product-count-${Math.min(visiblePlans.length, 3)} ${packageLayout === "vertical" ? "ht-vertical-products" : packageLayout === "compact" ? "ht-recovery-plans" : packageLayout === "standard" && variant === "sku-sheet" ? "ht-sku-plans" : "ht-plan-shell"}`;
      const shell = <section className={shellClass} style={styleFor("products")} onClick={select("products")}>{plans}</section>;
      return variant === "membership-plans" ? <div className="ht-member-products"><header className="ht-plan-heading"><b>选择套餐</b><span>特权对比 ›</span></header>{shell}</div> : shell;
    }
    if (id === "timer") return <Timer />;
    if (entry.type === "Agreement") return <Agreement entry={entry} />;
    if (id === "purchase") return variant === "blue-privilege" ? <div className="ht-action-wrap"><Action /></div> : <Action />;
    if (id === "legal") return <Legal />;
    if (id === "links") return <Links />;
    const children = renderedNodes.filter((child, index) => nodeParentId(renderedNodes, index) === id);
    return <PreviewElement node={entry} children={children} getChildren={(childId) => renderedNodes.filter((child, index) => nodeParentId(renderedNodes, index) === childId)} active={id === activeNode} activeNode={activeNode} onSelect={onSelect} />;
  };

  if (variant === "blue-privilege") return <div className="ht-paywall ht-blue-paywall"><Status />{openPrivilege ? <div className="ht-privilege-detail"><button type="button" className="ht-detail-back" aria-label="返回特权页" onClick={() => setOpenPrivilegeId(null)}>‹</button><h1 style={{ color: openPrivilege.detail?.titleColor }}>{openPrivilege.detail?.title || openPrivilege.name}</h1>{openPrivilege.detail?.iconSrc && <img className="ht-detail-icon" src={openPrivilege.detail.iconSrc} alt="" />}{openPrivilege.detail?.images?.find((image) => image.locale === "简体中文" && image.src)?.src && <img className="ht-detail-image" src={openPrivilege.detail.images.find((image) => image.locale === "简体中文" && image.src).src} alt="" />}</div> : <>{renderChildren(null)}{hasRetention && retentionPreviewOpen && <RetentionPreview config={retentionConfig} onClose={onCloseRetention} />}</>}</div>;
  if (variant === "membership-plans") return <div className="ht-paywall ht-membership-paywall"><div className="ht-member-backdrop"><Status /><span className="ht-back">‹</span><strong>我的访问</strong><b>ϟ</b><div><span>访客</span><span>谁看了我</span><span>喜欢我的人</span></div></div><section className="ht-member-sheet"><span className="ht-sheet-close">×</span>{renderChildren(null)}</section></div>;
  if (variant === "payment-recovery") return <div className="ht-paywall ht-recovery-paywall"><div className="ht-recovery-backdrop"><Status /><b>‹</b><strong>我的访问</strong></div>{renderChildren(null)}</div>;
  return <div className="ht-paywall ht-sku-paywall"><div className="ht-chat-scene"><Status /><b>‹</b><strong>huangzefeng</strong><small>上午4:52</small><span>Hi</span></div>{renderChildren(null)}</div>;
}
function PaywallPreview({ nodes: sourceNodes, template, mode, pricePreviewMode, activeNode, layerContext, onSelect, onUpdateHeroPosition, onReorder, retentionPreviewOpen, onOpenRetention, onCloseRetention }) {
  const nodes = useMemo(() => sourceNodes.map((node) => node.type === "Carousel" && node.id === layerContext?.nodeId && layerContext.rowIndex !== undefined ? { ...node, config: { ...node.config, initialSlide: layerContext.rowIndex } } : node), [sourceNodes, layerContext]);
  const [actionPreview, setActionPreview] = useState(null);
  const [previewToggles, setPreviewToggles] = useState({});
  const [previewTabs, setPreviewTabs] = useState({});
  const [screenIndex, setScreenIndex] = useState(0);
  const configuredScreenIndex = Number(nodes.find((item) => item.type === "Screen Flow")?.config?.defaultStep ?? 0);
  useEffect(() => setPreviewToggles({}), [template?.id]);
  useEffect(() => setPreviewTabs({}), [template?.id]);
  useEffect(() => setScreenIndex(configuredScreenIndex), [template?.id, configuredScreenIndex]);
  useEffect(() => {
    if (layerContext?.tabsId) setPreviewTabs((current) => ({ ...current, [layerContext.tabsId]: layerContext.index }));
    if (layerContext?.screenIndex >= 0) setScreenIndex(layerContext.screenIndex);
  }, [layerContext]);
  const runButtonAction = (node, product) => {
    if (!node) return;
    const action = node.config?.action ?? (node.type === "Purchase Button" ? "Purchase" : node.type === "Web Paywall Button" ? "WebCheckout" : "None");
    if (action === "NextScreen") {
      const count = nodes.filter((item) => item.type === "Screen").length;
      setScreenIndex((current) => Math.min(current + 1, Math.max(0, count - 1)));
      return;
    }
    if (action === "Purchase") setActionPreview({ kind: "payment", product });
    if (action === "WebCheckout") setActionPreview({ kind: "webCheckout", autoDismiss: node.config?.autoDismiss !== false });
    if (action === "OfferCodeRedemption") setActionPreview({ kind: "offerCode" });
    if (action === "RestorePurchases") setActionPreview({ kind: "restore" });
    if (action === "Dismiss") setActionPreview({ kind: "dismissed" });
    if (action === "OpenPage") {
      const target = templates.find((item) => item.id === (node.config?.actionPage ?? "ht-blue-privilege") && item.documentTemplate);
      setActionPreview(target ? { kind: "page", target } : { kind: "error", message: "目标页面不可用" });
    }
    if (action === "OpenURL") {
      const url = safeButtonUrl(node.config?.actionUrl ?? "");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setActionPreview({ kind: "error", message: "请先配置有效的目标链接" });
    }
  };
  const overlay = actionPreview && <ButtonActionOverlay preview={actionPreview} onClose={() => setActionPreview(null)} />;
  if (template?.documentTemplate) {
    const paywall = <HelloTalkPaywall variant={template.documentTemplate} nodes={nodes} activeNode={activeNode} layerContext={layerContext} onSelect={onSelect} onButtonAction={runButtonAction} onUpdateHeroPosition={onUpdateHeroPosition} onReorder={onReorder} retentionPreviewOpen={retentionPreviewOpen} onOpenRetention={onOpenRetention} onCloseRetention={onCloseRetention} pricePreviewMode={pricePreviewMode} interactive={mode === "editable"} />;
    return <div className="phone source-template-phone"><div className="ht-template-scroll" tabIndex={0} aria-label="付费墙页面预览">{paywall}</div><button className="close-phone" aria-label="Close preview">×</button>{overlay}</div>;
  }
  if (template && mode === "source" && !template.isNew) return <div className="phone source-template-phone"><SourceTemplateMedia template={template} /><button className="close-phone" aria-label="Close preview">×</button></div>;
  const hero = nodes.find((node) => node.type === "Hero Image");
  const children = new Map();
  const parents = new Map();
  const latestAtDepth = [];
  nodes.forEach((node) => {
    const depth = node.depth ?? 0;
    const parentId = node.parentId ?? (depth > 0 ? latestAtDepth[depth - 1] : undefined);
    if (parentId) {
      parents.set(node.id, parentId);
      children.set(parentId, [...(children.get(parentId) ?? []), node]);
    }
    latestAtDepth[depth] = node.id;
    latestAtDepth.length = depth + 1;
  });
  return <div data-no-translate={template?.isGallery ? true : undefined} className={`phone template-${hero?.theme ?? "lavender"} ${template?.isGallery ? `template-${template.id}${![5, 6, 38].includes(template.sourceOrder) ? " rc-rebuilt" : ""}` : ""}`}><button className="close-phone" aria-label="Close preview">×</button>{template?.isGallery && template.sourceOrder !== 38 && <div className="rc-statusbar" aria-hidden="true"><strong>9:41</strong><span className="rc-dynamic-island" /><span className="rc-status-icons"><Signal /><Wifi /><BatteryFull /></span></div>}<div className="phone-content">{!template?.isNew && <span className="phone-kicker">PREMIUM ACCESS</span>}{nodes.filter((node) => !parents.has(node.id)).map((node) => <PreviewElement key={node.id} node={node} children={children.get(node.id) ?? []} getChildren={(childId) => children.get(childId) ?? []} active={node.id === activeNode} activeNode={activeNode} onSelect={onSelect} onButtonAction={runButtonAction} onReorder={onReorder} pricePreviewMode={pricePreviewMode} toggleStates={previewToggles} onToggleChange={(id, enabled) => setPreviewToggles((current) => ({ ...current, [id]: enabled }))} tabStates={previewTabs} onTabChange={(id, index) => setPreviewTabs((current) => ({ ...current, [id]: index }))} screenIndex={screenIndex} onScreenChange={setScreenIndex} />)}</div>{overlay}</div>;
}

function ButtonActionOverlay({ preview, onClose }) {
  const [offerCode, setOfferCode] = useState("");
  const [offerCodeChecked, setOfferCodeChecked] = useState(false);
  const title = { payment: "支付预览", webCheckout: "网页结账预览", offerCode: "优惠码兑换预览", restore: "恢复购买预览", dismissed: "关闭付费墙预览" }[preview.kind] ?? "无法打开";
  const message = preview.kind === "restore" ? "此动作需要 App Store 或 Google Play 的购买记录；本地预览不会请求商店。" : preview.kind === "dismissed" ? "实际页面会返回上一页；本地保留编辑预览。" : preview.message;
  return <div className={`button-action-overlay ${preview.kind === "page" ? "page" : "sheet"}`} role="dialog" aria-modal="true" aria-label={title}>{preview.kind === "page" ? <><div className="button-action-page"><HelloTalkPaywall variant={preview.target.documentTemplate} /></div><button type="button" className="button-action-back" onClick={onClose} aria-label="返回编辑预览"><ArrowLeft size={18} /> 返回</button></> : <><button type="button" className="button-action-scrim" onClick={onClose} aria-label="关闭预览" /><div className="button-action-sheet"><button type="button" className="button-action-close" onClick={onClose} aria-label="关闭预览"><X size={18} /></button><h3>{title}</h3>{preview.kind === "payment" ? <><p>{preview.product?.name || "未选择商品"}</p><strong>{preview.product?.price || ""}</strong><small>仅预览，不会发起真实支付</small></> : preview.kind === "webCheckout" ? <><p>此按钮将使用 RevenueCat Billing 在浏览器打开网页结账。</p><small>本地未连接 Billing，预览不会发起交易。{preview.autoDismiss ? "结账后自动关闭付费墙。" : "结账后保持付费墙打开。"}</small></> : preview.kind === "offerCode" ? <form className="offer-code-preview" onSubmit={(event) => { event.preventDefault(); setOfferCodeChecked(true); }}><label htmlFor="preview-offer-code">优惠码</label><input id="preview-offer-code" value={offerCode} onChange={(event) => { setOfferCode(event.target.value); setOfferCodeChecked(false); }} placeholder="输入优惠码" autoComplete="off" required /><button type="submit">验证优惠码</button><small role="status">{offerCodeChecked ? "已填写优惠码；本地未连接 RevenueCat，无法确认是否有效或变更价格。" : "此处仅预览兑换页；不会提交优惠码或更改商品价格。"}</small></form> : <p>{message}</p>}</div></>}</div>;
}

function previewClickArea(event) {
  const target = event?.target;
  if (!(target instanceof Element)) return "component";
  const marked = target.closest("[data-inspector-area]");
  if (marked) return marked.dataset.inspectorArea;
  if (target.closest("img, video, .preview-media-art, .ht-source-art")) return "media";
  if (target.closest("h1, h2, h3, strong")) return "headline";
  if (target.closest("small, p")) return "caption";
  if (target.closest("button")) return "action";
  return "component";
}

function PreviewElement({ node, active, activeNode, onSelect, onButtonAction, onReorder, dragProps, reorderHandle, children = [], getChildren = () => [], pricePreviewMode = "1", toggleStates = {}, onToggleChange, tabStates = {}, onTabChange, screenIndex = 0, onScreenChange }) {
  const select = (event) => {
    const indexed = event?.target instanceof Element ? event.target.closest("[data-inspector-slide], [data-inspector-row]") : null;
    const slideValue = indexed?.getAttribute(indexed.hasAttribute("data-inspector-row") ? "data-inspector-row" : "data-inspector-slide");
    onSelect(node.id, previewClickArea(event), slideValue == null ? null : Number(slideValue));
  };
  const config = node.config ?? {};
  const nodeStyle = {
    ...(config.color ? { color: config.color } : {}),
    ...(config.backgroundColor ? { backgroundColor: config.backgroundColor } : {}),
    ...(config.fontSize ? { fontSize: `${config.fontSize}px` } : {}),
    ...(config.fontWeight ? { fontWeight: config.fontWeight } : {}),
    ...(config.textAlign ? { textAlign: config.textAlign } : {}),
    ...(config.fontFamily === "serif" ? { fontFamily: "Georgia, serif" } : config.fontFamily === "mono" ? { fontFamily: "ui-monospace, monospace" } : {}),
    ...(config.opacity !== undefined ? { opacity: Number(config.opacity) / 100 } : {}),
    ...(config.radius !== undefined ? { borderRadius: `${config.radius}px` } : {}),
    ...(config.shadow ? { boxShadow: `0 ${Math.max(2, Math.round(config.shadow / 2))}px ${config.shadow}px #17172833` } : {}),
    ...(config.maxLines ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: config.maxLines, overflow: "hidden" } : {}),
    ...(config.scaleText ? { overflowWrap: "anywhere" } : {}),
    ...(config.offsetY ? { transform: `translateY(${config.offsetY}px)` } : {}),
    ...(Object.keys(config).some((key) => key.startsWith("margin")) ? { margin: ["Top", "Right", "Bottom", "Left"].map((edge) => `${config[`margin${edge}`] ?? 0}px`).join(" ") } : {}),
  };
  const reorderProps = dragProps ?? (onReorder ? { onDragOver: (event) => onReorder.over(node.id, event), onDrop: (event) => onReorder.drop(node.id, event) } : {});
  const handle = reorderHandle ?? (onReorder ? <PreviewReorderHandle onDragStart={(event) => onReorder.start(node.id, event)} onDragEnd={onReorder.end} /> : null);
  const wrap = (content, className = "") => <div {...reorderProps} data-node-id={node.id} className={`preview-node ${active ? "selected" : ""} ${className} ${onReorder || dragProps ? "preview-reorderable" : ""}`} style={nodeStyle} onClick={select}>{handle}{content}</div>;
  const textStyle = { color: config.color, fontSize: config.fontSize ? `${config.fontSize}px` : undefined, fontWeight: config.fontWeight, textAlign: config.textAlign };
  const buttonStyle = { backgroundColor: config.backgroundColor, color: config.color, borderRadius: config.radius === undefined ? undefined : `${config.radius}px` };
  const cardStyle = { backgroundColor: config.backgroundColor, borderRadius: config.radius === undefined ? undefined : `${config.radius}px`, boxShadow: config.shadow ? `0 ${Math.max(2, Math.round(config.shadow / 2))}px ${config.shadow}px #17172833` : undefined };
  const renderChildren = (items = children) => items.map((child) => <PreviewElement key={child.id} node={child} children={getChildren(child.id)} getChildren={getChildren} active={child.id === activeNode} activeNode={activeNode} onSelect={onSelect} onButtonAction={onButtonAction} onReorder={onReorder} pricePreviewMode={pricePreviewMode} toggleStates={toggleStates} onToggleChange={onToggleChange} tabStates={tabStates} onTabChange={onTabChange} screenIndex={screenIndex} onScreenChange={onScreenChange} />);
  const isTextLayer = isTextNodeType(node.type);
  const isListLayer = ["List", "Feature list", "Features"].includes(node.type) || /^List \d+$/.test(node.type);
  const isListItemLayer = node.type === "List item" || node.type === "Today" || /^Item \d+$/.test(node.type) || /^Day \d+$/.test(node.type);
  const isImageLayer = ["Image", "Black Friday Image"].includes(node.type) || /^Image \d+$/.test(node.type);
  if (node.sourcePending) return wrap(<p className="preview-boundary">Source layer confirmed; field content pending</p>, "preview-copy");
  if (node.type === "Page Background") return wrap(<div className="preview-page-background" style={{ backgroundColor: config.mediaBackgroundColor ?? "#ffffff" }}>{config.mediaState !== "removed" && config.mediaSrc && <img src={config.mediaSrc} alt="" style={{ objectFit: config.mediaFit ?? "cover", objectPosition: config.mediaPosition ?? "center" }} />}</div>, "preview-page-background-wrap");
  if (node.type === "Screen Flow") {
    const current = Math.min(Math.max(0, screenIndex), Math.max(0, children.length - 1));
    return wrap(<div className="preview-screen-flow" onClick={(event) => event.stopPropagation()}><div className="preview-screen-progress" aria-label={`第 ${current + 1} 页，共 ${children.length} 页`}>{children.map((child, index) => <button type="button" key={child.id} className={index === current ? "active" : ""} aria-label={`查看第 ${index + 1} 页`} aria-current={index === current ? "step" : undefined} onClick={(event) => { event.stopPropagation(); onScreenChange?.(index); }} />)}</div>{children[current] && renderChildren([children[current]])}</div>, "preview-screen-flow-wrap");
  }
  if (node.type === "Screen") return wrap(<div className="preview-screen" onClick={(event) => event.stopPropagation()}>{renderChildren()}</div>, "preview-screen-wrap");
  if (node.type === "Feature Table") return wrap(<>{config.title && <h3 className="preview-table-title">{config.title}</h3>}{config.tableVariant === "feature-list" ? <ul className="preview-feature-list" style={{ backgroundColor: config.backgroundColor }}>{(config.rows ?? []).map((row, index) => { const Icon = { telescope: Telescope, rocket: Rocket, star: Star, orbit: Orbit, bell: Bell }[row.icon] ?? Star; return <li key={index} data-inspector-row={index}><span className="preview-feature-list-icon" style={{ backgroundColor: config.accentColor }}><Icon size={12} /></span><span><strong>{row.name}</strong><small>{row.values?.[0] ?? ""}</small></span></li>; })}</ul> : <table className="preview-feature-table" style={{ backgroundColor: config.backgroundColor }}><thead><tr><th>{config.firstColumnLabel ?? "权益"}</th>{(config.columns ?? []).map((column, index) => <th key={index} style={{ color: config.accentColor }}>{column}</th>)}</tr></thead><tbody>{(config.rows ?? []).map((row, index) => <tr key={index} data-inspector-row={index}><th scope="row">{row.name}</th>{(config.columns ?? []).map((_, columnIndex) => <td key={columnIndex}>{row.values?.[columnIndex] ?? ""}</td>)}</tr>)}</tbody></table>}</>, "preview-feature-table-wrap");
  if (["Hero Image", "Hero Video"].includes(node.type)) {
    const config = node.config ?? {};
    const dimensions = mediaDimensions(config);
    const insets = ["Top", "Right", "Bottom", "Left"].map((edge) => Math.max(0, Number(config[`padding${edge}`]) || 0));
    const padding = insets.map((value) => `${value}px`).join(" ");
    const height = 104 * dimensions.height / 100;
    const media = config.mediaState === "removed" ? null : config.mediaSrc
      ? config.mediaType === "Video" ? <video src={config.mediaSrc} autoPlay loop muted playsInline style={{ objectFit: config.mediaFit ?? "cover" }} /> : config.mediaOverflow === "scroll" ? <ScrollImage src={config.mediaSrc} alt={node.label || ""} dimensions={dimensions} /> : <img src={config.mediaSrc} alt={node.label || ""} style={{ width: dimensions.imageWidth, height: dimensions.imageHeight, objectFit: config.mediaFit ?? "cover" }} />
      : <span>{node.type === "Hero Video" || config.mediaType === "Video" ? "VIDEO" : node.content === "knowledge" ? "✦" : ""}</span>;
    return wrap(<div className={`preview-media visual-${node.content}`} style={{ width: `${dimensions.width}%`, marginInline: "auto", height: `${height}px`, padding, transform: config.offsetY ? `translateY(${config.offsetY}px)` : undefined, borderRadius: config.rounded ? `${config.radius ?? 0}px` : undefined, backgroundColor: config.mediaBackgroundColor ?? "#f5f5f5" }}><div className={`preview-media-art${config.mediaSrc ? " has-media" : ""}${config.mediaOverflow === "scroll" && config.mediaType !== "Video" ? " media-scroll" : ""}`}>{media}</div></div>, "preview-hero");
  }
  if (node.type === "Stars") return wrap(<div className="preview-stars">{node.content || "★★★★★"}</div>);
  if (node.type === "Discount") return wrap(<h2>{node.content || "Discount"}</h2>, "preview-headline");
  if (isTextLayer) {
    const tabIndex = tabStates[config.linkedTabsId] ?? config.tabDefaultIndex ?? 0;
    const visibleNode = Array.isArray(config.tabContents) ? { ...node, content: config.tabContents[tabIndex] ?? node.content, textRuns: undefined } : node;
    return wrap(node.variant === "headline" ? <h2 style={textStyle}><RichText node={visibleNode} fallback="Heading" interactive /></h2> : node.variant === "section" ? <h3 style={textStyle}><RichText node={visibleNode} interactive /></h3> : <p style={textStyle} className={node.variant === "boundary" ? "preview-boundary" : ""}><RichText node={visibleNode} fallback="Supporting text" interactive /></p>, node.variant === "headline" ? "preview-headline" : "preview-copy");
  }
  if (isListLayer && config.listVariant === "testimonials") return wrap(<div className="preview-testimonials">{(config.testimonialRows ?? []).map((row, index) => <article key={index} data-inspector-row={index}><strong>{row.title}</strong><span aria-label="5 星评价">★★★★★</span><p>{row.quote}</p>{row.author && <small>{row.author}</small>}</article>)}</div>, "preview-testimonials-wrap");
  if (isListLayer) {
    const tabIndex = tabStates[config.linkedTabsId] ?? config.tabDefaultIndex ?? 0;
    const rows = config.linkedTabsId && Array.isArray(config.tabListRows?.[tabIndex]) ? config.tabListRows[tabIndex] : listRowsFor(node);
    if (!rows.length && !children.length) return wrap(<div className="preview-list-anchor">List</div>, "preview-list-anchor-wrap");
    return wrap(<div className="preview-benefits" style={{ background: node.config?.backgroundColor }}><ul className="preview-benefits">{rows.map((row, index) => <li key={index} data-inspector-row={index} className={row.leadingMode === "none" ? "no-leading" : ""}><i style={{ color: node.config?.accentColor }}>{row.leadingMode !== "none" ? ({ dumbbell: <Dumbbell size={17} />, weight: <Weight size={17} />, running: <PersonStanding size={17} />, clock: <Clock3 size={17} />, moon: <Moon size={17} />, flower: <Flower2 size={17} />, heart: <Heart size={17} />, scan: <ScanSearch size={17} />, map: <MapIcon size={17} />, help: <CircleHelp size={17} />, arrow: <ChevronRight size={17} />, access: <LogIn size={17} />, noads: <Ban size={17} />, blocks: <Blocks size={17} />, activity: <Activity size={17} />, archive: <Archive size={17} />, download: <Download size={17} />, ticket: <Ticket size={17} />, seat: <Armchair size={17} />, shirt: <Shirt size={17} />, group: <Users size={17} /> }[row.leading] ?? row.leading ?? "✓") : ""}</i><span><strong>{row.title}</strong>{row.showCaption !== false && row.caption && <small>{row.caption}</small>}</span></li>)}</ul>{renderChildren()}</div>, "preview-list");
  }
  if (node.type === "Timeline") return config.enabled === false ? null : wrap(<ol className="preview-timeline" style={{ "--timeline-accent": config.accentColor ?? "#6a31e9", "--timeline-line": config.lineColor ?? "#d9cafa" }}>{listRowsFor(node).map((row, index) => <li key={index} data-inspector-row={index}><span className="timeline-marker">{row.marker === "lock" ? <LockKeyhole size={12} /> : row.marker === "bell" ? <Bell size={12} /> : row.marker === "star" ? <Star size={12} /> : index + 1}</span><span><strong>{row.title}</strong>{row.showCaption !== false && row.caption && <small>{row.caption}</small>}</span></li>)}</ol>, "preview-timeline-wrap");
  if (node.type === "Social Proof") return wrap(<div className="preview-social-proof">{config.leftDecorationSrc && <img className="preview-social-decoration preview-social-decoration-left" src={config.leftDecorationSrc} alt="" />}{config.rightDecorationSrc && <img className="preview-social-decoration preview-social-decoration-right" src={config.rightDecorationSrc} alt="" />}<div aria-label={`${config.rating ?? 5} 分`} style={{ color: config.accentColor ?? "#ffb40d" }}>{"★".repeat(Math.max(0, Math.min(5, Math.round(Number(config.rating ?? 5)))))}</div><strong>{config.count ?? "50,000+"}</strong><span>{config.caption ?? node.content}</span></div>, "preview-social-proof-wrap");
  if (node.type === "Award") return wrap(config.leftDecorationSrc && config.rightDecorationSrc ? <div className="preview-award preview-award-decorated"><img src={config.leftDecorationSrc} alt="" /><span><small>{config.source ?? "编辑推荐"}</small><strong>{config.title ?? node.content}</strong>{config.subtitle && <small>{config.subtitle}</small>}</span><img src={config.rightDecorationSrc} alt="" /></div> : <div className="preview-award"><Star size={20} fill={config.accentColor ?? "#f3a718"} color={config.accentColor ?? "#f3a718"} /><strong>{config.title ?? node.content}</strong>{config.subtitle && <span>{config.subtitle}</span>}<small>{config.source ?? "编辑推荐"}</small></div>, "preview-award-wrap");
  if (node.type === "Tabs") return wrap(<PreviewTabs tabs={config.tabs ?? []} selected={tabStates[node.id] ?? config.defaultTab ?? 0} onChange={(index) => onTabChange?.(node.id, index)} config={config} />, "preview-tabs-wrap");
  if (node.type === "Stack") return wrap(<div className="preview-stack" style={{ flexDirection: config.axis === "horizontal" ? "row" : "column", gap: `${config.gap ?? 8}px`, backgroundColor: config.backgroundColor }}>{renderChildren()}</div>, "preview-stack-wrap");
  if (node.type === "Icon") {
    const Icon = { star: Star, heart: Heart, check: Check, shield: ShieldCheck, users: Users, gift: Gift }[config.iconName] ?? Star;
    return wrap(<Icon size={Number(config.iconSize) || 24} color={config.color ?? "#6a31e9"} aria-label={config.iconName ?? "star"} />, "preview-icon-wrap");
  }
  if (isListItemLayer) { const [title, caption] = (node.content ?? "").split("|"); return wrap(<div className="preview-list-item" style={textStyle}><i>●</i><span><strong style={textStyle}>{title}</strong>{caption && <small style={textStyle}>{caption}</small>}</span></div>, "preview-list-item-wrap"); }
  if (node.type === "Card") return children.length ? wrap(<div className="preview-card" style={cardStyle}>{renderChildren()}</div>, "preview-card-wrap") : !node.content ? wrap(<div className="preview-card-anchor" style={cardStyle} />, "preview-card-anchor-wrap") : wrap(<div className="preview-card" style={cardStyle}>{node.content.split("\n").map((row) => { const [title, copy] = row.split("|"); return <div key={row}><strong>{title}</strong>{copy && <small>{copy}</small>}</div>; })}</div>, "preview-card-wrap");
  if (["Product", "Japanese Ai - 1 Year"].includes(node.type)) { const [name, price] = (node.content || "").split("|"); return wrap(<div className="preview-product"><strong>{name || "Product"}</strong>{price && <small>{price}</small>}</div>, "preview-product-anchor-wrap"); }
  if (node.type === "App Icon") return wrap(<div className="preview-app-icon">✦</div>, "preview-app-icon-wrap");
  if (isImageLayer) {
    const config = node.config ?? {};
    const dimensions = mediaDimensions(config);
    const height = `${92 * dimensions.height / 100}px`;
    return wrap(<div className={`preview-image${config.mediaSrc ? " has-media" : ""}${config.mediaOverflow === "scroll" && config.mediaType !== "Video" ? " media-scroll" : ""}`} style={{ width: `${dimensions.width}%`, marginInline: "auto", height, background: config.mediaBackgroundColor, borderRadius: config.rounded ? `${config.radius ?? 8}px` : undefined, padding: ["Top", "Right", "Bottom", "Left"].map((edge) => `${Math.max(0, Number(config[`padding${edge}`]) || 0)}px`).join(" "), transform: config.offsetY ? `translateY(${config.offsetY}px)` : undefined }}>{config.mediaState !== "removed" && (config.mediaSrc ? config.mediaOverflow === "scroll" ? <ScrollImage src={config.mediaSrc} alt={node.label || ""} dimensions={dimensions} /> : <img src={config.mediaSrc} alt={node.label || ""} style={{ width: dimensions.imageWidth, height: dimensions.imageHeight, objectFit: config.mediaFit ?? "cover" }} /> : node.type === "Black Friday Image" ? "BLACK FRIDAY" : node.content)}</div>, "preview-image-wrap");
  }
  if (node.type === "Video") {
    const dimensions = mediaDimensions(config);
    return wrap(<div className="preview-video" style={{ width: `${dimensions.width}%`, height: `${92 * dimensions.height / 100}px`, backgroundColor: config.mediaBackgroundColor ?? "#222" }}>{config.mediaSrc && config.mediaState !== "removed" ? <video src={config.mediaSrc} autoPlay muted loop playsInline controls style={{ objectFit: config.mediaFit ?? "cover" }} /> : <span>视频</span>}</div>, "preview-video-wrap");
  }
  if (node.type === "Carousel") return Array.isArray(config.slides) ? wrap(<PreviewSlideCarousel slides={config.slides} initialSlide={config.initialSlide ?? 0} config={config} onDotSelect={(index) => onSelect(node.id, "dots", index)} />, "preview-carousel-wrap") : children.length ? wrap(<div className="preview-carousel">{renderChildren()}</div>, "preview-carousel-wrap") : !node.content ? wrap(<div className="preview-card-anchor" />, "preview-carousel-wrap") : wrap(<PreviewCarousel content={node.content} config={node.config} />, "preview-carousel-wrap");
  if (node.type === "Timer") return node.config?.enabled === false ? null : wrap(<PreviewTimer content={node.content} config={node.config} />);
  if (node.type === "Products") {
    if (node.variant === "purchase") {
      const [label = "Continue", , price = ""] = node.content.split("|");
      return wrap(<button className="preview-cta"><span>{label}</span>{price && <small>{price}</small>}</button>, "preview-button");
    }
    if (config.showCards === false && config.priceSummary) {
      const row = productPackageRows(node, config.productTemplate)[0];
      const current = row?.skuId ? productPriceFields(row).total : config.sourceCurrentPrice;
      const compare = row?.skuId ? productPriceFields(row).referenceTotal : config.sourceComparePrice;
      return wrap(<div className="preview-price-summary">{compare && <s>{compare}</s>}<strong>{current || "未关联 SKU"}</strong></div>, "preview-products-wrap");
    }
    if (config.showCards === false) return null;
    const switched = Boolean(toggleStates[config.linkedToggleId]);
    const tabIndex = tabStates[config.linkedTabsId] ?? config.tabDefaultIndex ?? 0;
    const groupOffset = config.linkedTabsId ? tabIndex * (Number(config.groupSize) || 0) : switched ? Number(config.groupSize) || 0 : 0;
    return wrap(<PreviewProducts nodeId={node.id} key={config.linkedTabsId ? `tab-${tabIndex}` : config.linkedToggleId ? String(switched) : node.id} content={node.content} config={node.config} childrenNodes={children} priceMode={pricePreviewMode} switched={switched} tabIndex={tabIndex} onInspect={(event, index) => onSelect(node.id, previewClickArea(event), index + groupOffset)} onChildSelect={(childId) => onSelect(childId, "row", 0)} onPurchase={(plan, index) => { onSelect(node.id, "price", index + groupOffset); onButtonAction?.({ type: "Purchase Button", config: { action: "Purchase" } }, plan); }} />, "preview-products-wrap");
  }
  if (node.type === "Toggle") return wrap(<PreviewToggle key={`${node.id}-${node.defaultState ?? "Off"}`} content={node.content} defaultState={node.defaultState} config={config} linkedEnabled={toggleStates[node.id]} onChange={(enabled) => onToggleChange?.(node.id, enabled)} />, "preview-toggle-wrap");
  if (["Toggle On", "Toggle Off"].includes(node.type)) return wrap(<div className="preview-toggle-anchor" />, "preview-toggle-anchor-wrap");
  if (node.type === "Footer Top Part") return wrap(<div className="preview-card-anchor" />, "preview-card-anchor-wrap");
  if (node.type === "Button and Links") { const [cta, links] = (node.content ?? "GET FULL ACCESS|Terms · Privacy · Restore").split("|"); return wrap(<><button className="preview-cta" style={buttonStyle}>{cta}</button><small className="preview-links" style={textStyle}>{links}</small></>, "preview-button"); }
  if (node.type === "Button" || node.type === "Web Paywall Button" || node.type === "Purchase Button") return wrap(<button className="preview-cta" style={buttonStyle} onClick={(event) => { event.stopPropagation(); select(event); onButtonAction?.(node); }}>{config.linkedToggleId && toggleStates[config.linkedToggleId] && config.onContent ? config.onContent : node.content ?? (node.type === "Web Paywall Button" ? "Pay on web" : node.type === "Button" ? "button text" : "Continue")}</button>, "preview-button");
  if (node.type === "Links") {
    const labels = visibleLinkLabels(node.content ?? "Terms · Privacy · Restore · Login");
    return wrap(<small className={`preview-links${config.spacedLinks ? " preview-links-spaced" : ""}`} style={textStyle}>{labels.map((label, index) => <React.Fragment key={`${index}-${label}`}>{index > 0 && !config.spacedLinks && " · "}<button type="button" data-inspector-area="links" data-inspector-row={index} onClick={(event) => { event.stopPropagation(); onSelect(node.id, "links", index); onButtonAction?.({ type: "Button", config: linkActionFor(label, config.linkActions?.[index]) }); }}>{label}</button></React.Fragment>)}</small>);
  }
  if (node.type === "Footer") return wrap(<small className="preview-footer" style={textStyle}>{node.content}</small>);
  return wrap(<p>{node.content || node.type}</p>);
}

function PreviewTimer({ content, config = {} }) {
  const startValue = timerSeconds(content ?? "04:59:59");
  const [remaining, setRemaining] = useState(startValue);
  useEffect(() => {
    setRemaining(startValue);
    if (!startValue) return undefined;
    const interval = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [startValue, config.resetMode]);
  const opacity = Math.max(0, Math.min(100, Number(config.digitBackgroundOpacity ?? 100)));
  const digitBackground = config.digitBackgroundColor ? `color-mix(in srgb, ${config.digitBackgroundColor} ${opacity}%, transparent)` : config.backgroundColor;
  return <div className="preview-timer" style={{ color: config.color, borderRadius: config.radius === undefined ? undefined : `${config.radius}px` }}>{config.prefix && <strong style={{ color: config.prefixColor, fontSize: config.prefixFontSize ? `${config.prefixFontSize}px` : undefined }}>{config.prefix} </strong>}<span style={{ color: config.digitColor, backgroundColor: digitBackground, fontSize: config.fontSize ? `${config.fontSize}px` : undefined }}>{formatTimer(remaining, config.format ?? "hh:mm:ss", config.separator ?? ":")}</span>{config.suffix && <small style={config.suffixFontSize ? { fontSize: `${config.suffixFontSize}px` } : undefined}> {config.suffix}</small>}</div>;
}

function PreviewSlideCarousel({ slides, initialSlide, config = {}, onDotSelect }) {
  const [active, setActive] = useState(initialSlide);
  useEffect(() => setActive(Math.min(slides.length - 1, Math.max(0, initialSlide))), [initialSlide, slides.length]);
  const slide = slides[Math.min(active, slides.length - 1)];
  if (!slide) return null;
  const styles = carouselSlideStyles(config);
  if (config.peekAdjacent && slides.length > 1) {
    const card = (item, position) => <div className={`preview-slide-card ${position}`} aria-hidden={position !== "current"} key={`${position}-${item.id}`}>
      {(!config.hideImageIfEmpty || item.image) && <div data-inspector-area={position === "current" ? "media" : undefined} className="preview-slide-media" style={{ ...styles.hero, height: `${160 * (Number(config.imageHeight) || 100) / 100}px`, backgroundColor: config.imageBackground ?? "#e5f1ff" }}>{item.image && <img src={item.image} alt="" style={{ objectFit: config.imageFit === "fill" ? "fill" : config.imageFit ?? "fill" }} />}</div>}
      {item.title && <strong data-inspector-area={position === "current" ? "headline" : undefined} style={styles.title}>{item.title}</strong>}
      {item.caption && <p data-inspector-area={position === "current" ? "caption" : undefined} style={styles.caption}>{item.caption}</p>}
    </div>;
    return <div className="preview-slide-carousel peek-adjacent" data-inspector-slide={active}>
      <div className="preview-slide-peek-track">
        {card(slides[(active - 1 + slides.length) % slides.length], "previous")}
        {card(slide, "current")}
        {card(slides[(active + 1) % slides.length], "next")}
      </div>
      <div data-inspector-area="dots" className="preview-slide-dots" style={styles.dots}>{slides.map((item, index) => <button type="button" key={item.id} aria-label={`查看第 ${index + 1} 页`} aria-current={index === active ? "true" : undefined} style={{ color: index === active ? config.accentColor : config.secondaryColor }} onClick={(event) => { event.stopPropagation(); setActive(index); onDotSelect?.(index); }}>{index === active ? "●" : "○"}</button>)}</div>
    </div>;
  }
  return <div className={`preview-slide-carousel ${config.dotsPlacement === "below" ? "dots-below" : ""} ${config.dotsVariant === "progress" ? "progress-dots" : ""}`} data-inspector-slide={active}>{(!config.hideImageIfEmpty || slide.image) && <div data-inspector-area="media" className="preview-slide-media" style={{ ...styles.hero, height: `${160 * (Number(config.imageHeight) || 100) / 100}px`, aspectRatio: "auto", boxSizing: "border-box", backgroundColor: config.imageBackground ?? "#e5f1ff", padding: ["Top", "Right", "Bottom", "Left"].map((edge) => `${Math.max(0, Number(config[`imagePadding${edge}`]) || 0)}px`).join(" ") }}>{slide.image && <img src={slide.image} alt="" style={{ objectFit: config.imageFit === "fill" ? "fill" : config.imageFit ?? "fill" }} />}</div>}{slide.title && <strong data-inspector-area="headline" style={styles.title}>{slide.title}</strong>}{slide.caption && <p data-inspector-area="caption" style={styles.caption}>{slide.caption}</p>}<div data-inspector-area="dots" className="preview-slide-dots" style={styles.dots}>{slides.map((item, index) => <button type="button" key={item.id} aria-label={`查看第 ${index + 1} 页`} aria-current={index === active ? "true" : undefined} style={{ color: index === active ? config.accentColor : config.secondaryColor }} onClick={(event) => { event.stopPropagation(); setActive(index); onDotSelect?.(index); }}>{index === active ? "●" : "○"}</button>)}</div></div>;
}

function PreviewCarousel({ content, config = {} }) {
  const sourceSlides = (content ?? "Customer story").split("\n---\n").filter(Boolean);
  const count = Math.max(1, Math.min(10, Number(config.itemCount ?? sourceSlides.length) || 1));
  const slides = Array.from({ length: count }, (_, index) => sourceSlides[index] ?? sourceSlides.at(-1) ?? "");
  const [current, setCurrent] = useState(Math.min(slides.length - 1, Math.max(0, Number(config.initialSlide) || 0)));
  useEffect(() => setCurrent(Math.min(slides.length - 1, Math.max(0, Number(config.initialSlide) || 0))), [config.initialSlide, slides.length]);
  const slide = slides[current] ?? slides[0];
  const [title, copy] = slide.split("|");
  return <div className="preview-carousel"><span>★★★★★</span><p>{copy ? <><strong>{title}</strong><small>{copy}</small></> : slide}</p><div><button aria-label="Previous review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index - 1 + slides.length) % slides.length); }}>‹</button><i style={{ gap: `${config.gap ?? 8}px` }}>{slides.map((_, index) => <b className={index === current ? "active" : ""} style={{ color: index === current ? config.accentColor : config.secondaryColor }} key={index}>•</b>)}</i><button aria-label="Next review" onClick={(event) => { event.stopPropagation(); setCurrent((index) => (index + 1) % slides.length); }}>›</button></div></div>;
}

function CreditProductCard({ row, index, config, priceMode, nodeId, onInspect, onPurchase }) {
  const ref = useProductCardPlacement(config);
  return <div ref={ref} className="preview-products-credit" data-product-card data-product-node-id={nodeId} data-product-index={index} onClick={(event) => onInspect?.(event, index)} style={{ ...(Number(config.planWidth) > 0 ? { width: `${config.planWidth}%`, marginInline: "auto" } : {}), ...(config.planHeight !== undefined && config.planHeight !== "" ? { minHeight: `${config.planHeight}px` } : {}), ...(config.planPadding !== "" && config.planPadding !== undefined ? { padding: `${config.planPadding}px` } : {}), ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].filter((side) => config[`planPadding${side}`] !== undefined && config[`planPadding${side}`] !== "").map((side) => [`padding${side}`, `${config[`planPadding${side}`]}px`])) }}><span className="preview-credit-copy"><strong data-inspector-area="product-name" style={productPartStyle(config, "name")}>{row.name}</strong>{row.supportingCopy && <small data-inspector-area="product-supporting" style={productPartStyle(config, "supporting")}>{row.supportingCopy}</small>}</span><button type="button" data-inspector-area="product-price" style={{ ...productPartStyle(config, "price"), ...(Number(config.priceModeStyles?.[priceMode]?.mainFontSize) > 0 ? { fontSize: `${config.priceModeStyles[priceMode].mainFontSize}px` } : {}), ...(validHexColor(config.priceModeStyles?.[priceMode]?.mainColor) ? { color: config.priceModeStyles[priceMode].mainColor } : {}) }} onClick={(event) => { event.stopPropagation(); onPurchase?.(row, index); }}>{resolveProductPrice(row, priceMode).main}</button></div>;
}

function PreviewProducts({ content, config = {}, childrenNodes = [], priceMode = "1", switched = false, tabIndex = 0, onInspect, onChildSelect, onPurchase, nodeId }) {
  const source = content || childrenNodes.map((child) => child.content).filter(Boolean).join("\n");
  const allRows = productPackageRows({ content: source, config }, config.productTemplate);
  const groupSize = Math.max(1, Number(config.groupSize) || allRows.length);
  const styleOffset = config.linkedTabsId ? tabIndex * groupSize : config.linkedToggleId && switched ? groupSize : 0;
  const rows = config.linkedTabsId ? allRows.slice(tabIndex * groupSize, (tabIndex + 1) * groupSize) : config.linkedToggleId ? allRows.slice(switched ? groupSize : 0, switched ? groupSize * 2 : groupSize) : allRows;
  const layout = productLayout(config);
  const requestedChoice = config.linkedProducts && config.defaultSelected === -1 ? -1 : Math.min(Math.max(0, Number(config.defaultSelected) || 0), Math.max(0, rows.length - 1));
  const defaultChoice = config.linkedToggleId && (requestedChoice < 0 || rows[requestedChoice]?.emptySlot) ? rows.findIndex((row) => !row.emptySlot) : requestedChoice;
  const [chosen, setChosen] = useState(defaultChoice);
  useEffect(() => setChosen(defaultChoice), [defaultChoice]);
  const embeddedList = childrenNodes.find((child) => child.type === "List");
  const embeddedBenefits = embeddedList?.config?.listRows?.map((row) => row.title).filter(Boolean) ?? embeddedList?.content?.split("\n").map((line) => line.split("|")[0]).filter(Boolean);
  if (config.purchasePerCard) return <div className="preview-products-credit-list">{rows.map((row, index) => <CreditProductCard key={`${row.skuId || row.name}-${index}`} row={row} index={index} config={{ ...config, productPartStyles: { ...config.productPartStyles, ...config.packagePartStyles?.[index + styleOffset] } }} priceMode={priceMode} nodeId={nodeId} onInspect={onInspect} onPurchase={onPurchase} />)}</div>;
  return <div className={`preview-products product-layout-${layout} product-count-${Math.min(rows.length, 3)}`}>{rows.map((row, index) => <ProductPackageCard nodeId={nodeId} key={`${row.skuId || row.name}-${index}`} plan={row} index={index} styleIndex={index + styleOffset} config={config} layout={layout} selected={index === chosen} priceMode={priceMode} onChoose={setChosen} onInspect={onInspect} embeddedBenefits={embeddedBenefits} onBenefitInspect={embeddedList ? () => onChildSelect?.(embeddedList.id) : undefined} />)}</div>;
}

function PreviewToggle({ content, defaultState = "Off", config = {}, linkedEnabled, onChange }) {
  const [localEnabled, setLocalEnabled] = useState(defaultState === "On");
  const enabled = linkedEnabled ?? localEnabled;
  const [title = "Not sure? Get free trial", secondary = "Cancel anytime"] = (enabled && config.onContent ? config.onContent : content || "").split("|");
  return <button className={`preview-toggle ${enabled ? "enabled" : ""}`} role="switch" aria-checked={enabled} onClick={(event) => { event.stopPropagation(); const next = !enabled; setLocalEnabled(next); onChange?.(next); }}><span><strong>{title}</strong><small>{secondary}</small></span><i style={{ backgroundColor: enabled ? config.onColor : config.offColor }}><b /></i></button>;
}

function PreviewTabs({ tabs, selected, onChange, config }) {
  const active = tabs[selected];
  return <div className="preview-tabs"><div role="tablist">{tabs.map((tab, index) => <button type="button" role="tab" aria-selected={index === selected} key={tab.id} style={index === selected ? { color: config.accentColor ?? "#6a31e9", borderColor: config.accentColor ?? "#6a31e9" } : undefined} onClick={(event) => { event.stopPropagation(); onChange?.(index); }}>{tab.title}</button>)}</div><div role="tabpanel">{active?.description}</div></div>;
}
