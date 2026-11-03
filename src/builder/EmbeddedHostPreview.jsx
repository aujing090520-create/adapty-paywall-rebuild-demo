import React from 'react';
import {ChevronLeft,ChevronRight,Phone,Ellipsis,Signal,Wifi,Battery,Mic,PlusCircle,Image,Smile,Gift,WandSparkles,MessageSquare,Hand,CircleDollarSign,Sparkles} from 'lucide-react';

// Preview-only host chrome; it is not editable paywall content or a runtime chat implementation.
export default function EmbeddedHostPreview({kind,slotTop}) {
  if(kind!=='chat-gifts')return null;
  return <><div className="nc-chat-host" aria-hidden="true" inert="">
    <div className="nc-chat-context" style={{height:slotTop}}>
      <div className="nc-chat-status"><strong>14:24</strong><span><Signal size={20}/><Wifi size={18}/><Battery size={27}/></span></div>
      <div className="nc-chat-navigation"><ChevronLeft size={23}/><div><strong>Maze <img src="/ht-vip-badge.svg" alt=""/></strong><small>15:23</small></div><Phone size={21} color="#dddddd"/><Ellipsis size={27}/></div>
      <div className="nc-chat-greeting"><span>Hi <Hand size={30} fill="#7c4af4" color="#7c4af4"/></span><strong>给语伴发条消息或招手打个招呼吧!</strong><b>招手</b></div>
      <div className="nc-chat-composer"><span>请输入...<b>文A</b></span><Mic size={22}/></div>
      <div className="nc-chat-tools">{[PlusCircle,Image,Smile,Gift,WandSparkles,MessageSquare].map((Icon,index)=><Icon key={index} size={23} color={index===3?'#7d4af6':index===4?'#dddddd':'#161616'}/>)}</div>
      <div className="nc-chat-panel"><div className="nc-chat-handle"/><div className="nc-chat-balance"><span><Sparkles size={12}/>0 <small>升级到Lv.1还差1个HT币</small></span><span>权益中心 <ChevronRight size={12}/></span></div><div className="nc-chat-categories"><span>背包</span><span>礼物⌄</span><strong>会员</strong><span>特权</span><span>贺卡</span><b><CircleDollarSign size={17} color="#ebca3c"/>0 <PlusCircle size={21} fill="#7a48f5" color="#7a48f5"/></b></div></div>
    </div>
  </div><div className="nc-chat-home" aria-hidden="true"/></>;
}
