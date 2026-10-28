export const TIME_SCOPES = [['campaign','活动统一到期'],['userOffer','当前用户优惠到期'],['global','全局业务到期']];
export const TIME_STATES = [['active','进行中'],['ended','已到期'],['unavailable','数据不可用']];
export const timeSources = document => document.business?.timeSources ?? [];
const timestamp=value=>typeof value==='string'&&/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)?Date.parse(value):NaN;

export function sourceKeyError(sources,id,key) {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) return '使用英文字母或下划线开头，可包含数字、点和短横线';
  return sources.some(source=>source.id!==id&&source.key===key)?'数据键已存在':'';
}

export function timeSourceReferences(document,id) {
  const found=[];
  const visit=node=>{if(node.props.timeSource==='business'&&node.props.timeSourceId===id)found.push(node.id);node.children.forEach(visit);};
  visit(document.root);
  for(const rule of document.logic?.rules??[])if(rule.conditions.some(condition=>condition.type==='timeSource'&&condition.source===id))found.push(rule.id??rule.name);
  return found;
}

export function removeTimeSource(document,id) {
  if(timeSourceReferences(document,id).length)return document;
  return {...document,business:{...document.business,timeSources:timeSources(document).filter(source=>source.id!==id)}};
}

// The host supplies a normalized response for the current authenticated user.
// An explicit host context never falls back to a Demo sample on missing data.
export function resolveBusinessTime(document,id,runtime={}) {
  const source=timeSources(document).find(source=>source.id===id);
  const unavailable={state:'fallback',status:'unavailable',seconds:0,deadline:null};
  if(!source)return unavailable;
  const context=runtime.$time?.context;
  const value=context===undefined?source.sample:context?.values?.[source.key];
  if(!value||value.status==='unavailable')return unavailable;
  if(value.status==='ended')return {...unavailable,state:'ended',status:'ended'};
  const deadline=timestamp(value.expiresAt);
  const now=runtime.$time?.now??Date.now();
  if(value.status!=='active'||!Number.isFinite(deadline)||!Number.isFinite(now))return unavailable;
  const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
  return {state:seconds?'active':'ended',status:seconds?'active':'ended',seconds,deadline};
}

const responseClocks=new WeakMap();
export function createBusinessTimeContext(response,receivedAt=performance.now()) {
  return {...response,receivedAt};
}
export function clockAnchor(context,wall=Date.now(),monotonic=performance.now()) {
  if(context&&responseClocks.has(context))return responseClocks.get(context);
  const epoch=context?.serverTime===undefined?wall:timestamp(context.serverTime);
  const anchor={epoch,monotonic:context?.serverTime!==undefined&&Number.isFinite(context?.receivedAt)?context.receivedAt:monotonic};
  if(context&&typeof context==='object')responseClocks.set(context,anchor);
  return anchor;
}
export const clockNow=(anchor,monotonic=performance.now())=>anchor.epoch+Math.max(0,monotonic-anchor.monotonic);
