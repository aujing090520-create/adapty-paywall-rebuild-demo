import { useLayoutEffect, useRef } from "react";
import { productTranslation } from "../productPlacement.js";
import { HT_PRODUCT_DESIGN_DEFAULTS } from "./productStyleModel.js";

export function useProductCardPlacement(config) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const place = () => {
      if (!card.classList.contains("product-content-sorted")) card.style.gridTemplateRows = "";
      const cardRect = card.getBoundingClientRect();
      const cssScale = cardRect.width / card.offsetWidth || 1;
      const canvas = card.closest(".ht-paywall");
      const unitScale = HT_PRODUCT_DESIGN_DEFAULTS[config.productTemplate] && canvas ? canvas.getBoundingClientRect().width / 390 : cssScale;
      card.dataset.productUnitScale = String(unitScale);
      card.querySelectorAll('[data-inspector-area^="product-"]').forEach((element) => {
        element.style.translate = "none";
        const part = element.dataset.inspectorArea.replace("product-", "");
        const managed = config.productContentOrders?.[card.dataset.productLayout] || config.productArrangements?.[card.dataset.productLayout];
        const settings = managed ? {} : config.productPartStyles?.[part] ?? {};
        const translation = productTranslation({ alignment: settings.align, offsetX: settings.offsetX, offsetY: settings.offsetY, card: cardRect, element: element.getBoundingClientRect(), unitScale, cssScale });
        element.style.translate = `${translation.x}px ${translation.y}px`;
      });
      if (card.classList.contains("product-content-sorted")) {
        const peers = [...card.parentElement.querySelectorAll("[data-product-card].product-content-sorted")].filter((item) => item.dataset.productNodeId === card.dataset.productNodeId);
        const heights = [];
        peers.forEach((peer) => peer.querySelectorAll('[data-inspector-area^="product-"]').forEach((element) => {
          const row = Number(element.style.gridRow);
          if (row > 0) heights[row - 1] = Math.max(heights[row - 1] ?? 0, element.getBoundingClientRect().height / cssScale);
        }));
        const tracks = Array.from({ length: heights.length }, (_, index) => `${heights[index] ?? 0}px`).join(" ");
        peers.forEach((peer) => { if (peer.style.gridTemplateRows !== tracks) peer.style.gridTemplateRows = tracks; });
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(card);
    return () => observer.disconnect();
  });
  return ref;
}
