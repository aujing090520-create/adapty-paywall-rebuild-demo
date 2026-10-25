import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {publishParameterReference} from '../scripts/publish-parameter-reference.mjs';

test('production reference publishing copies only the requested HTML and CSV, preserving content',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'paywall-reference-'));
  const source=pathToFileURL(join(dir,'source')+'/'),target=pathToFileURL(join(dir,'public','docs')+'/');
  try{
    await mkdir(source);
    await writeFile(new URL('component-parameters.html',source),'<h1>组件参数功能表</h1>');
    await writeFile(new URL('component-parameters.csv',source),'\ufeff组件,参数\n弹窗,宽度\n');
    await writeFile(new URL('private-audit.md',source),'not for publication');
    await publishParameterReference(source,target);
    assert.deepEqual((await readdir(target)).sort(),['component-parameters.csv','component-parameters.html']);
    for(const name of await readdir(target))assert.equal(await readFile(new URL(name,target),'utf8'),await readFile(new URL(name,source),'utf8'));
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('missing reference input fails the build preparation rather than publishing a silent empty page',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'paywall-reference-'));
  try{await assert.rejects(publishParameterReference(pathToFileURL(join(dir,'missing')+'/'),pathToFileURL(join(dir,'public')+'/')),/ENOENT/);}
  finally{await rm(dir,{recursive:true,force:true});}
});
