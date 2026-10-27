import React,{useEffect,useRef,useState} from 'react';
import wasmUrl from 'libpag/lib/libpag.wasm?url';

const safe=url=>/^(https?:\/\/|\/(?!\/)|data:application\/(octet-stream|x-pag);base64,)/i.test(url??'');
let library;
const engine=()=>library??=import('libpag').then(({PAGInit})=>PAGInit({locateFile:()=>wasmUrl})).catch(error=>{library=null;throw error;});

export default function PagMedia({src,fallback,loop=true,autoPlay=true,objectFit='contain',alt=''}) {
  const canvas=useRef(null),[state,setState]=useState('loading');
  useEffect(()=>{
    let disposed=false,view,file;const controller=new AbortController();
    setState('loading');
    const load=async()=>{
      try{
        if(!safe(src))throw new Error('Invalid PAG source');
        const response=await fetch(src,{signal:controller.signal});
        if(!response.ok)throw new Error('PAG unavailable');
        const data=await response.arrayBuffer();
        if(data.byteLength>10*1024*1024)throw new Error('PAG too large');
        if(disposed)return;
        const PAG=await engine();if(disposed)return;
        file=await PAG.PAGFile.load(data);if(disposed){file?.destroy();file=null;return;}
        const scale=Math.min(1,2048/Math.max(file.width(),file.height()));
        canvas.current.width=Math.max(1,Math.round(file.width()*scale));canvas.current.height=Math.max(1,Math.round(file.height()*scale));
        view=await PAG.PAGView.init(file,canvas.current,{useScale:false});
        if(!view)throw new Error('PAG view unavailable');
        if(disposed){view.destroy();file.destroy();view=null;file=null;return;}
        view.setRepeatCount(loop?0:1);if(autoPlay)await view.play();else await view.flush();
        if(!disposed)setState('ready');
      }catch(error){if(!disposed&&error.name!=='AbortError')setState('fallback');}
    };
    load();return()=>{disposed=true;controller.abort();view?.destroy();file?.destroy();};
  },[src,loop,autoPlay]);
  return <div data-pag-state={state} style={{position:'relative',width:'100%',height:'100%',minHeight:60}}>
    {state!=='ready'&&fallback&&<img alt={alt} src={fallback} style={{width:'100%',height:'100%',objectFit,display:'block'}}/>}
    <canvas ref={canvas} aria-label={alt||'PAG动画'} style={{display:state==='ready'?'block':'none',width:'100%',height:'100%',objectFit}}/>
  </div>;
}
