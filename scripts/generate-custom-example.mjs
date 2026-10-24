import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {zipSync} from 'fflate';
const root=new URL('../',import.meta.url),files={};
for(const name of ['index.html','app.js'])files[name]=new Uint8Array(await readFile(new URL(`examples/custom-component/${name}`,root)));
const data=Buffer.from(zipSync(files,{level:6,mtime:new Date('2026-01-01T00:00:00Z')}));
await mkdir(new URL('public/custom-component/',root),{recursive:true});const path=new URL('public/custom-component/example.zip',root);
let previous;try{previous=await readFile(path);}catch{}if(!previous?.equals(data))await writeFile(path,data);
console.log(`Custom example: ${data.length} bytes`);
