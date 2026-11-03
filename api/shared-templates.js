import {createSharedTemplateService,ServiceError,MAX_TEMPLATE_BYTES} from '../server/sharedTemplateService.js';
import {blobTemplateStore} from '../server/blobTemplateStore.js';
export const config={maxDuration:30};
const reads=new Map();
async function readBody(req){
  if(!/^application\/json\b/i.test(req.headers['content-type']??''))throw new ServiceError(415,'请上传JSON模板配置');
  if(Number(req.headers['content-length'])>MAX_TEMPLATE_BYTES)throw new ServiceError(413,'模板超过2MB');
  if(req.body!==undefined){const value=typeof req.body==='string'?JSON.parse(req.body):req.body;if(Buffer.byteLength(JSON.stringify(value))>MAX_TEMPLATE_BYTES)throw new ServiceError(413,'模板超过2MB');return value;}
  const chunks=[];let size=0;
  for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>MAX_TEMPLATE_BYTES)throw new ServiceError(413,'模板超过2MB');chunks.push(chunk);}
  return JSON.parse(Buffer.concat(chunks.map(chunk=>Buffer.from(chunk))).toString());
}
export function createSharedTemplateHandler(service,{configured=()=>true,clock=()=>Date.now()}={}){return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','application/json; charset=utf-8');
  const send=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  try{
    if(!configured())throw new ServiceError(503,'云端模板存储尚未配置，请联系维护者');
    if(!['GET','POST','PUT','DELETE'].includes(req.method)){res.setHeader('Allow','GET, POST, PUT, DELETE');throw new ServiceError(405,'不支持的请求方法');}
    const origin=req.headers.origin;
    if(origin){const url=new URL(origin);if(!['http:','https:'].includes(url.protocol)||url.host!==req.headers.host)throw new ServiceError(403,'不允许跨站提交模板');}
    const ip=String(req.headers['x-forwarded-for']??req.socket?.remoteAddress??'unknown').split(',')[0].trim();
    const key=`${ip}:${Math.floor(clock()/60000)}`,count=reads.get(key)??0;
    if(count>=120)throw new ServiceError(429,'请求过于频繁，请稍后再试');
    if(!reads.has(key)&&reads.size>=5000){for(const k of reads.keys())if(!k.endsWith(`:${Math.floor(clock()/60000)}`))reads.delete(k);if(reads.size>=5000)throw new ServiceError(429,'请求过于频繁，请稍后再试');}
    reads.set(key,count+1);
    const url=new URL(req.url,'https://local.invalid'),id=url.searchParams.get('id'),token=/^Bearer ([A-Za-z0-9_-]+)$/.exec(req.headers.authorization??'')?.[1];
    if(req.method==='GET')return send(200,id?await service.get(id):{items:await service.list(),storage:'cloud'});
    if(req.method==='POST')return send(200,await service.publish(await readBody(req),token,ip));
    if(req.method==='PUT')return send(200,await service.manage(id,token,'rename',(await readBody(req)).title,ip));
    return send(200,await service.manage(id,token,'withdraw',undefined,ip));
  }catch(error){send(error instanceof ServiceError?error.status:error instanceof SyntaxError?400:503,{error:error instanceof ServiceError?error.message:error instanceof SyntaxError?'JSON格式不正确':'云端模板服务暂不可用，请稍后重试'});}
};}
export default createSharedTemplateHandler(createSharedTemplateService(blobTemplateStore,{salt:process.env.BLOB_READ_WRITE_TOKEN??'unconfigured'}),{configured:()=>Boolean(process.env.BLOB_READ_WRITE_TOKEN)});
