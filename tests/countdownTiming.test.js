import test from 'node:test';
import assert from 'node:assert/strict';
import {countdownMode,entryCountdownDeadline} from '../src/builder/countdownTiming.js';
import {clearLocalDemoSettings} from '../src/templateStorage.js';

const now=Date.parse('2030-01-01T00:00:00Z');
const store=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),values};};
test('three countdown modes keep distinct reopening semantics, including expired first entry',()=>{
  const storage=store(),scope={now,id:'timer',scope:'paywall-a',storage};
  const props={start:'71:49:28',deadline:new Date(now+10000).toISOString()};
  assert.equal(countdownMode(props),'deadline');
  const fixed={...props,timingMode:'deadline'};
  assert.equal(entryCountdownDeadline(fixed,scope),now+10000);
  assert.equal(entryCountdownDeadline(fixed,{...scope,now:now+60000}),now+10000);
  const first={...props,timingMode:'firstEntry'};
  const deadline=entryCountdownDeadline(first,scope);
  assert.equal(deadline,now+(71*3600+49*60+28)*1000);
  assert.equal(entryCountdownDeadline(first,{...scope,now:deadline+1000}),deadline);
  assert.notEqual(entryCountdownDeadline(first,{...scope,scope:'paywall-b',now:now+2000}),deadline);
  const repeat={...props,timingMode:'everyEntry'};
  assert.equal(entryCountdownDeadline(repeat,{...scope,now:now+3000}),entryCountdownDeadline(repeat,scope)+3000);
});
test('editing never starts the persisted first-entry clock; invalid data uses fallback instead of reset',()=>{
  const storage=store(),scope={now,id:'timer',scope:'a',storage},props={timingMode:'firstEntry',start:'00:10:00'};
  entryCountdownDeadline(props,{...scope,persist:false});assert.equal(storage.values.size,0);
  const first=entryCountdownDeadline(props,scope);
  assert.equal(entryCountdownDeadline(props,{...scope,now:now+5000}),first);
  assert.ok(Number.isNaN(entryCountdownDeadline({...props,start:'bad'},scope)));
  assert.ok(Number.isNaN(entryCountdownDeadline(props,{...scope,storage:{getItem(){throw Error('denied');}}})));
  assert.ok(Number.isNaN(entryCountdownDeadline(props,{...scope,storage:undefined})));
  assert.equal(countdownMode({start:'00:10:00'}),'everyEntry');
});
test('local Demo reset clears timer anchors but not unrelated browser data',()=>{
  const storage=store();
  Object.defineProperty(storage,'length',{get:()=>storage.values.size});
  storage.key=index=>[...storage.values.keys()][index];storage.removeItem=key=>storage.values.delete(key);
  entryCountdownDeadline({timingMode:'firstEntry',start:'00:01:00'},{now,id:'timer',scope:'a',storage});
  storage.setItem('unrelated','keep');
  assert.equal(clearLocalDemoSettings(storage),true);
  assert.deepEqual([...storage.values],[['unrelated','keep']]);
});
