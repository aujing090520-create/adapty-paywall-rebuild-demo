import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {createSharedTemplateService,validatePublication} from '../server/sharedTemplateService.js';
import {createSharedTemplateHandler} from '../api/shared-templates.js';
import {buildRenewalOfferTemplate} from '../src/builder/renewalOfferTemplate.js';
import {preparePublication,canManageShared,sharedRequest,SHARE_CAPABILITIES_KEY} from '../src/sharedTemplates.js';

const token=()=>randomBytes(32).toString('base64url');
const input=()=>({id:randomUUID(),title:'匿名共享验收',styleType:'续费折扣',document:buildRenewalOfferTemplate()});
function memoryStore(){let index=null,version=0;const docs=new Map();return {conflicts:0,writes:0,async readIndex(){return index?{value:structuredClone(index),etag:String(version)}:null;},async writeIndex(value,etag){if(this.conflicts-->0||etag!==(index?String(version):undefined))throw new Error('conflict');index=structuredClone(value);version++;this.writes++;},async readDocument(id){return structuredClone(docs.get(id));},async writeDocument(id,doc){docs.set(id,structuredClone(doc));},isConflict:e=>e.message==='conflict'};}
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

test('anonymous readers can use a shared snapshot but only its capability can manage it',async()=>{
  const store=memoryStore(),service=createSharedTemplateService(store),payload=input(),secret=token();
  const published=await service.publish(payload,secret,'one');
  assert.equal(published.title,payload.title);assert.equal(published.productCount,1);
  const list=await createSharedTemplateService(store).list();assert.equal(list.length,1);
  assert.doesNotMatch(JSON.stringify(list),/ownerHash|contentHash|uploads|ips/);
  const copy=await service.get(payload.id);assert.deepEqual(copy.document,payload.document);
  await assert.rejects(service.manage(payload.id,token(),'rename','非法','two'),e=>e.status===403);
  await assert.rejects(service.manage(payload.id,undefined,'withdraw',undefined,'two'),e=>e.status===401);
  const writes=store.writes;await service.publish(payload,secret,'one');assert.equal(store.writes,writes);
  await service.manage(payload.id,secret,'rename','已改名','one');assert.equal((await service.list())[0].title,'已改名');
  await service.manage(payload.id,secret,'withdraw',undefined,'one');assert.deepEqual(await service.list(),[]);
  await assert.rejects(service.get(payload.id),e=>e.status===404);assert.deepEqual(copy.document,payload.document);
  const after=store.writes;await service.manage(payload.id,secret,'withdraw',undefined,'one');assert.equal(store.writes,after);
});

test('conditional writes retry once without losing records, concurrent publication is idempotent',async()=>{
  const store=memoryStore(),service=createSharedTemplateService(store),payload=input(),secret=token();store.conflicts=1;
  await Promise.all([service.publish(payload,secret,'one'),service.publish(payload,secret,'one')]);
  assert.equal((await service.list()).length,1);
  assert.equal((await store.readIndex()).value.limits.uploads,1);
  const altered={...payload,title:'另一份'};await assert.rejects(service.publish(altered,secret,'one'),e=>e.status===409);
});

test('failed upload can resume and pending records can be withdrawn without a published document',async()=>{
  const store=memoryStore(),write=store.writeDocument,payload=input(),secret=token(),service=createSharedTemplateService(store);
  store.writeDocument=async()=>{throw new Error('network');};await assert.rejects(service.publish(payload,secret,'one'));
  assert.deepEqual(await service.list(),[]);store.writeDocument=write;
  await service.publish(payload,secret,'one');assert.equal((await store.readIndex()).value.limits.uploads,1);
  const pending=input();store.writeDocument=async()=>{throw new Error('network');};await assert.rejects(service.publish(pending,secret,'one'));
  await service.manage(pending.id,secret,'withdraw',undefined,'one');assert.equal((await store.readIndex()).value.records[pending.id].state,'withdrawn');
});

