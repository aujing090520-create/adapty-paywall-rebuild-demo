export const COMPONENT_LIBRARY_KEY = "paywall-component-library-v1";

const PRODUCT_BINDING_KEYS = new Set(["packageRows", "linkedProducts", "defaultSelected", "productTemplate", "bluePrivilege", "productColors"]);
const TEXT_TYPES = new Set(["Text", "Header", "Title", "Subtitle"]);

export function componentKind(type) {
  return TEXT_TYPES.has(type) ? "Text" : type;
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function portableNode(node) {
  const result = { type: node.type, label: node.label, content: node.content, config: copy(node.config ?? {}) };
  if (node.type === "Products") {
    for (const key of PRODUCT_BINDING_KEYS) delete result.config[key];
    result.content = "";
  }
  return result;
}

export function captureComponent(nodes, rootId, name) {
  const index = nodes.findIndex((node) => node.id === rootId);
  if (index < 0) return null;
  const root = nodes[index];
  const descendants = [];
  const ancestors = [{ index, depth: root.depth ?? 0 }];
  for (let i = index + 1; i < nodes.length && (nodes[i].depth ?? 0) > (root.depth ?? 0); i += 1) {
    while (ancestors.at(-1).depth >= (nodes[i].depth ?? 0)) ancestors.pop();
    const explicitParent = nodes.findIndex((item) => item.id === nodes[i].parentId);
    const parentOffset = explicitParent >= index ? explicitParent - index : ancestors.at(-1).index - index;
    descendants.push({ ...portableNode(nodes[i]), relativeDepth: (nodes[i].depth ?? 0) - (root.depth ?? 0), parentOffset });
    ancestors.push({ index: i, depth: nodes[i].depth ?? 0 });
  }
  return { id: crypto.randomUUID(), name: name.trim(), kind: componentKind(root.type), createdAt: Date.now(), root: portableNode(root), descendants };
}

export function applyComponent(nodes, rootId, record) {
  const index = nodes.findIndex((node) => node.id === rootId);
  if (index < 0 || componentKind(nodes[index].type) !== record.kind) return nodes;
  const target = nodes[index];
  let end = index + 1;
  while (end < nodes.length && (nodes[end].depth ?? 0) > (target.depth ?? 0)) end += 1;
  const savedConfig = copy(record.root.config ?? {});
  const config = target.type === "Products" ? { ...target.config, ...savedConfig } : savedConfig;
  const replacement = { ...target, label: record.root.label ?? "", content: target.type === "Products" ? target.content : record.root.content ?? "", config };
  const descendants = [];
  for (const [offset, saved] of (record.descendants ?? []).entries()) {
    const id = `library-${crypto.randomUUID()}`;
    const parentId = saved.parentOffset === 0 ? target.id : descendants[saved.parentOffset - 1]?.id ?? target.id;
    descendants.push({ ...copy(saved), id, depth: (target.depth ?? 0) + saved.relativeDepth, parentId });
    delete descendants[offset].relativeDepth;
    delete descendants[offset].parentOffset;
  }
  return [...nodes.slice(0, index), replacement, ...descendants, ...nodes.slice(end)];
}

export function readComponentLibrary(storage) {
  try {
    const value = JSON.parse(storage.getItem(COMPONENT_LIBRARY_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item.name === "string" && typeof item.kind === "string" && item.root?.type) : [];
  } catch {
    return [];
  }
}

export function writeComponentLibrary(storage, records) {
  try {
    storage.setItem(COMPONENT_LIBRARY_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}
