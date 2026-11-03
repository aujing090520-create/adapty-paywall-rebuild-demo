import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
const prefix='paywall-shared-v1/';
const options=()=>({access:'private',token:process.env.BLOB_READ_WRITE_TOKEN});
// Conditional writes need the origin ETag, not a compressed response's weak validator.
async function read(path){const blob=await get(prefix+path,{...options(),useCache:false,headers:{'Accept-Encoding':'identity'}});return blob?{value:await new Response(blob.stream).json(),etag:blob.blob.etag}:null;}
export const blobTemplateStore={
  readIndex:()=>read('index.json'),
  writeIndex:(value,etag)=>put(prefix+'index.json',JSON.stringify(value),{...options(),addRandomSuffix:false,contentType:'application/json',cacheControlMaxAge:60,...(etag?{ifMatch:etag}:{allowOverwrite:false})}),
  readDocument:async id=>(await read(`documents/${id}.json`))?.value.document,
  async writeDocument(id,document,contentHash){
    const existing=await read(`documents/${id}.json`);
    if(existing){if(existing.value.contentHash!==contentHash)throw new Error('Document conflict');return;}
    try{await put(prefix+`documents/${id}.json`,JSON.stringify({document,contentHash}),{...options(),addRandomSuffix:false,allowOverwrite:false,contentType:'application/json',cacheControlMaxAge:60});}
    catch(error){if(!this.isConflict(error))throw error;const stored=await read(`documents/${id}.json`);if(stored?.value.contentHash!==contentHash)throw error;}
  },
  isConflict:error=>error instanceof BlobPreconditionFailedError||/already exists/i.test(error.message),
};
