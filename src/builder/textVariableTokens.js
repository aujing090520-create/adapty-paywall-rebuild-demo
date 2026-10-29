export const TIMER_VARIABLE_DEFINITIONS = [['days','天'],['hours','小时'],['minutes','分钟'],['seconds','秒']].flatMap(([unit,label]) => [
  { key:`count_${unit}_with_zero`, label:`${label}（补零）`, field:unit },
  { key:`count_${unit}_without_zero`, label:`${label}（不补零）`, field:`${unit}WithoutZero` },
]);

export const variableToken = key => `{{ ${key} }}`;

export function timerTextProps(props) {
  const variable = TIMER_VARIABLE_DEFINITIONS.find(item => item.field === props.timerField);
  if (!variable) return props;
  const { timerField, binding, runs, ...rest } = props;
  return { ...rest, text:variableToken(variable.key) };
}

export function upgradeTimerTextVariables(document) {
  const visit = node => {
    const props = node.type === 'Text' ? timerTextProps(node.props) : node.props;
    const children = node.children.map(visit);
    return props !== node.props || children.some((child,index) => child !== node.children[index]) ? { ...node, props, children } : node;
  };
  const root = visit(document.root);
  return root === document.root ? document : { ...document, root };
}

export function variableTextNodes(text, marks) {
  const nodes = [], pattern = /\{\{\s*([^{}]*?)\s*\}\}/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) nodes.push({ type:'text', text:text.slice(offset,match.index), marks });
    nodes.push({ type:'variable', attrs:{ key:match[1].trim() }, marks });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) nodes.push({ type:'text', text:text.slice(offset), marks });
  return nodes;
}
