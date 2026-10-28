export const COMPARISON_ORDER_RULES = [
  { key: 'social-first', name: '社交特权优先（Demo 示例）', order: ['visitors', 'nearby', 'exposure', 'partners', 'translation'] },
  { key: 'learning-first', name: '学习特权优先（Demo 示例）', order: ['translation', 'partners', 'visitors', 'nearby', 'exposure'] },
];

const itemKeys = ['translation', 'visitors', 'nearby', 'exposure', 'partners'];
export function comparisonItemKey(rowId) {
  if (rowId === 'benefits/header') return 'header';
  const index = /^benefits\/row-(\d+)$/.exec(rowId)?.[1];
  return index === undefined ? undefined : itemKeys[Number(index)] ?? `feature-${index}`;
}

// One permutation is applied to every column; source nodes and row actions stay intact.
export function orderedComparisonCells(column, table, businessOrdering) {
  if (table?.props.comparisonTableVersion !== 2 || table.props.comparisonOrderMode !== 'rule') return column.children;
  const key = table.props.comparisonOrderRule;
  const order = businessOrdering === undefined
    ? COMPARISON_ORDER_RULES.find(rule => rule.key === key)?.order
    : businessOrdering?.values?.[key]?.order;
  if (!Array.isArray(order)) return column.children;
  const rowKey = cell => cell.props.comparisonItemKey ?? comparisonItemKey(cell.props.comparisonRowId);
  const available = new Set(table.children[0]?.children.map(rowKey).filter(key => key && key !== 'header'));
  const requested = [...new Set(order.filter(key => typeof key === 'string' && available.has(key)))];
  if (!requested.length) return column.children;
  const defaults = table.children[0].children.map(rowKey).filter(key => key && key !== 'header');
  const rank = new Map([...requested, ...defaults.filter(key => !requested.includes(key))].map((key, index) => [key, index]));
  // A custom/unlinked cell makes the table unsafe to reorder as a synchronized collection.
  if (table.children.some(col => col.children.length !== defaults.length + 1 || new Set(col.children.map(rowKey)).size !== col.children.length || col.children.some(cell => rowKey(cell) !== 'header' && !available.has(rowKey(cell))))) return column.children;
  return [...column.children].sort((a, b) => (rowKey(a) === 'header' ? -1 : rank.get(rowKey(a))) - (rowKey(b) === 'header' ? -1 : rank.get(rowKey(b))));
}
