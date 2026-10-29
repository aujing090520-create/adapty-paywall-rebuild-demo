import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import { Check, LockKeyhole, Star, Bell, Moon, Heart, Users, Clock3, Gift, ChevronRight, Dumbbell, Download, MapPin, Flower2, Activity, Ticket, Ban, Blocks, Archive, Shirt, Armchair, ScanSearch, CircleHelp, LogIn, PersonStanding, X } from 'lucide-react';
import { componentProps, resolveComponentText, indexDocument } from './componentDocument.js';
import { parameterFromBinding, productParameterPreview } from '../products/productParameters.js';
import { isUnconfiguredDetailPage, flowInitialIndex } from './componentTree.js';
import { stepDestination, owningModal } from './workflow.js';
import { openSheetNavigation, closeSheetNavigation } from './buttonModals.js';
import { overlayAlignmentStyle } from './propertyModel.js';
import { canvasSelectionTarget } from './canvasSelection.js';
import { stateStyleProps, countdownSeconds, checkedControl, activeComponents, previewCommerceContexts, countdownValues, countdownDeadline, imageMask, paintColor, cornerRadius, selectionOwner, sequencePages, BADGE_DEFAULTS, mainAxisFillStyle, hasBoundedHeight } from './propertyModel.js';
import {productPriceFields} from '../productPricing.js';
import { interpolateVariables, variableIssues } from './textVariables.js';
import { TimelinePreview, TimelineItemPreview } from './TimelinePreview.jsx';
import { actionLink,customCheckoutLink } from './actionLinks.js';
import {isGradient,gradientWithOpacity} from './colorModel.js';
import TablerGlyph,{parseTablerIcon} from './TablerGlyph.jsx';
import CustomComponentPreview from './CustomComponentPreview.jsx';
import {safeTextLink,richTextFontFamily} from './richTextModel.js';
import {textRuleProps} from './textRules.js';
import {logicNode} from './paywallLogic.js';
import {comparisonRowProps} from './htVipColumn.js';
import {pageFrame} from './pagePresentation.js';
import {orderedComparisonCells} from './comparisonOrdering.js';
import {resolveBusinessTime,clockAnchor,clockNow} from './businessTime.js';
import {localizedDocument} from './contentLocalization.js';
import {businessList,interpolateItem} from './businessData.js';
import {fontStyles} from './fontStyles.js';
import { isExitOfferStep } from './exitOffers.js';
import { screenChromeLayout } from './screenLayout.js';

