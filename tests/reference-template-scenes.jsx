import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ComponentPreview from '../src/builder/ComponentPreview.jsx';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import { importComponentDocument } from '../src/builder/componentDocument.js';
import { upgradeCanonicalComponents } from '../src/builder/componentCatalog.js';
import '../src/styles.css';
import '../src/builder/componentEditor.css';

function ReferenceScenes() {
  const [orders, setOrders] = useState([2, 4, 7, 12]), [status, setStatus] = useState('');
  return <main style={{ padding: 16, background: '#eef0f3' }}>
    <nav style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <button onClick={() => setOrders([2, 4, 7, 12])}>页头与状态</button>
      <button onClick={() => setOrders([18, 27, 28, 30])}>正文与页脚边界</button>
      <button onClick={() => setOrders([8, 9, 29, 34])}>状态与对比表</button>
    </nav>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 300px))', gap: 16 }}>
      {orders.map((order) => {
        const template = templates.find((entry) => entry.id === `rc-source-${order}`);
        const document = upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(template.id), template));
        return <section key={order} data-source-order={order} style={{ minWidth: 0 }}><h2 style={{ fontSize: 16 }}>#{order} {template.title}</h2><ComponentPreview document={document} editing={false} onSelect={() => {}} onStatus={setStatus} /></section>;
      })}
    </div>
    <output>{status}</output>
  </main>;
}
createRoot(document.getElementById('root')).render(<ReferenceScenes />);
