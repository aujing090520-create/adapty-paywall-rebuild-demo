import {COMPONENT_TYPES,COMPONENT_NAMES,CONTAINER_TYPES,componentProps,indexDocument} from '../src/builder/componentDocument.js';
import {createCatalogComponent} from '../src/builder/componentCatalog.js';
import {BADGE_DEFAULTS} from '../src/builder/propertyModel.js';
import {PRODUCT_TEXT_VARIABLES,TIMER_TEXT_VARIABLES} from '../src/builder/textVariables.js';
import {iconLabel} from '../src/builder/iconLabels.js';
import {PRODUCT_PARAMETER_OPTIONS} from '../src/products/productParameters.js';

export const definitions=[];
const add=(types,group,label,key,meaning,condition='该组件显示且当前模块已启用',options=[],range='')=>definitions.push({types,group,label,key,meaning,condition,options,range});
add(['Stack'],'展示顺序','展示顺序','comparisonOrderMode','整张特权对比表按画布或用户规则展示，三列按稳定特权标识同步重排，表头固定','仅特权表最外层；不改写模板图层顺序',[['canvas','按画布顺序','默认及回退顺序'],['rule','按用户规则','采用所选规则结果']]);
add(['Stack'],'展示顺序','排序规则','comparisonOrderRule','选择排序规则，缺失或无有效结果时按画布顺序展示；未返回条目按原顺序追加','特权表选择按用户规则时；当前规则是Demo示例，未接入真实用户接口');
const without=(...types)=>COMPONENT_TYPES.filter(type=>!types.includes(type));
const containers=[...CONTAINER_TYPES].filter(type=>!['Tabs','Carousel','PageControl','Timeline','TimelineItem','Switch','ExpressCheckout','Countdown'].includes(type));
const sized=without('TimelineItem');
const spaced=without('TimelineItem','Wallet','Custom');
const framed=without('Text','ProductParameter','Timeline','TimelineItem','Countdown','Wallet','Custom','Icon','Screen','Indicators');
const all=COMPONENT_TYPES;
const alignment=[['start','起始','横向时靠上，纵向时靠左；叠放时靠左上'],['center','居中','交叉轴居中；叠放时两个方向均居中'],['end','末尾','横向时靠下，纵向时靠右；叠放时靠右下']];
const distributions=[['between','两端分布','首尾贴内容区主轴两端，把剩余空间均分到子项之间；一个子项靠起始'],['around','各项两侧均分','每个子项两侧分配相同的额外空间；相邻额外间隔为首尾额外留白的两倍，基础gap另加'],['evenly','各项等距','首端、尾端及子项之间分配相等的额外空间，内部基础gap仍保留'],['start','起始','全部子项聚集在内容区主轴起点'],['center','居中','整组子项在内容区沿主轴居中'],['end','末尾','全部子项聚集在内容区主轴末端']];
const modes=[['fit','适应内容','尺寸随内容收缩，不凭空产生可分配空间'],['fill','填满','使用父容器可用空间；纵向有界容器中的填满高度分摊剩余高度'],['fixed','固定','使用明确的设计像素尺寸，不是浏览器缩放后的截图尺寸']];
const fit=[['cover','填满','保持比例铺满框体，超出的部分裁切'],['contain','完整显示','保持比例完整显示，框体与素材比例不同时会有留白'],['fill','拉伸','铺满框体，允许改变素材比例'],['none','原始尺寸','保持素材固有尺寸，不自动缩放']];
const bool=[['true','开启','启用此能力或使用该状态'],['false','关闭','禁用此能力或不使用该状态']];

