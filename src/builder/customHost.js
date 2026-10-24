export async function ensureCustomPreview(){
  if(!navigator.serviceWorker)throw new Error('当前环境不支持 ZIP 组件预览，请使用 HTTPS 或 localhost');
  const registration=await navigator.serviceWorker.register('/custom-component/sw.js',{scope:'/custom-component/'});
  if(registration.active?.state==='activated')return registration.active;
  const worker=registration.installing??registration.waiting??registration.active;
  if(!worker)throw new Error('自定义组件预览服务未就绪');
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{worker.removeEventListener('statechange',change);reject(new Error('自定义组件预览服务启动超时'));},15000);
    const change=()=>{if(worker.state==='activated'||worker.state==='redundant'){clearTimeout(timeout);worker.removeEventListener('statechange',change);worker.state==='activated'?resolve():reject(new Error('自定义组件预览服务启动失败'));}};
    worker.addEventListener('statechange',change);change();
  });
  return worker;
}
