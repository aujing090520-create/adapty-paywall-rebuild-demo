import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {buildVisitorConnectionTemplate} from '../src/builder/visitorConnectionTemplate.js';
import {safeImageSource,imageSources,imageVariableName,imageVariableToken} from '../src/builder/imageSources.js';
import {displayVariables} from '../src/builder/textVariables.js';
import {businessParameterRuntime} from '../src/builder/paywallLogic.js';
import {renameBusinessVariable} from '../src/builder/workbenchModel.js';
import {component,componentProps,updateComponent,indexDocument,importComponentDocument,validDocument,saveComponentDocument,readComponentDocument} from '../src/builder/componentDocument.js';
import {copyFragment,pasteFragment} from '../src/builder/componentOperations.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {structureIssues} from '../scripts/lib/component-structure-contract.mjs';
import {workflowIssues} from '../src/builder/workflow.js';
import iconCatalog from '../src/builder/tablerCatalog.json' with {type:'json'};

test('named visitor template uses standard components, parameter text and fixed chrome',()=>{
  const template=templates.find(t=>t.id==='ht-visitor-connection'),doc=importComponentDocument(createBuilderNodes(template.id),template),{nodes,parents}=indexDocument(doc);
  assert.equal(template.title,'孙铭阳定制模版1');assert.ok(validDocument(doc));assert.deepEqual(structureIssues(doc),[]);assert.deepEqual(workflowIssues(doc),[]);
  assert.equal(doc.logic.variables.length,9);assert.equal([...nodes.values()].filter(n=>n.type==='Package').length,2);assert.equal(doc.productFieldPreview,true);
  assert.equal(parents.get('visitor-connection/back'),'visitor-connection/navigation');assert.equal(parents.get('visitor-connection/navigation'),'visitor-connection/header');
  assert.equal(parents.get('visitor-connection/packages'),'visitor-connection/package-section');assert.equal(parents.get('visitor-connection/purchase'),'visitor-connection/footer');
  assert.ok(![...nodes.values()].some(n=>n.type==='Custom'));
  for(const n of nodes.values())if(n.type==='Icon'){const [,style,name]=n.props.icon.split(':');assert.ok(iconCatalog.icons.some(([key,flags])=>key===name&&(flags&(style==='filled'?2:1))),n.props.icon);}
  for(let at=1;at<=3;at++){assert.equal(nodes.get(`visitor-connection/avatar-${at}`).props.imageSource,'variable');assert.equal(nodes.get(`visitor-connection/nickname-${at}`).type,'Text');assert.match(nodes.get(`visitor-connection/description-${at}`).props.text,/business\.visitor_/);}
});
test('generic image source validates addresses and distinguishes omitted parameters from explicit empty values',()=>{
  for(const url of ['javascript:alert(1)','//evil.test/image','file:///tmp/a','https://user:secret@example.com/avatar','data:text/html;base64,bad'])assert.equal(safeImageSource(url),'');
  assert.equal(safeImageSource(' /fallback.png '),'/fallback.png');assert.equal(safeImageSource('https://example.com/a.jpg'),'https://example.com/a.jpg');
  const doc=buildVisitorConnectionTemplate(),props={imageSource:'variable',imageVariable:'{{ business.visitor_1_avatar }}',src:'/default.png'};
  assert.equal(imageSources(props,doc).src,'/visitor-connection-template/avatar-1.jpg');
  for(const value of ['',null,'javascript:alert(1)'])assert.equal(imageSources(props,doc,null,null,businessParameterRuntime(doc,{visitor_1_avatar:value})).src,'/default.png');
  assert.equal(imageSources({...props,imageSource:'fixed'},doc).src,'/default.png');assert.equal(imageSources(props,doc,null,null,businessParameterRuntime(doc,{visitor_1_avatar:'/new.png'})).src,'/new.png');
  for(const key of ['visitor_1_avatar','{visitor_1_avatar}','{{ business.visitor_1_avatar }}'])assert.equal(imageVariableToken(key),'{{ business.visitor_1_avatar }}');
  assert.equal(imageVariableName('{{ business.visitor_1_avatar }}'),'visitor_1_avatar');assert.equal(imageVariableToken(''),'');
  assert.equal(imageSources({...props,imageVariable:'rule_avatar'},doc,null,null,businessParameterRuntime(doc,{rule_avatar:'/rule.jpg'})).src,'/rule.jpg');
  assert.equal(imageSources(props,doc,null,null,{$parameterPreview:true}).parameter,'{visitor_1_avatar}');
  assert.equal(displayVariables('你好 {{ business.visitor_1_nickname }}，{{ business.unknown }}',doc,null,null,{$parameterPreview:true}),'你好 {visitor_1_nickname}，{unknown}');
});
test('variable rename, persistence and cross-screen copying keep dynamic image dependencies',()=>{
  const doc=buildVisitorConnectionTemplate(),before=structuredClone(doc),renamed=renameBusinessVariable(doc,'visitor-connection/variable-1-avatar','partner_photo');
  assert.equal(indexDocument(renamed).nodes.get('visitor-connection/avatar-1').props.imageVariable,'{{ business.partner_photo }}');
  const target={version:3,templateId:'target',products:{},logic:{variables:[{id:'existing',key:'visitor_1_avatar',type:'string',value:'/different.jpg'}]},root:component('target','Screen')};
  const pasted=pasteFragment(target,'target',copyFragment(doc,'visitor-connection/person-1')).document;
  assert.ok(validDocument(pasted));assert.equal(pasted.logic.variables.length,4);const copied=[...indexDocument(pasted).nodes.values()].find(n=>n.type==='Image');assert.match(copied.props.imageVariable,/visitor_1_avatar_2/);
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};saveComponentDocument(storage,doc);assert.deepEqual(readComponentDocument(storage,doc.templateId),doc);assert.deepEqual(doc,before);
});

