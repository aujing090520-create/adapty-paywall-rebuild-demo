import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {Editor} from '@tiptap/core';
import {textEditorExtensions,toggleTextFormat} from './richTextExtensions.js';
import {textToEditorDocument,editorDocumentToPatch,safeTextLink} from './richTextModel.js';

const dom=new JSDOM('<!doctype html><body></body>',{pretendToBeVisual:true,url:'http://localhost/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});
globalThis.getComputedStyle=dom.window.getComputedStyle;
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
const create=(props)=>new Editor({element:document.createElement('div'),extensions:textEditorExtensions(),content:textToEditorDocument(props)});
const patch=(editor)=>editorDocumentToPatch(editor.getJSON());

test('existing mixed styles, links, newlines and unknown metadata survive without mutating template data',()=>{
  const props={fontWeight:400,italic:true,runs:[{text:'VIP',color:'#ff0000',fontSize:32,fontWeight:800,trackingKey:'old'},{text:'条款',breakBefore:true,link:'https://example.com/terms',underline:true},{text:'\n\n末行',italic:false}]};
  const original=structuredClone(props),editor=create(props),result=patch(editor);
  assert.deepEqual(props,original);assert.equal(result.text,'VIP\n条款\n\n末行');
  assert.equal(result.runs[0].color,'#ff0000');assert.equal(result.runs[0].fontSize,32);assert.equal(result.runs[0].fontWeight,800);assert.equal(result.runs[0].trackingKey,'old');
  assert.equal(result.runs.find(run=>run.text==='条款').link,'https://example.com/terms');assert.equal(result.runs.at(-1).italic,false);
  assert.match(editor.getHTML(),/font-size: 32px/);editor.destroy();
});

test('range formatting changes only the chosen text and undo restores its exact marks',()=>{
  const editor=create({text:'年度套餐',fontWeight:400});const before=patch(editor);
  editor.commands.setTextSelection({from:1,to:3});toggleTextFormat(editor,'bold');toggleTextFormat(editor,'italic');toggleTextFormat(editor,'underline');
  let runs=patch(editor).runs;assert.equal(runs[0].text,'年度');assert.equal(runs[0].fontWeight,700);assert.equal(runs[0].italic,true);assert.equal(runs[0].underline,true);
  assert.equal(runs[1].text,'套餐');assert.equal(runs[1].fontWeight,400);assert.equal(runs[1].italic,false);
  editor.commands.undo();assert.equal(patch(editor).runs[0].underline,false);editor.commands.undo();editor.commands.undo();assert.deepEqual(patch(editor),before);editor.destroy();
});

test('bold can be removed from inherited bold text without resizing or recoloring sibling text',()=>{
  const editor=create({text:'年度套餐',fontWeight:700});editor.commands.setTextSelection({from:1,to:3});toggleTextFormat(editor,'bold');
  const runs=patch(editor).runs;assert.equal(runs[0].fontWeight,400);assert.equal(runs[0].bold,false);assert.equal(runs[1].fontWeight,700);
  assert.equal(runs[0].fontSize,undefined);assert.equal(runs[0].color,undefined);editor.destroy();
});

test('inline code, links, removal and variable insertion use the actual editor selection',()=>{
  const editor=create({text:'查看权益'});editor.commands.setTextSelection({from:1,to:3});toggleTextFormat(editor,'code');assert.equal(patch(editor).runs[0].code,true);toggleTextFormat(editor,'code');editor.commands.setLink({href:'https://example.com/benefits'});
  let result=patch(editor);assert.equal(result.runs[0].text,'查看');assert.equal(result.runs[0].link,'https://example.com/benefits');
  editor.commands.unsetLink();assert.equal(patch(editor).runs[0].link,undefined);
  editor.commands.setTextSelection({from:3,to:5});editor.commands.insertContent('{{ product.price }}');
  assert.equal(patch(editor).text,'查看{{ product.price }}');editor.destroy();
});

test('empty content stays empty and scripts or untrusted HTML cannot become executable links',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,hi','https://example.com/\nheader'])assert.equal(safeTextLink(value),'');
  const editor=create({text:'<script>alert(1)</script>'});assert.ok(!editor.getHTML().includes('<script>'));
  editor.commands.selectAll();editor.commands.deleteSelection();assert.deepEqual(patch(editor),{text:'',runs:null});editor.destroy();
});
