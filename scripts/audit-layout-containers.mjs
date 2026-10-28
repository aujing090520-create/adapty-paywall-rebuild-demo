import {readFileSync,writeFileSync} from 'node:fs';
import {templates} from '../src/templates/templateDefinitions.js';
import {templateDocument} from './lib/component-structure-contract.mjs';
import {indexDocument} from '../src/builder/componentDocument.js';
import {layoutContainerReasons} from '../src/builder/layoutContainers.js';

const baseline=process.argv[2]?new Map(JSON.parse(readFileSync(process.argv[2],'utf8')).map(row=>[row.id,row.document])):new Map();
const removed=[],rows=[],reasons={};let beforeCount=0;
for(const template of templates){
  const document=templateDocument(template),{nodes,parents}=indexDocument(document);
  if(baseline.has(template.id))for(const node of indexDocument(baseline.get(template.id)).nodes.values())if(node.type==='Stack'){
    beforeCount++;
    if(!nodes.has(node.id))removed.push({template:template.id,id:node.id,decision:node.id.startsWith('products/badge-space-')?'合并重复标签占位，实际标签与参数ID保留':'清理生成器空分组；仅新模板，用户保存的空容器不自动删除'});
  }
  for(const node of nodes.values())if(node.type==='Stack'){
    const responsibilities=layoutContainerReasons(node,nodes.get(parents.get(node.id)));
    for(const reason of responsibilities)reasons[reason]=(reasons[reason]??0)+1;
    rows.push({template:template.id,id:node.id,parent:parents.get(node.id),children:node.children.length,responsibilities,decision:'保留'});
  }
}
const report={date:'2026-10-28',scope:'全部模板的布局职责与结构一致性评估；不是全部模板的逐像素验收',templates:templates.length,beforeContainers:baseline.size?beforeCount:null,afterContainers:rows.length,removedCount:removed.length,policy:['不以层数作为删除依据','保留业务、交互、数据、视觉与尺寸边界','不跨商品套餐、页脚、屏幕或弹窗合并','保存文档只按严格旧标签指纹一次迁移；自定义或被引用节点不动','初次进入图层默认展开，手动收起不因选择或配置重置'],reasons,removed,containers:rows};
writeFileSync(new URL('../docs/layout-container-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({templates:report.templates,beforeContainers:report.beforeContainers,afterContainers:report.afterContainers,removedCount:report.removedCount,reasons},null,2));
