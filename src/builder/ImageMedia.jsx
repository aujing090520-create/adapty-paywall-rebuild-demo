import React,{useState} from 'react';
import {ImageOff} from 'lucide-react';

export default function ImageMedia({src,fallback,parameter,alt,style}){
  const [failed,setFailed]=useState([]);
  const current=[src,fallback].find(value=>value&&!failed.includes(value));
  if(parameter)return <div role="img" aria-label={parameter} style={{...style,display:'flex',alignItems:'center',justifyContent:'center',background:'#f0edf3',color:'#63556d',padding:3,boxSizing:'border-box',fontSize:10,lineHeight:1.2,textAlign:'center',overflowWrap:'anywhere'}}>{parameter}</div>;
  return current?<img src={current} alt={alt} draggable={false} style={style} onError={()=>setFailed(values=>[...new Set([...values,current])])}/>:<div className="nc-empty-media" role={alt?'img':undefined} aria-label={alt||undefined}><ImageOff aria-hidden="true" size={20} style={{opacity:0.3}}/></div>;
}
