import {createBuilderNodes,templates} from '../src/templates/templateDefinitions.js';
import {component,importComponentDocument,indexDocument,updateComponent} from '../src/builder/componentDocument.js';
import {upgradeCanonicalComponents,createCatalogComponent} from '../src/builder/componentCatalog.js';
import {owningScreen} from '../src/builder/workflow.js';

export function demoIssuesFixture(id='ht-blue-privilege') {
  const template=templates.find(item=>item.id===id);
  let document=upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(id),template));
  const screen=owningScreen(document,'purchase');
  const gift=createCatalogComponent('GiftList','audit-gifts'),benefits=createCatalogComponent('BenefitsStrip','audit-benefits');
  const open=createCatalogComponent('BottomSheet','audit-open');open.children[0].props.text='查看套餐说明';
  open.children[1].children[0].props.text='已选价格 {{ product.price }}';
  const title=component('audit-title','Text','文字',{text:'会员专属权益',fontSize:18,textAlign:'left'});
  const variable=component('audit-variable','Text','文字',{text:'价格联动验证：{{ product.price }} / {{ product.period }}',fontSize:14});
  const copy=component('audit-rule-copy','Text','文字',{text:'未选年套餐',fontSize:14});
  const image=component('audit-image','Image','图片',{src:'/ht-retention-gift.png',widthMode:'fixed',heightMode:'fixed',width:40,height:40});
  document=updateComponent(document,screen.id,{children:[title,variable,copy,open,image,benefits,...screen.children]});
  const footer=[...indexDocument(document).nodes.values()].find(node=>node.type==='Footer');
  document=updateComponent(document,footer.id,{children:[...footer.children.slice(0,1),gift,...footer.children.slice(1)]});
  const year=Object.values(document.products).find(row=>/YEAR$/.test(row.skuId))?.skuId;
  const giftItems=[{id:'badge',title:'身份铭牌',description:'套餐赠送身份装扮',image:'/ht-retention-gift.png',translations:{en:{title:'Profile badge',description:'Member decoration'},ar:{title:'شارة العضوية',description:'زينة العضوية'}}},{id:'voucher',title:'福利券',description:'会员专属福利',image:'/ht-retention-gift.png'}];
  document.business={bySku:{[year]:{gifts:giftItems}},benefits:giftItems};
  document.logic={variables:[{id:'show',key:'show_content',type:'boolean',value:true}],rules:[{id:'year',name:'年套餐说明',enabled:true,conditions:[{type:'sku',value:year}],effects:[{target:copy.id,kind:'text',value:'已选年套餐'}]},{id:'business',name:'业务内容开关',enabled:true,conditions:[{type:'variable',source:'show_content',value:false}],effects:[{target:title.id,kind:'hide'}]}]};
  document.localization={defaultLocale:'zh-CN',translations:{en:{[title.id]:{text:'Member benefits'}},ar:{[title.id]:{text:'مزايا العضوية'}}},assets:[{id:'ar',target:image.id,language:'ar',theme:'',platform:'',field:'src',src:'/ht-retention-gift.png'}]};
  return {document,template,year};
}
