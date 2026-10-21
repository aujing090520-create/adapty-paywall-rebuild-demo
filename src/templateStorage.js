const PREFIX = "paywall-template-v1:";

export const protectedTemplateIds = new Set([
  "ht-blue-privilege",
  "ht-membership-plans",
  "ht-payment-recovery",
  "ht-sku-sheet",
]);

export function readTemplateNodes(storage, templateId) {
  if (!protectedTemplateIds.has(templateId)) return null;
  try {
    const saved = JSON.parse(storage.getItem(PREFIX + templateId));
    if (saved?.version !== 1 || !Array.isArray(saved.nodes)) return null;
    if (!saved.nodes.every((node) => node && typeof node.id === "string" && typeof node.type === "string")) return null;
    if (new Set(saved.nodes.map((node) => node.id)).size !== saved.nodes.length) return null;
    return saved.nodes;
  } catch {
    return null;
  }
}

export function writeTemplateNodes(storage, templateId, nodes) {
  if (!protectedTemplateIds.has(templateId) || !Array.isArray(nodes)) return false;
  try {
    storage.setItem(PREFIX + templateId, JSON.stringify({ version: 1, nodes }));
    return true;
  } catch {
    return false;
  }
}
