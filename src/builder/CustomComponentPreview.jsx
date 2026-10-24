import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ensureCustomPreview} from './customHost.js';
import {customContext} from './customContext.js';

export default function CustomComponentPreview({node,props,document,packages,packageNode,selectedPackage,editing}){
  const ref=useRef(null),[ready,setReady]=useState(false),[height,setHeight]=useState(props.loadingHeight??300),[error,setError]=useState('');
  const id=props.customBundle?.id;
  const context=useMemo(()=>customContext(document,packages,packageNode,selectedPackage),[document,packages.map((item)=>item.id).join('|'),packageNode?.id,selectedPackage?.id]);
  useEffect(()=>{let active=true;setError('');setHeight(props.loadingHeight??300);setReady(false);if(id)ensureCustomPreview().then(()=>{if(active)setReady(true);},(failure)=>{if(active)setError(failure.message);});return()=>{active=false;};},[id]);
  const send=()=>ref.current?.contentWindow?.postMessage({channel:'ht-custom-preview',id,type:'context',context},'*');
  useEffect(()=>{
    if(!id)return;
    const message=(event)=>{
      const data=event.data;if(event.source!==ref.current?.contentWindow||data?.channel!=='ht-custom-preview'||data.id!==id)return;
      if(data.type==='ready')send();
      if(data.type==='height'&&Number.isFinite(data.height)&&data.height>0&&data.height<=10000)setHeight((current)=>current===data.height?current:data.height);
    };
    window.addEventListener('message',message);send();return()=>window.removeEventListener('message',message);
  },[id,ready,context]);
  if(!id||!ready)return <div className="nc-empty-custom" style={{height:props.heightMode==='fixed'?'100%':props.loadingHeight??300}}>{error||(!id?'未上传 ZIP':'加载中')}</div>;
  return <iframe key={id} ref={ref} title={node.name} sandbox="allow-scripts" referrerPolicy="no-referrer" src={`/custom-component/bundles/${id}/index.html`} onLoad={send} style={{display:'block',width:'100%',height:props.heightMode==='fixed'||props.heightMode==='fill'?'100%':height,border:0,pointerEvents:editing?'none':'auto'}}/>;
}
