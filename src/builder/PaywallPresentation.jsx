import React, { useRef, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import ComponentPreview from './ComponentPreview.jsx';
import { exitOfferSource, exitOfferTarget } from './exitOffers.js';
import { pageContext } from './componentTree.js';
import { fieldPreviewDocument } from '../products/fieldPreview.js';

export default function PaywallPresentation({ offerings = [], currentPaywallId, backdropDocument, backdropNavigation, productFields = true, ...props }) {
  const [offer, setOffer] = useState(null);
  const [closed, setClosed] = useState(false);
  const [request, setRequest] = useState(0);
  const [session, setSession] = useState(0);
  const [restarted, setRestarted] = useState(false);
  const [underlayNavigation, setUnderlayNavigation] = useState({});
  const [resumeNavigation, setResumeNavigation] = useState(null);
  const consumed = useRef(new Set());
  const dismiss = ({ snapshot }) => {
    const sourceId = pageContext(props.document, snapshot).active.id;
    const target = !props.document.settings?.buttonModalVersion && !offer && !consumed.current.has(sourceId) && exitOfferTarget(props.document, offerings, currentPaywallId, sourceId);
    if (target) { consumed.current.add(sourceId); setUnderlayNavigation({ ...snapshot, overlay: null, webLink: null }); setOffer(target); setRequest(0); }
    else setClosed(true);
  };
  const restart = () => { consumed.current.clear(); setResumeNavigation(null); setOffer(null); setClosed(false); setRequest(0); setRestarted(true); setSession((value) => value + 1); };
  const resume = () => { setResumeNavigation(underlayNavigation); setOffer(null); setRequest(0); };
  const render = (previewProps) => {
    previewProps={...previewProps,countdownScope:offer?.id??currentPaywallId??`draft:${props.document.templateId}`};
    if(productFields)previewProps={...previewProps,document:fieldPreviewDocument(previewProps.document)};
    const background = productFields?fieldPreviewDocument(offer ? props.document : backdropDocument):offer ? props.document : backdropDocument;
    if (!background || !previewProps.document.settings?.presentationSurfaceId) return <ComponentPreview {...previewProps}/>;
    const { flow, pages } = pageContext(background);
    const source = exitOfferSource(background);
    const backgroundNavigation = offer ? underlayNavigation : backdropNavigation ?? (flow && source ? { [flow.id]: pages.findIndex((page) => page.id === source.id) } : {});
    return <div className="ne-exit-sheet-presentation"><div className="ne-exit-underlay" inert="" aria-hidden="true"><ComponentPreview document={background} businessTime={props.businessTime} persistCountdown={false} editing={false} navigation={backgroundNavigation} onSelect={() => {}} onStatus={() => {}}/></div><div className="ne-exit-foreground"><ComponentPreview {...previewProps} dismissOnBackdrop/></div></div>;
  };
  if (props.editing) return render(props);
  return <div className="ne-presentation">
    <div className="ne-presentation-tools" aria-label="预览会话">
      <span>{closed ? '已关闭' : offer ? offer.name : '页面预览'}</span>
      <button type="button" className="ne-icon" title="重新预览" aria-label="重新预览" onClick={restart}><RotateCcw size={16}/></button>
      {!closed && <button type="button" className="ne-icon" title="关闭付费墙预览" aria-label="关闭付费墙预览" onClick={() => setRequest((value) => value + 1)}><X size={16}/></button>}
    </div>
    {closed ? <div className="phone native-phone ne-presentation-closed" role="status"><span>付费墙已关闭</span><button type="button" className="secondary" onClick={restart}><RotateCcw size={16}/>重新预览</button></div> : <React.Fragment key={`${session}:${offer?.id ?? 'primary'}`}>{render({
      ...props, document: offer?.document ?? props.document,
      selectedId: offer ? null : props.selectedId,
      navigation: offer ? offer.document.settings?.presentationSurfaceId ? { overlay: offer.document.settings.presentationSurfaceId } : undefined : resumeNavigation ?? (restarted ? props.document.settings?.presentationSurfaceId ? { overlay: props.document.settings.presentationSurfaceId } : undefined : props.navigation),
      onNavigate: offer ? undefined : props.onNavigate, onDismiss: dismiss, onResume: offer?.local ? resume : undefined, dismissRequest: request,
    })}</React.Fragment>}
  </div>;
}
