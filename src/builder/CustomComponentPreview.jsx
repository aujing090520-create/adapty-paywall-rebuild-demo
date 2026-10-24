import React,{useEffect,useMemo,useRef,useState} from 'react';
import {customContext} from './customContext.js';

export default function CustomComponentPreview({node,props,document,packages,packageNode,selectedPackage,editing}){
  const ref=useRef(null),acknowledged=useRef(false),[srcDoc,setSrcDoc]=useState(''),[height,setHeight]=useState(props.loadingHeight??300),[error,setError]=useState('');
  const id=props.customBundle?.id;
  const context=useMemo(()=>customContext(document,packages,packageNode,selectedPackage),[document,packages.map((item)=>item.id).join('|'),packageNode?.id,selectedPackage?.id]);
  useEffect(()=>{let active=true;const controller=new AbortController();setError('');setHeight(props.loadingHeight??300);setSrcDoc('');acknowledged.current=false;const timeout=setTimeout(()=>controller.abort(),15000);if(id)import('./customPreviewDocument.js').then(({loadCustomPreviewDocument})=>loadCustomPreviewDocument(id,{signal:controller.signal})).then((html)=>{if(active)setSrcDoc(html);},(failure)=>{if(active)setError(failure.name==='AbortError'?'组件资源加载超时，请刷新重试':failure.message);}).finally(()=>clearTimeout(timeout));else clearTimeout(timeout);return()=>{active=false;clearTimeout(timeout);controller.abort();};},[id]);
  const send=()=>ref.current?.contentWindow?.postMessage({channel:'ht-custom-preview',id,type:'context',context},'*');
  useEffect(()=>{
    if(!id)return;
    const message=(event)=>{
      const data=event.data;if(event.source!==ref.current?.contentWindow||data?.channel!=='ht-custom-preview'||data.id!==id)return;
      if(data.type==='ready'){acknowledged.current=true;send();}
      if(data.type==='error')setError(String(data.message??'组件脚本执行失败'));
      if(data.type==='height'&&Number.isFinite(data.height)&&data.height>0&&data.height<=10000)setHeight((current)=>current===data.height?current:data.height);
    };
    window.addEventListener('message',message);send();return()=>window.removeEventListener('message',message);
  },[id,srcDoc,context]);
  useEffect(()=>{if(!srcDoc)return;const timer=setTimeout(()=>{if(!acknowledged.current)setError('组件通信未就绪，请检查 ZIP 内的脚本和内容安全策略');},10000);return()=>clearTimeout(timer);},[srcDoc]);
  if(!id||!srcDoc)return <div className="nc-empty-custom" role={error?'alert':undefined} style={{height:props.heightMode==='fixed'?'100%':props.loadingHeight??300}}>{error||(!id?'未上传 ZIP':'加载中')}</div>;
  return <>{error&&<div role="alert" style={{fontSize:12,color:'#b42318',padding:8,overflowWrap:'anywhere'}}>{error}</div>}<iframe key={id} ref={ref} title={node.name} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={srcDoc} onLoad={send} style={{display:'block',width:'100%',height:props.heightMode==='fixed'||props.heightMode==='fill'?'100%':height,border:0,pointerEvents:editing?'none':'auto'}}/></>;
}