add(['Screen'],'图层管理','页面名称','name','为不同屏幕场景命名，不修改正文、价格或前端文案','只有Screen允许重命名；其他组件的旧name数据保留但不作为图层名称展示');
add(all,'图层管理','组件类型 / 图层名称','editor.layerLabel','普通组件固定显示中文组件名称；文字组件显示实际正文或绑定商品的实际值；Screen保留场景名称','不再提供普通组件和弹窗的重命名；旧数据别名不删除，不依靠图标猜组件类型');
add(['Screen','BottomSheet'],'场景管理','新场景名称','editor.sceneName','创建、导入或复制场景时自动追加数字避开重名，便于目标选择与画板区分','不修改已有场景名称、组件正文或稳定ID；普通组件图层仍固定显示组件类型');
add(['Button','PurchaseButton'],'编辑器工具','画布点击','editor.buttonSelection','首次点击按钮内文字或图标先选中按钮，显示动作和步骤；再次点入当前按钮内部可编辑文字/图标，也可直接在图层树选择子项','编辑态选择规则，不是持久化配置；弹层内容不会反向选中其打开按钮');
add(['Screen'],'图层管理','流程屏幕','editor.flowLayers','主图层列表只列流程Screen，旧HT自动生成的辅助详情和未配置详情不再作为流程层展示','仅移除冗余编辑器展示，不删除用户数据或修改现有详情链接；用户创建的普通屏幕仍正常展示');
add(without('Screen','Flow'),'图层管理','显示状态','hidden','控制组件及其整棵子树是否渲染','当前节点不是页面根节点',[['false','显示','渲染组件'],['true','隐藏','从预览布局中移除，不保留占位']]);
add(without('Screen','Flow'),'图层管理','图层拖动','图层树操作','在左侧图层树调整顺序，拖入容器时移动整棵子树，保留组件内容、样式及商品数据','不是右侧配置字段；目标必须允许容纳该节点且不能形成循环');
add(['BottomSheet'],'弹窗编辑','弹窗图层','editor.surface','在统一弹窗分区和独立画板编辑子组件，不参与主页面文档流；实际节点归属不变','弹窗不是流程Screen；可从分区加号创建居中挽留弹窗，按钮打开的底部弹窗仍从组件库添加');
add(['BottomSheet'],'弹窗位置','显示位置','presentation','选择居中弹窗或底部弹窗，使用相同尺寸与内容配置','只改变弹窗位置，不改关闭触发或按钮动作',[['overlay','屏幕居中','居中放置在遮罩上'],['sheet','屏幕底部','靠屏幕底部放置']]);
add(['BottomSheet'],'弹窗位置','屏幕边距','surfaceInset','弹窗与手机屏幕四边保留的最小距离；填满尺寸在扣除该距离后计算','默认居中20px、底部0px；外边距另外扣除。超高弹窗内部滚动，不超出手机预览',[],'0–160 px');
add(sized,'尺寸','实际尺寸','editor.renderedSize','显示选中组件实际外框的设计像素尺寸，包含内边距与边框，不包含外边距','只读；切换固定模式沿用当前测量值，不突然跳回160px；画布缩放不改变值');
add(['Screen'],'付费墙设置','触发屏幕','editor.exitSourceId','选择正在配置关闭事件的源Screen，不是优惠自身要执行的动作','Demo扩展能力；多屏可切换，画布关闭连接点会自动选定对应源屏幕；不改变初始步骤或按钮目标');
add(['Screen'],'付费墙设置','关闭后显示','settings.closeTargetsByScreen[screenId]','绑定当前画布中的真实页面或弹窗ID；原位关联不复制内容、不创建额外付费墙记录','Demo扩展能力，每个真实流程页面可独立配置；显式空值覆盖旧绑定；无需商品即可展示弹窗', [['','未关联','关闭时直接结束预览'],['node-id','当前画布内容','同一弹窗可由多个源页面共享，各自关联互不改写']]);
add(['Screen'],'关闭后显示','关闭哪个页面','editor.exitSourceId','明确选择前置页面；前置事件固定为关闭该页面','画布关闭页面连接点、页面设置或弹窗的配置触发页面入口；不会修改初始步骤');
add(['Screen','BottomSheet'],'关闭后显示','当前画布 / 弹窗样式 / 已保存内容','editor.closeTargetPicker','当前画布列出真实可关联目标；样式可创建居中礼盒弹窗或空白；已保存内容从历史记录复制并关联','默认当前画布，不混入无关历史记录；关联此内容不复制；复制并关联生成独立节点ID，保留原保存来源不变');
add(['Screen','BottomSheet'],'关闭后显示','新建挽留弹窗','editor.createModal','创建可编辑的标题、礼盒图片、正文、继续了解和暂时离开按钮，并直接关联所选源页面','所有模板可用，不强制购买或商品；已有目标时明确新建并更换关联，原目标保留');
add(['Screen','BottomSheet'],'弹窗管理','解除关联 / 删除弹窗 / 撤销移除','editor.modalLifecycle','解除仅移除当前源页面关系，保留内容；删除移除画布弹窗并清理所有来源关系及打开按钮；撤销恢复刚才移除','当前文档可恢复操作；旧独立保存记录不被物理删除；继续其他内容修改后不再覆盖性撤销旧快照');
add(['Screen'],'兼容','旧独立弹窗','settings.exitOffersByScreen[screenId]','兼容原独立保存文档，当前画布可直接复用；解除后仍作为当前工作区内容保留','新建不再使用此格式；旧exitOfferOfferingId只在最终屏幕回退生效，显式本地绑定优先；主文档与相关旧弹窗共同保存');
add(['Screen'],'兼容','解除后保留的旧弹窗','settings.retainedPopupIds','保存已解除但仍位于当前工作区的旧独立弹窗ID，不重新触发','不是新建弹窗的配置字段；删除画布弹窗后移除此ID，但保留历史保存记录');
add(['Screen'],'弹窗预览','预览流程 / 预览弹窗 / 测试关闭触发','editor.previewMode','预览流程从初始页面开始；预览弹窗直接展示当前弹窗；测试关闭触发从关联来源页开始','预览访问历史与编辑选择分开；返回编辑不改变当前文档、初始步骤或关联');
add(['Screen','BottomSheet'],'弹窗预览','关闭、返回与继续','preview.dismiss','关闭源页面时展示绑定内容；原位弹窗的关闭弹窗或返回动作回到来源页面；关闭付费墙动作和遮罩退出则结束流程','同一来源每次预览只拦截一次，避免无法离开；旧独立优惠保持原有结束会话行为；重新预览重置会话，不代表真实交易');
add(['Screen','BottomSheet'],'触发关系','关闭页面 → 显示内容','editor.exitRule','画布关闭虚线及设置显示实际前置页面和目标名称；弹窗反向显示全部关联来源','隐藏、删除或失效目标不触发并显示告警；普通按钮弹窗不会自动成为挽留');
add(all,'保存范围','保存','paywall.save','已有记录将当前整份组件文档按付费墙ID保存到当前浏览器，不修改模板默认内容','新建时确认样式仅返回创建页，填写名称并点击创建后才写记录；不是组件库保存，不代表线上发布或真实交易');
add(all,'保存范围','放弃修改','paywall.discard','恢复当前付费墙上次明确保存的版本；无保存版本时恢复当前模板默认内容','丢弃工作会话修改，不改模板默认素材、文案或SKU');
add(all,'保存范围','重新套用模板','template.apply','重新实例化模板默认内容，不读取上次未保存编辑或模板ID自动缓存','有未保存内容时先确认替换；取消保留；已保存付费墙仍可从列表重新打开');
add(all,'保存范围','离开工作区','paywall.leave','已有记录存在未保存内容时可保存并继续、放弃并继续或继续编辑；新建可返回创建页继续配置；浏览器离开使用原生未保存保护','保存失败不继续离开；名称和画布修改都属于同一工作区；新建不能从离开提示直接保存记录');
add(all,'后台管理','基础名称 / 复制','paywall.general','基础名称保存写入同一记录；复制读取已保存完整画布、商品和相关弹窗，打开未保存独立副本','名称为空阻止保存；副本保存前不产生正式记录；基础设置商品入口进入实际画布商品配置，不伪造临时新增结果');
add(containers,'布局','轴向','axis','控制直接子组件的排列方向','只影响该容器的直接子组件',[['horizontal','横向','从左至右排列；主轴为水平方向'],['vertical','纵向','从上至下排列；主轴为垂直方向'],['overlay','叠放','子组件叠在同一网格位置，不产生逐项分布或间距']]);
add(containers,'布局','对齐','align','控制交叉轴位置，不等同于文字段落对齐','子项若已填满交叉轴，或有自身alignSelf，位置可能不变化',alignment);
add(containers,'布局','分布','justify','沿主轴安排整组子项及剩余空间','横向或纵向；需有剩余空间。适应内容、子项填满或溢出时不同选项可能同形',distributions);
add(containers,'布局','子项间距','gap','相邻直接子项之间的基础间隔；均分分布可在其上增加空间','横向或纵向；不是组件外边距',[],'0–200 px');
add(containers,'兼容','当前对齐：拉伸（旧配置）','align=stretch','只读显示旧值并维持旧布局；标准按钮始终三项，主动选择后替换旧值','只有已保存stretch时显示；不是第四个可选按钮');
add(containers,'兼容','换行（旧模板）','wrap','允许横向子项换到下一行','仅已存wrap=true且横向时显示；不自动修改旧模板',[['true','换行','空间不足时换行'],['false','不换行','保持一行']]);

