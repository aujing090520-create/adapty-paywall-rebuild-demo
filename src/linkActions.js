export function visibleLinkLabels(content) {
  return (content ?? "").split(/\s*[·•]\s*/u).map((label) => label.trim()).filter(Boolean);
}

export function linkActionFor(label, configured) {
  if (configured) return configured;
  return /^(?:Restore(?: Purchases)?|恢复购买)$/i.test(label) ? { action: "RestorePurchases" } : { action: "OpenURL", actionUrl: "" };
}
