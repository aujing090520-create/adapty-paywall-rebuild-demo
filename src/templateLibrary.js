import {indexDocument,validDocument} from './builder/componentDocument.js';
import {boundExitOfferIds} from './builder/exitOffers.js';
import {upgradeButtonModals} from './builder/buttonModals.js';
import {localSettingsResetting} from './templateStorage.js';

export const TEMPLATE_LIBRARY_KEY='paywall-user-template-library-v1';
const validRecord=item=>item?.id?.startsWith('user-template-')&&typeof item.title==='string'&&item.title.trim()&&item.title.length<=60&&validDocument(item.document)&&typeof item.shared==='boolean';

export function readTemplateLibrary(storage){
  const raw=storage.getItem(TEMPLATE_LIBRARY_KEY);
  if(!raw)return [];
  const value=JSON.parse(raw);
  if(value?.version!==1||!Array.isArray(value.items)||!value.items.every(validRecord)||new Set(value.items.map(item=>item.id)).size!==value.items.length)throw new Error('本地模板库数据无效，原数据已保留');
  return value.items;
}

export function writeTemplateLibrary(storage,items){
  if(localSettingsResetting(storage))throw new Error('正在重置本地数据，请稍后重试');
  // Re-read before writing so corrupt or inaccessible data cannot be silently replaced.
  readTemplateLibrary(storage);
  if(!items.every(validRecord)||new Set(items.map(item=>item.id)).size!==items.length)throw new Error('模板配置无效');
  try{storage.setItem(TEMPLATE_LIBRARY_KEY,JSON.stringify({version:1,items}));}catch{throw new Error('模板保存失败，本地空间不足或存储不可用；原内容保留');}
}

const checkedTitle=(title,items,id)=>{
  const value=String(title??'').trim();
  if(!value||value.length>60)throw new Error('请填写1至60字的模板名称');
  if(items.some(item=>!item.archivedAt&&item.id!==id&&item.title===value))throw new Error('已有同名自定义模板，请换一个名称');
  return value;
};

export function createTemplateRecord(document,{title,styleType='',offerings=[],id=`user-template-${crypto.randomUUID()}`,now=new Date().toISOString()}={},items=[]){
  if(!validDocument(document))throw new Error('画布尚未就绪，无法保存模板');
  if(!document.settings?.buttonModalVersion){
    for(const target of boundExitOfferIds(document))if(!offerings.some(item=>item.id===target&&validDocument(item.document)))throw new Error('关联弹窗不可用，请先修复关联后保存模板');
  }
  const snapshot=structuredClone(upgradeButtonModals(document,offerings));
  // Old external-offer fields are migration history; the snapshot owns its button modals.
  if(snapshot.settings?.buttonModalVersion){
    delete snapshot.settings.exitOfferOfferingId;
    delete snapshot.settings.exitOffersByScreen;
    delete snapshot.settings.retainedPopupIds;
  }
  snapshot.templateId=id;
  return {id,title:checkedTitle(title,items),styleType,document:snapshot,shared:false,createdAt:now,updatedAt:now};
}

export function changeTemplateRecord(items,id,action,value,now=new Date().toISOString()){
  const record=items.find(item=>item.id===id);
  if(!record)throw new Error('模板已不存在，请重新打开模板库');
  let patch;
  if(action==='rename')patch={title:checkedTitle(value,items,id)};
  else if(action==='share'&&!record.archivedAt)patch={shared:true};
  else if(action==='unshare')patch={shared:false};
  else if(action==='archive')patch={archivedAt:now,shared:false};
  else if(action==='restore')patch={archivedAt:null,title:checkedTitle(record.title,items,id)};
  else throw new Error('当前模板不支持此操作');
  return items.map(item=>item.id===id?{...item,...patch,updatedAt:now}:item);
}

export function templateDescriptor(record){
  const nodes=[...indexDocument(record.document).nodes.values()],types=new Set(nodes.map(node=>node.type));
  const components=[['Countdown','Timer'],['Carousel','Carousel'],['Tabs','Tabs'],['TabControl','Tabs'],['Timeline','Trial timeline'],['Flow','Multi-step']].filter(([type])=>types.has(type)).map(([,label])=>label);
  const productCount=nodes.filter(node=>node.type==='Package').length;
  return {id:record.id,title:record.title,nativeDocument:true,savedDocument:record.document,userRecord:record,theme:'custom',media:nodes.some(node=>['Image','Video'].includes(node.type)||node.props.backgroundImage)?'image':'none',components:[...new Set(components)],productCount,tags:[`${productCount} 个商品`,...new Set(components)],category:'Custom'};
}

export function templatesInTab(records,tab){return records.filter(item=>tab==='trash'?item.archivedAt:!item.archivedAt&&(tab!=='shared'||item.shared));}
