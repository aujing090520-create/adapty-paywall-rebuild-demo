import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {buildStandaloneTemplate,upgradeStandaloneArt,STANDALONE_TEMPLATES} from '../src/builder/standaloneTemplates.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {component,indexDocument,validDocument,importComponentDocument,saveComponentDocument,readComponentDocument,cloneComponent} from '../src/builder/componentDocument.js';
import {copyFragment,pasteFragment,patchComponentProperties} from '../src/builder/componentOperations.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';
import {localizedDocument} from '../src/builder/contentLocalization.js';
import {productParameterPreview,PRODUCT_PARAMETER_OPTIONS} from '../src/products/productParameters.js';
import {purchaseTarget} from '../src/builder/purchaseTarget.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {workflowIssues} from '../src/builder/workflow.js';
import {PAYWALL_STYLE_TYPES} from '../src/paywallMetadata.js';
import iconCatalog from '../src/builder/tablerCatalog.json' with {type:'json'};

for(const [kind,config] of Object.entries(STANDALONE_TEMPLATES)){
  test(`${config.title}: native independent registration, chrome and product ownership`,()=>{
    const template=templates.find(item=>item.id===config.templateId),doc=upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id),template)),{nodes,parents}=indexDocument(doc),id=`standalone/${kind}`;
    assert.equal(template.title,config.title);assert.equal(template.nativeDocument,true);assert.equal(template.productCount,3);assert.ok(PAYWALL_STYLE_TYPES.includes(config.title));
    assert.ok(validDocument(doc));assert.deepEqual(structureIssues(doc),[]);assert.deepEqual(workflowIssues(doc),[]);
    assert.equal(doc.root.type,'Screen');assert.equal(doc.root.props.pagePresentation,'fullscreen');
    assert.equal(parents.get(`${id}/header`),doc.root.id);assert.equal(parents.get(`${id}/footer`),doc.root.id);assert.equal(parents.get(`${id}/packages`),doc.root.id);assert.equal(parents.get(`${id}/purchase`),`${id}/footer`);
    const plans=[...nodes.values()].filter(node=>node.type==='Package');assert.equal(plans.length,3);assert.equal(plans.filter(node=>node.props.defaultSelected).length,1);assert.equal(plans.find(node=>node.props.defaultSelected).id,`${id}/package-1`);assert.equal(new Set(plans.map(node=>node.props.group)).size,1);
    assert.ok(![...nodes.values()].some(node=>node.type==='Custom'||node.type==='Countdown'));
    assert.ok(Object.values(doc.products).every(product=>!product.skuId&&!product.price));
    for(const node of nodes.values())if(node.type==='Icon'){const [,variant,name]=node.props.icon.split(':');assert.ok(iconCatalog.icons.some(([entry,styles])=>entry===name&&(styles&(variant==='filled'?2:1))),node.props.icon);}
  });
  test(`${config.title}: locale copy, parameter semantics, ordinary editing/copying and persistence`,()=>{
    const doc=buildStandaloneTemplate(kind),before=structuredClone(doc),id=`standalone/${kind}`,{nodes}=indexDocument(doc),en=indexDocument(localizedDocument(doc,{contentLocale:'en'})).nodes,ar=indexDocument(localizedDocument(doc,{contentLocale:'ar'})).nodes;
    assert.ok(en.get(`${id}/title`).props.text);assert.equal(ar.get(`${id}/title`).props.text,nodes.get(`${id}/title`).props.text);
    assert.equal(nodes.get(`${id}/package-1/top-price`).props.parameter,config.weekly?'weeklyPrice':'totalPrice');assert.equal(nodes.get(`${id}/package-1/bottom-price`).props.parameter,config.weekly?'totalPrice':'monthlyPrice');
    const edited=patchComponentProperties(doc,`${id}/package-1`,{priceMode:'0'});assert.equal(indexDocument(edited).nodes.get(config.weekly?`${id}/package-1/bottom-price`:`${id}/package-1/top-price`).props.parameter,'monthlyPrice');
    const copyEdited=patchComponentProperties(doc,`${id}/title`,{text:'可编辑标题'});assert.equal(indexDocument(localizedDocument(copyEdited,{contentLocale:'zh-CN'})).nodes.get(`${id}/title`).props.text,'可编辑标题');
    const copied=pasteFragment({version:3,templateId:'target',products:{},root:component('target','Screen')},'target',copyFragment(doc,`${id}/package-1`));assert.ok(validDocument(copied.document));
    assert.equal(cloneComponent(nodes.get(`${id}/benefits`)).children.length,nodes.get(`${id}/benefits`).children.length);
    const store=new Map(),storage={getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)};assert.ok(saveComponentDocument(storage,doc));assert.deepEqual(readComponentDocument(storage,config.templateId),doc);
    assert.deepEqual(doc,before);assert.deepEqual(buildStandaloneTemplate(kind),before);
  });
}
test('weekly price is a generic selectable parameter, never replaces monthly modes, and adapts to lifetime',()=>{
  assert.ok(PRODUCT_PARAMETER_OPTIONS.some(([key,label])=>key==='weeklyPrice'&&label==='周价'));
  const doc=buildStandaloneTemplate('visitor'),plan=indexDocument(doc).nodes.get('standalone/visitor/package-1');
  assert.equal(productParameterPreview('weeklyPrice',plan),'¥{周价}/周');plan.props.productType='lifetime';assert.equal(productParameterPreview('weeklyPrice',plan),'');
  plan.children=plan.children.filter(()=>false);assert.equal(productParameterPreview('weeklyPrice',plan),'¥{总价}');
});
test('all fifteen illustration regions are original crops with verified hashes, not generated replacements',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/standalone-template/original/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.method,'lossless-rectangular-crop');assert.equal(manifest.generated,false);assert.equal(manifest.resized,false);assert.equal(manifest.assets.length,15);
  for(const asset of manifest.assets){const bytes=readFileSync(new URL(`../public${asset.path}`,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(asset.width,asset.rect[2]-asset.rect[0]);assert.equal(asset.height,asset.rect[3]-asset.rect[1]);assert.ok(asset.height<asset.sourceSize[1]/2);}
  for(const name of ['visitor','languages','live-voice'])assert.equal(existsSync(new URL(`../public/standalone-template/${name}.png`,import.meta.url)),false);
});
test('visitor masks and avatar groups are editable Images and are not counts, variables or redrawn icons',()=>{
  const doc=buildStandaloneTemplate('visitor'),{nodes}=indexDocument(doc);
  for(let index=0;index<3;index++){
    const prefix=`standalone/visitor/benefit-${index}`;
    assert.equal(nodes.get(`${prefix}/text/mosaic`).type,'Image');assert.match(nodes.get(`${prefix}/text/mosaic`).props.src,/original\/visitor-mosaic-/);
    assert.equal(nodes.get(`${prefix}/avatars`).type,'Image');assert.equal(nodes.get(`${prefix}/text`).type,'Stack');
  }
  assert.doesNotMatch(JSON.stringify(doc),/访客人数|附近人数|连续访问人数|visitor count|Nearby count/);
});
test('saved old default assets and count placeholders upgrade once without changing products or custom content',()=>{
  const old=buildStandaloneTemplate('visitor');delete old.standaloneArtVersion;
  const {nodes}=indexDocument(old),id='standalone/visitor';
  nodes.get(`${id}/portrait/image`).props.src='/standalone-template/visitor.png';
  nodes.get(`${id}/portrait`).children.push(component(`${id}/portrait/eye`,'Stack','布局容器',{background:'#e40fb1'},[component(`${id}/portrait/eye/icon`,'Icon','图标',{icon:'tabler:outline:eye'})]));
  const labels=['最近有 {访客人数} 人打开了你的对话框想要联系你','有 {附近人数} 个离你很近的语伴想和你线下认识','有 {连续访问人数} 人连续3天一直查看你的主页，但还没和你打招呼'];
  const english=['Recently, {visitor count} people opened your chat to contact you','{Nearby count} nearby partners would like to meet you','{Repeat visitor count} people viewed your profile for 3 days but have not said hello'];
  for(let i=0;i<3;i++){
    const row=nodes.get(`${id}/benefit-${i}`),key=`${id}/benefit-${i}`;
    row.children[0]=component(`${key}/avatars`,'Stack','布局容器',{widthMode:'fixed',width:69},[0,1,2].map(j=>component(`${key}/avatars/${j}`,'Stack','布局容器',{},[component(`${key}/avatars/${j}/icon`,'Icon','图标',{icon:'tabler:filled:user'})])));
    row.children[1]=component(`${key}/text`,'Text','文字',{text:labels[i],fontSize:14});old.localization.translations.en[`${key}/text`]={text:english[i]};
  }
  const before=structuredClone(old),fixed=upgradeCanonicalComponents(old),after=indexDocument(fixed).nodes;
  assert.deepEqual(old,before);assert.deepEqual(fixed.products,before.products);assert.equal(fixed.standaloneArtVersion,1);assert.deepEqual(structureIssues(fixed),[]);assert.ok(validDocument(fixed));
  assert.match(after.get(`${id}/portrait/image`).props.src,/original\/visitor-art/);assert.equal(after.has(`${id}/portrait/eye`),false);
  for(let i=0;i<3;i++){assert.equal(after.get(`${id}/benefit-${i}/avatars`).type,'Image');assert.equal(after.get(`${id}/benefit-${i}/text/mosaic`).type,'Image');}
  assert.doesNotMatch(JSON.stringify(fixed),/访客人数|visitor count/);assert.equal(upgradeStandaloneArt(fixed),fixed);
  const custom=structuredClone(before);indexDocument(custom).nodes.get(`${id}/portrait/image`).props.src='/custom.jpg';indexDocument(custom).nodes.get(`${id}/benefit-0`).children[1].props.text='用户改写的内容';indexDocument(custom).nodes.get(`${id}/benefit-1`).children=[];
  const kept=indexDocument(upgradeStandaloneArt(custom)).nodes;assert.equal(kept.get(`${id}/portrait/image`).props.src,'/custom.jpg');assert.equal(kept.get(`${id}/benefit-0/text`).props.text,'用户改写的内容');assert.equal(kept.get(`${id}/benefit-1`).children.length,0);
  const customEnglish=structuredClone(before);customEnglish.localization.translations.en[`${id}/benefit-0/text`]={text:'My edited English copy'};const preserved=upgradeStandaloneArt(customEnglish);assert.equal(indexDocument(preserved).nodes.get(`${id}/benefit-0/text`).type,'Text');assert.equal(preserved.localization.translations.en[`${id}/benefit-0/text`].text,'My edited English copy');
  assert.equal(upgradeStandaloneArt({...before,templateId:'custom'}).templateId,'custom');
  for(const kind of ['languages','liveVoice']){
    const record=buildStandaloneTemplate(kind);delete record.standaloneArtVersion;const originalNodes=indexDocument(record).nodes,key=`standalone/${kind}`;
    originalNodes.get(`${key}/hero/image`).props.src=`/standalone-template/${kind==='languages'?'languages':'live-voice'}.png`;
    originalNodes.get(`${key}/benefit-0`).children[0]=component(`${key}/benefit-0/icon`,'Icon','图标',{icon:kind==='languages'?'tabler:outline:world':'tabler:outline:clock',width:23,height:23});
    const migrated=indexDocument(upgradeStandaloneArt(record)).nodes;assert.match(migrated.get(`${key}/hero/image`).props.src,/\/original\//);assert.equal(migrated.get(`${key}/benefit-0/icon`).type,'Image');
  }
});
let server,Preview;const priorObserver=globalThis.ResizeObserver;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>{await server?.close();globalThis.ResizeObserver=priorObserver;});
for(const [kind,config] of Object.entries(STANDALONE_TEMPLATES))test(`${config.title}: rendered exclusive selection, selected label, correct purchase target and close`,async()=>{
  let renderer,status='',dismissed=0;const doc=buildStandaloneTemplate(kind),id=`standalone/${kind}`;
  const node=key=>renderer.root.findAll(entry=>typeof entry.type==='string'&&entry.props['data-component-id']===key)[0];
  const click=key=>act(async()=>node(key).props.onClick({stopPropagation(){},preventDefault(){}}));
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Preview,{document:doc,editing:false,onSelect(){},onStatus:value=>status=value,onDismiss(){dismissed++;}}));});
    assert.equal(node(`${id}/header`).props.style.gridRow,1);assert.equal(node(`${id}/footer`).props.style.gridRow,3);assert.equal(node(`${id}/package-1`).props['aria-pressed'],true);
    assert.equal(node(`${id}/package-1/label/text`).children[0],'{选中商品标签}');assert.equal(node(`${id}/package-2/label/text`).children[0],'{商品标签}');
    await click(`${id}/package-2`);assert.equal(node(`${id}/package-1`).props['aria-pressed'],false);assert.equal(node(`${id}/package-2`).props['aria-pressed'],true);assert.equal(node(`${id}/package-2/label/text`).children[0],'{选中商品标签}');
    const {nodes}=indexDocument(doc),selected=nodes.get(`${id}/package-2`);assert.equal(purchaseTarget(doc,nodes.get(`${id}/purchase`),selected,{}).id,selected.id);
    await click(`${id}/purchase`);assert.equal(status,'购买预览：未发起真实交易');await click(`${id}/close`);assert.equal(dismissed,1);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