const PreviewContext = createContext(null);
const TimerContext = createContext(null);
const CarouselContext = createContext(null);
const ItemContext=createContext(null);
const PagMedia=React.lazy(()=>import('./PagMedia.jsx'));
const icons = { check: Check, lock: LockKeyhole, star: Star, bell: Bell, moon: Moon, heart: Heart, group: Users, clock: Clock3, gift: Gift, arrow: ChevronRight, dumbbell: Dumbbell, weight: Dumbbell, running: PersonStanding, download: Download, map: MapPin, flower: Flower2, activity: Activity, ticket: Ticket, noads: Ban, blocks: Blocks, archive: Archive, shirt: Shirt, seat: Armchair, scan: ScanSearch, help: CircleHelp, access: LogIn };
export const safeMediaSource = (url) => /^(https?:\/\/|\/(?!\/)|data:(image|video)\/)/i.test(url ?? '') ? url : '';
const dimension = (mode, value) => mode === 'fixed' ? `${Math.max(0, Number(value) || 0)}px` : mode === 'fit' ? 'fit-content' : '100%';
const textPaintStyle=(color,opacity)=>isGradient(color)?{backgroundImage:gradientWithOpacity(color,opacity),backgroundClip:'text',WebkitBackgroundClip:'text',color:'transparent'}:{color:paintColor(color,opacity)};
export function componentStyle(node) {
  const props = componentProps(node);
  const numeric = (key, fallback = 0) => Number.isFinite(Number(props[key])) ? Number(props[key]) : fallback;
  const horizontalMargin = props.marginMode === 'individual' ? numeric('marginLeft') + numeric('marginRight') : 2 * numeric('marginHorizontal');
  return {
    width: props.widthMode === 'fill' && horizontalMargin ? `calc(100% - ${horizontalMargin}px)` : dimension(props.widthMode, props.width), height: props.heightMode === 'fixed' ? dimension('fixed', props.height) : props.heightMode === 'fill' ? '100%' : props.navigationRow ? 'fit-content' : undefined,
    minWidth: props.minWidth > 0 ? props.minWidth : 0, maxWidth: props.maxWidth > 0 ? props.maxWidth : undefined, flexShrink: 0, boxSizing: 'border-box',
    minHeight: props.minHeight > 0 ? props.minHeight : undefined, maxHeight: props.maxHeight > 0 ? props.maxHeight : undefined, background: props.fillEnabled === false ? 'transparent' : paintColor(props.background, props.backgroundOpacity),
    color: isGradient(props.color)?'inherit':paintColor(props.color, props.colorOpacity), flexGrow: props.flexGrow, fontSize: numeric('fontSize', 14), lineHeight: props.lineHeight, fontWeight: props.bold ? 700 : props.fontWeight, fontStyle: props.italic ? 'italic' : undefined, fontFamily: richTextFontFamily(props.fontFamily),
    textAlign: props.textAlign, opacity: node.type === 'Icon' ? 1 : numeric('opacity', 100) / 100, borderRadius: cornerRadius(props),
    border: props.borderEnabled !== false && props.borderWidth ? `${numeric('borderWidth')}px solid ${isGradient(props.borderColor)?'transparent':paintColor(props.borderColor, props.borderOpacity)}` : undefined,
    ...(props.borderEnabled!==false&&props.borderWidth&&isGradient(props.borderColor)?{'--nc-border-gradient':gradientWithOpacity(props.borderColor,props.borderOpacity),'--nc-border-width':`${numeric('borderWidth')}px`}:{}),
    boxShadow: props.shadowEnabled !== false && (props.shadowBlur || props.shadowX || props.shadowY) ? `${numeric('shadowX')}px ${numeric('shadowY')}px ${numeric('shadowBlur')}px ${paintColor(props.shadowColor ?? '#000000', props.shadowOpacity)}` : undefined,
    padding: props.paddingMode === 'individual' ? ['Top', 'Right', 'Bottom', 'Left'].map((side) => `${numeric(`padding${side}`)}px`).join(' ') : `${numeric('paddingVertical', numeric('paddingTop'))}px ${numeric('paddingHorizontal', numeric('paddingRight'))}px`,
    margin: props.marginMode === 'individual' ? ['Top', 'Right', 'Bottom', 'Left'].map((side) => `${numeric(`margin${side}`)}px`).join(' ') : `${numeric('marginVertical', numeric('marginTop'))}px ${numeric('marginHorizontal', numeric('marginRight'))}px`,
    alignSelf: props.alignSelf === 'auto' ? undefined : props.alignSelf,
    zIndex: props.navigationRow ? 2 : undefined,
    ...(props.fillEnabled !== false && props.textBackground && props.textBackground !== 'transparent' ? { background: paintColor(props.textBackground, props.backgroundOpacity) } : {}),
    ...(props.fillEnabled !== false && props.fillType === 'image' && props.backgroundImage ? { backgroundImage: `url(${JSON.stringify(safeMediaSource(props.backgroundImage))})`, backgroundSize: ({fill:'100% 100%',none:'auto'}[props.backgroundFit]) ?? props.backgroundFit ?? 'cover', backgroundPosition: props.backgroundPosition ?? 'center', backgroundRepeat: props.backgroundRepeat ?? 'no-repeat' } : {}),
  };
}
function containerStyle(node) {
  const p = componentProps(node);
  if (p.axis === 'overlay') return { display: 'grid', ...overlayAlignmentStyle(p) };
  return { display: 'flex', flexDirection: p.axis === 'horizontal' ? 'row' : 'column', gap: `${Math.max(0, Number(p.gap) || 0)}px`, alignItems: ({ start: 'flex-start', end: 'flex-end', stretch: 'stretch', center: 'center' }[p.align]) ?? 'stretch', justifyContent: ({ start: 'flex-start', end: 'flex-end', center: 'center', between: 'space-between', around: 'space-around', evenly: 'space-evenly' }[p.justify]) ?? 'flex-start', flexWrap: p.wrap ? 'wrap' : 'nowrap' };
}
function BackgroundVideo({ props }) {
  const src = props.fillEnabled !== false && props.fillType === 'video' ? safeMediaSource(props.backgroundVideo) : '';
  return src ? <video aria-hidden="true" data-background-video src={src} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: props.backgroundFit ?? 'cover', borderRadius: 'inherit', zIndex: -1, pointerEvents: 'none' }} /> : null;
}
function ComponentBadge({node,document,packageNode,timer}){
  const {runtime}=useContext(PreviewContext);
  const p=node.props;
  if(!(p.badgeEnabled??Boolean(p.badge)))return null;
  const badge={...BADGE_DEFAULTS,...p.badge},bottom=badge.position.startsWith('bottom'),side=badge.position.split('-')[1];
  const content=interpolateVariables(badge.text,document,packageNode,timer,runtime);
  const rich=richTextContent({p:badge,value:content,document,packageNode,timer,runtime,editing:true});
  return <span className="nc-badge" data-badge-owner={node.id} style={{...componentStyle({type:'Text',props:{...badge,textBackground:'transparent'},children:[]}),position:'absolute',zIndex:3,...(bottom?{bottom:0}:{top:0}),...(side==='center'?{left:'50%'}:side==='right'?{right:0}:{left:0}),transform:`translate(${side==='center'?'-50%':'0'},${badge.positionStyle==='overlay'?(bottom?'50%':'-50%'):'0'})`,maxWidth:'100%',whiteSpace:'pre-wrap',overflowWrap:'anywhere',pointerEvents:'none'}}><span style={{background:paintColor(badge.textBackground,badge.textBackgroundOpacity),textDecoration:badge.runs?.length?undefined:textDecoration(badge.strike,badge.underline)}}>{isGradient(badge.color)?<span style={textPaintStyle(badge.color,badge.colorOpacity)}>{rich}</span>:rich}</span></span>;
}
const textDecoration=(strike,underline)=>[strike&&'line-through',underline&&'underline'].filter(Boolean).join(' ')||undefined;
function richTextContent({p,value,document,packageNode,timer,editing,runtime}) {
  if(!p.runs?.length||p.binding)return value;
  return p.runs.map((run,index)=>{
    const href=safeTextLink(run.link),Tag=href?'a':'span';
    const content=interpolateVariables(run.text,document,packageNode,timer,runtime);
    const box=run.inlineBox;
    const boxStyle=box?{display:'inline-block',verticalAlign:'baseline',...Object.fromEntries(['width','borderRadius','paddingTop','paddingRight','paddingBottom','paddingLeft'].filter(key=>Number.isFinite(box[key])).map(key=>[key,Math.max(0,box[key])]))}:{};
    return <React.Fragment key={index}>{run.breakBefore&&<br/>}<Tag {...(href?{href,target:'_blank',rel:'noopener noreferrer',tabIndex:editing?-1:undefined,onClick:(event)=>{if(editing)event.preventDefault();else event.stopPropagation();}}:{})} style={{...boxStyle,...textPaintStyle(run.color??(href?'inherit':undefined),run.colorOpacity??p.colorOpacity),fontSize:run.fontSize?Number.parseFloat(run.fontSize):undefined,fontWeight:run.fontWeight??(run.bold===false?400:run.bold?700:undefined),fontStyle:(run.italic??p.italic)?'italic':'normal',fontFamily:run.code?'ui-monospace, monospace':richTextFontFamily(run.fontFamily),backgroundColor:run.backgroundColor??paintColor(box?.background),textDecoration:textDecoration(run.strikethrough??p.strike,(run.underline??p.underline)||Boolean(href))}}>{content}</Tag></React.Fragment>;
  });
}
function PageSequence({ node, context, props, attributes, style, children }) {
  const pages = sequencePages(node), count = pages.length;
  const chosen = Math.max(0, Math.min(Math.max(0, count - 1), context.runtime[node.id] ?? (node.type === 'Flow' ? flowInitialIndex(node) : props.defaultIndex ?? 0)));
  const fade=props.transitionAnimation==='fade';
  const plugins=useMemo(()=>fade?[Fade()]:[],[fade]);
  const [carouselRef, carousel] = useEmblaCarousel({ active: node.type === 'Carousel', align: 'center', containScroll:false, loop: Boolean(props.loop), startIndex: props.defaultIndex ?? 0, watchDrag: !context.editing },plugins);
  const pointerActive=useRef(false),animations=useRef([]);
  const pointerDown=()=>{pointerActive.current=true;},pointerUp=()=>{pointerActive.current=false;};
  useEffect(() => {
    if (!carousel) return;
    const select = () => { const index = carousel.selectedScrollSnap(); context.setRuntime((current) => current[node.id] === index ? current : { ...current, [node.id]: index }); };
    const down=()=>{pointerActive.current=true;animations.current.forEach((animation)=>animation.cancel());};
    const settled=()=>{pointerActive.current=false;};
    carousel.on('select', select).on('pointerDown',down).on('settle',settled);
    return () => {carousel.off('select', select).off('pointerDown',down).off('settle',settled);};
  }, [carousel, node.id, context.setRuntime]);
  useEffect(() => {
    if(!carousel || pointerActive.current || carousel.selectedScrollSnap()===chosen)return;
    animations.current.forEach((animation)=>animation.cancel());
    const track=carousel.containerNode?.(),slides=carousel.slideNodes?.()??[],view=track?.ownerDocument?.defaultView;
    const duration=context.editing?0:Math.max(0,Number(props.transitionTime??500));
    const from=fade?slides.map((slide)=>view?.getComputedStyle(slide).opacity):view?.getComputedStyle(track).transform;
    carousel.scrollTo(chosen,true);
    // Embla owns drag physics; programmatic transitions use the configured milliseconds.
    if(duration && view){
      if(fade)animations.current=slides.map((slide,index)=>{
        const transform=`translateX(${(track.parentElement.clientWidth-slide.offsetWidth)/2-slide.offsetLeft}px)`;
        return slide.animate([{opacity:from[index],transform},{opacity:index===chosen?1:0,transform}],{duration,easing:'ease-in-out'});
      });
      else if(track?.animate)animations.current=[track.animate([{transform:from},{transform:view.getComputedStyle(track).transform}],{duration,easing:'ease-in-out'})];
    }
  }, [carousel, chosen, context.editing, fade, props.transitionTime]);
  useEffect(()=>()=>animations.current.forEach((animation)=>animation.cancel()),[]);
  useEffect(() => {
    if (node.type !== 'Carousel' || !props.autoPlay || count < 2 || context.editing) return;
    const timer = setInterval(() => context.setRuntime((current) => {
      if(pointerActive.current)return current;
      const index = current[node.id] ?? props.defaultIndex ?? 0;
      return { ...current, [node.id]: index + 1 < count ? index + 1 : props.loop ? 0 : index };
    }), Math.max(250, Number(props.autoPlayInterval) || 2500));
    return () => clearInterval(timer);
  }, [node.type, node.id, count, props.autoPlay, props.loop, props.autoPlayInterval, props.defaultIndex, context.editing, context.setRuntime]);
  if (node.type !== 'Carousel') return <div {...attributes} style={{ ...style, ...(node.type==='Tabs'?{display:'block'}:containerStyle(node)) }}>{children(pages[chosen] ? [pages[chosen]] : [])}</div>;
  const peek = Math.max(0, Math.min(100, Number(props.pagePeek) || 0)), spacing = Math.max(0, Number(props.pageSpacing) || 0);
  const control=node.children.find((child)=>child.type==='PageControl');
  const pagination=control?children([control],false):!props.pageControlVersion && count>1?<div className="nc-pagination">{pages.map((child,index)=><button type="button" key={child.id} aria-label={`第 ${index+1} 页`} aria-current={chosen===index?'true':undefined} style={{color:chosen===index?props.activeDotColor??props.dotColor:props.dotColor}} onClick={(event)=>{event.stopPropagation();context.setRuntime((current)=>({...current,[node.id]:index}));}}>●</button>)}</div>:null;
  const bounded = props.heightMode !== 'fit';
  attributes.onPointerDown=pointerDown;attributes.onPointerUp=pointerUp;attributes.onPointerCancel=pointerUp;
  return <CarouselContext.Provider value={{id:node.id,pages,chosen}}><div {...attributes} style={{...style,display:'flex',flexDirection:'column',gap:0}}><BackgroundVideo props={props}/>{props.pageControlPosition === 'top' && pagination}<div ref={carouselRef} className="nc-carousel-viewport" style={{overflow:'hidden',minWidth:0,width:'100%',...(bounded?{flex:'1 1 0%',minHeight:0}:{})}}><div className="nc-carousel-track" style={{display:'flex',...(bounded?{height:'100%'}:{}),gap:spacing,alignItems:({top:'flex-start',center:'center',bottom:'flex-end'}[props.pageAlignment??'top']),touchAction:'pan-y pinch-zoom',...(!carousel ? {transform:`translateX(calc(${peek}px - ${chosen} * (100% - ${peek*2}px + ${spacing}px)))`} : {})}}>{pages.map((child,index)=><div key={child.id} data-carousel-page={index} aria-hidden={index!==chosen} style={{flex:`0 0 calc(100% - ${peek*2}px)`,minWidth:0,...(bounded?{height:'100%'}:{})}}>{children([child],false)}</div>)}</div></div>{props.pageControlPosition !== 'top' && pagination}</div></CarouselContext.Provider>;
}
function Disclosure({label,delay,scope,editing,children}) {
  const [open,setOpen]=useState(editing);
  const timer=useRef(null);
  useEffect(()=>{setOpen(editing);if(editing||delay<0)return;timer.current=setTimeout(()=>setOpen(true),delay??1500);return()=>clearTimeout(timer.current);},[scope,delay,editing]);
  return <><button type="button" aria-expanded={open} onClick={event=>{event.stopPropagation();clearTimeout(timer.current);setOpen(value=>!value);}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,border:0,background:'transparent',padding:8,font:'inherit',color:'inherit',width:'100%',cursor:'pointer'}}>{label}<ChevronRight size={16} style={{transform:open?'rotate(90deg)':'none'}}/></button>{open&&children}</>;
}

