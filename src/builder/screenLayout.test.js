import test from 'node:test';
import assert from 'node:assert/strict';
import { component, indexDocument } from './componentDocument.js';
import { screenChromeLayout } from './screenLayout.js';

const make = (first, extra = []) => component('screen', 'Screen', '', {}, [component('header', 'Header'), ...extra, first, component('footer', 'Footer')]);
for (const type of ['Image', 'Video', 'Custom']) {
  test(`full-width ${type} starts under the header without an extra scroll owner`, () => {
    const first = component('first', type, '', { widthMode: 'fill' });
    const result = screenChromeLayout(make(first));
    assert.ok(result.underHeader);
    assert.equal(result.header.id, 'header');
    assert.equal(result.footer.id, 'footer');
    assert.deepEqual(result.content.map((node) => node.id), ['first']);
    for (const props of [{ widthMode: 'fixed' }, { maxWidth: 100 }, { marginHorizontal: 4 }]) {
      assert.equal(screenChromeLayout(make({ ...first, props: { ...first.props, ...props } })).underHeader, false);
    }
  });
}
test('non-media, hidden media and hidden header do not reserve an accidental overlapping region', () => {
  assert.equal(screenChromeLayout(make(component('first', 'Text'))).underHeader, false);
  const image = component('first', 'Image');
  assert.ok(screenChromeLayout(make(image, [component('hidden', 'Text', '', { hidden: true })])).underHeader);
  const screen = make(image, [component('control', 'Toggle', '', { initial: true, hidden: true }), component('conditional', 'Text', '', { visibleWhen: { id: 'control', value: false } })]);
  assert.ok(screenChromeLayout(screen, {}, indexDocument({ root: screen }).nodes).underHeader);
  screen.children[0].props.hidden = true;
  assert.equal(screenChromeLayout(screen).header, undefined);
  assert.equal(screenChromeLayout(screen).underHeader, false);
});