let server,Preview,Properties;
const observer=globalThis.ResizeObserver;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;});
after(async()=>{await server?.close();globalThis.ResizeObserver=observer;});
test('runtime avatar/nickname/copy update together, null does not expose sample user and failed image falls back',async()=>{
  const doc=buildVisitorConnectionTemplate();indexDocument(doc).nodes.get('visitor-connection/avatar-1').props.src='/fallback.png';const before=structuredClone(doc);let renderer,status='';
  const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===`visitor-connection/${id}`)[0];
  const render=parameters=>React.createElement(Preview,{document:doc,businessParameters:parameters,editing:false,onSelect(){},onStatus:v=>status=v});
  try{
    await act(async()=>{renderer=Renderer.create(render({visitor_1_avatar:'/new.jpg',visitor_1_nickname:'新语伴',visitor_1_description:'一起练习英语'}));});
    assert.equal(node('avatar-1').findByType('img').props.src,'/new.jpg');assert.equal(node('nickname-1').children.join(''),'新语伴');assert.equal(node('description-1').children.join(''),'一起练习英语');
    await act(async()=>node('avatar-1').findByType('img').props.onError());assert.equal(node('avatar-1').findByType('img').props.src,'/fallback.png');
    await act(async()=>node('avatar-1').findByType('img').props.onError());assert.equal(node('avatar-1').findAllByType('img').length,0);
    await act(async()=>renderer.update(render({visitor_1_avatar:'/other.jpg',visitor_1_nickname:'另一位语伴',visitor_1_description:''})));
    assert.equal(node('avatar-1').findByType('img').props.src,'/other.jpg');assert.equal(node('description-1').children.join(''),'');
    await act(async()=>renderer.update(render({visitor_1_avatar:null,visitor_1_nickname:null,visitor_1_description:null})));
    assert.equal(node('avatar-1').findByType('img').props.src,'/fallback.png');assert.equal(node('nickname-1').children.join(''),'');
    await act(async()=>node('package-2').props.onClick({stopPropagation(){}}));assert.equal(node('package-2').props['aria-pressed'],true);
    await act(async()=>node('purchase').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(status,'购买预览：未发起真实交易');
    await act(async()=>node('restore').props.onClick({stopPropagation(){},preventDefault(){}}));assert.equal(status,'恢复购买预览');assert.deepEqual(doc,before);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
test('image inspector exposes the generic variable binding and keeps fixed/PAG configuration',async()=>{
  let doc=buildVisitorConnectionTemplate(),renderer;const id='visitor-connection/avatar-1';indexDocument(doc).nodes.get(id).props.src='/fallback.jpg';
  function Harness(){const [value,setValue]=React.useState(doc);doc=value;const {nodes,parents}=indexDocument(value),selected=nodes.get(id);return React.createElement(Properties,{selected,p:componentProps(selected),patch:props=>setValue(current=>updateComponent(current,id,{props})),document:value,nodes,parents,onStatus(){},demoSkus:[],fieldNames:{},navigation:{},setNavigation(){}});}
  try{
    await act(async()=>{renderer=Renderer.create(React.createElement(Harness));});
    const source=renderer.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='图片来源')[0],binding=renderer.root.findAll(n=>n.type==='input'&&n.props['aria-label']==='图片参数变量')[0];
    assert.equal(source.props.value,'variable');assert.equal(binding.props.value,'visitor_1_avatar');assert.equal(renderer.root.findAll(n=>n.type==='input'&&n.props.type==='file').length,0);
    assert.equal(renderer.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='图片地址变量').length,0);
    await act(async()=>binding.props.onChange({target:{value:'rule_avatar'}}));assert.equal(indexDocument(doc).nodes.get(id).props.imageVariable,'{{ business.rule_avatar }}');
    await act(async()=>renderer.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='图片来源')[0].props.onChange({target:{value:'fixed'}}));
    assert.equal(renderer.root.findAll(n=>n.type==='input'&&n.props.type==='file').length,1);
    assert.equal(indexDocument(doc).nodes.get(id).props.src,'/fallback.jpg');assert.equal(indexDocument(doc).nodes.get(id).props.imageVariable,'{{ business.rule_avatar }}');
    await act(async()=>renderer.root.findAll(n=>n.type==='select'&&n.props['aria-label']==='媒体类型')[0].props.onChange({target:{value:'pag'}}));
    assert.equal(indexDocument(doc).nodes.get(id).props.imageVariable,'{{ business.rule_avatar }}');assert.equal(renderer.root.findAll(n=>n.type==='input'&&n.props['aria-label']==='图片参数变量').length,0);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});

test('builder and flow previews show business parameter names without loading sample avatars',async()=>{
  const doc=buildVisitorConnectionTemplate(),before=structuredClone(doc);let renderer;
  try{
    for(const editing of [true,false]){
      await act(async()=>{if(renderer)renderer.update(React.createElement(Preview,{document:doc,editing}));else renderer=Renderer.create(React.createElement(Preview,{document:doc,editing}));});
      const node=id=>renderer.root.findAll(n=>typeof n.type==='string'&&n.props['data-component-id']===`visitor-connection/${id}`)[0];
      assert.equal(node('nickname-1').children.join(''),'{visitor_1_nickname}');assert.equal(node('description-1').children.join(''),'{visitor_1_description}');
      assert.equal(node('avatar-1').findAllByType('img').length,0);assert.equal(node('avatar-1').findByProps({'aria-label':'{visitor_1_avatar}'}).children.join(''),'{visitor_1_avatar}');
    }
    assert.deepEqual(doc,before);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
