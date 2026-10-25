import React, { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import ComponentPreview from './ComponentPreview.jsx';
import { exitOfferTarget } from './exitOffers.js';

export default function PaywallPresentation({ offerings = [], currentPaywallId, backdropDocument, ...props }) {
  const [offer, setOffer] = useState(null);
  const [closed, setClosed] = useState(false);
  const [request, setRequest] = useState(0);
  const [session, setSession] = useState(0);
  const [restarted, setRestarted] = useState(false);
  const [underlayNavigation, setUnderlayNavigation] = useState({});
  const dismiss = ({ eligible, snapshot }) => {
    const target = !offer && eligible && exitOfferTarget(props.document, offerings, currentPaywallId);
    if (target) { setUnderlayNavigation({ ...snapshot, overlay: null, webLink: null }); setOffer(target); setRequest(0); }
    else setClosed(true);
  };
  const restart = () => { setOffer(null); setClosed(false); setRequest(0); setRestarted(true); setSession((value) => value + 1); };
  const render = (previewProps) => {
    const background = offer ? props.document : backdropDocument;
    if (!background || !previewProps.document.settings?.presentationSurfaceId) return <ComponentPreview {...previewProps}/>;
    return <div className="ne-exit-sheet-presentation"><div className="ne-exit-underlay" inert="" aria-hidden="true"><ComponentPreview document={background} editing={false} navigation={underlayNavigation} onSelect={() => {}} onStatus={() => {}}/></div><div className="ne-exit-foreground"><ComponentPreview {...previewProps} dismissOnBackdrop/></div></div>;
  };
  if (props.editing) return render(props);
  return <div className="ne-presentation">
    <div className="ne-presentation-tools" aria-label="预览会话">
      <span>{closed ? '已关闭' : offer ? `退出优惠 · ${offer.name}` : '主付费墙'}</span>
      <button type="button" className="ne-icon" title="重新预览" aria-label="重新预览" onClick={restart}><RotateCcw size={16}/></button>
      {!closed && <button type="button" className="ne-icon" title="关闭付费墙预览" aria-label="关闭付费墙预览" onClick={() => setRequest((value) => value + 1)}><X size={16}/></button>}
    </div>
    {closed ? <div className="phone native-phone ne-presentation-closed" role="status"><span>付费墙已关闭</span><button type="button" className="secondary" onClick={restart}><RotateCcw size={16}/>重新预览</button></div> : <React.Fragment key={`${session}:${offer?.id ?? 'primary'}`}>{render({
      ...props, document: offer?.document ?? props.document,
      selectedId: offer ? null : props.selectedId,
      navigation: offer ? offer.document.settings?.presentationSurfaceId ? { overlay: offer.document.settings.presentationSurfaceId } : undefined : restarted ? props.document.settings?.presentationSurfaceId ? { overlay: props.document.settings.presentationSurfaceId } : undefined : props.navigation,
      onNavigate: offer ? undefined : props.onNavigate, onDismiss: dismiss, dismissRequest: request,
    })}</React.Fragment>}
  </div>;
}
