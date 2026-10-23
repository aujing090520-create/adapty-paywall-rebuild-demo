import React, { useEffect, useState } from 'react';
import { ChevronRight, Type, Image, Layers, Package, MousePointer2, Circle, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { TYPE_NAMES } from './layerModel.js';
import './layers.css';

function LayerIcon({ type }) {
  const Icon = type === 'Text' ? Type : /Image|Video|Background/.test(type) ? Image : /Product|Package/.test(type) ? Package : /Button|Toggle/.test(type) ? MousePointer2 : type === 'Icon' ? Circle : Layers;
  return <Icon size={15} aria-hidden="true" />;
}

export default function LayerTree({ tree, selectedId, onSelect, onMove, onRemove, onReparent }) {
  const [collapsed, setCollapsed] = useState(() => new Set([...tree.entries.values()].filter((entry) => entry.children.length && entry.parentId !== null && entry.parentId !== '$screen').map((entry) => entry.id)));
  const [dragged, setDragged] = useState(null);
  useEffect(() => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      let entry = tree.entries.get(selectedId);
      while (entry) { next.delete(entry.parentId); entry = tree.entries.get(entry.parentId); }
      return next;
    });
  }, [selectedId]);
  const toggle = (id) => setCollapsed((previous) => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const render = (entry, level = 0) => {
    const siblings = tree.entries.get(entry.parentId)?.children ?? [];
    const index = siblings.findIndex((item) => item.id === entry.id);
    const canSort = Boolean(entry.operation || entry.native || entry.productOrder);
    const isOpen = !collapsed.has(entry.id);
    return <li role="treeitem" aria-expanded={entry.children.length ? isOpen : undefined} aria-selected={selectedId === entry.id} key={entry.id}>
      <div data-layer-id={entry.id} data-layer-type={entry.type} className={`layer-row ${selectedId === entry.id ? 'selected' : ''}`} style={{ paddingLeft: 6 + Math.min(level, 10) * 13 }}
        onDragOver={(event) => { if (dragged && (entry.native || entry.productOrder || entry.id === '$screen')) event.preventDefault(); }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (dragged) onReparent(dragged, entry); setDragged(null); }}>
        {entry.children.length ? <button type="button" className="layer-disclosure" title={isOpen ? '收起' : '展开'} onClick={() => toggle(entry.id)}><ChevronRight size={13} style={{ transform: isOpen ? 'rotate(90deg)' : undefined }} /></button> : <span className="layer-disclosure" />}
        <button type="button" className="layer-select" title={`${TYPE_NAMES[entry.type] ?? entry.type}：${entry.label}`} onClick={() => onSelect(entry)} draggable={Boolean(entry.native || entry.productOrder)} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; setDragged(entry.id); }} onDragEnd={() => setDragged(null)}>
          <LayerIcon type={entry.type} /><span>{entry.label}</span>
        </button>
        {canSort && <div className="layer-actions"><button type="button" title="上移图层" aria-label={`上移${entry.label}`} disabled={index < 1} onClick={() => onMove(entry, -1)}><ArrowUp size={12} /></button><button type="button" title="下移图层" aria-label={`下移${entry.label}`} disabled={index >= siblings.length - 1} onClick={() => onMove(entry, 1)}><ArrowDown size={12} /></button>{entry.operation && <button type="button" title="删除项目" aria-label={`删除${entry.label}`} disabled={siblings.length < 2} onClick={() => onRemove(entry)}><Trash2 size={12} /></button>}</div>}
      </div>
      {isOpen && entry.children.length > 0 && <ul role="group">{entry.children.map((child) => render(tree.entries.get(child.id), level + 1))}</ul>}
    </li>;
  };
  return <div className="layer-tree" data-no-translate><h3>图层</h3><ul role="tree" aria-label="付费墙组件图层">{render(tree.entries.get(tree.root.id))}</ul></div>;
}