for(const axis of ['width','height']){
  const label=axis==='width'?'宽度':'高度',cap=axis==='width'?'Width':'Height';
  const owners=axis==='height'?sized.filter(type=>type!=='Wallet'):sized;
  add(owners.filter(type=>!['Icon','Indicators'].includes(type)),'尺寸',label,`${axis}Mode`,'决定尺寸的计算方式','子项约束、父容器尺寸和内外边距共同影响最终尺寸',modes);
  add(owners.filter(type=>!['Icon','Indicators'].includes(type)),'尺寸',`固定${label}`,axis,'指定固定设计像素尺寸',`${label}选择固定时显示`,[],'0–2000 px');
  add(['Icon','Indicators'],'尺寸',label,axis,'指定图形外框尺寸；图标内部图形扣除内边距和边框后绘制','这两类组件只使用固定尺寸',[],'0–2000 px');
  const limited=owners.filter(type=>!['Icon','Indicators'].includes(type));
  for(const bound of ['min','max'])add(limited,'尺寸',`${bound==='min'?'最小':'最大'}${label}`,`${bound}${cap}`,'限制尺寸的下界或上界；上下界冲突时同步修正另一界','只有填满模式能新增约束；旧记录已有约束保留显示和效力，切换尺寸模式时清除',[],'0–2000 px；最大值0表示未设置');
}
add(['Custom'],'尺寸','加载时初始高度','loadingHeight','ZIP未完成加载和首次测量前的占位高度','高度为适应内容且非旧版HTML；收到真实高度后由组件内容决定',[],'0–2000 px');
for(const [prefix,label] of [['padding','内边距'],['margin','外边距']]){
  const owners=prefix==='margin'?spaced.filter(type=>type!=='Screen'):spaced;
  add(owners,'布局间距',`${label}配置方式`,`${prefix}Mode`,'同一组边距的轴向/独立表示，不是两份叠加配置','轮播只有上下内边距；时间线中的图标不提供外边距',[['axis','轴向','纵向同时修改上下，横向同时修改左右'],['individual','独立','分别编辑各边；切换时显式转换数值']]);
  for(const [key,name] of [['Vertical','纵向'],['Horizontal','横向'],['Top','上'],['Right','右'],['Bottom','下'],['Left','左']])add(prefix==='padding'&&['Horizontal','Right','Left'].includes(key)?owners.filter(type=>type!=='Carousel'):owners,'布局间距',`${label}${name}`,`${prefix}${key}`,prefix==='padding'?'增加内容与框体边缘的距离，会减少可用于内容的内部空间':'增加框体外侧与相邻元素的距离；不等同于父级子项间距',`${['Vertical','Horizontal'].includes(key)?'轴向':'独立'}模式；时间线图标无外边距`,[],`${prefix==='padding'?'0':'-200'}–500 px`);
}
const paints=(types,group,label,key,gradient=false,condition,opacityKey=`${key}Opacity`)=>{
  add(types,group,label,key,'设置此层独立涂色，不改变其他涂色或整组件透明度',condition,[],gradient?'纯色CSS颜色或渐变':'纯色CSS颜色');
  add(types,group,`${label}不透明度`,opacityKey,'只影响此颜色；0完全透明，100完全不透明',`${condition??'该颜色存在'}；渐变时由各色标透明度控制，外部数值固定100`,[],'0–100%');
  add(types,`${group} / 色板`,`${label}色值格式`,key,'HEX、RGB、透明度是同一个颜色的不同表示，不能重复叠加透明度',condition,[], 'HEX / R / G / B / A');
  if(gradient){
    add(types,`${group} / 色板`,`${label}渐变角度`,key,'旋转线性渐变方向','打开该颜色色板并切换渐变',[],'角度');
    add(types,`${group} / 色板`,`${label}色标`,key,'调整每个色标的位置、颜色及透明度；可新增/移除色标','渐变模式；不是组件外部的不透明度',[],'位置0–100%；颜色及透明度');
  }
};
const corners=(types,group,prefix='')=>{
  add(types,group,`${prefix}形状`,`${prefix?'badge.':''}shape`,'决定外框裁切形状','外观模块启用；图片和图标的形状范围见专属字段',[['rectangle','矩形','使用圆角数值'],['pill','胶囊','两端自动形成圆弧，隐藏无效圆角输入']]);
  add(types,group,`${prefix}圆角配置方式`,`${prefix?'badge.':''}radiusMode`,'统一圆角与四角独立共用同一几何数据','矩形形状',[['all','统一','四个角使用同一数值'],['individual','四角','分别编辑四个角']]);
  for(const [key,name] of [['radius','圆角'],['radiusTopLeft','圆角左上'],['radiusTopRight','圆角右上'],['radiusBottomRight','圆角右下'],['radiusBottomLeft','圆角左下']])add(types,group,`${prefix}${name}`,`${prefix?'badge.':''}${key}`,'设置框体对应角的圆角半径',`${key==='radius'?'统一':'四角'}模式且形状为矩形`,[],'0–2000 px');
};
add(framed,'外观','外观启用','appearanceEnabled','启用形状/圆角；移除后使用无圆角矩形','不删除子组件或其他独立模块',bool);
corners(framed,'外观');
const fillOwners=[...framed,'Screen'];
add(fillOwners.filter(type=>type!=='Screen'),'填充','填充启用','fillEnabled','启用背景涂色、图片或视频；关闭不删除已存素材','页面背景为必需模块，无移除入口',bool);
add(fillOwners,'填充','背景类型','fillType','选择唯一生效的背景来源','该填充启用；视频仅容器支持',[['color','颜色','使用背景颜色'],['image','图片','使用背景图片'],['video','视频','容器背景静音循环自动播放视频']]);
paints(fillOwners,'填充','背景颜色','background',true,'背景类型为颜色；页面/页头纯色不透明度固定100');
add(fillOwners,'填充','背景图片地址','backgroundImage','上传或输入背景图片，替换该组件已有背景图','背景类型为图片；本Demo支持PNG/JPG/WebP/GIF，文件上限10MB');
add(fillOwners,'填充','素材地址','backgroundVideo','上传或输入背景视频，不增加一个内容流中的视频子组件','背景类型为视频；新配置仅容器支持，其他类型保留旧视频值；本Demo上传MP4，上限10MB，不提供转码');
add(fillOwners,'填充','背景适配','backgroundFit','控制背景素材如何适应框体','背景类型为图片/视频',fit);
const bordered=[...framed,'Icon','Image','Video','Indicators'];
add(bordered,'边框','边框启用','borderEnabled','添加或移除描边，描边占用框体内部尺寸','图标需先开启图标背景；指示器只有描边没有阴影',bool);
paints(bordered,'边框','边框颜色','borderColor',true,'边框模块已启用','borderOpacity');
add(bordered,'边框','边框宽度','borderWidth','调整描边厚度，不是外边距','边框启用',[],'0–20 px');
const shadowed=bordered.filter(type=>type!=='Indicators');
add(shadowed,'阴影','阴影启用','shadowEnabled','添加或移除外投影','图标需开启图标背景',bool);
for(const [key,label,meaning,range] of [['shadowX','X 偏移','向右为正、向左为负','-100–100 px'],['shadowY','Y 偏移','向下为正、向上为负','-100–100 px'],['shadowBlur','模糊','扩大投影模糊范围','0–100 px']])add(shadowed,'阴影',label,key,meaning,'阴影启用',[],range);
paints(shadowed,'阴影','阴影颜色','shadowColor',false,'阴影启用','shadowOpacity');
add(framed,'兼容','组件透明度（旧模板）','opacity','影响整个组件及其子树；不等同于某个颜色透明度','仅已存非100%记录时显示',[],'0–100%');