export function NativeComponent({ node, packageNode = null, floating = false, layoutStyle }) {
  const context = useContext(PreviewContext);
  const timer = useContext(TimerContext);
  const sequence=useContext(CarouselContext);
  const repeated=useContext(ItemContext),item=repeated?.item;
  const { document, selectedId, onSelect, editing, runtime, setRuntime, runAction } = context;
  const conditionalNode=comparisonRowProps(logicNode(node,document,runtime,context.selectedPackage),context.nodeIndex,source=>logicNode(source,document,runtime,context.selectedPackage));
  let baseProps = node.type==='Text'?textRuleProps(componentProps(conditionalNode),runtime.textRule):componentProps(conditionalNode);
  if(item)baseProps={...baseProps,text:interpolateItem(baseProps.text,item),runs:baseProps.runs?.map(run=>({...run,text:interpolateItem(run.text,item)})),src:interpolateItem(baseProps.src,item),action:baseProps.action?{...baseProps.action,actionUrl:interpolateItem(baseProps.action.actionUrl,item)}:undefined};
  const group = baseProps.group ?? node.id;
  const owner = selectionOwner(node, context.nodeIndex, context.parentIndex);
  const ownerProps = owner ? componentProps(owner) : {};
  const selectedOwner = selectionOwner(context.nodeIndex.get(selectedId), context.nodeIndex, context.parentIndex);
  const selectedGroup = ownerProps.group ?? owner?.id;
  const ownerSelected = owner?.type === 'TabButton' ? (runtime[ownerProps.target] ?? context.nodeIndex.get(ownerProps.target)?.props.defaultIndex ?? 0) === ownerProps.index : runtime[`package:${selectedGroup}`] !== undefined ? runtime[`package:${selectedGroup}`] === owner?.id : Boolean(ownerProps.defaultSelected);
  const previewState = editing && selectedOwner?.id === owner?.id ? runtime[`package-style:${owner?.id}`] : null;
  const inspectedGroup = selectedOwner?.props.group ?? selectedOwner?.id;
  const peerPreview = editing && owner?.type === 'Package' && selectedOwner?.type === 'Package' && selectedGroup === inspectedGroup && runtime[`package-style:${selectedOwner.id}`];
  const stateSelected = peerPreview ? owner.id === selectedOwner.id && peerPreview === 'selected' : previewState ? previewState === 'selected' : ownerSelected;
  const visualNode = { ...node, props: owner ? stateStyleProps(baseProps, stateSelected) : baseProps };
  const props = componentProps(visualNode);
  if (props.hidden || (['overlay','sheet'].includes(props.presentation) && !floating)) return null;
  if (props.visibleWhen && Boolean(runtime[props.visibleWhen.id] ?? context.nodeIndex.get(props.visibleWhen.id)?.props.initial) !== props.visibleWhen.value) return null;
  const currentPackage = node.type === 'Package' ? node : packageNode;
  if (props.productField && !(currentPackage?.props.productType ? productParameterPreview(parameterFromBinding(props.productField,currentPackage),currentPackage,stateSelected) : resolveComponentText({ props: { binding: { key: currentPackage?.props.dataKey, field: props.productField } } }, document, currentPackage, stateSelected))) return null;
  const variablePackage = currentPackage ?? context.selectedPackage;
  const entries=props.dataSource?businessList(document,props.dataSource,variablePackage):null;
  if(entries&&!entries.length)return null;
  const select = (event) => {
    if (!editing) return;
    event.stopPropagation();
    onSelect(canvasSelectionTarget(node, selectedId, context.nodeIndex, context.parentIndex));
  };
  const parentNode=context.nodeIndex.get(context.parentIndex.get(node.id));
  const effectiveProps = (candidate) => componentProps({...candidate,props:owner && selectionOwner(candidate,context.nodeIndex,context.parentIndex)?.id===owner.id ? stateStyleProps(candidate.props,stateSelected) : candidate.props});
  const parentProps=parentNode?effectiveProps(parentNode):null;
  if (parentProps?.heightMode === 'fill' && !hasBoundedHeight(parentNode, context.nodeIndex, context.parentIndex, effectiveProps)) parentProps.heightMode = 'fit';
  const style = { ...componentStyle(visualNode), ...(!floating ? mainAxisFillStyle(props,parentProps) : {}), ...layoutStyle };
  if (node.type === 'Screen') {
    style.minHeight = props.minHeight > 0 ? props.minHeight : node.id === document.root.id && props.heightMode === 'fit' ? 844 : 0;
    if (node.id === document.root.id && props.heightMode === 'fill') style.height = 844;
  }
  if (floating) {
    style.flexShrink = 1;
    for (const axis of ['Width','Height']) {
      style[`max${axis}`] = props[`max${axis}`] > 0 ? `min(100%, ${props[`max${axis}`]}px)` : '100%';
      if (props[`min${axis}`] > 0) style[`min${axis}`] = `min(100%, ${props[`min${axis}`]}px)`;
    }
  }
  const attributes = { 'data-component-id': node.id, 'data-component-type': node.type, 'data-axis': props.axis, 'data-width': props.widthMode, 'data-height': props.heightMode, className: `nc-node nc-${node.type.toLowerCase()} ${floating ? 'nc-modal-surface' : ''} ${editing && selectedId === node.id ? 'nc-inspected' : ''} ${editing && context.hoveredId === node.id ? 'nc-hovered' : ''}`, style, onClick: select };
  if(repeated&&repeated.index>0){attributes['data-component-id']=`${node.id}::${repeated.item.id}`;attributes['data-template-id']=node.id;}
  const children = (items = orderedComparisonCells(node,parentNode,context.businessOrdering), background = true) => <>{background && <BackgroundVideo props={props} />}{entries?entries.map((item,index)=><ItemContext.Provider key={item.id} value={{item,index}}>{items.filter(child=>child.type!=='BottomSheet').map(child=><NativeComponent key={child.id} node={child} packageNode={currentPackage}/>)}</ItemContext.Provider>):items.map((child) => <NativeComponent key={child.id} node={child} packageNode={currentPackage} />)}{background&&<ComponentBadge node={visualNode} document={document} packageNode={variablePackage} timer={timer}/>}</>;
  if(props.dataSource||props.collapsible||node.type==='Stack'&&props.horizontalScroll)return <div {...attributes} style={{...style,...(props.collapsible?{display:'flex',flexDirection:'column'}:containerStyle(visualNode)),...(props.horizontalScroll?{overflowX:'auto',overscrollBehaviorX:'contain'}:{})}}>{props.collapsible?<Disclosure label={props.collapseLabel??'展开内容'} delay={props.autoExpandDelay??1500} scope={`${variablePackage?.id??''}:${entries?.map(item=>item.id).join(',')??node.id}`} editing={editing}><div className="nc-disclosure-content" style={{...containerStyle(visualNode),flex:'1 1 auto',minWidth:0,minHeight:0}}>{children()}</div></Disclosure>:children()}</div>;
  if(node.type==='PageControl')return <div {...attributes} style={{...style,display:'flex',justifyContent:'center',alignItems:'center',gap:props.gap}}>{children()}</div>;
  if(node.type==='Indicators')return <>{sequence?.pages.map((page,index)=>{
    const active=index===sequence.chosen && (!editing || selectedId!==node.id || runtime[`package-style:${node.id}`]==='selected');
    const dotStyle=componentStyle({...node,props:stateStyleProps(baseProps,active)});
    return <button {...attributes} key={page.id} type="button" data-indicator-index={index} title={`第 ${index+1} 页`} aria-label={`第 ${index+1} 页`} aria-current={index===sequence.chosen?'true':undefined} style={{...dotStyle,display:'block',padding:0,margin:0,borderRadius:'50%',cursor:'pointer'}} onClick={(event)=>{event.stopPropagation();if(editing)onSelect(node.id);else setRuntime((current)=>({...current,[sequence.id]:index}));}}/>;
  })}</>;
  if (['Text','ProductParameter'].includes(node.type)) {
    const issues=variableIssues(resolveComponentText(visualNode,document,currentPackage,stateSelected),document,variablePackage,timer,runtime);
    if(editing&&issues.length)attributes.title=issues.map(item=>`${item.key}：${item.reason}，预览以空值回退`).join('；');
    const value = props.timerField && timer ? timer[props.timerField] ?? '' : interpolateVariables(resolveComponentText(visualNode, document, currentPackage, stateSelected), document, variablePackage, timer,runtime);
    if ((node.props.binding || node.type==='ProductParameter') && !value) return null;
    const rich = Boolean(node.type==='Text' && props.runs?.length && !props.binding);
    const content=node.type==='ProductParameter'?value:richTextContent({p:props,value,document,packageNode:variablePackage,timer,editing,runtime});
    return <div {...attributes} style={{ ...style, textDecoration: rich ? undefined : textDecoration(props.strike, props.underline), whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: props.lineHeight ?? 1.35 }}>{isGradient(props.color)?<span style={textPaintStyle(props.color,props.colorOpacity)}>{content}</span>:content}</div>;
  }
  if (node.type === 'Image' || node.type === 'Video') {
    const src = safeMediaSource(props.src);
    const circle = imageMask(props) === 'circle';
    return <div {...attributes} style={{ ...style, ...(circle ? { borderRadius: '50%' } : {}), ...(circle || props.mask === 'rounded' || props.shape !== 'rectangle' || props.radius > 0 || props.radiusMode === 'individual' ? { overflow: 'hidden' } : {}) }}>
      {node.type==='Image'&&props.mediaType==='pag'?<React.Suspense fallback={safeMediaSource(props.fallbackSrc)?<img alt={props.altText??'图片'} src={safeMediaSource(props.fallbackSrc)} style={{width:'100%',height:'100%',objectFit:props.objectFit}}/>:null}><PagMedia src={props.pagSrc} fallback={safeMediaSource(props.fallbackSrc)} loop={props.pagLoop!==false} autoPlay={props.pagAutoPlay!==false} objectFit={props.objectFit} alt={props.altText??'PAG动画'}/></React.Suspense>:src ? node.type === 'Video' ? <video src={src} autoPlay={props.autoPlay ?? false} loop={props.loop ?? false} muted={props.muted ?? true} playsInline controls={props.controls ?? true} style={{ width: '100%', height: '100%', objectFit: props.objectFit, borderRadius: 'inherit', display:'block' }} /> : <img src={src} alt={props.decorative ? '' : props.altText ?? node.name ?? '图片'} draggable={false} style={{ width: '100%', height: '100%', objectFit: props.objectFit, display: 'block', borderRadius: 'inherit' }} /> : <div className="nc-empty-media" />}
      {(src || node.type==='Image'&&props.mediaType==='pag'&&(props.pagSrc||props.fallbackSrc)) && props.overlayEnabled !== false && props.overlayColor && props.overlayColor !== 'transparent' && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: paintColor(props.overlayColor, props.overlayOpacity), borderRadius: 'inherit', pointerEvents: 'none' }} />}
    </div>;
  }
  if (node.type === 'Custom') return <div {...attributes}>{props.html!==undefined&&!props.customBundle?<iframe title={node.name} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; font-src data:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;box-sizing:border-box;font-family:Arial,sans-serif}</style></head><body>${props.html}</body></html>`} style={{width:'100%',height:'100%',border:0,pointerEvents:editing?'none':'auto'}}/>:<CustomComponentPreview node={node} props={props} document={document} packages={context.packages} packageNode={currentPackage} selectedPackage={context.selectedPackage} editing={editing}/>}</div>;
  if (node.type === 'Icon') {
    const Icon = icons[props.icon];
    const inset = (axis) => props.paddingMode === 'individual' ? Number(props[`padding${axis === 'width' ? 'Left' : 'Top'}`]) + Number(props[`padding${axis === 'width' ? 'Right' : 'Bottom'}`]) : 2 * Number(props[`padding${axis === 'width' ? 'Horizontal' : 'Vertical'}`]);
    const border = props.borderEnabled === false ? 0 : props.borderWidth;
    const width = Math.max(0, props.width - inset('width') - 2 * border), height = Math.max(0, props.height - inset('height') - 2 * border);
    return <div {...attributes} style={{ ...style, ...(props.icon === 'number' ? { fontSize: Math.min(width, height) } : {}), background: props.iconBackgroundEnabled === false ? 'transparent' : props.iconBackground !== 'transparent' ? paintColor(props.iconBackground, props.iconBackgroundOpacity) : style.background }} >{parseTablerIcon(props.icon)?<TablerGlyph icon={props.icon} width={width} height={height}/>:Icon ? <Icon width={width} height={height} /> : props.icon === 'number' ? props.number ?? '1' : props.icon ?? '✓'}</div>;
  }
  if (node.type === 'Toggle') {
    const checked=checkedControl(props,node.id,runtime,context.nodeIndex);
    const change=(value)=>setRuntime((current)=>({...current,[node.id]:value,...(props.switchTarget?{[props.switchTarget]:value?1:0}:{})}));
    if(props.switchControl)return <div {...attributes} style={{...style,width:51,height:31,padding:0,margin:0}}><button type="button" role="switch" aria-label={node.name} aria-checked={checked} style={{position:'relative',display:'block',border:0,width:51,height:31,padding:2,borderRadius:99,background:paintColor(props.trackColor,props.trackColorOpacity),cursor:'pointer'}} onClick={(event)=>{event.stopPropagation();if(editing)onSelect(node.id);else change(!checked);}}><span style={{display:'block',width:27,height:27,borderRadius:'50%',background:paintColor(props.thumbColor,props.thumbColorOpacity),transform:`translateX(${checked?20:0}px)`,boxShadow:'0 1px 3px #0003, 0 1px 2px #0002'}}/></button></div>;
    return <div {...attributes}><input type="checkbox" role={props.control === 'checkbox' ? 'checkbox' : 'switch'} aria-label={node.name} checked={checked} onChange={(event) => change(event.target.checked)} onClick={(event) => { event.stopPropagation(); if (editing) onSelect(node.id); }} /></div>;
  }
  if (node.type === 'Countdown') return <div {...attributes} style={{...style,...containerStyle(visualNode)}}><BackgroundVideo props={props}/>{node.children.length ? <CountdownContent key={`${node.id}-${props.start}-${props.deadline}`} node={node} context={context} packageNode={currentPackage}/> : <Countdown key={`${node.id}-${props.start}`} props={props} />}</div>;
  if (node.type === 'Wallet') {
    const checkout=()=>runAction({...node,props:{...props,action:{action:'Purchase'}}});
    return <div {...attributes} role="button" tabIndex={0} style={{...style,...(props.walletStyle?{background:props.walletStyle==='black'?'#000000':'#ffffff',color:props.walletStyle==='black'?'#ffffff':'#000000',border:props.walletStyle==='white-outline'?'1px solid #000000':'none'}:{}),display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={event=>{select(event);if(!editing){event.stopPropagation();checkout();}}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(editing)onSelect(node.id);else checkout();}}}>{props.method === 'google' ? 'Google Pay' : 'Apple Pay'}</div>;
  }
  if (node.type === 'Switch') {
    const chosen = runtime[node.id] ?? props.defaultIndex ?? 0;
    return <div {...attributes} style={{...style,display:'block'}}>{children(node.children.filter((child)=>child.type !== 'SwitchCase' || child.props.index === chosen))}</div>;
  }
  if (node.type === 'ExpressCheckout') return <div {...attributes} style={{...style,...containerStyle(visualNode)}}>{children(node.children.filter((child)=>child.props.state === (runtime[node.id] ?? props.previewState ?? 'available')))}</div>;
  if (node.type === 'Package') {
    return <div {...attributes} role="button" tabIndex={0} aria-pressed={stateSelected} style={{ ...style, ...containerStyle(visualNode) }} onClick={(event) => { event.stopPropagation(); if(editing)select(event);else setRuntime((current) => ({ ...current, [`package:${group}`]: node.id, selectedPackage: node.id })); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault();event.stopPropagation();if(editing)onSelect(node.id);else setRuntime((current) => ({ ...current, [`package:${group}`]: node.id, selectedPackage: node.id })); } }}>{children()}</div>;
  }
  if (['Tabs', 'Carousel', 'Flow'].includes(node.type)) {
    return <PageSequence node={visualNode} context={context} props={props} attributes={attributes} style={style} children={children} />;
  }
  if (node.type === 'Timeline' || node.type === 'TimelineItem') {
    const Timeline = node.type === 'Timeline' ? TimelinePreview : TimelineItemPreview;
    return <Timeline node={node} props={props} attributes={attributes} style={style} render={(child, childLayout) => <NativeComponent key={child.id} node={child} packageNode={currentPackage} layoutStyle={childLayout} />} />;
  }
  if (['Button','TabButton','PurchaseButton'].includes(node.type)) {
    if(['Purchase','WebCheckout','WebPaywall','CustomCheckout'].includes(props.action?.action)) attributes['data-purchase-sku']=document.products[(currentPackage??context.selectedPackage)?.props.dataKey]?.skuId??'';
    const buttonContent = node.children.filter((child) => child.type !== 'BottomSheet' && !['overlay','sheet'].includes(child.props.presentation));
    if (buttonContent.length && buttonContent.every((child) => child.type === 'Icon')) { attributes['aria-label'] = node.name; attributes.title = node.name; }
    const blocked = props.action?.action === 'OpenPage' && isUnconfiguredDetailPage(context.nodeIndex.get(props.action.actionPage));
    const disabled=!editing&&Boolean(props.disabled);
    return <div {...attributes} role="button" tabIndex={disabled?-1:0} aria-disabled={!editing && (blocked||disabled) || undefined} style={{ ...style, ...containerStyle(visualNode), ...(!editing&&(blocked||disabled)?{cursor:'default'}:{}),...(disabled?{opacity:(style.opacity??1)*.5}:{}) }} onClick={(event) => { select(event); if(disabled){event.stopPropagation();return;}if (node.type === 'TabButton') setRuntime((current) => ({ ...current, [props.target]: props.index })); else if (!editing) { event.stopPropagation(); runAction({...node,props},item); } }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if(disabled)return;if (editing) onSelect(node.id); else if (node.type === 'TabButton') setRuntime((current) => ({ ...current, [props.target]: props.index })); else runAction({...node,props},item); } }}>{children()}</div>;
  }
  if (node.type === 'Screen' && !node.children.some(child => child.type === 'Flow') && (props.pagePresentation || node.children.some(child=>['Header','Footer'].includes(child.type)))) {
    const chrome = screenChromeLayout(node, runtime, context.nodeIndex);
    if (!props.pagePresentation) return <div {...attributes} data-axis="vertical" data-header-overlap={chrome.underHeader||undefined} style={{...style,display:'grid',gridTemplateColumns:'minmax(0, 1fr)',gridTemplateRows:`${chrome.header?'auto':'0px'} 1fr ${chrome.footer?'auto':'0px'}`,minHeight:props.heightMode==='fit'?Math.max(style.minHeight??0,context.viewportHeight):style.minHeight}}>
      <BackgroundVideo props={props}/>{chrome.header&&<NativeComponent node={chrome.header} packageNode={currentPackage} layoutStyle={{gridColumn:1,gridRow:1,alignSelf:'start'}}/>}
      <div className="nc-screen-content" data-axis={props.axis} style={{...containerStyle(visualNode),gridColumn:1,gridRow:chrome.underHeader?'1 / 3':2,minWidth:0}}>{children(chrome.content,false)}</div>
      {chrome.footer&&<NativeComponent node={chrome.footer} packageNode={currentPackage} layoutStyle={{gridColumn:1,gridRow:3,alignSelf:'end'}}/>}</div>;
    const frame = pageFrame(props, context.viewportHeight);
    // The presentation frame owns geometry; only content scrolls between fixed chrome rows.
    const backdrop = node.children.find(child=>child.props.pageBackdrop);
    return <div className="nc-page-frame" data-page-presentation={frame.mode} style={{height:context.viewportHeight,padding:frame.inset,background:frame.mode==='fullscreen'?'transparent':props.windowBackdrop??'#8f8f8f'}} onClick={select}>
    {frame.mode!=='fullscreen'&&backdrop&&<NativeComponent node={backdrop} layoutStyle={{position:'absolute',inset:0,width:'100%',height:'100%',zIndex:0}}/>}
    <div {...attributes} data-axis="vertical" data-header-overlap={chrome.underHeader || undefined} style={{ ...style, width:'100%',maxWidth:'100%',height:frame.height,minHeight:0,maxHeight:'100%',margin:0,borderRadius:frame.radius,overflow:'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: `${chrome.header ? 'auto' : '0px'} minmax(0, 1fr) ${chrome.footer ? 'auto' : '0px'}` }}>
      <BackgroundVideo props={props} />
      {chrome.header && <NativeComponent node={chrome.header} packageNode={currentPackage} layoutStyle={{ gridColumn: 1, gridRow: 1, alignSelf: 'start' }} />}
      <div className="nc-screen-content" role="region" aria-label={`${node.name}内容`} tabIndex={0} data-axis={props.axis} style={{ ...containerStyle(visualNode), gridColumn: 1, gridRow: chrome.underHeader ? '1 / 3' : 2, minWidth: 0,minHeight:0,overflowY:'auto',overflowX:'hidden',overscrollBehavior:'contain' }}>{children(chrome.content, false)}</div>
      {chrome.footer && <NativeComponent node={chrome.footer} packageNode={currentPackage} layoutStyle={{ gridColumn: 1, gridRow: 3, alignSelf: 'end' }} />}
    </div></div>;
  }
  return <div {...attributes} style={{ ...style, ...containerStyle(visualNode), ...(['Header','Footer'].includes(node.type)?{position:'sticky',[node.type==='Header'?'top':'bottom']:0,zIndex:4}:{} ), ...layoutStyle }}>{children()}</div>;
}
function CountdownContent({node,context,packageNode}) {
  const now=Number.isFinite(context.runtime.$time?.now)?context.runtime.$time.now:Date.now();
  const [opened] = useState(()=>now);
  const duration = countdownSeconds(node.props.start ?? '00:10:00');
  const deadline = node.props.deadline ? countdownDeadline(node.props.deadline) : duration === null ? NaN : opened + duration * 1000;
  const business=node.props.timeSource==='business'?resolveBusinessTime(context.document,node.props.timeSourceId,context.runtime):null;
  const seconds = business?.seconds??Math.max(0,Math.ceil((deadline-now)/1000)||0);
  const actualState=business?.state??(!Number.isFinite(deadline)?'fallback':seconds?'active':'ended');
  const state = context.editing ? context.runtime[node.id] ?? (node.props.previewState && node.props.previewState !== 'auto' ? node.props.previewState : actualState) : actualState;
  useEffect(()=>{context.setRuntime((current)=>current[`countdown-state:${node.id}`]===state?current:{...current,[`countdown-state:${node.id}`]:state});},[context.setRuntime,node.id,state]);
  const values = countdownValues(seconds, node.props.countFrom);
  return <TimerContext.Provider value={values}>{node.children.filter((child)=>child.props.state === state && (state!=='fallback'||node.props.fallbackEnabled!==false)).map((child)=><NativeComponent key={child.id} node={child} packageNode={packageNode}/>)}</TimerContext.Provider>;
}
function Countdown({ props }) {
  const parse = (value) => { const parts = String(value ?? '00:00:00').split(':').map(Number); return parts.length === 3 && parts.every(Number.isFinite) ? Math.max(0, parts[0] * 3600 + parts[1] * 60 + parts[2]) : 0; };
  const [remaining, setRemaining] = useState(() => parse(props.start));
  useEffect(() => { const timer = window.setInterval(() => setRemaining((current) => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, []);
  const parts = [Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60];
  return <span className="nc-countdown"><span style={{ color: props.prefixColor }}>{props.prefix}</span>{parts.map((part, index) => <React.Fragment key={index}>{index > 0 && <span>:</span>}<strong style={{ background: props.digitBackground, borderRadius: 4, padding: '0 3px' }}>{String(part).padStart(2, '0')}</strong></React.Fragment>)}<span>{props.suffix}</span></span>;
}
export default function ComponentPreview({ document: sourceDocument, businessTime, businessOrdering, selectedId, highlightedId, onSelect, editing, inspectable = true, navigation, onNavigate, onStatus, onDismiss, onResume, dismissRequest = 0, dismissOnBackdrop = false }) {
  const document=useMemo(()=>localizedDocument(sourceDocument,navigation),[sourceDocument,navigation?.contentLocale,navigation?.contentTheme,navigation?.contentPlatform]);
  const [localRuntime, setRuntime] = useState({});
  const clock=useMemo(()=>clockAnchor(businessTime),[businessTime]);
  const [tick,setTick]=useState(()=>performance.now());
  const needsClock=useMemo(()=>[...indexDocument(document).nodes.values()].some(node=>node.type==='Countdown')||(document.logic?.rules??[]).some(rule=>rule.conditions.some(condition=>condition.type==='timeSource')),[document]);
  useEffect(()=>{if(!needsClock)return;const interval=setInterval(()=>setTick(performance.now()),1000);return()=>clearInterval(interval);},[needsClock]);
  const runtime={...localRuntime,$time:{now:clockNow(clock,tick),context:businessTime}};
  const [hoveredId, setHoveredId] = useState(null);
  const previousDocument = useRef(document);
  const viewport = useRef(null), phone=useRef(null), [scale, setScale] = useState(0.82), [viewportHeight, setViewportHeight] = useState(844);
  const navigationKey = JSON.stringify(Object.entries(navigation ?? {}).sort(([a], [b]) => a.localeCompare(b)));
  useEffect(() => setHoveredId(null), [editing, inspectable, selectedId, navigationKey, document]);
  useEffect(() => {
    const previous = indexDocument(previousDocument.current).nodes;
    previousDocument.current = document;
    setRuntime((current) => {
      const next = { ...current };
      for (const node of indexDocument(document).nodes.values()) {
        const old = previous.get(node.id);
        if (!old) continue;
        if (node.props.defaultIndex !== old.props.defaultIndex || node.props.initialStepId !== old.props.initialStepId || node.props.initial !== old.props.initial || node.props.previewState !== old.props.previewState) { delete next[node.id]; delete next[`history:${node.id}`]; }
        if (node.type === 'Package' && (node.props.defaultSelected !== old.props.defaultSelected || node.props.group !== old.props.group)) {
          delete next[`package:${node.props.group ?? node.id}`];
          delete next[`package:${old.props.group ?? node.id}`];
          delete next.selectedPackage;
        }
      }
      return { ...next, ...navigation };
    });
  }, [document, navigationKey]);
  useLayoutEffect(() => { const resize = () => { const scale = (phone.current?.clientWidth ?? 320) / 390; setScale(scale); setViewportHeight(phone.current?.clientHeight ? phone.current.clientHeight / scale : 844); }; const observer = new ResizeObserver(resize); if (phone.current) observer.observe(phone.current); resize(); return () => observer.disconnect(); }, []);
  useEffect(() => {
    if (!editing) return;
    const root = viewport.current;
    const element = [...(root?.querySelectorAll('[data-component-id]') ?? [])].find((item) => item.dataset.componentId === selectedId);
    if (!root || !element || element.matches('.nc-screen, .nc-flow')) return;
    const outer = root.getBoundingClientRect(), inner = element.getBoundingClientRect();
    // Rects include canvas zoom; scrollTop is measured before that transform.
    const zoom = outer.height / root.clientHeight;
    if (!(zoom > 0)) return;
    if (inner.top < outer.top) root.scrollTop += (inner.top - outer.top) / zoom;
    else if (inner.bottom > outer.bottom) root.scrollTop += Math.min(inner.top - outer.top, inner.bottom - outer.bottom) / zoom;
  }, [selectedId, navigationKey, editing]);
  const runAction = (node,item) => {
    const current=logicNode(node,document,{...runtime,$time:{...runtime.$time,now:clockNow(clock)}},commerce.background.selectedPackage);
    if(current.props.disabled||current.props.hidden)return;
    const action = node.props.action ?? {};
    if (!action.action || action.action === 'None') return;
    if(['Purchase','WebCheckout','WebPaywall','CustomCheckout'].includes(action.action)) {
      if(!isExitOfferStep(document,runtime)&&!(document.settings?.buttonModalVersion&&indexDocument(document).nodes.get(runtime.overlay)?.type==='BottomSheet')){onStatus('商品选择和购买只能在最终步骤进行');return;}
      const required=activeComponents(document,runtime).find((item)=>item.type==='Toggle'&&item.props.required&&!checkedControl(item.props,item.id,runtime,indexDocument(document).nodes));
      if(required){onStatus('请先勾选同意协议');return;}
      let owner=nodeIndex.get(parentIndex.get(node.id));
      while(owner&&!['Package','BottomSheet','Screen'].includes(owner.type))owner=nodeIndex.get(parentIndex.get(owner.id));
      const scope=owningModal(document,node.id)?commerce.floating:commerce.background;
      const target=owner?.type==='Package'?owner:scope.selectedPackage;
      const row=document.products[target?.props.dataKey??target?.id];
      if(document.productFieldPreview?!target:!row||!productPriceFields(row).total){onStatus('请先选择有效的商品套餐');return;}
    }
    if (action.action === 'NavigateTo') { onStatus('请先选择跳转目标'); return; }
    if (action.action === 'OpenSheet') {
      const target = indexDocument(document).nodes.get(action.actionPage);
      if (target?.type === 'BottomSheet' && !target.props.hidden) setRuntime((current)=>({...openSheetNavigation(current,target.id),[`modal-item:${target.id}`]:item??null})); else onStatus('请先选择有效的弹层');
    } else if (action.action === 'CloseSheet') {
      if (document.settings?.presentationSurfaceId && onResume) { onResume(); return; }
      if (document.settings?.presentationSurfaceId && onDismiss) { dismissPaywall(); return; }
      setRuntime(closeSheetNavigation);
    } else if (action.action === 'NavigateBack') {
      const {nodes,parents}=indexDocument(document);let flow=nodes.get(parents.get(node.id));
      while(flow&&!['Flow','BottomSheet'].includes(flow.type))flow=nodes.get(parents.get(flow.id));
      if(flow?.type!=='Flow')flow=null;
      const index=flow?(runtime[flow.id]??flowInitialIndex(flow)):0;
      const history=flow?runtime[`history:${flow.id}`]??[]:[];
      const previous=flow?flow.children.findIndex((page)=>page.id===history.at(-1)):-1;
      if(flow&&(previous>=0||!flow.props.initialStepId&&index>0)){const next={[flow.id]:previous>=0?previous:index-1,[`history:${flow.id}`]:history.slice(0,-1)};setRuntime((current)=>({...current,...next}));onNavigate?.(next);if(viewport.current)viewport.current.scrollTop=0;}
      else if (runtime.overlay) {
        if (document.settings?.presentationSurfaceId && onResume) onResume();
        else if (document.settings?.presentationSurfaceId && onDismiss) dismissPaywall();
        else setRuntime(closeSheetNavigation);
        return;
      }
      else dismissPaywall();
    } else if (action.action === 'Dismiss') {
      dismissPaywall();
    } else if (['OpenURL','OpenPrivacy','OpenTerms'].includes(action.action)) {
      const link = actionLink(action);
      if (!link) onStatus('请填写有效链接；仅深链方式支持应用协议');
      else if (link.method === 'in_app_browser') setRuntime((current)=>({...current,webLink:link}));
      else if (link.method === 'deep_link') window.location.assign(link.url);
      else window.open(link.url, '_blank', 'noopener,noreferrer');
    } else if (action.action === 'OpenPage') {
      const { nodes, parents } = indexDocument(document), target = stepDestination(document, node), owner = nodes.get(parents.get(target?.id));
      if (isUnconfiguredDetailPage(target)) { onStatus('该权益详情内容待补充，暂不开放跳转'); return; }
      if (owner?.type === 'Flow') { const currentId=owner.children[runtime[owner.id]??flowInitialIndex(owner)]?.id; const next = { [owner.id]: owner.children.findIndex((item) => item.id === target.id), overlay: owningModal(document,target.id)?.id ?? null, [`history:${owner.id}`]: [...runtime[`history:${owner.id}`]??[],currentId] }; setRuntime((current) => ({ ...current, ...next })); onNavigate?.(next); if (viewport.current) viewport.current.scrollTop = 0; }
      else onStatus('尚未配置有效的目标页面');
    } else if (action.action === 'NextScreen') {
      const {nodes,parents}=indexDocument(document);
      let flow=nodes.get(parents.get(node.id));
      while(flow&&flow.type!=='Flow')flow=nodes.get(parents.get(flow.id));
      flow ??= activeComponents(document,runtime).find((item)=>item.type==='Flow');
      const target=stepDestination(document,node);
      if (!flow || !target || !flow.children.some((page)=>page.id===target.id)) return onStatus('请选择有效的目标步骤');
      const currentId=flow.children[runtime[flow.id]??flowInitialIndex(flow)]?.id;
      const next = { [flow.id]: flow.children.findIndex((page)=>page.id===target.id), overlay:owningModal(document,target.id)?.id??null, [`history:${flow.id}`]: [...runtime[`history:${flow.id}`]??[],currentId] }; setRuntime((current) => ({ ...current, ...next })); onNavigate?.(next); if(viewport.current)viewport.current.scrollTop=0;
    } else if (action.action === 'CustomCheckout') {
      const {nodes,parents}=indexDocument(document);let owner=nodes.get(parents.get(node.id));
      while(owner&&owner.type!=='Package')owner=nodes.get(parents.get(owner.id));
      const packageNode=owner??(owningModal(document,node.id)?commerce.floating:commerce.background).selectedPackage;
      if(action.attachPackageId!==false&&!packageNode){onStatus('请先选择商品套餐');return;}
      const link=customCheckoutLink(action,{packageId:packageNode?.props.dataKey??packageNode?.id,appUserId:'demo-preview',environment:'sandbox'});
      if(!link)onStatus('请填写有效结账链接；仅深链方式支持应用协议');
      else if(link.method==='deep_link')window.location.assign(link.url);
      else window.open(link.url,'_blank','noopener,noreferrer');
    } else if (action.action === 'Purchase') {
      onStatus(node.type==='Wallet'?'钱包结账预览：未发起真实交易':'购买预览：未发起真实交易');
    } else if(action.action==='WebPaywall') {
      onStatus('网页付费墙预览：未发起真实交易');
    } else onStatus(({ RestorePurchases: '恢复购买预览', Dismiss: '关闭预览', WebCheckout: '网页结账预览', OfferCodeRedemption: '优惠码兑换预览', OpenPage: '页面跳转预览' }[action.action]) ?? '未配置点击动作');
  };
  const dismissPaywall = () => onDismiss ? onDismiss({ eligible: isExitOfferStep(document, runtime), snapshot: runtime }) : onStatus('关闭预览');
  const previousDismissRequest = useRef(dismissRequest);
  useEffect(() => {
    if (previousDismissRequest.current === dismissRequest) return;
    previousDismissRequest.current = dismissRequest;
    if (!editing) dismissPaywall();
  }, [dismissRequest, editing]);
  const {nodes:nodeIndex,parents:parentIndex} = indexDocument(document), overlay = nodeIndex.get(runtime.overlay);
  const commerce = previewCommerceContexts(document,runtime);
  const hover = (event) => {
    if (!editing || !inspectable) return;
    const element = event.target.closest?.('[data-component-id]');
    setHoveredId(canvasSelectionTarget(nodeIndex.get(element?.dataset.templateId??element?.dataset.componentId), selectedId, nodeIndex, parentIndex));
  };
  const common={document,nodeIndex,parentIndex,viewportHeight,selectedId,onSelect,editing,hoveredId:editing?highlightedId??(inspectable?hoveredId:null):null,runtime,setRuntime,runAction,onStatus,businessOrdering};
  const direction=document.previewContentLocale==='ar'?'rtl':'ltr';
  return <PreviewContext.Provider value={{...common,...commerce.background}}>
    <style>{fontStyles(document.fonts)}</style>
    <div className="phone native-phone" ref={phone} onPointerMove={hover} onPointerLeave={()=>setHoveredId(null)}>
      <div className="nc-viewport" ref={viewport} style={{transform:`scale(${scale})`,transformOrigin:'top left',width:390,height:viewportHeight,inset:'0 auto auto 0'}} onScroll={()=>setHoveredId(null)}><div className="nc-design" dir={direction}><NativeComponent node={document.root}/></div></div>
      {overlay&&<PreviewContext.Provider value={{...common,...commerce.floating}}><ItemContext.Provider value={runtime[`modal-item:${overlay.id}`]?{item:runtime[`modal-item:${overlay.id}`],index:0}:null}>
        <div className="nc-floating-overlay"><div className="nc-floating-backdrop" onClick={()=>{if(!editing&&dismissOnBackdrop&&overlay.id===document.settings?.presentationSurfaceId)dismissPaywall();else setRuntime(current=>({...current,overlay:null}));}}/>
          <div className="nc-floating-design" dir={direction} data-presentation={overlay.props.presentation} style={{transform:`scale(${scale})`,transformOrigin:'top left',height:viewportHeight,padding:overlay.props.surfaceInset??(overlay.props.presentation==='sheet'?0:20)}}><NativeComponent node={overlay} floating/></div>
        </div>
      </ItemContext.Provider></PreviewContext.Provider>}
      {runtime.webLink&&<div className="nc-web-preview" role="dialog" aria-label="网页预览"><header><span>{runtime.webLink.title}</span><button type="button" aria-label="关闭网页预览" title="关闭网页预览" onClick={()=>setRuntime(current=>({...current,webLink:null}))}><X size={18}/></button></header><iframe title="网页预览内容" src={runtime.webLink.url} sandbox="allow-scripts allow-forms allow-popups" referrerPolicy="no-referrer"/></div>}
    </div>
  </PreviewContext.Provider>;
}
