import { component, indexDocument, updateComponent } from './componentDocument.js';
import { createCatalogComponent } from './componentCatalog.js';

const isBack = (button) => button.children.some((child) => child.type === 'Icon' && child.props.icon === 'tabler:outline:arrow-left');
const rowProps = (children) => children.length === 1
  ? { axis: 'overlay', overlayAlignment: isBack(children[0]) ? 'top-left' : 'top-right' }
  : { axis: 'horizontal', align: 'center', justify: 'between' };

export function createNavigationRow(button, id = crypto.randomUUID()) {
  return component(id,'Stack','导航栏',{navigationRow:true,...rowProps([button]),widthMode:'fill',heightMode:'fit',gap:0,background:'transparent'},[button]);
}

export function appendNavigationButton(document, screenId, button) {
  const screen = indexDocument(document).nodes.get(screenId);
  if (screen?.type !== 'Screen') return document;
  const findRow = (node) => {
    if (node.type === 'BottomSheet' || node.type === 'Screen' && node.id !== screenId) return null;
    return node.type === 'Stack' && node.props.navigationRow ? node : node.children.map(findRow).find(Boolean);
  };
  const row = findRow(screen);
  if (row) {
    const children = isBack(button) ? [button,...row.children] : [...row.children,button];
    return updateComponent(document,row.id,{children,props:rowProps(children)});
  }
  return updateComponent(document,screenId,{children:[createNavigationRow(button),...screen.children]});
}

export function upgradeNavigationRows(document) {
  if (document.navigationRowsVersion === 1) return document;
  const generatedHeader = (node) => node.type === 'Header' && node.name === '页头' && node.props.axis === 'horizontal'
    && node.props.paddingHorizontal === 16 && node.props.paddingVertical === 8 && node.props.background === 'transparent' && node.props.shadowOpacity === 0
    && node.children.length > 0 && node.children.every((child) => child.type === 'Button' && child.props.width === 32 && child.props.height === 32 && child.children.some((entry) => entry.type === 'Icon' && ['tabler:outline:x','tabler:outline:arrow-left'].includes(entry.props.icon)));
  const visit = (node) => ({...node,...(generatedHeader(node)?{type:'Stack',name:'导航栏',props:{...node.props,navigationRow:true,...rowProps(node.children)}}:{}),children:node.children.map(visit)});
  let next = {...document,root:visit(document.root),navigationRowsVersion:1};
  if (document.templateId !== 'ht-blue-privilege') return next;
  const {nodes} = indexDocument(next), hero = nodes.get('hero-image');
  const hasNavigation = [...nodes.values()].some((node) => node.type === 'Button' && node.children.some((child) => child.type === 'Icon' && ['tabler:outline:x','tabler:outline:arrow-left'].includes(child.props.icon)) && ['Dismiss','NavigateBack','OpenSheet'].includes(node.props.action?.action));
  if (!hero || hasNavigation) return next;
  const button = createCatalogComponent('BackButton','hero-image/back');
  button.children[0].props.color = '#ffffff';
  const row = createNavigationRow(button,'hero-image/navigation');
  row.props = {...row.props,paddingHorizontal:16,paddingVertical:16};
  return updateComponent(next,hero.id,{children:[...hero.children,row]});
}
