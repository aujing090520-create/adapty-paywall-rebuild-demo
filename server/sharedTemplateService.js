import {createHash,timingSafeEqual} from 'node:crypto';
import {validDocument,indexDocument} from '../src/builder/componentDocument.js';

export const MAX_TEMPLATE_BYTES=2*1024*1024;
export class ServiceError extends Error{constructor(status,message){super(message);this.status=status;}}
const fail=(status,message)=>{throw new ServiceError(status,message);};
const digest=value=>createHash('sha256').update(value).digest('hex');
const validId=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id??'');
const ownerHash=token=>typeof token==='string'&&/^[A-Za-z0-9_-]{43,100}$/.test(token)?digest(token):fail(401,'缺少有效的模板管理凭证');
const sameOwner=(record,hash)=>record?.ownerHash?.length===hash.length&&timingSafeEqual(Buffer.from(record.ownerHash),Buffer.from(hash));
const titleValue=value=>typeof value==='string'&&value.trim()&&value.trim().length<=60?value.trim():fail(400,'模板名称须为1至60字');
const publicRecord=record=>Object.fromEntries(['id','title','styleType','createdAt','updatedAt','productCount','components','media','theme'].map(key=>[key,record[key]]));
const emptyState=()=>({version:1,records:{},limits:{day:'',uploads:0,writes:0,ips:{}}});

export function validatePublication(input){
  if(!input||!validId(input.id))fail(400,'模板标识无效');
  const json=JSON.stringify(input);
  if(Buffer.byteLength(json)>MAX_TEMPLATE_BYTES)fail(413,'模板超过2MB，请压缩图片或减少嵌入资源');
  const inspect=(value,depth=0)=>{
    if(depth>55)fail(400,'模板嵌套过深');
    if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
      if(['__proto__','prototype','constructor'].includes(key))fail(400,'模板包含不安全字段');
      inspect(child,depth+1);
    }
    if(typeof value==='string'&&/^\s*(javascript:|vbscript:|file:|blob:|data:text\/html)/i.test(value))fail(400,'模板包含不可共享的资源地址');
  };
  inspect(input);
  if(!validDocument(input.document))fail(400,'模板组件结构无效');
  const nodes=[...indexDocument(input.document).nodes.values()];
  if(nodes.length>1800)fail(400,'模板最多包含1800个组件');
  if(nodes.some(node=>node.type==='Custom'||node.props.html||node.props.customBundle))fail(400,'匿名共享暂不支持自定义代码组件，请使用标准组件');
  const types=new Set(nodes.map(node=>node.type));
  const components=[['Countdown','Timer'],['Carousel','Carousel'],['TabControl','Tabs'],['Tabs','Tabs'],['Timeline','Trial timeline'],['Flow','Multi-step']].filter(([type])=>types.has(type)).map(([,name])=>name);
  return {id:input.id,title:titleValue(input.title),styleType:String(input.styleType??'').slice(0,60),document:structuredClone(input.document),productCount:nodes.filter(node=>node.type==='Package').length,components:[...new Set(components)],media:nodes.some(node=>['Image','Video'].includes(node.type)||node.props.backgroundImage)?'image':'none',theme:'custom'};
}

export function createSharedTemplateService(store,{now=()=>Date.now(),salt='local-test'}={}){
  const mutate=async update=>{
    for(let attempt=0;attempt<3;attempt++){
      const saved=await store.readIndex(),state=saved?.value??emptyState();
      if(state.version!==1||!state.records||!state.limits)fail(503,'共享模板库暂不可用');
      const before=JSON.stringify(state);
      const result=update(state);
      if(JSON.stringify(state)===before)return result;
      try{await store.writeIndex(state,saved?.etag);return result;}catch(error){if(!store.isConflict(error))throw error;}
    }
    fail(409,'共享模板正在更新，请稍后重试');
  };
  const budget=(state,ip,upload)=>{
    const day=new Date(now()).toISOString().slice(0,10),hour=Math.floor(now()/3600000),key=digest(`${salt}:${ip}`);
    if(state.limits.day!==day)state.limits={day,uploads:0,writes:0,ips:{}};
    const limits=state.limits;
    if(limits.writes>=100||upload&&limits.uploads>=20)fail(429,'今日共享操作已达上限，请明天再试');
    const previous=limits.ips[key],entry=previous?.hour===hour?previous:{hour,uploads:0};
    if(upload&&entry.uploads>=5)fail(429,'上传过于频繁，请一小时后再试');
    limits.writes++;
    if(upload){entry.uploads++;limits.uploads++;limits.ips[key]=entry;}
  };
  return {
    async list(){const state=(await store.readIndex())?.value??emptyState();return Object.values(state.records).filter(item=>item.state==='active').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(publicRecord);},
    async get(id){
      if(!validId(id))fail(400,'模板标识无效');
      const record=(await store.readIndex())?.value.records[id];
      if(record?.state!=='active')fail(404,'模板已撤回或不存在');
      const document=await store.readDocument(id);
      if(!document)fail(503,'模板资源暂不可用，请稍后重试');
      return {...publicRecord(record),document};
    },
    async publish(input,token,ip){
      const hash=ownerHash(token),payload=validatePublication(input),contentHash=digest(JSON.stringify(payload)),stamp=new Date(now()).toISOString();
      const reserved=await mutate(state=>{
        const previous=state.records[payload.id];
        if(previous&&!sameOwner(previous,hash))fail(403,'无权修改其他人上传的模板');
        if(previous?.contentHash!==undefined&&previous.contentHash!==contentHash)fail(409,'该共享标识已用于另一份配置，请重新共享');
        if(previous?.state==='active')return previous;
        if(!previous&&Object.keys(state.records).length>=250)fail(429,'共享库容量已达上限，请联系维护者');
        if(previous?.state!=='pending'&&Object.values(state.records).filter(item=>item.state==='active'||item.state==='pending').length>=50)fail(429,'共享库最多容纳50份模板，请先撤回不再使用的模板');
        if(previous?.state!=='pending')budget(state,ip,true);
        const {document,...metadata}=payload;
        return state.records[payload.id]={...metadata,ownerHash:hash,contentHash,state:'pending',createdAt:previous?.createdAt??stamp,updatedAt:stamp};
      });
      if(reserved.state==='active')return publicRecord(reserved);
      await store.writeDocument(payload.id,payload.document,contentHash);
      return mutate(state=>{
        const record=state.records[payload.id];
        if(sameOwner(record,hash)&&record.state==='active'&&record.contentHash===contentHash)return publicRecord(record);
        if(!sameOwner(record,hash)||record.state!=='pending')fail(409,'共享状态已变化，请刷新后重试');
        record.state='active';record.updatedAt=stamp;
        return publicRecord(record);
      });
    },
    async manage(id,token,action,title,ip){
      if(!validId(id))fail(400,'模板标识无效');
      const hash=ownerHash(token);
      return mutate(state=>{
        const record=state.records[id];
        if(!record)fail(404,'模板不存在');
        if(!sameOwner(record,hash))fail(403,'无权修改其他人上传的模板');
        if(action==='withdraw'&&record.state==='withdrawn')return {id,withdrawn:true};
        budget(state,ip,false);
        if(action==='rename'){if(record.state!=='active')fail(404,'模板已撤回');record.title=titleValue(title);}
        else if(action==='withdraw')record.state='withdrawn';
        else fail(400,'不支持此操作');
        record.updatedAt=new Date(now()).toISOString();
        return action==='withdraw'?{id,withdrawn:true}:publicRecord(record);
      });
    },
  };
}
