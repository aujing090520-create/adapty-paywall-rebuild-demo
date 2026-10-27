import { component } from './componentDocument.js';

export function buildBlueVipColumn(document) {
  const visit = node => {
    if(node.id!=='benefits')return {...node,children:node.children.map(visit)};
    if(node.children.some(child=>child.id==='benefits/column-background'))return node;
    const background=node.children[0]?.children[2]?.props.background??'#ffffff';
    const rows=node.children.map(row=>({...row,props:{...row.props,background:'transparent'},children:row.children.map((cell,index)=>({...cell,props:{...cell.props,background:index===2?'transparent':row.id==='benefits/header'?'#f1f1f1':cell.props.background}}))}));
    const underlay=component('benefits/column-background','Stack','列背景',{axis:'horizontal',widthMode:'fill',heightMode:'fill',gap:0,paddingMode:'axis',paddingHorizontal:16,paddingVertical:0},[
      component('benefits/non-vip-space','Stack','布局容器',{widthMode:'fill',heightMode:'fill',flexGrow:2.67}),
      component('benefits/vip-background','Stack','VIP列背景',{widthMode:'fill',heightMode:'fill',flexGrow:.76,background,radius:0}),
    ]);
    return {...node,props:{...node.props,axis:'overlay'},children:[underlay,component('benefits/rows','Stack','权益行内容',{axis:'vertical',widthMode:'fill',heightMode:'fit',gap:node.props.gap??0},rows)]};
  };
  return {...document,root:visit(document.root)};
}
