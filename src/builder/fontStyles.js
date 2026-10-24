export function fontStyles(fonts=[]) {
  if(!Array.isArray(fonts))return '';
  return fonts.flatMap(font=>/^ht-font-[a-z\d-]+$/i.test(font.id)?(font.faces??[]).flatMap(face=>{
    if(!/^data:(?:font\/(?:ttf|otf)|application\/(?:octet-stream|x-font-ttf|x-font-opentype));base64,[a-z\d+/=]+$/i.test(face.src??''))return [];
    const weight=Math.min(1000,Math.max(1,Number(face.weight)||400));
    return `@font-face{font-family:${JSON.stringify(font.id)};src:url(${JSON.stringify(face.src)});font-weight:${weight};font-style:${face.style==='italic'?'italic':'normal'};font-display:swap;}`;
  }):[]).join('\n');
}

export function fontResources(node,fonts=[]) {
  const referenced=new Set();
  const visit=value=>{
    if(!value||typeof value!=='object')return;
    if(typeof value.fontFamily==='string')referenced.add(value.fontFamily);
    Object.values(value).forEach(visit);
  };
  visit(node);
  return structuredClone(fonts.filter(font=>referenced.has(font.id)));
}
export function withFontResources(document,incoming=[]) {
  if(!Array.isArray(incoming)||!incoming.length)return document;
  const ids=new Set((document.fonts??[]).map(font=>font.id)),added=incoming.filter(font=>!ids.has(font.id));
  return added.length?{...document,fonts:[...document.fonts??[],...structuredClone(added)]}:document;
}
