import { Extension, Node } from '@tiptap/core';
import {variableToken} from './textVariableTokens.js';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize, FontFamily, BackgroundColor } from '@tiptap/extension-text-style';

const TextVariable = Node.create({
  name:'variable', inline:true, group:'inline', atom:true,
  addAttributes() { return { key:{default:'',parseHTML:element=>element.getAttribute('data-text-variable')} }; },
  parseHTML() { return [{tag:'span[data-text-variable]'}]; },
  renderHTML({node}) { return ['span',{'data-text-variable':node.attrs.key,class:'rc-variable-token',contenteditable:'false',title:variableToken(node.attrs.key)},node.attrs.key]; },
  renderText({node}) { return variableToken(node.attrs.key); },
});

const StoredStyles = Extension.create({
  name: 'storedTextStyles',
  addGlobalAttributes() {
    return [{ types: ['textStyle'], attributes: {
      fontWeight: { default: null, parseHTML: (element) => element.style.fontWeight || null, renderHTML: (attributes) => attributes.fontWeight ? { style: `font-weight: ${Number(attributes.fontWeight)}` } : {} },
      colorOpacity: { default: null, renderHTML: () => ({}) },
      legacy: { default: null, renderHTML: () => ({}) },
    } }];
  },
});

export const textEditorExtensions = () => [StarterKit.configure({ blockquote: false, bulletList: false, orderedList: false, listItem: false, listKeymap: false, heading: false, horizontalRule: false, codeBlock: false, trailingNode: false, link: { openOnClick: false, autolink: false, defaultProtocol: 'https' } }), TextStyle, Color, FontSize, FontFamily, BackgroundColor, StoredStyles, TextVariable];

export function toggleTextFormat(editor, name) {
  let chain = editor.chain();
  if (name === 'bold') chain = editor.isActive('bold') ? chain.unsetMark('bold').setMark('textStyle', { fontWeight: 400 }) : chain.setMark('bold').setMark('textStyle', { fontWeight: 700 });
  else chain = chain.toggleMark(name);
  return chain.run();
}
