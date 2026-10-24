import tinycolor from 'tinycolor2';
import {parse,stringify} from 'gradient-parser';

export const isGradient=(value)=>/gradient\(/i.test(value??'');
export function pickerColor(value,opacity=100){
  if(isGradient(value))return value;
  const color=tinycolor(value);
  if(!color.isValid())return 'rgba(0,0,0,1)';
  return color.setAlpha(color.getAlpha()*Math.max(0,Math.min(100,Number(opacity)))/100).toRgbString();
}
export function pickerPaint(value){
  if(isGradient(value))return {color:value,opacity:100};
  const color=tinycolor(value);
  return color.isValid()?{color:color.toHexString(),opacity:Math.round(color.getAlpha()*100)}:null;
}
export function gradientStops(value){
  try{
    const gradient=parse(value)[0];
    if(!gradient?.colorStops?.length)return null;
    return {gradient,stops:gradient.colorStops.map((stop,index)=>{
      const color=stop.type==='hex'?`#${stop.value}`:stop.type==='literal'?stop.value:`${stop.type}(${stop.value.join(',')})`;
      return {color,offset:stop.length?.type==='%'?Number(stop.length.value)/100:index/(gradient.colorStops.length-1)};
    })};
  }catch{return null;}
}
export function gradientWithOpacity(value,opacity=100){
  if(opacity===100)return value;
  try{const gradients=parse(value);for(const gradient of gradients)gradient.colorStops=gradient.colorStops.map((stop)=>{const color=tinycolor(stop.type==='hex'?`#${stop.value}`:stop.type==='literal'?stop.value:`${stop.type}(${stop.value.join(',')})`);if(!color.isValid())return stop;const {r,g,b,a}=color.toRgb();return {...stop,type:'rgba',value:[String(r),String(g),String(b),String(a*opacity/100)]};});return stringify(gradients);}catch{return value;}
}
