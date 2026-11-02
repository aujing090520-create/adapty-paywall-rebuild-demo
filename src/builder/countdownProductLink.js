import {indexDocument} from './componentDocument.js';

const boundaryTypes=new Set(['Screen','BottomSheet','Tab','Slide','SwitchCase','CheckoutState']);
export const countdownLinksProducts=props=>props.linkProducts??props.promotion?.enabled??false;

export function countdownPackages(document,timer) {
  const {nodes,parents}=indexDocument(document);
  let boundary=timer;
  while(boundary&&!boundaryTypes.has(boundary.type))boundary=nodes.get(parents.get(boundary.id));
  return [...nodes.values()].filter(node=>{
    if(node.type!=='Package')return false;
    let owner=node;
    while(owner&&owner!==boundary){if(['Screen','BottomSheet'].includes(owner.type))return false;owner=nodes.get(parents.get(owner.id));}
    return Boolean(owner);
  });
}

// Product selection, amount and labels belong to the existing product service.
// This component exports timing context only; display-only timers keep the active product context.
export function productLinkRuntime(document,runtime) {
  const {nodes}=indexDocument(document),events=[],byPackage={};
  for(const [id,record] of Object.entries(runtime.$countdowns??{})) {
    const timer=nodes.get(id);
    if(timer?.type!=='Countdown')continue;
    const linked=countdownLinksProducts(timer.props);
    const event={countdownId:id,linked,state:linked?record.status:'active',expiresAt:linked&&record.deadline?new Date(record.deadline).toISOString():null,packageIds:countdownPackages(document,timer).map(node=>node.id)};
    events.push(event);
    for(const id of event.packageIds)(byPackage[id]??=[]).push(event);
  }
  return {...runtime,$productLinks:{events,byPackage}};
}
