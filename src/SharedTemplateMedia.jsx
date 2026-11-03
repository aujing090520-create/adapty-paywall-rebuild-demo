import React,{useEffect,useState} from 'react';
import ComponentPreview from './builder/ComponentPreview.jsx';
import {loadSharedTemplate} from './sharedTemplates.js';
export default function SharedTemplateMedia({id}){
  const [state,setState]=useState({document:null,error:''});
  useEffect(()=>{let active=true;loadSharedTemplate(id).then(record=>{if(active)setState({document:record.document,error:''});},error=>{if(active)setState({document:null,error:error.message});});return()=>{active=false;};},[id]);
  if(!state.document)return <div className="template-cloud-placeholder">{state.error||'正在加载预览…'}</div>;
  return <div className="rc-gallery-live" aria-hidden="true"><div className="rc-gallery-live-scale"><ComponentPreview document={state.document} editing onSelect={()=>{}}/></div></div>;
}
