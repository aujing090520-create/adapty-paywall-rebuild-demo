import { component } from './componentDocument.js';
import { comparisonItemKey } from './comparisonOrdering.js';

export const COMPARISON_ROW_KEYS = ['action','hidden','visibleWhen','heightMode','height','minHeight','maxHeight'];

function matchesLayout(node, expected, editable = []) {
  return Object.entries(node.props).every(([key,value])=>editable.includes(key) || key in expected && value===expected[key]);
}

export function comparisonRowProps(node, nodes, resolve = value => value) {
  const source = nodes.get(node.props.comparisonRowId);
  if (!source || source.id === node.id) return node;
  const props = resolve(source).props;
  return {...node, props:{...node.props,...Object.fromEntries(COMPARISON_ROW_KEYS.map(key => [key,props[key]]))}};
}

// Keep the table column-first, while retaining the original row action identity.
export function buildBlueVipColumn(document) {
  const visit = node => {
    if (node.id !== 'benefits') {
      const children=node.children.map(visit);
      return children.some((child,index)=>child!==node.children[index])?{...node,children}:node;
    }
    if (node.props.comparisonTableVersion === 2) {
      let changed = false;
      const children = node.children.map(column => ({...column, children: column.children.map(cell => {
        const key = comparisonItemKey(cell.props.comparisonRowId);
        if (!key || cell.props.comparisonItemKey) return cell;
        changed = true;
        return {...cell, props: {...cell.props, comparisonItemKey: key}};
      })}));
      return changed ? {...node, children} : node;
    }
    const underlay = node.children.find(child => child.id === 'benefits/column-background');
    if (document.templateId !== 'ht-blue-privilege' && !underlay) return node;
    const rowGroup = node.children.find(child => child.id === 'benefits/rows');
    const rows = rowGroup?.children ?? node.children;
    if (!rows.length || rows.some(row => row.children.length !== 3 || row.props.heightMode !== 'fixed' || !(row.props.height > 0))) return node;
    if (rows.some(row => row.props.borderWidth > 0 || row.props.radius > 0 || row.props.gap > 0 || row.props.paddingLeft !== rows[0].props.paddingLeft || row.props.paddingRight !== rows[0].props.paddingRight)) return node;
    if (underlay && (node.children.length !== 2 || underlay.children.length !== 2 || underlay.children.some(child => child.children.length))) return node;
    if (underlay) {
      const vip=underlay.children.find(child=>child.id==='benefits/vip-background');
      const spacer=underlay.children.find(child=>child.id==='benefits/non-vip-space');
      if (!vip || !spacer || !matchesLayout(underlay,{axis:'horizontal',widthMode:'fill',heightMode:'fill',gap:0,paddingMode:'axis',paddingHorizontal:16,paddingVertical:0}) || !matchesLayout(spacer,{widthMode:'fill',heightMode:'fill',flexGrow:2.67}) || !matchesLayout(vip,{widthMode:'fill',heightMode:'fill',flexGrow:.76,radius:0},['background']) || !matchesLayout(rowGroup,{axis:'vertical',widthMode:'fill',heightMode:'fit',gap:0})) return node;
      if (rows.some(row=>row.props.background && row.props.background!=='transparent')) return node;
    }
    if (rows.some(row=>row.children.some(cell=>!['Text','Icon'].includes(cell.type) && !(cell.type==='Stack'&&cell.children.length===1&&cell.children[0].type==='Icon')))) return node;
    // Do not discard wrappers referenced by custom rules.
    if (['benefits/rows','benefits/column-background','benefits/non-vip-space'].some(id => JSON.stringify(document.logic ?? {}).includes(JSON.stringify(id)))) return node;
    const background = underlay?.children.find(child => child.id === 'benefits/vip-background')?.props.background ?? rows[0].children[2].props.background ?? '#ffffff';
    const columns = [[],[],[]];
    rows.forEach(row => row.children.forEach((cell,index) => {
      const iconLayout = cell.type === 'Stack' && cell.children.length === 1 && cell.children[0].type === 'Icon';
      const content = iconLayout ? cell.children[0] : cell;
      const rawIcon = content.type === 'Icon';
      const cellProps = {...row.props,axis:'vertical',gap:0,paddingMode:'individual',paddingTop:0,paddingRight:0,paddingBottom:0,paddingLeft:0,widthMode:'fill',flexGrow:0,align:'stretch',justify:rawIcon?'center':'start',background:underlay||index===2?'transparent':row.props.background??'transparent',comparisonRowId:row.id,comparisonItemKey:comparisonItemKey(row.id)};
      const leaf = {...content,props:{...content.props,widthMode:rawIcon?'fixed':'fill',heightMode:rawIcon?'fixed':'fill',...(rawIcon?{width:content.props.iconSize??content.props.fontSize??14,height:content.props.iconSize??content.props.fontSize??14,alignSelf:'center'}:{}),flexGrow:rawIcon?0:1,...(index===2 && content.props.background===background?{background:'transparent'}:{})}};
      columns[index].push(component(index===0?row.id:iconLayout?cell.id:`${cell.id}/cell`,row.type,row.name,cellProps,[leaf]));
    }));
    const ids = ['benefits/feature-column','benefits/standard-column','benefits/vip-background'];
    return {...node,props:{...node.props,axis:'horizontal',gap:0,align:'start',paddingMode:'individual',paddingLeft:rows[0].props.paddingLeft??16,paddingRight:rows[0].props.paddingRight??16,paddingTop:0,paddingBottom:0,comparisonTableVersion:2},children:columns.map((children,index)=>component(ids[index],'Stack',['特权列','非会员列','VIP列'][index],{axis:'vertical',widthMode:'fill',heightMode:'fit',flexGrow:rows[0].children[index].props.flexGrow??[1.85,.82,.76][index],gap:0,background:index===2?background:'transparent',radius:0},children))};
  };
  const root=visit(document.root);
  return root===document.root?document:{...document,root};
}
