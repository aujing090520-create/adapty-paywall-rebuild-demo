import React,{useState} from 'react';
import {Save,X} from 'lucide-react';

export function SaveTemplateDialog({defaultName='',onClose,onSave}){
  const [name,setName]=useState(defaultName.slice(0,60)),[error,setError]=useState('');
  return <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="保存为自定义模板"><header><h2>保存为自定义模板</h2><button className="icon" aria-label="关闭保存模板" onClick={onClose}><X size={18}/></button></header><form onSubmit={event=>{event.preventDefault();try{onSave(name);}catch(err){setError(err.message);}}}><label className="template-name-field">模板名称<input autoFocus maxLength={60} value={name} onChange={event=>{setName(event.target.value);setError('');}}/></label><p className="template-local-note">仅保存在当前浏览器，不上传云端。</p>{error&&<p role="alert" className="template-library-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>取消</button><button type="submit" className="primary"><Save size={15}/>保存模板</button></div></form></section></div>;
}
