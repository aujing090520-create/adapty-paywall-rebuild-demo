import test from 'node:test';
import assert from 'node:assert/strict';
import opentype from 'opentype.js';
import {installFontFamilies} from './fontAssets.js';
import {fontStyles,fontResources,withFontResources} from './fontStyles.js';
import {component} from './componentDocument.js';
import {copyFragment,pasteFragment,copyStyles,pasteStyles} from './componentOperations.js';

function file(name,weight=400) {
  const path=new opentype.Path();path.moveTo(0,0);path.lineTo(300,600);path.lineTo(600,0);path.close();
  const font=new opentype.Font({familyName:'Audit Sans',styleName:weight===700?'Bold':'Regular',unitsPerEm:1000,ascender:800,descender:-200,glyphs:[new opentype.Glyph({name:'.notdef',unicode:0,advanceWidth:600,path})]});
  font.tables.os2.usWeightClass=weight;
  return {name,arrayBuffer:async()=>font.toArrayBuffer()};
}
test('TTF/OTF files are parsed into one shared family with independent real font weights',async()=>{
  const families=await installFontFamilies([file('regular.otf'),file('bold.ttf',700)]);
  assert.equal(families.length,1);assert.equal(families[0].family,'Audit Sans');assert.deepEqual(families[0].faces.map(face=>face.weight),[400,700]);
  const css=fontStyles(families);assert.match(css,/@font-face/);assert.match(css,/font-weight:700/);assert.match(css,/data:font\/otf;base64/);
  const before=structuredClone(families),next=await installFontFamilies([file('replacement.otf')],families);assert.deepEqual(families,before);assert.equal(next[0].id,families[0].id);assert.equal(next[0].faces.length,2);
});
test('invalid font uploads are atomic and cannot erase existing shared families',async()=>{
  const existing=await installFontFamilies([file('regular.otf')]),before=structuredClone(existing);
  await assert.rejects(installFontFamilies([file('other.ttf'),{name:'broken.otf',arrayBuffer:async()=>new ArrayBuffer(5)}],existing),/无法解析/);
  await assert.rejects(installFontFamilies([{name:'script.html'}],existing),/TTF 或 OTF/);assert.deepEqual(existing,before);
});
test('font CSS refuses external sources, malformed identifiers and injected CSS',()=>{
  assert.equal(fontStyles([{id:'x";}body{color:red}',faces:[{src:'data:font/ttf;base64,AAAA'}]}]),'');
  assert.equal(fontStyles([{id:'ht-font-test',faces:[{src:'https://example.com/font.ttf'}]}]),'');
  assert.equal(fontStyles([{id:'ht-font-test',faces:[{src:'data:text/html;base64,AAAA'}]}]),'');
});

test('library, cross-document component copy and style copy retain only referenced font resources',()=>{
  const fonts=[{id:'ht-font-used',family:'Used',faces:[]},{id:'ht-font-unused',family:'Unused',faces:[]}];
  const text=component('text','Text','文字',{text:'原文',fontFamily:'ht-font-used'});
  const source={version:3,products:{},fonts,root:component('page','Screen','页面',{},[text])};
  const destination={version:3,products:{},root:component('other','Screen','页面',{},[component('target','Text','目标',{text:'目标文字'})])};
  const fragment=copyFragment(source,'text'),pasted=pasteFragment(destination,'other',fragment).document;
  assert.deepEqual(pasted.fonts,[fonts[0]]);assert.equal(pasted.root.children[1].props.fontFamily,'ht-font-used');assert.equal(destination.fonts,undefined);
  const styled=pasteStyles(destination,'target',copyStyles(text,fonts));assert.deepEqual(styled.fonts,[fonts[0]]);assert.equal(styled.root.children[0].props.text,'目标文字');
  const libraryNode=component('badge','Stack','徽标',{badge:{fontFamily:'ht-font-used'},textRules:{introductory:{runs:[{text:'优惠',fontFamily:'ht-font-used'}]}}});
  const libraryResources=fontResources(libraryNode,fonts);assert.deepEqual(libraryResources,[fonts[0]]);assert.deepEqual(withFontResources(destination,libraryResources).fonts,[fonts[0]]);
  assert.equal(withFontResources(pasted,libraryResources),pasted);assert.equal(pasteStyles(destination,'missing',copyStyles(text,fonts)),destination);
});
