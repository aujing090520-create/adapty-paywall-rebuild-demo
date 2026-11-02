import {activeComponents} from './propertyModel.js';
import {entryCountdownDeadline,countdownMode} from './countdownTiming.js';
import {resolveBusinessTime} from './businessTime.js';

export function countdownRuntime(document,runtime,clocks,{scope=document.templateId,storage,persist=true,editing=false}={}) {
  const visible=[...activeComponents(document,{...runtime,overlay:null},false),...activeComponents(document,runtime,false)];
  const timers=[...new Map(visible.filter(node=>node.type==='Countdown').map(node=>[node.id,node])).values()];
  const active=new Set(timers.map(node=>node.id)),values={};
  for(const id of clocks.keys())if(!active.has(id))clocks.delete(id);
  for(const node of timers) {
    const p=node.props,signature=JSON.stringify([scope,p.start,p.deadline,countdownMode(p),p.timeSource,p.timeSourceId,editing]);
    let record=clocks.get(node.id);
    if(record?.signature!==signature) {
      record={signature,deadline:p.timeSource==='business'?NaN:entryCountdownDeadline(p,{now:runtime.$time?.now,id:node.id,scope,storage,persist:persist&&!editing})};
      clocks.set(node.id,record);
    }
    const business=p.timeSource==='business'?resolveBusinessTime(document,p.timeSourceId,runtime):null;
    const deadline=business?.deadline??record.deadline,now=runtime.$time?.now;
    const seconds=business?.seconds??(Number.isFinite(now)&&Number.isFinite(deadline)?Math.max(0,Math.ceil((deadline-now)/1000)):0);
    const actualState=business?.state??(!Number.isFinite(deadline)||!Number.isFinite(now)?'fallback':seconds?'active':'ended');
    const state=editing?(runtime[node.id]??(p.previewState&&p.previewState!=='auto'?p.previewState:actualState)):actualState;
    values[node.id]={state,actualState,status:state==='fallback'?'unavailable':state,seconds,deadline:Number.isFinite(deadline)?deadline:null};
  }
  return {...runtime,...Object.fromEntries(Object.entries(values).map(([id,value])=>[`countdown-state:${id}`,value.state])),$countdowns:values};
}
