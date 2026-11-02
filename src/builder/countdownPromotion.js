import {indexDocument} from './componentDocument.js';

const boundaryTypes=new Set(['Screen','BottomSheet','Tab','Slide','SwitchCase','CheckoutState']);
function boundary(id,nodes,parents) {
  let node=nodes.get(id);
  while(node&&!boundaryTypes.has(node.type))node=nodes.get(parents.get(node.id));
  return node?.id;
}
export function promotionPackages(document,timer) {
  const {nodes,parents}=indexDocument(document),scope=boundary(timer.id,nodes,parents);
  return [...nodes.values()].filter(node=>{
    if(node.type!=='Package')return false;
    let owner=node;
    while(owner&&owner.id!==scope){if(['Screen','BottomSheet'].includes(owner.type))return false;owner=nodes.get(parents.get(owner.id));}
    return Boolean(owner);
  });
}
export function promotionGroups(document,timer) {
  const groups=[];
  for(const node of promotionPackages(document,timer)) {
    const key=node.props.group??node.id;
    let group=groups.find(group=>group.key===key);
    if(!group){group={key,count:0};groups.push(group);}
    group.count++;
  }
  return groups;
}
export function promotionRuntime(document,runtime) {
  const {nodes}=indexDocument(document),bindings=new Map(),pricing={};
  for(const timer of nodes.values())if(timer.type==='Countdown'&&timer.props.promotion?.enabled) {
    const config=timer.props.promotion;
    for(const node of promotionPackages(document,timer))if(!config.group||config.group==='@all'||config.group===(node.props.group??node.id)) {
      const found=bindings.get(node.id)??[];found.push(timer);bindings.set(node.id,found);
    }
  }
  for(const [id,timers] of bindings) {
    const timer=timers[0],state=runtime.$countdowns?.[timer.id],config=timer.props.promotion;
    const conflict=timers.length>1;
    pricing[id]={...config,productType:nodes.get(id).props.productType,timerId:timer.id,state:conflict?'fallback':state?.state??'fallback',phase:!conflict&&state?.state==='active'?'discount':'regular',deadline:conflict?null:state?.deadline??null,reason:conflict?'conflict':state?'timer':'unavailable'};
  }
  return {...runtime,$pricing:pricing};
}
export function promotionHiddenNode(node,pricing) {
  if(!pricing||pricing.phase==='discount')return false;
  if(node.type==='ProductParameter')return node.props.parameter==='productLabel'&&pricing.hideLabel!==false
    ||['totalReferencePrice','monthlyReferencePrice'].includes(node.props.parameter)&&pricing.hideReference!==false
    ||node.props.parameter==='savings'&&pricing.hideSavings!==false;
  return node.type==='Stack'&&node.children.length>0&&node.children.every(child=>promotionHiddenNode(child,pricing));
}
export function promotionWarnings(document,timer) {
  if(!timer.props.promotion?.enabled)return [];
  const packages=promotionPackages(document,timer).filter(node=>!timer.props.promotion.group||timer.props.promotion.group==='@all'||timer.props.promotion.group===(node.props.group??node.id));
  if(!packages.length)return ['未关联有效套餐，优惠联动暂不生效'];
  const runtime=promotionRuntime(document,{});
  return packages.some(node=>runtime.$pricing[node.id]?.reason==='conflict')?['同一套餐关联了多个优惠倒计时，预览将回退正常价格']:[];
}
