import { component, indexDocument, updateComponent } from './componentDocument.js';
import { createCatalogComponent } from './componentCatalog.js';
import {pinScreenNavigation} from './templateNavigationHeaders.js';

const isBack = (button) => button.children.some((child) => child.type === 'Icon' && child.props.icon === 'tabler:outline:arrow-left');
const rowProps = (children) => children.length === 1
  ? { axis: 'overlay', overlayAlignment: isBack(children[0]) ? 'top-left' : 'top-right' }
  : { axis: 'horizontal', align: 'center', justify: 'between' };

export function createNavigationRow(button, id = crypto.randomUUID()) {
  return component(id,'Stack','导航栏',{navigationRow:true,...rowProps([button]),widthMode:'fill',heightMode:'fit',gap:0,background:'transparent'},[button]);
}

export function appendNavigationButton(document, screenId, button) {
  let screen = indexDocument(document).nodes.get(screenId);
  if (screen?.type !== 'Screen') return document;
  const pinned=pinScreenNavigation(screen);
  if(pinned!==screen){document=updateComponent(document,screenId,{props:pinned.props,children:pinned.children});screen=pinned;}
  const findRow = (node) => {
    if (node.type === 'BottomSheet' || node.type === 'Screen' && node.id !== screenId) return null;
    const navigation=(['Stack','Header'].includes(node.type)&&node.props.navigationRow)||(node.type==='Header'&&node.props.fixedNavigation);
    return navigation ? node : node.children.map(findRow).find(Boolean);
  };
  const row = findRow(screen);
  if (row) {
    const children = isBack(button) ? [button,...row.children] : [...row.children,button];
    return updateComponent(document,row.id,{children,props:rowProps(children)});
  }
  const header=screen.children.find(child=>child.type==='Header');
  const navigation=createNavigationRow(button);
  if(header)return updateComponent(document,header.id,{children:[navigation,...header.children]});
  return updateComponent(document,screenId,{props:!screen.props.pagePresentation?{pagePresentation:'fullscreen'}:{},children:[{...navigation,type:'Header',name:'页头',props:{...navigation.props,fixedNavigation:true,overlapContent:true,shadowOpacity:0}},...screen.children]});
}

export function upgradeNavigationRows(document) {
  if (document.navigationRowsVersion === 2) return document;
  const migrated = document.navigationRowsVersion === 1;
  const generatedHeader = (node) => node.type === 'Header' && !node.props.fixedNavigation && node.name === '页头' && node.props.axis === 'horizontal'
    && node.props.paddingHorizontal === 16 && node.props.paddingVertical === 8 && node.props.background === 'transparent' && node.props.shadowOpacity === 0
    && node.children.length > 0 && node.children.every((child) => child.type === 'Button' && child.props.width === 32 && child.props.height === 32 && child.children.some((entry) => entry.type === 'Icon' && ['tabler:outline:x','tabler:outline:arrow-left'].includes(entry.props.icon)));
  const visit = (node) => ({...node,...(generatedHeader(node)?{type:'Stack',name:'导航栏',props:{...node.props,navigationRow:true,...rowProps(node.children)}}:{}),children:node.children.map(visit)});
  let next = {...document,root:migrated?document.root:visit(document.root),navigationRowsVersion:2};
  if (document.templateId !== 'ht-blue-privilege') return next;
  const {nodes} = indexDocument(next), hero = nodes.get('hero-image');
  if (hero) {
    const navigation = hero.children.filter((node) => node.props.navigationRow);
    const children = [...navigation,...hero.children.filter((node) => !node.props.navigationRow)];
    if (children.some((node,index) => node !== hero.children[index])) next = updateComponent(next,hero.id,{children});
  }
  // Version-one drafts may have deliberately removed their default navigation.
  if (migrated) return next;
  const hasNavigation = [...nodes.values()].some((node) => node.type === 'Button' && node.children.some((child) => child.type === 'Icon' && ['tabler:outline:x','tabler:outline:arrow-left'].includes(child.props.icon)) && ['Dismiss','NavigateBack','OpenSheet'].includes(node.props.action?.action));
  if (!hero || hasNavigation) return next;
  const button = createCatalogComponent('BackButton','hero-image/back');
  button.children[0].props.color = '#ffffff';
  const row = createNavigationRow(button,'hero-image/navigation');
  row.props = {...row.props,paddingHorizontal:16,paddingVertical:16};
  return updateComponent(next,hero.id,{children:[row,...hero.children]});
}
