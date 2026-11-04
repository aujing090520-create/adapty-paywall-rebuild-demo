import React,{useState} from 'react';
import {ImageOff} from 'lucide-react';

export default function ImageMedia({src,fallback,alt,style}){
  const [failed,setFailed]=useState([]);
  const current=[src,fallback].find(value=>value&&!failed.includes(value));
  return current?<img src={current} alt={alt} draggable={false} style={style} onError={()=>setFailed(values=>[...new Set([...values,current])])}/>:<div className="nc-empty-media" role={alt?'img':undefined} aria-label={alt||undefined}><ImageOff aria-hidden="true" size={20} style={{opacity:0.3}}/></div>;
}