const typography=(types,prefix='')=>{
  const group=prefix?'徽标 / 文字':'文字样式',path=prefix?'badge.':'';
  add(types,group,`${prefix}文字对齐`,`${path}textAlign`,'段落在自身文字框内左对齐、居中或右对齐，不移动整个文字框','文字框有额外宽度时最明显',[['left','左对齐','文字靠左'],['center','居中','文字在框内居中'],['right','右对齐','文字靠右']]);
  add(types,group,`${prefix}字体`,`${path}fontFamily`,'选择系统或当前文档已上传字体族；旧字体保留兼容','字体族资源由文档统一保存，不按每个文字重复上传');
  add(types,group,`${prefix}字重`,`${path}fontWeight`,'改变整段文字粗细，真实字形取决于字体文件包含的字重','100极细、200特细、300细、400常规、500中等、600半粗、700粗、800特粗、900极粗',[], '100–900');
  add(types,group,`${prefix}字号`,`${path}fontSize`,'改变整个文字组件字号，不是只改变光标选区字号','配置单位是设计像素；手机预览会整体缩放',[],'8–160 px');
  paints(types,group,`${prefix}文字颜色`,`${path}color`,true,'对应文字存在',`${path}colorOpacity`);
  paints(types,group,prefix?'徽标文字背景':'背景颜色',prefix?'badge.textBackground':'background',true,'文字背景与父框体填充分属两层',prefix?'badge.textBackgroundOpacity':'backgroundOpacity');
};
typography(['Text','ProductParameter']);
add(['ProductParameter'],'参数属性','商品参数','parameter','引用外部商品字段，仅预览字段名，不编辑业务文案或绑定SKU','月价与划线月价在终身商品中分别显示总价与划线总价；切回订阅恢复原字段',PRODUCT_PARAMETER_OPTIONS.map(([key,label])=>[key,label,`引用${label}`]));
add(['ProductParameter'],'参数属性','默认态输出','parameter','只读默认态字段占位，不是可编辑文字');
add(['ProductParameter'],'参数属性','选中态输出','parameter','只读{选中商品标签}，与默认{商品标签}分别映射','仅商品标签参数');
add(['ProductParameter'],'参数属性','终身适配','parameter','显示当前终身商品的有效字段；节省比例不显示但保留配置','所属套餐为终身商品，且该参数需要转换或隐藏');
for(const [key,label] of [['italic','斜体'],['underline','下划线'],['strike','删除线']])add(['ProductParameter'],'文字样式',label,key,'调整参数整体文字格式，不修改外部字段值');
add(['Text'],'文字规则','文字规则','textRules','切换默认或优惠分支的内容/格式；标准尺寸仍属于默认，不重复配置','预览使用当前选择规则，不是真实用户优惠资格判定',[['default','默认','默认文案与格式'],['introductory','首次优惠','首次优惠覆盖，未覆盖字段继承默认'],['promotional','促销优惠','促销优惠覆盖'],['multiphase','多阶段优惠','多阶段优惠覆盖']]);
add(['Text'],'文字属性','文字内容','text / runs','编辑正文与真实选区格式；默认SKU绑定时只读，优惠分支可独立覆盖文案','优惠仅改格式时继续读取SKU；主动改优惠正文才覆盖，返回默认仍读原商品，不改SKU记录');
for(const [label,key,meaning] of [['粗体','bold','切换选区粗体'],['斜体','italic','切换选区斜体'],['删除线','strikethrough','给选区加删除线'],['下划线','underline','给选区加下划线'],['行内代码','code','给选区使用等宽代码格式，不是HTML编辑'],['链接','link','为选区设置安全链接或移除链接'],['撤销/重做','history','撤销或恢复文字编辑']])add(['Text'],'文字工具',label,`runs.${key}`,meaning,'文字有选区时只改变选区；链接不接受脚本协议');
add(['Text'],'旧版兼容','内容来源','binding','仅旧版未升级文档的兼容入口；当前构建器普通文字与商品参数已经分离','升级时商品绑定文字自动迁移为商品参数；当前文字面板不提供来源切换',[['custom','自定义文字','旧版独立文字'],['product','商品字段','旧版绑定，升级后改用商品参数']]);
add(['Text'],'旧版兼容','商品字段','binding.field','旧字段映射，在当前构建器迁移为ProductParameter.parameter','仅未升级的兼容文档；不是当前新增配置入口',Object.entries({name:'商品周期名称',price:'售卖价',reference:'划线价',monthlyPrice:'月均售卖价',referencePrice:'SKU 原价',productInfo:'商品信息',supportingCopy:'辅助文案',savingCopy:'节省比例（兼容字段）',saveCopy:'商品信息（兼容字段）',badgeText:'商品标签'}).map(([key,label])=>[key,label,`旧绑定${label}`]));
add(['Text'],'旧版兼容','转为独立文字','binding','未升级旧文档的解绑入口；当前参数组件不提供此操作','已有旧绑定且默认规则；当前需要独立文案时新增普通文字');
for(const [key,label] of PRODUCT_TEXT_VARIABLES)add(['Text'],'文字变量',label,`{{ ${key} }}`,'插入变量占位符；商品内部读取所属商品，商品外部读取当前选中商品','有对应商品数据才可显示；终身商品不生成订阅月数');
add(['Text'],'文字变量','业务变量','{{ business.<变量键> }}','读取工作区业务变量默认值或预览运行值','在条件与联动中创建变量后，文字变量菜单可插入；未知键以空值回退');
for(const [key,label] of TIMER_TEXT_VARIABLES)add(['Text'],'倒计时变量',label,`{{ ${key} }}`,'插入当前倒计时值；补零如02，不补零如2','处于倒计时内容中；计时单位决定小时/分钟是否累计');
add(['Text'],'文字变量','插入变量','text / runs','在当前选区插入完整变量标签；正文、多个变量可以混排，并支持选区格式','变量面板按倒计时、商品、业务、列表条目分组，可搜索名称或变量键；倒计时和条目按所在组件开放。旧timerField自动兼容为同名变量，不再提供二选一入口');
add(['Text'],'字体资源','配置字体族','document.fonts','上传TTF/OTF并解析真实字体名/字重，文档共享使用；组件复制携带必要资源','字体文件选择/上传是资源操作；文件不合法或保存失败不覆盖原记录');

add(['Image','Video'],'素材','素材地址','src','设置当前素材；上传可在图片和视频类型间切换','本Demo上传PNG/JPG/WebP/GIF/MP4，上限10MB；安全URL或本地Data URL');
add(['Image'],'素材','媒体类型','mediaType','同一媒体组件选择图片或PAG动画，保持尺寸和视觉样式','PAG使用官方libpag播放；尚无用户业务PAG验收文件',[['image','图片','使用src'],['pag','PAG 动画','使用pagSrc和静态回退图']]);
add(['Image'],'PAG','PAG 地址','pagSrc','PAG文件HTTP或上传Data URL','媒体类型为PAG；最大10MB，加载和播放失败转静态回退');
add(['Image'],'PAG','PAG 静态回退图','fallbackSrc','PAG加载中、失败或运行环境不支持时展示的图片','媒体类型为PAG');
add(['Image'],'PAG','PAG 循环播放','pagLoop','持续循环或播放一次','媒体类型为PAG',bool);
add(['Image'],'PAG','PAG 自动播放','pagAutoPlay','初始化后播放或只渲染首帧','媒体类型为PAG',bool);
add(['Stack'],'数据与展开','数据列表来源','dataSource','普通子组件或按当前SKU礼包/全局福利重复内部基础组件','列表没有可用数据时整块隐藏并收高；内部节点仍可编辑',[['','普通子组件','不重复'],['gifts','当前 SKU 礼包','读取业务数据中对应SKU'],['benefits','会员福利','读取全局福利列表']]);
add(['Stack'],'数据与展开','允许展开收起','collapsible','容器支持用户展开或收起内部内容','编辑态展开以便编辑，交互预览按延时/点击控制',bool);
add(['Stack'],'数据与展开','展开按钮文案','collapseLabel','容器展开收起按钮的可见文案','开启允许展开收起');
add(['Stack'],'数据与展开','自动展开延时','autoExpandDelay','进入页面或切换套餐后等待指定毫秒再展开；-1只手动展开','开启允许展开收起；默认1500ms',[],'-1–60000 ms');
add(['Stack'],'数据与展开','允许横向浏览','horizontalScroll','容器沿横向连续滚动，不劫持纵向滚动','建议搭配横向排列和固定宽条目；使用原生滚动',bool);
add(['Image','Video'],'素材','素材适配','objectFit','控制内容素材在自己的框体内如何缩放','正常新配置只提供填满/完整显示；已存拉伸/原始尺寸保留兼容',fit);
for(const [key,label,meaning] of [['loop','循环播放','播完后重新开始'],['muted','静音','关闭音轨声音'],['autoPlay','自动播放','加载后尝试播放，受浏览器策略限制'],['controls','播放控件','显示播放器原生控制栏']])add(['Video'],'播放设置',label,key,meaning,'关闭播放控件时强制自动播放；取消自动播放会保留可操作控件',bool);
add(['Image','Video'],'遮罩','遮罩启用','maskEnabled','启用或移除素材裁切形状','只影响素材框体，不添加背景',bool);
add(['Image','Video'],'遮罩','遮罩','mask','选择素材裁切形状','已启用遮罩；原端凹/凸曲线尚未实现，不把本表当成全量源端等价',[['rectangle','矩形','可配统一或四角圆角'],['circle','圆形','椭圆裁切，非方形框体不会自动变成正圆']]);
for(const [key,name] of [['radius','圆角'],['radiusTopLeft','圆角左上'],['radiusTopRight','圆角右上'],['radiusBottomRight','圆角右下'],['radiusBottomLeft','圆角左下']])add(['Image','Video'],'遮罩',name,key,'设置矩形裁切的对应圆角','矩形遮罩；统一/四角切换共用同一数据',[],'0–2000 px');
add(['Image','Video'],'遮罩','圆角配置方式','radiusMode','切换统一圆角与四角独立','矩形遮罩',[['all','统一','四角同值'],['individual','四角','各角独立']]);
add(['Image','Video'],'叠加层','叠加层启用','overlayEnabled','启用独立的素材上方涂色层，不覆盖原素材地址','素材存在；遮罩仍统一裁切',bool);
paints(['Image','Video'],'叠加层','叠加层颜色','overlayColor',true,'叠加层启用且素材存在','overlayOpacity');
add(['Icon'],'图标属性','类型','icon','从可搜索图形网格选择真实图标标识，支持线框/填充，不把名称当图形','名称选中后显示，网格内隐藏名称，悬停可查');
add(['Icon'],'图标属性','数字','number','旧数字图标显示的数字','仅icon=number',[],'0–99');
paints(['Icon'],'图标属性','颜色','color',false,'只影响图形，不降低图标背景或边框透明度','colorOpacity');
add(['Icon'],'图标背景','图标背景启用','iconBackgroundEnabled','启用独立背景和边框/阴影；移除会清除该背景外观配置','只改变图标框体，图形ID不变',bool);
paints(['Icon'],'图标背景','背景颜色','iconBackground',true,'图标背景已启用','iconBackgroundOpacity');
add(['Icon'],'图标背景','形状','shape','图标背景框体形状','图标背景已启用',[['rectangle','矩形','使用圆角'],['circle','圆形','使用椭圆背景']]);
for(const [key,name] of [['radius','圆角'],['radiusTopLeft','圆角左上'],['radiusTopRight','圆角右上'],['radiusBottomRight','圆角右下'],['radiusBottomLeft','圆角左下']])add(['Icon'],'图标背景',name,key,'调整图标背景圆角','背景开启且矩形；不是图形自身的线条圆角',[],'0–2000 px');
add(['Icon'],'图标背景','圆角配置方式','radiusMode','统一或四角独立','图标背景开启且矩形',[['all','统一','四角同值'],['individual','四角','四角分别设置']]);

