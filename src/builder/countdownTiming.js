import {countdownSeconds,countdownDeadline} from './propertyModel.js';

export const COUNTDOWN_MODES = [['deadline','统一截止时间'],['firstEntry','首次进入后计时'],['everyEntry','每次进入重新计时']];
export const countdownMode = props => COUNTDOWN_MODES.some(([key])=>key===props.timingMode) ? props.timingMode : props.deadline ? 'deadline' : 'everyEntry';

export function entryCountdownDeadline(props,{now,id,scope,storage,persist=true}) {
  if(countdownMode(props)==='deadline')return countdownDeadline(props.deadline);
  const duration=countdownSeconds(props.start??'00:10:00');
  if(duration===null||!Number.isFinite(now))return NaN;
  const deadline=now+duration*1000;
  if(countdownMode(props)!=='firstEntry'||!persist)return deadline;
  const key=`paywall-countdown-v1:${JSON.stringify([scope,id,props.start??'00:10:00'])}`;
  try {
    const saved=storage?.getItem(key);
    if(saved!==null&&saved!==undefined) {
      const parsed=Number(saved);
      return saved.trim()!==''&&Number.isFinite(parsed)&&parsed>0?parsed:NaN;
    }
    if(!storage)return NaN;
    storage.setItem(key,String(deadline));
    return deadline;
  } catch { return NaN; }
}
