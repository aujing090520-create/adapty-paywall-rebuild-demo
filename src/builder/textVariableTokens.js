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

// Legacy digit nodes become styled inline runs, not separate selectable components.
export function consolidateCountdownText(document) {
  const visit = (node, parent) => {
    let children = node.children.map(child => visit(child, node));
    let props = node.props;
    if (parent?.type === 'Countdown' && node.type === 'CountdownState' && props.state === 'active' && children.length > 1 && props.axis === 'horizontal' && children.every(child => child.type === 'Text' && !child.props.hidden && child.props.visible !== false && !child.props.binding && !child.props.action && !child.props.textRules) && children.some(child => /\{\{\s*count_/.test(child.props.text ?? ''))) {
      const first = children[0], runs = [], gap = props.gap ?? 0;
      for (const [index, child] of children.entries()) {
        const p = child.props;
        if (index && gap) runs.push({ text:' ', inlineBox:{width:gap} });
        const inlineBox = {background:p.background,borderRadius:p.radius,paddingTop:p.paddingTop??p.paddingVertical,paddingBottom:p.paddingBottom??p.paddingVertical,paddingLeft:p.paddingLeft??p.paddingHorizontal,paddingRight:p.paddingRight??p.paddingHorizontal};
        const box = Object.fromEntries(Object.entries(inlineBox).filter(([,value]) => value !== undefined));
        const style = {color:p.color,colorOpacity:p.colorOpacity,fontWeight:p.fontWeight,italic:p.italic,underline:p.underline,strikethrough:p.strike,...(p.fontSize!==first.props.fontSize?{fontSize:p.fontSize}:{}),...(Object.keys(box).length?{inlineBox:box}:{})};
        const defined = Object.fromEntries(Object.entries(style).filter(([,value]) => value !== undefined));
        runs.push(...(p.runs?.length?p.runs:[{text:p.text??''}]).map(run=>({...defined,...run})));
      }
      const {background,radius,paddingTop,paddingRight,paddingBottom,paddingLeft,paddingHorizontal,paddingVertical,timerField,binding,runs:oldRuns,...textProps}=first.props;
      children=[{...first,name:'文字',props:{...textProps,text:runs.map(run=>run.text).join(''),runs,widthMode:'fit',heightMode:'fit',textAlign:'center',background:'transparent',radius:0,paddingHorizontal:0,paddingVertical:0}}];
      props={...props,gap:0};
    }
    return props !== node.props || children.some((child,index)=>child!==node.children[index]) || children.length!==node.children.length ? {...node,props,children} : node;
  };
  const root=visit(document.root);
  return root===document.root?document:{...document,root};
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