add(['Package'],'兼容存储','商品 SKU','products[dataKey].skuId','旧记录的SKU数据保留，不作为样式预览内容来源','当前构建器不提供SKU选择器；新组件无需绑定SKU。此行为只兼容旧数据，不是新增配置入口');
add(['Package'],'商品属性','商品类型','productType','选择订阅或终身结构语义，不绑定实际SKU','终身不按月收费，不显示节省比例；切换类型保留原参数和样式',[['subscription','订阅商品','月价/划线月价保持原字段'],['lifetime','终身商品（非订阅）','月价转总价、划线月价转划线总价、节省比例隐藏']]);
add(['Package'],'商品属性','价格显示','priceMode','一次同步当前套餐主售价与划线价参数；模式根据同一份参数配置计算，旧值不覆盖画布','只调整已有价格参数，保留排版、补充月价、标签及其他套餐；终身显示总价，切回订阅保留模式',[['1','总价','售价总价、划线总价'],['0','月均价','售价月价、划线月价'],['3','总价 / 月均划线价','售价总价、划线月价'],['4','月均价 / 总划线价','售价月价、划线总价']]);
add(['Package'],'商品属性','显示商品标签','productLabelEnabled','控制商品标签容器的可见性，不计算折扣','有商品标签子组件时展示；预览使用字段名占位，不因SKU标签为空隐藏',[['true','显示','默认{商品标签}，选中{选中商品标签}'],['false','隐藏','隐藏标签容器，保留字段和样式']]);
for (const [label,key,meaning] of [['商品周期名称','name','展示{SKU时长}'],['售卖价','price','展示¥{总价}或¥{月价}/月'],['划线价','reference','展示{总价}或{月价}/月，文字采用删除线'],['商品标签（未选中）','badgeText','展示{商品标签}'],['商品标签（选中）','selectedBadgeText','展示{选中商品标签}'],['商品信息','productInfo','展示{商品信息}']]) add(['Package'],'商品属性',label,`products[dataKey].${key}`,meaning,'只读字段定义，不需要SKU或金额；实际视觉样式由绑定Text配置');
add(['Package'],'商品属性','默认选中','defaultSelected','设置初次预览选中的商品；同一选择组只保留一个默认选中','不同选择组相互独立',[['true','是','同组其他默认选中清除'],['false','否','取消该商品默认选中']]);
add(['Package'],'商品属性','互斥选择组','group','按当前页面或弹窗列出商品组，显示各组套餐数量和成员；可加入已有组或新建独立组','同组仅能选中一个套餐；保留旧组标识，切组时协调新旧组的默认选中',[['existing','已有商品组','加入同场景已有组'],['__new__','新建独立商品组','生成唯一组标识']]);
for(const [key,name] of Object.entries({name:'商品名称',price:'主价格',reference:'参考价',monthlyPrice:'月均价',referencePrice:'原价',supportingCopy:'辅助文案',savingCopy:'优惠说明',saveCopy:'SAVE 文案',badgeText:'标签文字'}))add(['Package'],'兼容存储',name,`products[dataKey].${key}`,'旧记录的示例数据保留；当前样式预览展示对应字段名','仅旧数据兼容，不是当前构建器新增配置入口；自定义文字仍可独立编辑');
add(all,'状态样式','状态','navigation.package-style','切换正在编辑和预览的状态；不是第二个“默认选中”字段','仅商品、标签按钮、指示器或处于商品/标签按钮内的子组件；文字正文共用，字号、字重、颜色及排版可分别配置；未覆盖值继承默认',[['default','默认','编辑默认标准属性'],['selected','选中 / 当前','编辑选中或激活标准属性；未覆盖值继承默认']]);

