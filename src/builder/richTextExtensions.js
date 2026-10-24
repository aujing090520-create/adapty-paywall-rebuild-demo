import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, Color, FontSize, FontFamily, BackgroundColor } from '@tiptap/extension-text-style';

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

export const textEditorExtensions = () => [StarterKit.configure({ blockquote: false, bulletList: false, orderedList: false, listItem: false, listKeymap: false, heading: false, horizontalRule: false, codeBlock: false, trailingNode: false, link: { openOnClick: false, autolink: false, defaultProtocol: 'https' } }), TextStyle, Color, FontSize, FontFamily, BackgroundColor, StoredStyles];

export function toggleTextFormat(editor, name) {
  let chain = editor.chain();
  if (name === 'bold') chain = editor.isActive('bold') ? chain.unsetMark('bold').setMark('textStyle', { fontWeight: 400 }) : chain.setMark('bold').setMark('textStyle', { fontWeight: 700 });
  else chain = chain.toggleMark(name);
  return chain.run();
}
