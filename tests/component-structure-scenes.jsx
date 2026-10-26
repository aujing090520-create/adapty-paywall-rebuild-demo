import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ComponentPreview from '../src/builder/ComponentPreview.jsx';
import { component } from '../src/builder/componentDocument.js';
import { createCatalogComponent } from '../src/builder/componentCatalog.js';
import { moveEditorComponent, copyFragment, pasteFragment } from '../src/builder/componentOperations.js';
import '../src/styles.css';
import '../src/builder/componentEditor.css';

const text = (id, value, props = {}) => component(id, 'Text', '', { text: value, ...props });
const frame = (id, media, long) => ({ version: 3, templateId: id, products: {}, root: component(id, 'Screen', '', {}, [
  component(`${id}/header`, 'Header', '', { background: '#ffffff', paddingVertical: 12, heightMode: 'fit' }, [text(`${id}/heading`, '固定页头', { fontWeight: 700 })]),
  ...(media ? [component(`${id}/image`, 'Image', '', { src: '/figma-paywall-assets/recovery-art.png', widthMode: 'fill', heightMode: 'fixed', height: 200 })] : []),
  ...Array.from({ length: long ? 30 : 2 }, (_, index) => text(`${id}/line-${index}`, `内容 ${index + 1}`, { heightMode: 'fixed', height: 48 })),
  component(`${id}/footer`, 'Footer', '', { background: '#ffffff', paddingVertical: 12 }, [text(`${id}/buy`, '固定页脚', { fontWeight: 700 })]),
]) });
const tabDocument = () => {
  const groups = ['a', 'b'].map((group) => {
    const owner = createCatalogComponent('Tabs', `group-${group}`);
    for (const [index, tab] of owner.children.entries()) {
      tab.children.find((child) => child.type === 'Text').props.text = `${group.toUpperCase()} 内容 ${index + 1}`;
      for (const button of tab.children[0].children) button.children[0].props.text = `${group.toUpperCase()} ${button.props.index + 1}`;
    }
    return owner;
  });
  return { version: 3, products: {}, root: component('root', 'Screen', '', {}, groups) };
};

function StructureScenes() {
  const [long, setLong] = useState(true), [tabs, setTabs] = useState(tabDocument), [status, setStatus] = useState('');
  return <main style={{ padding: 16, background: '#eef0f3' }}>
    <button onClick={() => setLong(!long)}>切换长短内容</button>
    <div style={{ display: 'flex', gap: 24, alignItems: 'start' }}>{[true, false].map((media) => <section key={String(media)} style={{ width: 300 }} data-case={media ? 'media-first' : 'text-first'}><h2>{media ? '首项媒体' : '首项文字'}</h2><ComponentPreview document={frame(media ? 'media' : 'copy', media, long)} editing={false} onSelect={() => {}} onStatus={setStatus} /></section>)}</div>
    <section style={{ marginTop: 24 }}><h2>跨标签组结构</h2>
      <button onClick={() => setTabs(moveEditorComponent(tabs, 'group-a/tab-0', 'group-b'))}>移动 A 首页到 B</button>
      <button onClick={() => setTabs(pasteFragment(tabs, 'group-b', copyFragment(tabs, 'group-a/tab-0')).document)}>复制 A 首页到 B</button>
      <button onClick={() => setTabs(tabDocument())}>重置标签</button>
      <div style={{ width: 390 }}><ComponentPreview document={tabs} editing={false} onSelect={() => {}} onStatus={setStatus} /></div>
    </section><output>{status}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<StructureScenes />);