add(['Button','PurchaseButton'],'动作属性','点击动作','action.action','设置按钮用途及交互行为；购买按钮选择导航时保留ID、内容与实际样式并转为普通按钮，选择购买则转回购买按钮','编辑态优先选中图层；交互预览才执行动作；仅显式选择行为才转换类型，不改原模板',[['None','未配置','不执行动作'],['NavigateTo','跳转到','继续选择导航目标'],['NextScreen','跳转到下一步骤','按目标屏幕ID跳转并记录访问历史，自动显示步骤选择'],['NavigateBack','返回上一屏幕','返回当前流程历史或关闭当前弹层'],['RestorePurchases','恢复购买','仅显示恢复购买演示提示，不发起交易'],['Dismiss','关闭付费墙','仅演示关闭，真实关闭已排除'],['Purchase','购买','显示购买结账方式；不把跳转伪装成购买']]);
add(['Button','PurchaseButton'],'动作属性','导航目标','action.action','选择具体目的地','点击动作是跳转到；购买用途改变后按普通按钮编辑',[['OpenPrivacy','隐私政策','打开单独配置的隐私链接'],['OpenTerms','服务条款','打开单独配置的条款链接'],['OpenURL','自定义链接','打开配置URL'],['WebCheckout','网页购买','演示网页购买，不发起交易'],['OfferCodeRedemption','优惠码兑换','演示兑换入口'],['OpenSheet','弹层','打开已绑定且未隐藏的弹层，包括旧模板挽留弹窗'],['OpenPage','详情屏幕','进入已绑定且内容可用的流程页面']]);
add(['Button','PurchaseButton'],'动作属性','链接地址','action.actionUrl','设置隐私、条款或URL目标','导航目标为隐私政策/服务条款/自定义链接；购买按钮已显式切换为普通导航用途');
add(['Button'],'动作属性','链接打开方式','action.openMethod','决定链接交给哪种浏览方式','目标链接有效；应用内浏览器为受限iframe，受目标站点嵌入策略限制',[['in_app_browser','应用内浏览器','在手机预览内嵌入页面'],['external_browser','外部浏览器','另开链接'],['deep_link','深链','使用应用协议链接；不接受脚本协议']]);
add(['Button','PurchaseButton'],'动作属性','目标页面','action.actionPage','绑定真实详情Screen，不把页面名称当作目标ID','兼容详情页面导航；普通流程之间使用下一步骤');
add(['Button','PurchaseButton'],'动作属性','步骤','action.actionPage','跳转到所选Screen步骤；属性、画布连线和运行预览使用同一目标ID','点击动作是跳转到下一步骤；不列出自己或辅助详情；删除目标后保留失效ID并提示重新选择');
add(['Screen'],'步骤编排','初始步骤','Flow.props.initialStepId','设置预览流程开始的Screen，独立于编辑时选中的屏幕','通过付费墙设置配置，按屏幕ID持久化，复制/排序不改变该ID');
add(['Screen'],'步骤编排','初始步骤 + → 创建页面','workflow.add','在画布初始步骤连接点选择空白Screen或来源屏幕，点击创建页面后插入当前初始屏幕之前','最多10步骤；选择与取消不改文档；空白仅新屏幕为空，其他画板保持各自内容；HT详情不算流程步骤');
add(['Screen'],'步骤编排','连接到后续屏幕的按钮','workflow.creationConnection','明确选择新屏幕中的普通或购买CTA，创建时将复制后按钮转为NextScreen并指向当前初始屏幕，生成实际连线','仅唯一的既有NextScreen按钮默认选中；其他CTA必须主动选择，不自动改购买行为；源模板不改，复制保留样式和子内容；actionPage唯一持有目标');
add(['Screen'],'画布选择','组件悬停框','editor.hoveredId','仅当前选中画板的可编辑组件显示悬停边框，不触发动作，不改选中项','悬停与点击共用命中规则：按钮子内容首次指向按钮，再次可下钻；离开、滚动、切换选中项和预览清空，不写入文档');
add(['Screen'],'步骤编排','复制屏幕 / 排序 / 删除','workflow.manage','在Screen更多菜单操作真实步骤，保留原屏幕名称与所有组件；复制在原屏幕后创建独立ID和商品记录','至少保留1个步骤；排序保持初始与按钮目标身份，删除目标后显示失效绑定，不擅自改绑');
add(['Button','PurchaseButton'],'动作属性','目标弹窗','action.actionPage','绑定真实BottomSheet子树','导航目标为弹窗；与页面之间的步骤跳转分开');
add(['PurchaseButton'],'动作属性','打开方式','action.action','选择结账展示流程，不在Demo中发起真实付款','真实Billing/恢复/钱包交易仍排除',[['Purchase','标准结账','显示标准结账演示'],['WebCheckout','网页结账（浏览器）','显示网页结账演示'],['WebPaywall','网页付费墙','显示网页付费墙演示'],['CustomCheckout','自定义结账','组装自定义URL并按所选浏览方式打开']]);
add(['PurchaseButton'],'动作属性','结账链接','action.actionUrl','自定义结账的基础URL','打开方式为自定义结账');
add(['PurchaseButton'],'动作属性','链接打开方式','action.openMethod','自定义结账链接的打开方式','自定义结账',[['external_browser','外部浏览器','另开URL'],['deep_link','深链','使用应用协议URL']]);
for(const [key,name,meaning] of [['attachPackageId','附带商品套餐 ID','把选中商品ID附加到URL'],['attachAppUserId','附带应用用户 ID','附加示例用户demo-preview，不读取真实用户'],['attachEnvironment','附带环境','附加sandbox示例环境']])add(['PurchaseButton'],'动作属性',name,`action.${key}`,meaning,'仅自定义结账；默认勾选',bool);

for(const type of ['Tabs','Carousel','Flow'])add([type],'页面属性','默认页面',type==='Flow'?'defaultIndex / initialStepId':'defaultIndex','设置初次展示页，并同步当前编辑预览页；流程同步保存初始步骤ID，避免旧ID覆盖新选择','页面使用真实子节点顺序；不复制正文，不修改其他页面');
add(['Carousel'],'页面属性','页面纵向对齐','pageAlignment','高度不同时控制轮播页在轨道内的位置','实际轨道比该页高时可见',[['top','顶部','页顶对齐'],['center','居中','页垂直居中'],['bottom','底部','页底对齐']]);
add(['Carousel'],'页面属性','页面间距','pageSpacing','相邻轮播页面之间的间隔','至少两个轮播页',[],'0–200 px');
add(['Carousel'],'页面属性','邻页露出','pagePeek','让两侧相邻页面各露出指定宽度','轨道需有足够宽度；不是页面内边距',[],'0–100 px');
add(['Carousel'],'页面属性','循环播放','loop','末页之后继续到首个页面','至少两个页面；与视频循环是不同字段',bool);
add(['Carousel'],'页面属性','自动切换','autoPlay','按停留时间自动切换页面','交互预览生效；编辑态不自动切走正在编辑的内容',bool);
add(['Carousel'],'页面属性','每页停留时间','autoPlayInterval','两次自动切换之间的等待时间','开启自动切换',[],'250–60000 ms');
add(['Carousel'],'页面属性','过渡时间','transitionTime','设置切页动画持续时间','开启自动切换配置；点击和实际拖动也使用轮播引擎',[],'0–10000 ms');
add(['Carousel'],'页面属性','过渡动画','transitionAnimation','选择轮播过渡方式','开启自动切换配置',[['slide','滑动','横向滑动'],['fade','淡入淡出','切换页面透明度']]);
add(['Carousel'],'分页控件','分页控件启用','children.PageControl','添加/移除实际分页控件子树，不生成多余轮播页面','轮播页仍由Slide子节点定义',bool);
add(['Carousel'],'分页控件','分页器位置','pageControlPosition','把实际分页控件放在页面轨道上方或下方','分页控件存在',[['top','顶部','轨道上方'],['bottom','底部','轨道下方']]);
add(['PageControl'],'分页控件属性','指示器间距','gap','相邻指示点之间的间隔','存在分页指示器',[],'0–200 px');
paints(['Indicators'],'填充','背景颜色','background',true,'默认/当前两态分别设置，不由轮播父级重复配置');

