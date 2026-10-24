const CACHE_PREFIX='ht-paywall-custom-v1-';
const mime={html:'text/html; charset=utf-8',js:'application/javascript',mjs:'application/javascript',css:'text/css; charset=utf-8',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',avif:'image/avif',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',wasm:'application/wasm',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg',ogg:'audio/ogg'};
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',(event)=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',(event)=>{
  const data=event.data,source=event.source;
  if(data?.type!=='install-bundle'||!source||!event.ports[0])return;
  const sender=new URL(source.url);
  if(sender.origin!==self.location.origin||sender.pathname.startsWith('/custom-component/')||!/^([a-f0-9]{64})$/.test(data.id))return;
  event.waitUntil((async()=>{
    const cacheName=CACHE_PREFIX+data.id,existing=(await caches.keys()).includes(cacheName);
    const cache=await caches.open(cacheName),base=`${self.location.origin}/custom-component/bundles/${data.id}/`;
    try{
      const ready=base+'?ht-install-complete=1';
      if(existing&&await cache.match(ready)){event.ports[0].postMessage({ok:true});return;}
      for(const [name,bytes] of Object.entries(data.files)){
        if(name.startsWith('/')||name.includes('\\')||name.split('/').some((part)=>!part||part==='..'||part==='.'))throw new Error('文件路径无效');
        const url=new URL(name.split('/').map(encodeURIComponent).join('/'),base);if(!url.href.startsWith(base))throw new Error('文件路径无效');
        const type=mime[name.split('.').pop().toLowerCase()]??'application/octet-stream';
        const headers=new Headers({'Content-Type':type,'Access-Control-Allow-Origin':'*','Cross-Origin-Resource-Policy':'cross-origin','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});
        if(type.startsWith('text/html'))headers.set('Content-Security-Policy',`default-src 'none'; script-src ${self.location.origin}/custom-component/ blob:; style-src ${base} 'unsafe-inline'; img-src ${base} data: blob:; font-src ${base} data:; connect-src ${base} blob:; worker-src ${base} blob:; media-src ${base} blob:; frame-src 'none'; object-src 'none'; base-uri ${base}; form-action 'none'`);
        await cache.put(url.href,new Response(bytes,{headers}));
      }
      await cache.put(ready,new Response('complete'));
      event.ports[0].postMessage({ok:true});
    }catch{if(!existing)await caches.delete(cacheName);event.ports[0].postMessage({ok:false,error:'ZIP 组件保存失败，请检查浏览器存储空间'});}
  })());
});
self.addEventListener('fetch',(event)=>{
  const url=new URL(event.request.url),match=/^\/custom-component\/bundles\/([a-f0-9]{64})\//.exec(url.pathname);
  if(url.origin!==self.location.origin||!match)return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE_PREFIX+match[1]);url.search='';return await cache.match(url.href)??new Response('组件资源不存在',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Access-Control-Allow-Origin':'*'}});})());
});
