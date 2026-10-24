import test from 'node:test';
import assert from 'node:assert/strict';
import { actionLink,customCheckoutLink } from './actionLinks.js';

test('legacy links retain external browsing while new links distinguish all three methods',()=>{
  assert.equal(actionLink({actionUrl:'https://example.com/path'}).method,'external_browser');
  for(const method of ['in_app_browser','external_browser','deep_link'])assert.equal(actionLink({actionUrl:'https://example.com/path',openMethod:method}).method,method);
});

test('application schemes are accepted only as deep links; script and browser schemes are rejected',()=>{
  assert.equal(actionLink({actionUrl:'hellotalk://vip?entry=demo',openMethod:'deep_link'}).url,'hellotalk://vip?entry=demo');
  assert.equal(actionLink({actionUrl:'hellotalk://vip',openMethod:'in_app_browser'}),null);
  assert.equal(actionLink({actionUrl:'hellotalk://vip',openMethod:'external_browser'}),null);
  for(const url of ['javascript:alert(1)','data:text/html,test','file:///tmp/demo','blob:https://example.com/id','chrome://settings','view-source:https://example.com','devtools://test','filesystem:https://example.com/test'])assert.equal(actionLink({actionUrl:url,openMethod:'deep_link'}),null,url);
});

test('relative, malformed and unknown-method links do not silently open a different destination',()=>{
  for(const action of [{actionUrl:'not a link'},{actionUrl:'/relative'},{actionUrl:''},{actionUrl:'https://example.com',openMethod:'unknown'}])assert.equal(actionLink(action),null);
});

test('custom checkout attaches only enabled context parameters and preserves query strings and fragments',()=>{
  const action={actionUrl:'https://example.com/checkout?campaign=ht#offer'};
  const context={packageId:'yearly / 年付',appUserId:'demo-preview',environment:'sandbox'};
  const result=new URL(customCheckoutLink(action,context).url);
  assert.equal(result.searchParams.get('rc_package'),context.packageId);assert.equal(result.searchParams.get('rc_app_user_id'),'demo-preview');assert.equal(result.searchParams.get('rc_env'),'sandbox');assert.equal(result.searchParams.get('campaign'),'ht');assert.equal(result.hash,'#offer');
  const disabled=new URL(customCheckoutLink({...action,attachPackageId:false,attachAppUserId:false,attachEnvironment:false},context).url);
  assert.equal(disabled.searchParams.has('rc_package'),false);assert.equal(disabled.searchParams.has('rc_app_user_id'),false);assert.equal(disabled.searchParams.has('rc_env'),false);
  assert.equal(customCheckoutLink({...action,openMethod:'in_app_browser'},context),null);
  assert.equal(customCheckoutLink({actionUrl:'javascript:alert(1)',openMethod:'deep_link'},context),null);
  assert.equal(new URL(customCheckoutLink(action,{}).url).searchParams.has('rc_package'),false);
});