add(['Timeline'],'时间线属性','图标对齐','iconAlignment','使图标对齐标题行或标题加描述的整体中心','时间节点中有真实图标和文字',[['title','标题','图标中心对齐标题中心'],['content','标题和描述','图标对齐整块文字中心']]);
for(const [key,name,meaning] of [['itemSpacing','节点间距','相邻时间节点的纵向间隔'],['textSpacing','标题与描述','同一节点标题与描述之间的间隔'],['columnGutter','列间距','图标列与文字列之间的横向距离']])add(['Timeline'],'间距',name,key,meaning,'由时间线父组件统一控制，子层不重复拥有该间距',[],'0–200 px');
add(['TimelineItem'],'连接线','连接线启用','connectorEnabled','显示连接到下一节点的线，末项不额外绘制尾线；不适用时隐藏设置但保留原值','当前节点和后续可见时间节点都具有图标或图片标记',bool);
add(['TimelineItem'],'连接线','连接线宽度','connectorWidth','设置连接线厚度','连接线启用',[],'0–100 px');
for(const [key,label] of [['connectorMarginVertical','连接线纵向留白'],['connectorMarginTop','连接线留白上'],['connectorMarginBottom','连接线留白下']])add(['TimelineItem'],'连接线',label,key,'从图标接合位置缩短对应端线段，不改变节点文字尺寸','对应统一/上下独立模式；连接线已启用',[],'0–200 px');
add(['TimelineItem'],'连接线','切换连接线上下留白','connectorMarginMode','统一留白或上下独立表示','连接线已启用',[['axis','统一','上下同值'],['individual','上下独立','上下不同值']]);
paints(['TimelineItem'],'连接线','连接线颜色','connectorColor',false,'连接线启用','connectorOpacity');
add(['Switch'],'开关属性','默认状态','defaultIndex','决定初始展示关闭/开启内容，并同步预览','两份SwitchCase子树分别编辑',[['0','关闭','展示关闭内容'],['1','开启','展示开启内容']]);
add(['Toggle'],'兼容控件','控件类型','control','旧HT协议组件使用开关或勾选框','系统Switch里的滑块只提供颜色，不提供本项',[['switch','开关','展示兼容开关'],['checkbox','勾选框','展示协议勾选框']]);
add(['Toggle'],'兼容控件','初始状态','initial','设置旧控件默认开关状态','没有绑定switchTarget时',[['false','关闭','初始不勾选'],['true','开启','初始勾选']]);
add(['Toggle'],'兼容控件','购买前必须勾选','required','未勾选时阻止演示购买继续，不拦截普通文字导航','旧HT协议控件；真实交易不在本轮范围',bool);
paints(['Toggle'],'开关填充','滑块颜色','thumbColor',false,'仅系统Switch的实际滑块控件，非旧HT协议控件','thumbColorOpacity');
paints(['Toggle'],'开关填充','轨道颜色','trackColor',false,'仅系统Switch的实际滑块控件，非旧HT协议控件','trackColorOpacity');
add(['Countdown'],'倒计时属性','目标时间（UTC）','deadline','使用UTC绝对截止时间；浏览器本地时区不改变保存含义','仅手动模式；有合法时间时覆盖旧相对时长，无效时间使用兜底分支');
add(['Countdown'],'倒计时属性','时间来源','timeSource','决定手动时间或统一业务时间的唯一来源；切换保留另一种配置','业务状态由统一数据源提供，组件不修改服务端业务有效期',[['manual','手动设置','使用deadline或旧start'],['business','业务时间源','引用活动、当前用户优惠或全局业务时间源']]);
add(['Countdown'],'倒计时属性','绑定时间源','timeSourceId','关联工作区业务时间源定义，不在组件重复配置接口地址','业务时间源模式；缺失、失败或无效时间使用兜底分支');
add(['Countdown'],'倒计时属性','接口数据键','business.timeSources[].key','只读展示统一接入层提供数据的键','已选择时间源；Demo未连接真实接口，样例在工作区业务数据维护');
add(['Countdown'],'倒计时属性','时间字段','expiresAt','只读展示统一接口约定的到期时间字段','已选择时间源；需要带时区的ISO时间');
add(['Countdown'],'兼容','起始时长（旧模板）','start','进入预览后开始的相对倒计时','仅手动模式，没有deadline且原记录包含start',[],'HH:MM:SS，分和秒0–59');
add(['Countdown'],'倒计时属性','计时单位','countFrom','控制最大的显示计时单位和累计进位方式','文字使用对应计时变量才显示变化',[['days','天','小时在天内取余'],['hours','小时','小时可累计超过24'],['minutes','分钟','分钟可累计超过60']]);
add(['Countdown'],'倒计时属性','自定义兜底内容','fallbackEnabled','计时输入不可用时是否展示兜底子树','正常计时不展示兜底；子树由图层选择编辑',bool);
add(['Countdown'],'文字样式','字号','fontSize','旧倒计时未拆分子文字时，控制整段倒计时字号','仅无子组件的旧倒计时；新倒计时在真实Text子层配置',[],'8–160 px');
add(['Countdown'],'文字样式','颜色','color','旧倒计时未拆分子文字时，控制整段倒计时颜色','仅无子组件的旧倒计时；新倒计时在真实Text子层配置');
add(['Countdown'],'显示内容','编辑内容状态','navigation.<Countdown ID>','切换正在编辑及预览的计时中、已结束、数据不可用内容','编辑会话状态，不改到期时间；只有开启自定义兜底后才出现数据不可用选项');
add(['Countdown'],'显示内容','文字单元','editor.countdownTextId','在倒计时面板选择需要编辑的真实文字子组件','仅保留独立数字底色等多文字结构时显示；不新增第二份正文');
add(['Countdown'],'显示内容','倒计时文字内容','CountdownState.children[].props.text / runs','在倒计时组件内直接编辑普通文字、变量与选区样式','写入实际Text子组件；新普通倒计时默认只有一条变量文字；复杂自定义组合通过定位内容图层继续编辑');
add(['Countdown'],'显示内容','定位文字图层 / 定位内容图层','editor.selection','定位对应真实子组件，展开图层并显示完整排版属性','只改变编辑选择；不改变用户文案或组件结构');
for(const entry of [...definitions].filter(item=>item.types.includes('Text')&&['文字样式','字体资源'].includes(item.group)))add(['Countdown'],'显示内容 / 文字样式',entry.label,`CountdownState.children[当前文字].props.${entry.key}`,entry.meaning,'倒计时自身显示内容面板，写入当前真实文字；默认/选中样式独立保留',entry.options,entry.range);
add(['Wallet'],'钱包样式','按钮样式','walletStyle','改变钱包外观，不伪造真实设备钱包可用性','交互只演示，不发起交易',[['black','黑色','黑底白字'],['white','白色','白底黑字'],['white-outline','白色描边','白底黑字黑边']]);
add(['Custom'],'自定义组件','上传/替换 ZIP','customBundle','解析并缓存ZIP资源，用隔离iframe预览；替换失败保留原记录','自包含网页支持范围见审计台账；不等价原生SDK，不能读取父页面数据');
add(['Custom'],'自定义组件','移除 ZIP','customBundle','移除当前组件与ZIP的关联，不清空其他组件配置','已关联ZIP');
add(['Custom'],'兼容','HTML（旧配置）','html','编辑原有隔离HTML内容，不作为新的ZIP入口','只有旧html存在且未关联ZIP');
add(['Custom'],'自定义组件','下载示例','example.zip','下载示例资源，不修改当前组件','示例仅用于功能验证，不作为正式模板数据');

