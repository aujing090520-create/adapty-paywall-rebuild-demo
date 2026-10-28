export const CONTENT_LANGUAGES = [['zh-CN','中文'],['en','English'],['ar','العربية']];
const fields=['text','runs','src','backgroundImage','backgroundVideo','pagSrc','fallbackSrc'];
const withoutBackground=new Set(['Text','ProductParameter','Timeline','TimelineItem','Countdown','Wallet','Custom','Indicators','Icon','Toggle']);
export function resourceFields(node){
  if(!node)return [];
  if(node.type==='Image')return node.props.mediaType==='pag'?['pagSrc','fallbackSrc']:['src'];
  if(node.type==='Video')return ['src'];
  return withoutBackground.has(node.type)?[]:['backgroundImage','backgroundVideo'];
}
export const RESOURCE_FIELD_LABELS={src:'图片/视频',backgroundImage:'背景图片',backgroundVideo:'背景视频',pagSrc:'PAG',fallbackSrc:'PAG 回退图'};

export function localizedDocument(document, context = {}) {
  const settings=document.localization;
  const locale=context.contentLocale??settings?.defaultLocale??'zh-CN';
  const theme=context.contentTheme??'light', platform=context.contentPlatform??'ios';
  const defaults=settings?.translations?.[settings.defaultLocale??'zh-CN']??{};
  const translations=settings?.translations?.[locale]??{};
  const nonEmpty=value=>Object.fromEntries(Object.entries(value??{}).filter(([,value])=>value!==undefined&&value!==''));
  const visit=node=>{
    const translated={...nonEmpty(defaults[node.id]),...nonEmpty(translations[node.id])};
    const props={...node.props,...Object.fromEntries(fields.filter(key=>translated[key]!==undefined&&translated[key]!==''&&!(node.props.binding&&['text','runs'].includes(key))).map(key=>[key,translated[key]]))};
    if(translated.backgroundImage)props.fillType='image';if(translated.backgroundVideo)props.fillType='video';
    if(locale==='ar'&&['left','right'].includes(props.textAlign))props.textAlign=props.textAlign==='left'?'right':'left';
    const matches=(settings?.assets??[]).filter(item=>item.target===node.id&&item.src&&(!item.language||item.language===locale||item.language===(settings.defaultLocale??'zh-CN'))&&(!item.theme||item.theme===theme)&&(!item.platform||item.platform===platform));
    const ranked=matches.map((item,index)=>({item,index,score:(item.language===locale?4:0)+(item.platform===platform?2:0)+(item.theme===theme?1:0)})).sort((a,b)=>a.score-b.score||a.index-b.index);
    for(const {item} of ranked){const field=item.field??(node.type==='Image'?'src':'backgroundImage');if(fields.includes(field)){props[field]=item.src;if(field==='backgroundImage')props.fillType='image';if(field==='backgroundVideo')props.fillType='video';}}
    return {...node,props,children:node.children.map(visit)};
  };
  return {...document,previewContentLocale:locale,root:visit(document.root)};
}
