const PREFIX = "paywall-template-v1:";
const SOURCE_IMAGE_REPAIR_PREFIX = "paywall-template-source-image-repair-v1:";
const COMPONENT_LIBRARY_KEY = "paywall-component-library-v1";
const resetting = new WeakSet();
export const localSettingsResetting = (storage) => resetting.has(storage);
export const beginLocalDemoReset = (storage) => resetting.add(storage);
export const cancelLocalDemoReset = (storage) => resetting.delete(storage);

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
    if (storage.getItem(SOURCE_IMAGE_REPAIR_PREFIX + templateId) === "done") return saved.nodes;
    const nodes = saved.nodes.map((node) => templateId === "ht-blue-privilege" && node.id === "hero-image" && node.config?.mediaState === "removed"
      ? { ...node, config: { ...node.config, mediaState: "source" } }
      : node);
    if (nodes.some((node, index) => node !== saved.nodes[index])) {
      storage.setItem(PREFIX + templateId, JSON.stringify({ ...saved, nodes }));
    }
    storage.setItem(SOURCE_IMAGE_REPAIR_PREFIX + templateId, "done");
    return nodes;
  } catch {
    return null;
  }
}

export function writeTemplateNodes(storage, templateId, nodes) {
  if (localSettingsResetting(storage)) return false;
  if (!protectedTemplateIds.has(templateId) || !Array.isArray(nodes)) return false;
  try {
    storage.setItem(PREFIX + templateId, JSON.stringify({ version: 1, nodes }));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalDemoSettings(storage) {
  beginLocalDemoReset(storage);
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.startsWith(PREFIX) || key?.startsWith(SOURCE_IMAGE_REPAIR_PREFIX) || key?.startsWith('paywall-component-document-v3:') || key?.startsWith('paywall-saved-v1:') || key === 'paywall-component-library-v3' || key === COMPONENT_LIBRARY_KEY) storage.removeItem(key);
    }
    return true;
  } catch {
    cancelLocalDemoReset(storage);
    return false;
  }
}
