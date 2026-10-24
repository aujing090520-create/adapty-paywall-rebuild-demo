import {unzip,strFromU8} from 'fflate';
import {ensureCustomPreview} from './customHost.js';

export async function readCustomZip(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.length>5*1024*1024)throw new Error('ZIP 文件不能超过 5 MiB');
  let total=0,count=0;const names=new Set();
  const files=await new Promise((resolve,reject)=>{
    try{unzip(bytes,{filter(file){
      const name=file.name;
      if(name.includes('\\')||name.startsWith('/')||/^[a-z]:/i.test(name)||name.split('/').some((part)=>part==='..'||part==='.'||part===''&&!name.endsWith('/'))||/[\u0000-\u001f]/.test(name))throw new Error('ZIP 包含不安全的文件路径');
      if(name.startsWith('__MACOSX/')||name.split('/').some((part)=>part.startsWith('._'))||name.endsWith('/'))return false;
      if(names.has(name))throw new Error('ZIP 包含重复文件路径');names.add(name);
      if(/\.zip$/i.test(name))throw new Error('ZIP 不能包含嵌套压缩包');
      if(++count>200)throw new Error('ZIP 文件数量不能超过 200 个');
      if(file.originalSize>10*1024*1024)throw new Error('单个文件解压后不能超过 10 MiB');
      total+=file.originalSize;
      if(total>20*1024*1024)throw new Error('ZIP 解压后不能超过 20 MiB');
      if(total>bytes.length*20)throw new Error('ZIP 压缩比不能超过 20 倍');
      return true;
    }},(error,result)=>error?reject(new Error('ZIP 文件无效或损坏')):resolve(result));}catch(error){reject(error);}
  });
  if(!files['index.html'])throw new Error('ZIP 根目录必须包含 index.html');
  return {files,html:strFromU8(files['index.html']),size:total,count};
}

export async function installCustomBundle(file){
  if(file.size>5*1024*1024)throw new Error('ZIP 文件不能超过 5 MiB');
  const bytes=new Uint8Array(await file.arrayBuffer()),bundle=await readCustomZip(bytes);
  const digest=await crypto.subtle.digest('SHA-256',bytes),id=Array.from(new Uint8Array(digest),(byte)=>byte.toString(16).padStart(2,'0')).join('');
  const html=new DOMParser().parseFromString(bundle.html,'text/html');
  const bridge=html.createElement('script');bridge.src='/custom-component/bridge.js';html.head.prepend(bridge);
  bundle.files['index.html']=new TextEncoder().encode(`<!doctype html>\n${html.documentElement.outerHTML}`);
  const worker=await ensureCustomPreview();
  await new Promise((resolve,reject)=>{
    const channel=new MessageChannel();const timeout=setTimeout(()=>{channel.port1.close();reject(new Error('ZIP 组件保存超时'));},15000);
    channel.port1.onmessage=({data})=>{clearTimeout(timeout);channel.port1.close();data?.ok?resolve():reject(new Error(data?.error??'ZIP 组件保存失败'));};
    worker.postMessage({type:'install-bundle',id,files:bundle.files},[channel.port2]);
  });
  return {id,name:file.name,size:bundle.size,count:bundle.count};
}
