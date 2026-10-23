import React from "react";
import { productPriceFields, resolveProductPrice } from "../productPricing.js";
import { productArrangement } from "../productArrangement.js";
import { contentRegions, contentSlot } from "../productContentOrder.js";
import { Check } from "lucide-react";
import { productGradient, HT_PRODUCT_DESIGN_DEFAULTS, productFontSize, validHexColor, productPartStyle, packagePartStyle } from "./productStyleModel.js";
import { useProductCardPlacement } from "./useProductCardPlacement.js";

export function ProductPackageCard({ plan, index, styleIndex = index, config = {}, layout, selected, focused = false, interactive = true, priceMode = "1", onChoose, onInspect, embeddedBenefits, onBenefitInspect, nodeId = "products" }) {
  const arrangement = productArrangement(config, layout);
  if (layout === "vertical" && arrangement.cardContentLayout !== "source") config = { ...config, cardContentLayout: arrangement.cardContentLayout, showRadio: arrangement.cardContentLayout === "radio-stacked" };
  const cardRef = useProductCardPlacement(config);
  let contentOrder = config.productContentOrders?.[layout];
  const baseClass = `ht-node ${focused ? "selected" : ""} ${contentOrder ? "product-content-sorted" : ""} ${config.planHeight !== undefined && config.planHeight !== "" ? "ht-sized-plan" : ""}`;
  if (plan.emptySlot) return <div className={`${layout === "vertical" ? "ht-vertical-plan" : "ht-plan"} ht-plan-empty ${layout === "horizontal" ? "ht-blue-plan" : ""}`} aria-label={`套餐 ${index + 1} 空坑位`} />;
  const name = plan.name;
  const priceView = resolveProductPrice(plan, priceMode);
  const fields = productPriceFields(plan);
  const modeStyle = config.priceModeStyles?.[priceMode] ?? {};
  const supportingCopy = plan.showSupportingCopy && plan.supportingCopy !== fields.monthly ? plan.supportingCopy : "";
  const saveText = plan.showSaveCopy ? plan.saveCopy : "";
  const primaryDetail = supportingCopy || saveText;
  const extraSave = saveText && primaryDetail !== saveText ? saveText : "";
  const saving = plan.showSavingCopy ? plan.savingCopy : "";
  const hasBadge = Boolean(plan.showBadge && plan.badgeText);
  if (contentOrder) {
    const present = { name, price: priceView.main, reference: priceView.strike, monthly: layout === "vertical" && fields.monthly !== priceView.main && fields.monthly !== priceView.strike ? fields.monthly : "", supporting: supportingCopy, save: saveText, saving, badge: hasBadge, marker: layout === "info-row" };
    const inventory = Object.fromEntries(Object.entries(present).filter(([, value]) => value).map(([part], sequence) => [part, { sequence, region: ["horizontal", "standard"].includes(layout) ? "body" : part === "badge" && layout !== "info-row" ? "heading" : part === "marker" ? "marker" : ["name", "supporting", "secondaryName"].includes(part) ? "left" : "right" }]));
    Object.entries(contentOrder).forEach(([region, items]) => items.forEach((part) => { inventory[part] ??= { region }; }));
    contentOrder = contentRegions(layout, inventory, contentOrder);
  }
  const selectedStyle = selected ? { borderColor: "transparent", background: `${productGradient([config.selectedBackground ?? "#ffffff", config.selectedBackground ?? "#ffffff", config.selectedBackground ?? "#ffffff"], ["#ffffff", "#ffffff", "#ffffff"])} padding-box, ${productGradient(config.selectedBorderGradient, ["#ff860a", "#ff860a", "#ff860a"])} border-box` } : {};
  const productStyle = { "--badge-background": productGradient(config.badgeGradient, ["#ff860a", "#ffb000", "#ffd10b"]), "--save-text-color": config.saveTextColor ?? "#ff8207", "--save-background-color": config.saveBackgroundColor ?? "transparent" };
  const usesDesignDefaults = Boolean(HT_PRODUCT_DESIGN_DEFAULTS[config.productTemplate]);
  const legacyFontStyle = (value) => !usesDesignDefaults && Number(value) > 0 ? { fontSize: `${value}px` } : {};
  const configuredPriceSize = Number(modeStyle.mainFontSize) > 0 ? modeStyle.mainFontSize : usesDesignDefaults ? undefined : config.priceFontSize;
  const compactPrice = priceView.main.length >= 6 && layout !== "compact";
  const priceStyle = { ...(compactPrice ? { fontSize: `min(${Number(configuredPriceSize) > 0 ? productFontSize(config, configuredPriceSize) : "6cqw"}, 4cqw)` } : Number(configuredPriceSize) > 0 ? { fontSize: productFontSize(config, configuredPriceSize) } : {}), ...(modeStyle.mainColor ? { color: modeStyle.mainColor } : {}) };
  const strikeStyle = { ...(Number(modeStyle.strikeFontSize) > 0 ? { fontSize: productFontSize(config, modeStyle.strikeFontSize) } : {}), ...(modeStyle.strikeColor ? { color: modeStyle.strikeColor } : {}) };
  const frameStyle = { ...(Number(config.planWidth) > 0 ? { width: `${config.planWidth}%`, marginInline: "auto", justifySelf: "center" } : {}), ...(config.planHeight !== undefined && config.planHeight !== "" && Number.isFinite(Number(config.planHeight)) ? { minHeight: productFontSize(config, config.planHeight) } : {}), ...(config.planPadding !== "" && Number.isFinite(Number(config.planPadding)) && config.planPadding !== undefined ? { padding: productFontSize(config, config.planPadding) } : {}), ...Object.fromEntries(["Top", "Right", "Bottom", "Left"].filter((side) => config[`planPadding${side}`] !== undefined && config[`planPadding${side}`] !== "" && Number.isFinite(Number(config[`planPadding${side}`]))).map((side) => [`padding${side}`, productFontSize(config, config[`planPadding${side}`])])) };
  const planStyle = { ...productStyle, "--product-frame-top": frameStyle.paddingTop ?? frameStyle.padding ?? "0px", ...selectedStyle, ...frameStyle, ...(config.planRadius !== undefined && config.planRadius !== "" ? { borderRadius: `${config.planRadius}px` } : {}) };
  const partStyle = (part, base = {}) => {
    return { ...base, ...(["saving", "save"].includes(part) && validHexColor(config.saveTextColor) ? { color: config.saveTextColor } : {}), ...productPartStyle(config, part), ...(contentOrder ? contentSlot(contentOrder, part, layout) : {}), ...(part === "price" && Number(modeStyle.mainFontSize) > 0 ? { fontSize: productFontSize(config, modeStyle.mainFontSize) } : {}), ...(part === "price" && validHexColor(modeStyle.mainColor) ? { color: modeStyle.mainColor } : {}), ...(part === "reference" && Number(modeStyle.strikeFontSize) > 0 ? { fontSize: productFontSize(config, modeStyle.strikeFontSize) } : {}), ...(part === "reference" && validHexColor(modeStyle.strikeColor) ? { color: modeStyle.strikeColor } : {}), ...packagePartStyle(config, styleIndex, part) };
  };
  const choose = (event) => { if (!interactive) return; event.stopPropagation(); onChoose?.(index); onInspect?.(event, index); };
  const keyboard = (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(event); } };
  const cardProps = { ref: cardRef, "data-product-card": true, "data-product-node-id": nodeId, "data-product-index": styleIndex, "data-product-layout": layout, ...Object.fromEntries(Object.entries(arrangement).map(([key, value]) => [`data-arrange-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value])), style: planStyle, role: interactive ? "button" : undefined, tabIndex: interactive ? 0 : undefined, onClick: choose, onKeyDown: keyboard };
  if (layout === "info-row") {
    const [primaryName, secondaryName = ""] = name.split(" · ");
    const [primaryCopy, secondaryCopy = ""] = supportingCopy.split(" · ");
    return <div className={`${baseClass} ht-info-row ${selected ? "chosen" : ""}`} {...cardProps} style={planStyle}>
      <span className="ht-info-row-marker" data-inspector-area="product-marker" style={partStyle("marker")} aria-hidden="true">◆</span>
      <span className="ht-info-row-main"><strong data-inspector-area="product-name" style={partStyle("name")}>{primaryName}</strong>{secondaryName && <small data-inspector-area="product-secondaryName" style={partStyle("secondaryName")}>{secondaryName}</small>}{primaryCopy && <small data-inspector-area="product-supporting" style={partStyle("supporting")}>{primaryCopy}</small>}</span>
      <span className="ht-info-row-price">{hasBadge && <small data-inspector-area="product-badge" style={partStyle("badge")}>{plan.badgeText}</small>}{priceView.strike && <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del>}<strong data-inspector-area="product-price" style={partStyle("price", priceStyle)}>{priceView.main}</strong>{saving && <small data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}{saveText && <small data-inspector-area="product-save" style={partStyle("save")}>{saveText}</small>}{secondaryCopy && <small data-inspector-area="product-billing" style={partStyle("billing")}>{secondaryCopy}</small>}</span>
    </div>;
  }
  if (layout === "compact") return <div className={`${baseClass} ht-plan ht-compact-plan ${hasBadge ? "has-product-badge" : ""} ${selected ? "chosen" : ""}`} {...cardProps}>
    {hasBadge && <b className="ht-compact-badge" data-inspector-area="product-badge" style={partStyle("badge")}>{plan.badgeText}</b>}
    <strong className="ht-compact-name" data-inspector-area="product-name" style={partStyle("name")}>{name}</strong>
    <div className="ht-compact-price"><span data-inspector-area="product-price" style={partStyle("price", priceStyle)}>{priceView.main}</span>{priceView.strike && <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del>}{saving && <small data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}{supportingCopy && <small data-inspector-area="product-supporting" style={partStyle("supporting")}>{supportingCopy}</small>}{saveText && <small data-inspector-area="product-save" style={partStyle("save")}>{saveText}</small>}</div>
  </div>;
  if (usesDesignDefaults && ["horizontal", "standard"].includes(layout)) return <div className={`${baseClass} ht-plan ht-source-plan ${selected ? "chosen" : ""}`} {...cardProps}>
    {hasBadge && <b className="ht-source-badge" data-inspector-area="product-badge" style={partStyle("badge")}>{plan.badgeText}</b>}
    <strong className="ht-source-name" data-inspector-area="product-name" style={partStyle("name")}>{name}</strong>
    <em className="ht-source-price" data-inspector-area="product-price" style={partStyle("price", priceStyle)}>{priceView.main}</em>
    <div className="ht-source-detail">{saving && <small data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}{saveText && <small data-inspector-area="product-save" style={partStyle("save")}>{saveText}</small>}</div>
    <div className="ht-source-foot">{priceView.strike ? <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del> : supportingCopy ? <small data-inspector-area="product-supporting" style={partStyle("supporting")}>{supportingCopy}</small> : null}</div>
  </div>;
  if (layout === "vertical") {
    const monthly = fields.monthly && fields.monthly !== priceView.main && fields.monthly !== priceView.strike ? fields.monthly : "";
    if (config.cardContentLayout === "split-summary") return <div className={`${baseClass} ht-vertical-plan split-summary ${config.showRadio ? "with-radio" : ""} ${selected ? "chosen" : ""}`} {...cardProps}>
      {hasBadge && <b data-inspector-area="product-badge" className="ht-vertical-badge" style={partStyle("badge")}>{plan.badgeText}</b>}
      <div className="ht-split-summary-copy"><div className="ht-split-summary-name"><strong data-inspector-area="product-name" style={partStyle("name")}>{name}</strong>{saving && <small data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}</div>{(supportingCopy || (config.duplicatePriceAsDetail && priceView.main)) && <span data-inspector-area="product-supporting" style={partStyle("supporting")}>{supportingCopy || priceView.main}</span>}</div>
      <strong data-inspector-area="product-price" className="ht-split-summary-price" style={partStyle("price", priceStyle)}>{priceView.main}</strong>
    </div>;
    return <div className={`${baseClass} ht-vertical-plan ${config.cardContentLayout === "radio-stacked" ? "radio-stacked" : ""} ${config.showRadio ? "with-radio" : ""} ${selected ? "chosen" : ""}`} {...cardProps}>
      {hasBadge && <b data-inspector-area="product-badge" className="ht-vertical-badge" style={partStyle("badge", legacyFontStyle(config.badgeFontSize))}>{plan.badgeText}</b>}
      <div className="ht-vertical-main"><strong data-inspector-area="product-name" style={partStyle("name", legacyFontStyle(config.nameFontSize))}>{name}</strong>{config.showMainPrice !== false && <div className="ht-vertical-price-line"><span className="ht-vertical-total" data-inspector-area="product-price" style={partStyle("price", priceStyle)}>{priceView.main}</span>{priceView.strike && <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del>}{saving && !fields.referenceTotal && <small className="ht-vertical-saving" data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}</div>}{(supportingCopy || saveText) && <div className="ht-vertical-detail">{supportingCopy && <small data-inspector-area="product-supporting" style={partStyle("supporting")}>{supportingCopy}</small>}{saveText && <small className="ht-plan-save-copy" data-inspector-area="product-save" style={partStyle("save")}>{saveText}</small>}</div>}</div>
      <div className="ht-vertical-side">{monthly && <span data-inspector-area="product-monthly" style={partStyle("monthly")}>{monthly}</span>}{fields.months === 0 && fields.referenceTotal && !priceView.strike && <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{fields.referenceTotal}</del>}</div>
      {selected && embeddedBenefits?.length > 0 && <ul className="ht-plan-embedded-benefits" onClick={(event) => { event.stopPropagation(); onBenefitInspect?.(event); }}>{embeddedBenefits.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}><Check size={11} /><span>{line}</span></li>)}</ul>}
    </div>;
  }
  const priceNode = <em data-inspector-area="product-price" className="ht-plan-main-price" style={partStyle("price", priceStyle)}>{priceView.main}</em>;
  if (layout === "horizontal" && config.cardContentLayout === "duration-grid") {
    const [amount, unit = ""] = name.toUpperCase() === "LIFETIME" ? ["∞", "LIFETIME"] : name.split(/\s+/, 2);
    return <div className={`${baseClass} ht-plan ht-duration-plan ${selected ? "chosen" : ""}`} {...cardProps}>
      <strong className="ht-duration-amount" data-inspector-area="product-name" style={partStyle("name")}>{amount}</strong><span className="ht-duration-unit" data-inspector-area="product-durationUnit" style={partStyle("durationUnit")}>{unit}</span>
      <em data-inspector-area="product-price" className="ht-duration-price" style={partStyle("price", priceStyle)}>{priceView.main}</em>
    </div>;
  }
  if (layout === "horizontal") return <div className={`${baseClass} ht-plan ht-blue-plan ${selected ? "chosen" : ""} ${priceView.missing ? "price-missing" : ""}`} {...cardProps}>
    <span>{hasBadge && <b data-inspector-area="product-badge" style={partStyle("badge", legacyFontStyle(config.badgeFontSize))}>{plan.badgeText}</b>}<strong data-inspector-area="product-name" style={partStyle("name", legacyFontStyle(config.nameFontSize))}>{name}</strong></span>
    <div className="ht-blue-price">{priceView.strike && <del data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del>}{priceNode}</div>
    <div className="ht-blue-detail">{saving && <small className="ht-plan-saving" data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}{primaryDetail && <i className={primaryDetail === saveText ? "ht-plan-save-copy" : ""} data-inspector-area={primaryDetail === saveText ? "product-save" : "product-supporting"} style={partStyle(primaryDetail === saveText ? "save" : "supporting", legacyFontStyle(config.detailFontSize))}>{primaryDetail}</i>}{extraSave && <small className="ht-plan-custom-save" data-inspector-area="product-save" style={partStyle("save")}>{extraSave}</small>}</div>
  </div>;
  return <div className={`${baseClass} ht-plan ht-structured-plan ${selected ? "chosen" : ""} ${priceView.prominent ? "price-prominent" : ""} ${priceView.missing ? "price-missing" : ""}`} {...cardProps}>
    {hasBadge && <b data-inspector-area="product-badge" className="ht-structured-badge" style={partStyle("badge", legacyFontStyle(config.badgeFontSize))}>{plan.badgeText}</b>}
    <strong className="ht-structured-name" data-inspector-area="product-name" style={partStyle("name", legacyFontStyle(config.nameFontSize))}>{name}</strong>
    <div className="ht-structured-price">{priceView.strike && <del className="ht-plan-extra-reference" data-inspector-area="product-reference" style={partStyle("reference", strikeStyle)}>{priceView.strike}</del>}{priceNode}</div>
    {(saving || primaryDetail || extraSave) && <div className="ht-structured-detail">{saving && <small className="ht-plan-saving" data-inspector-area="product-saving" style={partStyle("saving")}>{saving}</small>}{primaryDetail && <i className={primaryDetail === saveText ? "ht-plan-save-copy" : ""} data-inspector-area={primaryDetail === saveText ? "product-save" : "product-supporting"} style={partStyle(primaryDetail === saveText ? "save" : "supporting", legacyFontStyle(config.detailFontSize))}>{primaryDetail}</i>}{extraSave && <small className="ht-plan-custom-save" data-inspector-area="product-save" style={partStyle("save")}>{extraSave}</small>}</div>}
  </div>;
}
