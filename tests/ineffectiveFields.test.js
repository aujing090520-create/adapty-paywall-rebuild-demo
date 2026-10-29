import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import Renderer,{act} from 'react-test-renderer';
import {createServer} from 'vite';
import {component as c,componentProps,indexDocument,saveComponentDocument,readComponentDocument} from '../src/builder/componentDocument.js';
import {patchComponentProperties} from '../src/builder/componentOperations.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {flowInitialIndex} from '../src/builder/componentTree.js';
import {templates,createBuilderNodes} from '../src/templates/templateDefinitions.js';
import {importComponentDocument} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents} from '../src/builder/componentCatalog.js';

let server,Properties,Preview;
before(async()=>{globalThis.ResizeObserver=class{observe(){}disconnect(){}};server=await createServer({configFile:false,logLevel:'silent',server:{middlewareMode:true,hmr:false,watch:null}});Properties=(await server.ssrLoadModule('/src/builder/RevenueCatProperties.jsx')).default;Preview=(await server.ssrLoadModule('/src/builder/ComponentPreview.jsx')).default;});
after(async()=>server?.close());
async function mount(body,id=body.id){
  let document={version:3,templateId:'field-audit',products:{},root:c('root','Screen','页面',{},[body])},navigation={},renderer;
  const render=()=>{const {nodes,parents}=indexDocument(document),selected=nodes.get(id);return React.createElement(React.Fragment,null,
    React.createElement(Properties,{document,selected,p:componentProps(selected),nodes,parents,navigation,patch:props=>{document=patchComponentProperties(document,id,props);renderer.update(render());},setNavigation:values=>{navigation={...navigation,...values};renderer.update(render());},onStatus(){}}),
    React.createElement(Preview,{document,selectedId:id,navigation,editing:true,onSelect(){},onStatus(){}}));};
  await act(async()=>{renderer=Renderer.create(render());});
  return {renderer,document:()=>document,field:(label,type='input')=>renderer.root.findAll(node=>node.type===type&&node.props['aria-label']===label)[0],node:(target=id)=>renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===target)[0],async replace(next){document=next;await act(async()=>renderer.update(render()));},async change(label,value,type='input'){const field=this.field(label,type);assert.ok(field,label);await act(async()=>field.props.onChange({target:{value,checked:value},currentTarget:{value}}));},async click(label){await act(async()=>this.field(label,'button').props.onClick());},async close(){await act(async()=>renderer.unmount());}};
}

test('standalone horizontal scrolling has an actual overflow owner and can be disabled again',async()=>{
  const h=await mount(c('stack','Stack','容器',{axis:'horizontal',widthMode:'fixed',width:220},[c('a','Text','文字',{text:'一',widthMode:'fixed',width:200}),c('b','Text','文字',{text:'二',widthMode:'fixed',width:200})]));
  try{await h.change('允许横向浏览',true);assert.equal(h.node().props.style.overflowX,'auto');assert.equal(h.node().props.style.overscrollBehaviorX,'contain');assert.equal(h.node().props.style.flexDirection,'row');await h.change('允许横向浏览',false);assert.equal(h.node().props.style.overflowX,undefined);}finally{await h.close();}
});

test('collapsible containers apply axis, spacing and alignment to content instead of discarding axis',async()=>{
  const h=await mount(c('stack','Stack','容器',{axis:'horizontal',gap:17,align:'center',collapsible:true},[c('a','Text','文字',{text:'一'}),c('b','Text','文字',{text:'二'})]));
  const content=()=>h.renderer.root.findAll(node=>node.props?.className==='nc-disclosure-content')[0];
  try{assert.equal(h.node().props.style.flexDirection,'column');assert.equal(content().props.style.flexDirection,'row');assert.equal(content().props.style.gap,'17px');assert.equal(content().props.style.alignItems,'center');assert.equal(content().props.style.flex,'1 1 auto');await h.click('叠放');assert.equal(content().props.style.display,'grid');await h.click('纵向');assert.equal(content().props.style.flexDirection,'column');await h.change('子项间距','21');await h.change('分布','between','select');await h.click('末尾');assert.equal(content().props.style.gap,'21px');assert.equal(content().props.style.justifyContent,'space-between');assert.equal(content().props.style.alignItems,'flex-end');}finally{await h.close();}
});

test('Flow default page reads and writes the actual initial step and survives storage',async()=>{
  const flow=c('flow','Flow','流程',{initialStepId:'two',defaultIndex:0},[c('one','Screen','第一页',{},[c('one/text','Text','文字',{text:'第一页'})]),c('two','Screen','第二页',{},[c('two/text','Text','文字',{text:'第二页'})])]);
  const h=await mount(flow);
  try{assert.equal(h.field('默认页面','select').props.value,1);assert.ok(h.node('two'));await h.change('默认页面','0','select');const changed=indexDocument(h.document()).nodes.get('flow');assert.equal(changed.props.initialStepId,'one');assert.equal(flowInitialIndex(changed),0);assert.ok(h.node('one'));assert.equal(h.node('two'),undefined);const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};assert.ok(saveComponentDocument(storage,h.document()));assert.equal(flowInitialIndex(indexDocument(readComponentDocument(storage,'field-audit')).nodes.get('flow')),0);}finally{await h.close();}
});

