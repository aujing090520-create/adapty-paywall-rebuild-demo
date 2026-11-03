export const SHARE_CAPABILITIES_KEY='paywall-share-capabilities-v1';
const cache=new Map();
function capabilities(storage){const value=JSON.parse(storage.getItem(SHARE_CAPABILITIES_KEY)??'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('本机共享管理凭证无效，请保留原数据并联系维护者');return value;}
export function canManageShared(storage,id){try{return typeof capabilities(storage)[id]==='string';}catch{return false;}}
export function preparePublication(storage,existingId){
  const saved=capabilities(storage);
  if(existingId&&saved[existingId])return {id:existingId,token:saved[existingId]};
  const id=crypto.randomUUID(),bytes=crypto.getRandomValues(new Uint8Array(32));
  const token=btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  try{storage.setItem(SHARE_CAPABILITIES_KEY,JSON.stringify({...saved,[id]:token}));}catch{throw new Error('无法保存本机管理凭证，尚未上传模板');}
  return {id,token};
}
export async function sharedRequest({id,method='GET',body,token,fetcher=fetch}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetcher(`/api/shared-templates${id?`?id=${encodeURIComponent(id)}`:''}`,{method,credentials:'omit',cache:'no-store',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});
    const value=await response.json();
    if(!response.ok){const error=new Error(value.error||'共享模板操作失败');error.status=response.status;throw error;}
    return value;
  }catch(error){if(error.name==='AbortError')throw new Error('云端响应超时，请重试；本地模板仍保留');if(error instanceof TypeError||error instanceof SyntaxError)throw new Error('无法连接云端模板库，本地模板仍可使用');throw error;}
  finally{clearTimeout(timer);}
}
export async function loadSharedTemplate(id,{fresh=false}={}){
  if(!fresh&&cache.has(id))return cache.get(id);
  const promise=sharedRequest({id}).then(record=>({...record,document:{...record.document,templateId:`shared-template-${id}`}}));
  if(!fresh)cache.set(id,promise);
  try{return await promise;}catch(error){cache.delete(id);throw error;}
}
export function sharedDescriptor(record,owned=false,document){
  return {id:`shared-template-${record.id}`,title:record.title,nativeDocument:true,savedDocument:document,cloudRecord:{...record,owned},theme:record.theme??'custom',media:record.media??'none',productCount:record.productCount??0,components:record.components??[],tags:[`${record.productCount??0} 个商品`,...(record.components??[])],category:'Custom'};
}
export async function publishLocalTemplate(storage,record){
  const capability=preparePublication(storage,record.publicationId??record.cloudId);
  const result=await sharedRequest({method:'POST',token:capability.token,body:{id:capability.id,title:record.title,styleType:record.styleType,document:record.document}});
  return result;
}
export async function manageSharedTemplate(storage,id,action,title){
  const token=capabilities(storage)[id];
  if(!token)throw new Error('当前浏览器没有这份模板的管理凭证');
  let result;
  try{result=await sharedRequest({id,method:action==='rename'?'PUT':'DELETE',token,...(action==='rename'?{body:{title}}:{})});}
  catch(error){if(action!=='rename'&&error.status===404)result={id,withdrawn:true};else throw error;}
  cache.delete(id);return result;
}
