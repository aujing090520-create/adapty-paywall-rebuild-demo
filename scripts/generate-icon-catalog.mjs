import {readFile,writeFile,mkdir} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const metadata=JSON.parse(await readFile(new URL('node_modules/@tabler/icons/icons.json',root),'utf8'));
const pkg=JSON.parse(await readFile(new URL('node_modules/@tabler/icons/package.json',root),'utf8'));
const catalog={version:pkg.version,icons:Object.values(metadata).map((entry)=>[entry.name,(entry.styles.outline?1:0)+(entry.styles.filled?2:0)])};
const save=async(path,contents)=>{const url=new URL(path,root);let previous;try{previous=await readFile(url,'utf8');}catch{}if(previous!==contents)await writeFile(url,contents);};
await save('src/builder/tablerCatalog.json',`${JSON.stringify(catalog)}\n`);
await mkdir(new URL('public/licenses/',root),{recursive:true});
await save('public/licenses/tabler-icons.txt',await readFile(new URL('node_modules/@tabler/icons/LICENSE',root),'utf8'));
console.log(`Tabler ${catalog.version}: ${catalog.icons.length} names`);
