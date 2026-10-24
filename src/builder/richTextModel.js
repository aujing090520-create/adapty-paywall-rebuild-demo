const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const markNames = ['bold', 'italic', 'strike', 'underline', 'code'];
const known = new Set(['text', 'breakBefore', 'bold', 'italic', 'strikethrough', 'underline', 'code', 'link', 'color', 'colorOpacity', 'fontSize', 'fontWeight', 'fontFamily', 'backgroundColor']);
export function safeTextLink(value) {
  if(typeof value!=='string'||/[\u0000-\u0020]/.test(value))return '';
  try { const url=new URL(value);return (['http:','https:'].includes(url.protocol)?Boolean(url.hostname):['mailto:','tel:'].includes(url.protocol)&&Boolean(url.pathname))?value:''; } catch { return ''; }
}

export function textToEditorDocument(props, value = props.text ?? '') {
  const paragraphs = [{ type: 'paragraph', content: [] }];
  for (const run of props.runs?.length ? props.runs : [{ text: value }]) {
    const marks = [];
    const weight = run.fontWeight ?? (run.bold === false ? 400 : run.bold || props.bold ? 700 : props.fontWeight ?? 400);
    const enabled = { bold: run.bold ?? (Number(weight) >= 600), italic: run.italic ?? props.italic, strike: run.strikethrough ?? props.strike, underline: run.underline ?? props.underline, code: run.code };
    for (const type of markNames) if (enabled[type]) marks.push({ type });
    const attrs = { fontWeight: weight, legacy: Object.fromEntries(Object.entries(run).filter(([key]) => !known.has(key))) };
    for (const key of ['color', 'colorOpacity', 'fontSize', 'fontFamily', 'backgroundColor']) if (own(run, key)) attrs[key] = key === 'fontSize' && typeof run[key] === 'number' ? `${run[key]}px` : run[key];
    marks.push({ type: 'textStyle', attrs });
    if (safeTextLink(run.link)) marks.push({ type: 'link', attrs: { href: run.link } });
    const lines = `${run.breakBefore ? '\n' : ''}${run.text ?? ''}`.split('\n');
    lines.forEach((line, index) => {
      if (index) paragraphs.push({ type: 'paragraph', content: [] });
      if (line) paragraphs.at(-1).content.push({ type: 'text', text: line, marks });
    });
  }
  return { type: 'doc', content: paragraphs };
}

export function editorDocumentToPatch(document) {
  const runs = [];
  const append = (text, style = {}) => {
    if (!text) return;
    const previous = runs.at(-1);
    if (previous && JSON.stringify(Object.fromEntries(Object.entries(previous).filter(([key]) => key !== 'text'))) === JSON.stringify(style)) previous.text += text;
    else runs.push({ ...style, text });
  };
  const visit = (node) => {
    if (node.type === 'hardBreak') { append('\n'); return; }
    if (node.type === 'text') {
      const marks = node.marks ?? [], attributes = marks.find((mark) => mark.type === 'textStyle')?.attrs ?? {};
      const has = (type) => marks.some((mark) => mark.type === type);
      const style = { ...attributes.legacy, bold: has('bold'), italic: has('italic'), strikethrough: has('strike'), underline: has('underline'), code: has('code'), fontWeight: attributes.fontWeight ?? (has('bold') ? 700 : 400) };
      for (const key of ['color', 'colorOpacity', 'fontSize', 'fontFamily', 'backgroundColor']) if (attributes[key] !== undefined && attributes[key] !== null) style[key] = key === 'fontSize' ? Number.parseFloat(attributes[key]) : attributes[key];
      const href = marks.find((mark) => mark.type === 'link')?.attrs.href;
      if (safeTextLink(href)) style.link = href;
      append(node.text, style);
    } else (node.content ?? []).forEach(visit);
  };
  (document.content ?? []).forEach((paragraph, index) => { if (index) append('\n'); visit(paragraph); });
  return { text: runs.map((run) => run.text).join(''), runs: runs.length ? runs : null };
}

export const richTextFontFamily = (value) => value === 'serif' ? 'Georgia, serif' : value === 'mono' ? 'ui-monospace, monospace' : value && value !== 'system' ? value : undefined;
