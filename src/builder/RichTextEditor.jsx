import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline, Code, Link, Braces } from 'lucide-react';
import { editorDocumentToPatch, textToEditorDocument, safeTextLink, richTextFontFamily } from './richTextModel.js';
import {textEditorExtensions,toggleTextFormat} from './richTextExtensions.js';

function ClientEditor({ p, value, onChange, variables = [], label }) {
  const latest = useRef(onChange); latest.current = onChange;
  const root = useRef(null), insertion = useRef(null);
  const model = textToEditorDocument(p, value);
  const extensions = useMemo(textEditorExtensions, []);
  const selectState = useCallback(({editor:current}) => current ? Object.fromEntries(['bold','italic','strike','underline','code','link'].map(name=>[name,current.isActive(name)])) : {}, []);
  const [linkOpen, setLinkOpen] = useState(false), [link, setLink] = useState(''), [variablesOpen, setVariablesOpen] = useState(false);
  const [query, setQuery] = useState('');
  const editor = useEditor({
    extensions, content: model, immediatelyRender: false,
    editorProps: { attributes: { role: 'textbox', 'aria-label': label, 'aria-multiline': 'true' } },
    onUpdate: ({ editor: current }) => latest.current(editorDocumentToPatch(current.getJSON())),
  });
  const state = useEditorState({ editor, selector: selectState });
  const incoming = JSON.stringify(model);
  useEffect(() => {
    if (!editor) return;
    const current = editorDocumentToPatch(editor.getJSON());
    const target = editorDocumentToPatch(JSON.parse(incoming));
    if (JSON.stringify(current) !== JSON.stringify(target)) editor.commands.setContent(JSON.parse(incoming), { emitUpdate: false });
  }, [editor, incoming]);
  useEffect(() => {
    if (!variablesOpen) return;
    const close = event => { if (!root.current?.contains(event.target)) setVariablesOpen(false); };
    document.addEventListener('pointerdown',close);
    return () => document.removeEventListener('pointerdown',close);
  },[variablesOpen]);
  const groups = new Map();
  for (const [key,title,group='变量'] of variables) {
    if (!`${key} ${title}`.toLowerCase().includes(query.trim().toLowerCase())) continue;
    if (!groups.has(group)) groups.set(group,[]);
    groups.get(group).push([key,title]);
  }
  const toggle = (name) => {
    editor.commands.focus();
    toggleTextFormat(editor,name);
  };
  return <div ref={root} className="rc-rich-editor" style={{ fontFamily: richTextFontFamily(p.fontFamily) }} onKeyDown={event=>{if(event.key==='Escape'&&variablesOpen){event.preventDefault();event.stopPropagation();setVariablesOpen(false);editor?.commands.focus();}}}>
    <div className="rc-rich-surface"><EditorContent editor={editor}/><div className="rc-rich-toolbar" role="toolbar" aria-label="文字格式">
      {[['bold','粗体',Bold],['italic','斜体',Italic],['strike','删除线',Strikethrough],['underline','下划线',Underline],['code','行内代码',Code]].map(([name, title, Glyph]) => <button key={name} type="button" aria-label={title} title={title} aria-pressed={Boolean(state?.[name])} disabled={!editor} onMouseDown={(event) => event.preventDefault()} onClick={() => toggle(name)}><Glyph size={15}/></button>)}
      <button type="button" aria-label="链接" title="链接" aria-pressed={Boolean(state?.link)} disabled={!editor} onMouseDown={(event) => event.preventDefault()} onClick={() => { setLink(editor.getAttributes('link').href ?? ''); setLinkOpen(true); }}><Link size={15}/></button>
    </div></div>
    <div className="rc-rich-variable"><button type="button" className="ne-icon" aria-label="插入变量" title="插入变量" aria-expanded={variablesOpen} disabled={!editor} onMouseDown={(event) => event.preventDefault()} onClick={() => { insertion.current={range:{from:editor.state.selection.from,to:editor.state.selection.to},marks:(editor.state.storedMarks??editor.state.selection.$from.marks()).map(mark=>mark.toJSON())};setQuery('');setVariablesOpen(!variablesOpen); }}><Braces size={15}/><span>插入变量</span></button></div>
    {variablesOpen && <section className="rc-variable-picker" aria-label="变量面板">
      <input type="search" autoFocus aria-label="搜索变量" placeholder="搜索变量" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div role="menu" aria-label="可用变量">{[...groups].map(([group,items])=><div key={group} role="group" aria-label={group}><strong>{group}</strong>{items.map(([key,title])=><button type="button" role="menuitem" key={key} onMouseDown={event=>event.preventDefault()} onClick={()=>{editor.chain().focus().setTextSelection(insertion.current.range).insertContent({type:'variable',attrs:{key},marks:insertion.current.marks}).run();setVariablesOpen(false);}}><span>{title}</span><code>{key}</code></button>)}</div>)}{groups.size===0&&<small role="status">没有匹配的变量</small>}</div>
    </section>}
    {linkOpen && <div className="rc-rich-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setLinkOpen(false); }}><form role="dialog" aria-modal="true" aria-label="添加链接" className="rc-rich-dialog" onSubmit={(event) => { event.preventDefault(); if (!safeTextLink(link)) return; editor.chain().focus().extendMarkRange('link').setLink({ href: link }).run(); setLinkOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape') setLinkOpen(false); }}><strong>添加链接</strong><label>URL<input autoFocus aria-label="链接地址" placeholder="粘贴链接" value={link} onChange={(event) => setLink(event.target.value)}/></label>{link && !safeTextLink(link) && <small role="alert">请输入有效链接</small>}<div><button type="button" onClick={() => setLinkOpen(false)}>取消</button>{state?.link && <button type="button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkOpen(false); }}>移除链接</button>}<button type="submit" disabled={!safeTextLink(link)}>添加</button></div></form></div>}
  </div>;
}

export default function RichTextEditor({ p, value, onChange, variables, 'aria-label': label = '文字内容' }) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) return <div role="textbox" aria-label={label} aria-readonly="true">{value}</div>;
  return <ClientEditor p={p} value={value} onChange={onChange} variables={variables} label={label}/>;
}
