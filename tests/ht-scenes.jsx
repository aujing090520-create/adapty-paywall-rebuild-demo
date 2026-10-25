import React from 'react';
import { createRoot } from 'react-dom/client';
import ComponentPreview from '../src/builder/ComponentPreview.jsx';
import { importComponentDocument } from '../src/builder/componentDocument.js';
import { upgradeCanonicalComponents } from '../src/builder/componentCatalog.js';
import { templates, createBuilderNodes } from '../src/templates/templateDefinitions.js';
import '../src/styles.css';
import '../src/builder/componentEditor.css';

const id = new URLSearchParams(location.search).get('template') ?? 'ht-membership-plans';
const template = templates.find((entry) => entry.id === id);
const document = upgradeCanonicalComponents(importComponentDocument(createBuilderNodes(id), template));
createRoot(window.document.getElementById('root')).render(<main style={{ width: 390, margin: 16 }}><ComponentPreview document={document} editing={false} onSelect={() => {}} onStatus={() => {}} /></main>);