test('persistent upload rate limits survive fresh function instances',async()=>{
  const store=memoryStore();for(let i=0;i<5;i++)await createSharedTemplateService(store).publish(input(),token(),'one');
  await assert.rejects(createSharedTemplateService(store).publish(input(),token(),'one'),e=>e.status===429);
  await createSharedTemplateService(store).publish(input(),token(),'two');assert.equal((await createSharedTemplateService(store).list()).length,6);
});

test('public uploads reject oversized, executable, invalid and browser-only resource configurations',()=>{
  const good=input();assert.ok(validatePublication(good));
  for(const bad of [{...good,id:'invalid'},{...good,title:''},{...good,extra:'x'.repeat(2*1024*1024)},{...good,document:{}},{...good,extra:{constructor:'bad'}},{...good,extra:'javascript:alert(1)'},{...good,extra:'blob:local'}])assert.throws(()=>validatePublication(bad));
  const executable=input();executable.document.root.children.push({id:'untrusted',type:'Custom',props:{html:'<script>bad</script>'},children:[]});assert.throws(()=>validatePublication(executable),/自定义代码/);
});

async function request(handler,{method='GET',body,headers={},url='/api/shared-templates'}={}){
  const req={method,url,headers:{host:'demo.test',...headers},body,socket:{remoteAddress:randomUUID()}};
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.value=JSON.parse(value);}};
  await handler(req,res);return res;
}
test('API verifies ownership and same-origin, limits bodies, exposes no credentials or caches',async()=>{
  const handler=createSharedTemplateHandler(createSharedTemplateService(memoryStore())),payload=input(),secret=token();
  const upload=await request(handler,{method:'POST',body:payload,headers:{authorization:`Bearer ${secret}`,'content-type':'application/json',origin:'https://demo.test'}});assert.equal(upload.statusCode,200);
  const list=await request(handler);assert.equal(list.value.items.length,1);assert.equal(list.headers['Cache-Control'],'no-store');assert.doesNotMatch(JSON.stringify(list.value),new RegExp(secret));
  assert.equal((await request(handler,{method:'DELETE',url:`/api/shared-templates?id=${payload.id}`})).statusCode,401);
  assert.equal((await request(handler,{method:'DELETE',url:`/api/shared-templates?id=${payload.id}`,headers:{authorization:`Bearer ${token()}`}})).statusCode,403);
  assert.equal((await request(handler,{method:'POST',body:payload,headers:{origin:'https://evil.test'}})).statusCode,403);
  assert.equal((await request(handler,{method:'POST',body:'{bad',headers:{'content-type':'application/json'}})).statusCode,400);
  assert.equal((await request(handler,{method:'POST',body:payload,headers:{'content-type':'text/plain'}})).statusCode,415);
  assert.equal((await request(handler,{method:'POST',body:payload,headers:{'content-type':'application/json','content-length':'3000000'}})).statusCode,413);
  assert.equal((await request(createSharedTemplateHandler(null,{configured:()=>false}))).statusCode,503);
});

test('capabilities are browser-local and saved before upload, network failure preserves them',async()=>{
  const one=storage(),two=storage(),cap=preparePublication(one);assert.equal(canManageShared(one,cap.id),true);assert.equal(canManageShared(two,cap.id),false);
  assert.deepEqual(preparePublication(one,cap.id),cap);assert.throws(()=>preparePublication({getItem:()=>null,setItem(){throw new Error('quota');}}),/尚未上传/);
  await assert.rejects(sharedRequest({method:'POST',token:cap.token,body:{id:cap.id},fetcher:async()=>{throw new TypeError('network');}}),/本地模板仍可使用/);
  assert.ok(one.getItem(SHARE_CAPABILITIES_KEY));
  await assert.rejects(sharedRequest({fetcher:async()=>({ok:false,status:403,json:async()=>({error:'无权'})})}),e=>e.status===403);
});
