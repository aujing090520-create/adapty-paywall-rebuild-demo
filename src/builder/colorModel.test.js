import test from 'node:test';
import assert from 'node:assert/strict';
import {pickerColor,pickerPaint,gradientWithOpacity,gradientStops} from './colorModel.js';

test('color editor alpha maps to one canonical paint percentage, not a second wrapper opacity',()=>{
  assert.equal(pickerColor('#123456',50),'rgba(18, 52, 86, 0.5)');
  assert.deepEqual(pickerPaint('rgba(18,52,86,0.25)'),{color:'#123456',opacity:25});
  assert.equal(pickerPaint('not a color'),null);
});
test('gradient preserves source stops and alpha; text alpha is calculated through the parsed AST',()=>{
  const value='linear-gradient(180deg, rgba(234,237,251,0.18) 0%, #eaedfb 100%)';
  assert.equal(pickerColor(value,100),value);assert.deepEqual(pickerPaint(value),{color:value,opacity:100});
  const data=gradientStops(value);assert.equal(data.gradient.type,'linear-gradient');assert.equal(data.stops[0].offset,0);assert.equal(data.stops[1].offset,1);
  const half=gradientStops(gradientWithOpacity(value,50));assert.deepEqual(half.gradient.colorStops[0].value,['234','237','251','0.09']);assert.deepEqual(half.gradient.colorStops[1].value,['234','237','251','0.5']);
  assert.equal(gradientWithOpacity(value,100),value);assert.equal(gradientWithOpacity('unsupported',50),'unsupported');
});