test('legacy HTML has no unused loading height, while ZIP and empty custom components retain it',async()=>{
  const html=c('custom','Custom','旧HTML',{html:'<p>内容</p>',heightMode:'fit',loadingHeight:275});const h=await mount(html);
  try{assert.equal(h.field('加载时初始高度'),undefined);assert.equal(indexDocument(h.document()).nodes.get('custom').props.loadingHeight,275);const next=structuredClone(h.document());delete indexDocument(next).nodes.get('custom').props.html;await h.replace(next);assert.ok(h.field('加载时初始高度'));await h.change('加载时初始高度','240');assert.equal(h.node().findAll(node=>node.props.className==='nc-empty-custom')[0].props.style.height,240);}finally{await h.close();}
});

test('icon color and opacity edit the inspected selection state, never the other state',async()=>{
  const icon=c('icon','Icon','图标',{icon:'heart',color:'#112233',selectedColor:'#abcdef'});const h=await mount(c('plan','Package','套餐',{defaultSelected:false},[icon]),'icon');
  try{await h.click('选中');assert.equal(h.field('颜色值').props.value,'#abcdef');await h.change('颜色值','#ff0000');await h.change('颜色不透明度','40');const props=indexDocument(h.document()).nodes.get('icon').props;assert.equal(props.color,'#112233');assert.equal(props.selectedColor,'#ff0000');assert.equal(props.selectedColorOpacity,40);assert.equal(h.node().props.style.color,'color-mix(in srgb, #ff0000 40%, transparent)');await h.click('默认');assert.equal(h.node().props.style.color,'#112233');assert.equal(Number(h.field('颜色不透明度').props.value),100);}finally{await h.close();}
});

test('connector controls require a following marker; hidden fields preserve settings for future reordering',async()=>{
  const timeline=createCatalogComponent('Timeline','timeline'),target=timeline.children.at(-1);target.props.connectorWidth=7;const h=await mount(timeline,target.id);
  try{assert.equal(h.field('连接线宽度'),undefined);const next=structuredClone(h.document()),parent=indexDocument(next).nodes.get('timeline');parent.children.unshift(parent.children.pop());await h.replace(next);assert.equal(Number(h.field('连接线宽度').props.value),7);const marker=parent.children[1].children.find(child=>['Icon','Image'].includes(child.type));marker.props.hidden=true;await h.replace(structuredClone(next));assert.equal(h.field('连接线宽度'),undefined);marker.props.hidden=false;await h.replace(structuredClone(next));assert.ok(h.field('连接线宽度'));parent.children[1].children=parent.children[1].children.filter(child=>!['Icon','Image'].includes(child.type));await h.replace(structuredClone(next));assert.equal(h.field('连接线宽度'),undefined);assert.equal(indexDocument(h.document()).nodes.get(target.id).props.connectorWidth,7);}finally{await h.close();}
});

test('manual UTC input and change both persist the deadline instead of only changing the displayed value',async()=>{
  const h=await mount(createCatalogComponent('Countdown','timer'));
  try{const field=h.field('目标时间（UTC）');assert.equal(typeof field.props.onInput,'function');await act(async()=>field.props.onInput({currentTarget:{value:'2030-01-01T00:00:07'}}));assert.equal(indexDocument(h.document()).nodes.get('timer').props.deadline,'2030-01-01T00:00:07Z');await h.change('目标时间（UTC）','');assert.equal(indexDocument(h.document()).nodes.get('timer').props.deadline,'');}finally{await h.close();}
});

for(const template of templates)test(`${template.id}: shared field renderer preserves template and activates standalone stack scrolling`,async()=>{
  const document=upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id),template)),snapshot=structuredClone(document);let renderer;
  const render=source=>React.createElement(Preview,{document:source,editing:true,onSelect(){},onStatus(){}});
  try{
    await act(async()=>{renderer=Renderer.create(render(document));});
    assert.ok(renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']).length);
    const candidates=renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-type']==='Stack'&&node.props['data-component-id']);
    const nodes=indexDocument(document).nodes;
    const target=candidates.map(node=>nodes.get(node.props['data-component-id'])).find(node=>node&&!node.props.collapsible&&!node.props.dataSource);
    if(target){
      await act(async()=>renderer.update(render(patchComponentProperties(document,target.id,{horizontalScroll:true}))));
      const actual=renderer.root.findAll(node=>typeof node.type==='string'&&node.props['data-component-id']===target.id)[0];
      assert.equal(actual.props.style.overflowX,'auto');
      assert.equal(actual.props.style.overscrollBehaviorX,'contain');
    }
    assert.deepEqual(document,snapshot);
  }finally{if(renderer)await act(async()=>renderer.unmount());}
});
