import React, { useState } from 'react';
import { ArrowLeft, Search, Type, Image, Video, Star, Layers, PanelTop, PanelBottom, Code2, Package, ShoppingBag, CreditCard, ToggleLeft, MousePointerClick, GalleryHorizontal, Timer, List, Award, MessageSquare, RectangleHorizontal } from 'lucide-react';
import { catalogFor } from './componentCatalog.js';
const icons = {Text:Type,Image,Video,Icon:Star,Stack:Layers,Header:PanelTop,Footer:PanelBottom,Custom:Code2,Package,BottomSheet:PanelBottom,PurchaseButton:ShoppingBag,ExpressCheckout:CreditCard,Tabs:RectangleHorizontal,Switch:ToggleLeft,Button:MousePointerClick,Carousel:GalleryHorizontal,Countdown:Timer,Timeline:List,SocialProof:MessageSquare,FeatureList:List,Award};
export default function ComponentPicker({parent,onBack,onAdd}) {
  const [query,setQuery] = useState('');
  const groups = catalogFor(parent).map((group)=>({...group,items:group.items.filter(([key,label])=>`${key} ${label}`.toLowerCase().includes(query.toLowerCase()))})).filter((group)=>group.items.length);
  return <><header><button type="button" className="ne-icon" title="返回图层" aria-label="返回图层" onClick={onBack}><ArrowLeft size={17}/></button><strong>添加组件</strong></header><div className="ne-picker-target">{parent.name}</div><div className="ne-picker-search"><Search size={14}/><input aria-label="搜索组件" value={query} onChange={(event)=>setQuery(event.target.value)}/></div><div className="ne-catalog" aria-label="组件目录">{groups.map((group)=><section key={group.name}><h3>{group.name}</h3>{group.items.map(([type,label])=>{const Icon = icons[type] ?? Layers;return <button type="button" className="ne-catalog-entry" key={type} onClick={()=>onAdd(type)}><span className="ne-catalog-icon"><Icon size={18}/></span><span>{label}</span></button>;})}</section>)}</div></>;
}
