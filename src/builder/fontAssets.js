import opentype from 'opentype.js';

const localizedName = (names) => names?.en ?? names?.zh ?? Object.values(names ?? {})[0];
const dataUrl = (file, bytes) => new Promise((resolve,reject)=>{
  if(typeof FileReader==='undefined')return resolve(`data:font/${/\.otf$/i.test(file.name)?'otf':'ttf'};base64,${Buffer.from(bytes).toString('base64')}`);
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error(`无法读取字体：${file.name}`));reader.readAsDataURL(new Blob([bytes],{type:`font/${/\.otf$/i.test(file.name)?'otf':'ttf'}`}));
});

export async function installFontFamilies(files, existing=[]) {
  if(!files.length)throw new Error('请选择字体文件');
  const result=structuredClone(existing);
  for(const file of files) {
    if(!/\.(ttf|otf)$/i.test(file.name))throw new Error('请选择 TTF 或 OTF 字体文件');
    const bytes=await file.arrayBuffer();let parsed;
    try {parsed=opentype.parse(bytes);}catch {throw new Error(`字体文件无法解析：${file.name}`);}
    const family=localizedName(parsed.names.preferredFamily)??localizedName(parsed.names.fontFamily);
    if(!family)throw new Error(`字体文件缺少字体族名称：${file.name}`);
    const weight=Number(parsed.tables.os2?.usWeightClass)||400;
    const style=parsed.tables.post?.italicAngle?'italic':'normal';
    const face={src:await dataUrl(file,bytes),weight,style,name:file.name};
    let record=result.find(item=>item.family===family);
    if(!record){record={id:`ht-font-${crypto.randomUUID()}`,family,faces:[]};result.push(record);}
    const index=record.faces.findIndex(item=>item.weight===weight&&item.style===style);
    if(index<0)record.faces.push(face);else record.faces[index]=face;
  }
  return result;
}
