import React,{useState} from 'react';
import {X,Upload} from 'lucide-react';
import {installFontFamilies} from './fontAssets.js';

export default function FontManager({fonts,onSave,onClose}) {
  const [files,setFiles]=useState([]),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const choose=(list)=>{setFiles(Array.from(list??[]));setError('');};
  return <div className="rc-rich-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!saving)onClose();}}><form className="rc-rich-dialog rc-font-manager" role="dialog" aria-modal="true" aria-label="配置字体族" onKeyDown={event=>{if(event.key==='Escape'&&!saving)onClose();}} onSubmit={async event=>{event.preventDefault();setSaving(true);try{const result=await installFontFamilies(files,fonts);await onSave(result);onClose();}catch(reason){setError(reason.message);}finally{setSaving(false);}}}>
    <header><strong>配置字体族</strong><button type="button" aria-label="关闭字体配置" title="关闭字体配置" disabled={saving} onClick={onClose}><X size={16}/></button></header>
    {fonts.length>0&&<ul className="rc-font-list">{fonts.map(font=><li key={font.id}>{font.family}<small>{font.faces.map(face=>`${face.weight}${face.style==='italic'?' 斜体':''}`).join('、')}</small></li>)}</ul>}
    <label className="rc-upload" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();choose(event.dataTransfer.files);}}><Upload size={20}/><span>{files.length?files.map(file=>file.name).join('、'):'选择字体文件'}</span><input autoFocus type="file" aria-label="选择字体文件" accept="font/ttf,.ttf,font/otf,.otf" multiple disabled={saving} onChange={event=>{choose(event.target.files);event.target.value='';}}/></label>
    {error&&<small role="alert">{error}</small>}<button type="submit" disabled={saving||!files.length}>{saving?'正在上传':'上传字体族'}</button>
  </form></div>;
}
