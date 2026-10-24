import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import ColorPicker from 'react-best-gradient-color-picker';
import {X} from 'lucide-react';

export default function ColorPickerPopup({label,value,onChange,onClose,anchor,allowGradient,opacityReadOnly}){
  const ref=useRef(null);
  useEffect(()=>{
    const outside=(event)=>{if(!ref.current?.contains(event.target))onClose();};
    const escape=(event)=>{if(event.key==='Escape')onClose();};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[onClose]);
  const left=Math.max(12,Math.min(window.innerWidth-326,anchor.right-314)),top=Math.max(12,Math.min(window.innerHeight-440,anchor.bottom+6));
  return createPortal(<div ref={ref} role="dialog" aria-label={`${label}编辑器`} className="rc-color-popover" style={{left,top}}><header><strong>{label}</strong><button type="button" title="关闭颜色编辑器" aria-label="关闭颜色编辑器" onClick={onClose}><X size={16}/></button></header><ColorPicker value={value} onChange={onChange} width={288} height={210} config={{defaultGradient:'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(38,38,38,1) 100%)'}} hideEyeDrop hideAdvancedSliders hideColorGuide hidePresets hideInputType hideColorTypeBtns={!allowGradient} hideOpacity={opacityReadOnly} disableDarkMode locales={{CONTROLS:{SOLID:'纯色',GRADIENT:'渐变'}}}/></div>,document.body);
}