const badgeOwners=['Stack','Package','Slide','PurchaseButton'];
add(badgeOwners,'徽标','徽标启用','badgeEnabled','启用父组件独立徽标，不插入影响其他子项顺序的文字节点','徽标位置相对所属框体',bool);
add(badgeOwners,'徽标 / 文字','徽标文字','badge.text / badge.runs','徽标正文及真实选区格式；不覆盖父框体正文','徽标启用；支持与文字组件相同的六项选区工具与商品变量');
for(const [label,key,meaning] of [['粗体','bold','选区粗体'],['斜体','italic','选区斜体'],['删除线','strikethrough','选区删除线'],['下划线','underline','选区下划线'],['行内代码','code','选区等宽代码格式'],['链接','link','选区安全链接']])add(badgeOwners,'徽标 / 文字工具',`徽标${label}`,`badge.runs.${key}`,meaning,'徽标启用且存在文字选区，不修改父级或子组件文字');
for(const [key,label] of PRODUCT_TEXT_VARIABLES)add(badgeOwners,'徽标 / 文字变量',label,`badge.{{ ${key} }}`,'从所属或当前选中商品读取变量','徽标启用且存在对应商品数据');
typography(badgeOwners,'徽标');
add(badgeOwners,'徽标位置','徽标样式','badge.positionStyle','决定徽标是否跨越所属框体边缘','徽标启用',[['overlay','覆盖边框','一半越出边框，可能覆盖邻近内容，需由模板安排空间'],['nested','内嵌边框','在所属框体边缘内侧']]);
add(badgeOwners,'徽标位置','徽标对齐','badge.position','将徽标锚定在所属框体六个边缘位置','仅移动徽标，不改变父组件内子项对齐',[['top-left','左上','左上边缘'],['top-center','上方居中','上边缘中心'],['top-right','右上','右上边缘'],['bottom-left','左下','左下边缘'],['bottom-center','下方居中','下边缘中心'],['bottom-right','右下','右下边缘']]);
for(const [prefix,label] of [['padding','内边距'],['margin','外边距']]){
  add(badgeOwners,'徽标间距',`徽标${label}配置方式`,`badge.${prefix}Mode`,'同一组徽标边距切换轴向/四边独立','徽标启用',[['axis','轴向','纵向/横向'],['individual','四边','上右下左']]);
  for(const [side,name] of [['Vertical','纵向'],['Horizontal','横向'],['Top','上'],['Right','右'],['Bottom','下'],['Left','左']])add(badgeOwners,'徽标间距',`徽标${label}${name}`,`badge.${prefix}${side}`,prefix==='padding'?'徽标文字与徽标框体之间的距离':'徽标相对定位后的外侧偏移留白','徽标启用且对应边距模式',[],`${prefix==='margin'?'-200':'0'}–500 px`);
}
corners(badgeOwners,'徽标外观','徽标');
for(const [key,label] of [['appearanceEnabled','徽标外观'],['fillEnabled','徽标填充'],['borderEnabled','徽标边框'],['shadowEnabled','徽标阴影']])add(badgeOwners,'徽标',`${label}启用`,`badge.${key}`,'独立启用或移除此徽标模块，不修改父框体同名模块','徽标启用',bool);
paints(badgeOwners,'徽标填充','徽标背景颜色','badge.background',true,'徽标填充开启','badge.backgroundOpacity');
paints(badgeOwners,'徽标边框','徽标边框颜色','badge.borderColor',true,'徽标边框开启','badge.borderOpacity');
add(badgeOwners,'徽标边框','徽标边框宽度','badge.borderWidth','徽标描边厚度','徽标边框开启',[],'0–20 px');
for(const [key,label] of [['shadowX','徽标X 偏移'],['shadowY','徽标Y 偏移'],['shadowBlur','徽标模糊']])add(badgeOwners,'徽标阴影',label,`badge.${key}`,'改变徽标自身投影，不改变所属商品/容器的投影','徽标阴影开启',[],key==='shadowBlur'?'0–100 px':'-100–100 px');
paints(badgeOwners,'徽标阴影','徽标阴影颜色','badge.shadowColor',false,'徽标阴影开启','badge.shadowOpacity');

for(const [label,key,meaning] of [['上移','moveBefore','在同一父容器中前移'],['下移','moveAfter','在同一父容器中后移'],['复制组件','duplicate','复制真实子树，重新生成节点和商品记录ID'],['删除组件','remove','删除本组件子树，页面根节点禁止删除'],['保存到组件库','library.save','保存可复用子树，绑定文案以当前值转为独立文字，不转移SKU所有权'],['打开组件库','library.open','插入已保存的组件，或管理组件库记录'],['重命名','rename','修改图层名而非前端正文'],['包入布局容器','wrap','新建真实Stack包裹当前节点，不生成虚构图层'],['复制/粘贴组件','clipboard.fragment','应用内剪贴板复制真实子树，跨模板粘贴时隔离商品记录'],['复制/粘贴样式','clipboard.styles','复制受支持样式字段，不复制文案、动作、素材或SKU；完整徽标样式复制仍未闭环']])add(all,'编辑器工具',label,key,meaning,'按图层父级/类型决定是否可用；不属于前端组件的第二份配置');
add(['Screen','Flow'],'页面管理','编辑页面','navigation.page','选择当前编辑的真实Screen，图层树与预览同步','文档包含多页时；全局外观仍属于文档根节点');
add(all,'预览','交互预览','editing','在选图层编辑与执行点击/拖动行为之间切换','编辑态点击先选组件；真实付款、恢复与关闭行为排除');
add(['ExpressCheckout','CheckoutState'],'状态内容','预览状态','navigation.checkout','从左侧选可用/不可用/加载子层切换预览，不重复设置父级默认状态','真实设备钱包检测不在Demo中执行');
add(['Tabs','Tab','TabControl','TabButton'],'标签结构','标签增删/排序','children','所属组的按钮数量、目的页索引和样式按真实页面身份同步','不是按钮上手填第二份目标；跨标签组移动/粘贴仍待独立核对');
add(['SwitchCase','CountdownState'],'状态内容','状态子层','children','分别配置当前状态的真实子组件；不把多状态全部堆在前端','由父级开关、计时或左侧图层选择决定展示哪一层');
for(const [name,meaning] of [['口碑展示','由Stack、Text组合；评分、评价与作者都是文字组件'],['权益列表','由Stack、Icon、Text组合；间距归相应父容器'],['奖项展示','由Stack、Icon、Text组合；不额外维护黑盒样式参数']])add(['Stack'],'透明组合预设',name,'children',meaning,'添加后展开图层，使用本表对应基础组件参数，不另造一套重复配置');

export function parameterRows(){
  const rows=[];
  for(const definition of definitions)for(const type of definition.types){
    const root=createCatalogComponent(type,`reference-${type}`),node=[...indexDocument({root}).nodes.values()].find(item=>item.type===type);
    const p=componentProps(node);
    const key=definition.key,raw=key.startsWith('badge.')?key.slice(6).split(' / ')[0]:key;
    const value=key==='name'?COMPONENT_NAMES[type]:key.startsWith('badge.')?BADGE_DEFAULTS[raw]:key.split('.').reduce((current,part)=>current?.[part],p);
    const optionValue=definition.options.find(option=>String(option[0])===String(value));
    const initial=key==='deadline'&&value?'新建时当前UTC时间 + 3天':optionValue?optionValue[1]:key==='icon'?iconLabel(value):value==='stretch'?'拉伸（旧配置）':key==='mask'&&value==='none'?'矩形（默认）':key==='group'&&value===node.id?'组件自身ID':raw==='fontFamily'&&!value?'系统字体':raw.endsWith('Opacity')&&value===undefined?'100':value==='transparent'?'透明':value===undefined?'依当前模板/条件继承':typeof value==='object'?JSON.stringify(value):String(value);
    const condition=type==='Screen'&&definition.group==='布局'?`页面有固定页头/页脚时，仅滚动内容参与排列，页头/页脚不参与分布。${definition.condition}`:type==='Screen'&&['minWidth','maxWidth'].includes(key)?`页面宽度不提供新增约束入口，仅兼容旧记录已有值。${definition.condition}`:type==='Toggle'&&!['开关填充','图层管理','编辑器工具','预览'].includes(definition.group)?`旧HT协议控件分支；系统滑块不显示此项。${definition.condition}`:definition.condition;
    for(const option of definition.options.length?definition.options:[[null,definition.range||'当前值',definition.meaning]])rows.push({component:type,name:COMPONENT_NAMES[type],group:definition.group,label:definition.label,key,option:option[0],optionName:option[1],meaning:definition.options.length?`${definition.meaning}；${option[2]}`:option[2],purpose:definition.meaning,condition,initial});
  }
  return rows;
}
