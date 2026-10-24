import React from 'react';

const outline=new URL('../../node_modules/@tabler/icons-sprite/dist/tabler-sprite.svg',import.meta.url).href;
const filled=new URL('../../node_modules/@tabler/icons-sprite/dist/tabler-sprite-filled.svg',import.meta.url).href;
export function parseTablerIcon(value){const match=/^tabler:(outline|filled):([a-z0-9-]+)$/.exec(value??'');return match?{variant:match[1],name:match[2]}:null;}
export default function TablerGlyph({icon,width=24,height=24}){
  const value=parseTablerIcon(icon);
  if(!value)return null;
  return <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true"><use href={`${value.variant==='filled'?filled:outline}#tabler-${value.variant==='filled'?'filled-':''}${value.name}`}/></svg>;
}
