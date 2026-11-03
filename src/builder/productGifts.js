import {businessList,selectedBusinessData} from './businessData.js';

export function createProductGifts(id) {
  return {id,type:'ProductGifts',name:'商品礼包',props:{title:'解锁 VIP，立即获得以下福利',description:'购买当前套餐后可获得以下礼包，具体权益以商品配置为准。',selectionGroup:'',collapsible:true,initialExpanded:true,cardWidth:190,cardHeight:68,imageSize:40,cardGap:10,cardRadius:18,cardBackground:'#ffffff',cardColor:'#171717',cardFontSize:16,background:'#f6f6f6',radius:18,paddingVertical:12,paddingHorizontal:12,marginVertical:12,marginHorizontal:16,widthMode:'fill',heightMode:'fit',fontSize:17,fontWeight:700},children:[]};
}

export function giftPackages(document,node,nodes,parents) {
  const scope=id=>{
    let current=nodes.get(id);
    while(current&&!['Screen','BottomSheet'].includes(current.type))current=nodes.get(parents.get(current.id));
    return current?.id;
  };
  const owner=scope(node.id);
  return [...nodes.values()].filter(candidate=>candidate.type==='Package'&&scope(candidate.id)===owner&&(!node.props.selectionGroup||(candidate.props.group??candidate.id)===node.props.selectionGroup));
}

export function giftPackage(packages,runtime={},fallback) {
  return packages.find(node=>node.id===runtime.selectedPackage)
    ??packages.find(node=>runtime[`package:${node.props.group??node.id}`]===node.id)
    ??packages.find(node=>node.props.defaultSelected&&runtime[`package:${node.props.group??node.id}`]===undefined)
    ??packages.find(node=>node.id===fallback?.id);
}

export function setPackageGifts(document,packageNode,gifts) {
  const key=packageNode.props.dataKey??packageNode.id,row=document.products[key]??{};
  if(row.skuId&&document.business?.bySku?.[row.skuId])return {...document,business:{...document.business,bySku:{...document.business.bySku,[row.skuId]:{...document.business.bySku[row.skuId],gifts}}}};
  return {...document,products:{...document.products,[key]:{...row,gifts}}};
}
export const packageGifts=(document,node)=>selectedBusinessData(document,node).gifts??[];
export const visiblePackageGifts=(document,node)=>node?businessList(document,'gifts',node):[];

// Only new Blue template documents receive example data; saved user trees stay untouched.
export function buildBlueProductGifts(document,variant) {
  if(variant!=='blue-privilege')return document;
  let added=false;
  const samples=[
    [{id:'monthly-gift',title:'会员专属礼包',description:'月度会员专享福利',image:'/ht-retention-gift.png'}],
    [{id:'annual-gift',title:'6大会员随心选',description:'六项会员福利任选，示例礼包数据',image:'/ht-retention-gift.png'},{id:'annual-badge',title:'中秋铭牌',description:'会员专属身份铭牌，示例礼包数据',image:'/ht-vip-badge.svg'},{id:'annual-coupon',title:'专属福利券',description:'年度会员专属福利券',image:'/ht-retention-gift.png'}],
    [{id:'lifetime-badge',title:'终身会员铭牌',description:'终身会员专属身份标识',image:'/ht-vip-badge.svg'},{id:'lifetime-gift',title:'终身会员礼包',description:'终身会员专享福利',image:'/ht-retention-gift.png'}],
  ];
  const products={...document.products};
  const visit=node=>{
    const children=[];
    for(const child of node.children){
      children.push(visit(child));
      if(child.id==='products'&&child.children.some(entry=>entry.type==='Package')&&!node.children.some(entry=>entry.type==='ProductGifts')){
        const gift=createProductGifts('products/gifts');gift.props.selectionGroup=child.children.find(entry=>entry.type==='Package').props.group??child.children[0].id;
        children.push(gift);added=true;
        child.children.filter(entry=>entry.type==='Package').forEach((entry,index)=>{const key=entry.props.dataKey??entry.id;products[key]={...products[key],gifts:products[key]?.gifts??samples[index]??[]};});
      }
    }
    return {...node,children};
  };
  const root=visit(document.root);
  return added?{...document,root,products}:document;
}
