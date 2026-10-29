import test from 'node:test';
import assert from 'node:assert/strict';
import {component,indexDocument} from './componentDocument.js';
import {TIMER_VARIABLE_DEFINITIONS,upgradeTimerTextVariables} from './textVariableTokens.js';
import {availableTextVariables,interpolateVariables,variableIssues} from './textVariables.js';
import {upgradeCanonicalComponents} from './componentCatalog.js';

test('all legacy timer fields migrate without changing node IDs, layout, data or the source object',()=>{
  const root=component('page','Screen','页面',{},TIMER_VARIABLE_DEFINITIONS.map(({field},index)=>component(`timer-${index}`,'Text','文字',{timerField:field,text:'旧值',runs:[{text:'旧值'}],binding:{key:'sku',field:'price'},color:'#ff0000',widthMode:'fit',fontSize:21,background:'#00ff00'})));
  const document={products:{sku:{price:'¥10'}},root},snapshot=structuredClone(document);
  const result=upgradeTimerTextVariables(document);
  result.root.children.forEach((node,index)=>{
    assert.equal(node.id,`timer-${index}`);assert.equal(node.props.text,`{{ ${TIMER_VARIABLE_DEFINITIONS[index].key} }}`);
    assert.equal(node.props.timerField,undefined);assert.equal(node.props.binding,undefined);assert.equal(node.props.runs,undefined);
    assert.equal(node.props.fontSize,21);assert.equal(node.props.background,'#00ff00');assert.equal(node.props.widthMode,'fit');
  });
  assert.deepEqual(document,snapshot);assert.equal(result.products,document.products);assert.equal(upgradeTimerTextVariables(result),result);
});

test('canonical migration also handles nested legacy digits that need width normalization',()=>{
  const digit=component('hours','Text','文字',{timerField:'hours',binding:{key:'sku',field:'price'},runs:[{text:'错误旧值'}]});
  const document={products:{},root:component('timer','Countdown','倒计时',{},[component('active','CountdownState','内容',{state:'active'},[digit])])};
  const result=upgradeCanonicalComponents(document),props=indexDocument(result).nodes.get('hours').props;
  assert.equal(props.text,'{{ count_hours_with_zero }}');assert.equal(props.widthMode,'fit');assert.equal(props.timerField,undefined);
  assert.equal(indexDocument(result).nodes.get('hours').type,'Text');assert.equal(props.binding,undefined);assert.equal(props.runs,undefined);
  assert.equal(upgradeCanonicalComponents(result),result);
});

test('picker uses one registry, only exposes contextual variables where available and includes new business keys',()=>{
  const document={products:{},logic:{variables:[{key:'sale',defaultValue:'活动'}]}};
  const ordinary=availableTextVariables(document),timer=availableTextVariables(document,{countdown:true,list:true});
  assert.ok(!ordinary.some(([key])=>key.startsWith('count_')||key.startsWith('item.')));
  assert.ok(ordinary.some(([key,,group])=>key==='business.sale'&&group==='业务'));
  for(const {key} of TIMER_VARIABLE_DEFINITIONS)assert.ok(timer.some(([value,,group])=>key===value&&group==='倒计时'));
  const text='还剩 {{ count_hours_with_zero }} 小时 {{ count_minutes_without_zero }} 分钟';
  assert.equal(interpolateVariables(text,document,null,{hours:'02',minutesWithoutZero:'3'}),'还剩 02 小时 3 分钟');
  assert.deepEqual(variableIssues(text,document,null,{hours:'02',minutesWithoutZero:'3'}),[]);
  assert.equal(variableIssues('{{ unknown.key }}',document)[0].reason,'未知变量');
});
