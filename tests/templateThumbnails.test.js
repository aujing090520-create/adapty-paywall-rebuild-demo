import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

test('HT reference thumbnails fit the full image into the standard gallery slot without cropping', () => {
  const css = postcss.parse(readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8'));
  const declarations = {};
  css.walkRules('.template-source-preview .prd-template-screenshot', rule => {
    rule.walkDecls(declaration => { declarations[declaration.prop] = declaration.value; });
  });
  assert.equal(declarations['object-fit'], 'contain');
  assert.equal(declarations['object-position'], 'center');
  assert.equal(declarations.width, '100%');
  assert.equal(declarations.height, '100%');
});
