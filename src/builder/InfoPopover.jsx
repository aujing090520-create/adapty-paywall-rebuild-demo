import React, {useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Info} from 'lucide-react';

export function popoverPosition(anchor, bounds, size, gap = 8) {
  const width = Math.min(size.width, Math.max(0, bounds.width - gap * 2));
  const left = Math.max(gap, Math.min(bounds.width - width - gap, anchor.left + anchor.width / 2 - width / 2));
  const below = bounds.height - anchor.bottom - gap * 2;
  const above = anchor.top - gap * 2;
  const side = size.height <= below || below >= above ? 'bottom' : 'top';
  const maxHeight = Math.max(0, side === 'bottom' ? below : above);
  const height = Math.min(size.height, maxHeight);
  return {left, top: side === 'bottom' ? anchor.bottom + gap : anchor.top - gap - height,
    width, maxHeight, side, arrow: Math.max(10, Math.min(width - 10, anchor.left + anchor.width / 2 - left))};
}

export default function InfoPopover({label, text, scope, editing}) {
  const [open, setOpen] = useState(false), [position, setPosition] = useState(null);
  const trigger = useRef(null), bubble = useRef(null), id = useId();
  const host = trigger.current?.closest('.native-phone');
  useEffect(() => {setOpen(false);}, [scope, editing]);
  useLayoutEffect(() => {
    if (!open || !host || !bubble.current) return;
    const root = host.getBoundingClientRect(), rect = trigger.current.getBoundingClientRect();
    const scale = root.width / host.offsetWidth, unit = host.clientWidth / 390;
    const anchor = {left:(rect.left-root.left)/scale-host.clientLeft, top:(rect.top-root.top)/scale-host.clientTop,
      bottom:(rect.bottom-root.top)/scale-host.clientTop, width:rect.width/scale};
    setPosition({...popoverPosition(anchor, {width:host.clientWidth,height:host.clientHeight},
      {width:260*unit,height:bubble.current.offsetHeight}, 8*unit), unit});
  }, [open, host, text]);
  useEffect(() => {
    if (!open || !host) return;
    const doc = host.ownerDocument;
    const outside = event => {
      if (!trigger.current?.contains(event.target) && !bubble.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {if (event.key === 'Escape') {event.stopPropagation();setOpen(false);}};
    const scroll = event => {if (!bubble.current?.contains(event.target)) setOpen(false);};
    const close = () => setOpen(false);
    doc.addEventListener('pointerdown', outside, true);
    doc.addEventListener('keydown', escape, true);
    doc.addEventListener('scroll', scroll, true);
    doc.defaultView.addEventListener('resize', close);
    return () => {
      doc.removeEventListener('pointerdown', outside, true);
      doc.removeEventListener('keydown', escape, true);
      doc.removeEventListener('scroll', scroll, true);
      doc.defaultView.removeEventListener('resize', close);
    };
  }, [open, host]);
  if (!text) return null;
  const unit = host ? host.clientWidth / 390 : 1;
  return <>
    <button ref={trigger} type="button" aria-label={label} aria-expanded={open} aria-describedby={open?id:undefined}
      onClick={event => {if(editing)return;event.stopPropagation();setPosition(null);setOpen(value=>!value);}}><Info size={15}/></button>
    {open && host && createPortal(<div ref={bubble} id={id} role="tooltip" className="nc-info-popover"
      data-side={position?.side} onClick={event=>event.stopPropagation()}
      style={{left:position?.left??8,top:position?.top??0,width:position?.width??260*unit,
        maxHeight:position?.maxHeight,visibility:position?'visible':'hidden',fontSize:13*unit,
        '--nc-popover-arrow':`${position?.arrow??16}px`}}><div className="nc-info-popover-content" style={{padding:10*unit}}>{text}</div></div>, host)}
  </>;
}
