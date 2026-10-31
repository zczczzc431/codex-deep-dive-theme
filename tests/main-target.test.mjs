import test from 'node:test';
import assert from 'node:assert/strict';
import {mainTargets,selectMain} from '../scripts/main-target.mjs';
const target=(url,id='main')=>({id,type:'page',url});
test('spotlight and other helper windows are excluded alongside the real main',()=>{
 const list=[target('app://-/index.html'),...['spotlight','avatar-overlay','detached-window'].map(r=>target('app://-/index.html?initialRoute=%2F'+r,r))];
 assert.equal(mainTargets(list).length,1);
 assert.equal(selectMain(list).id,'main');
});
test('thread query remains a main renderer',()=>assert.equal(mainTargets([target('app://-/index.html?initialRoute=%2Fthread%2Fexample')]).length,1));
test('foreign URLs, ambiguous routes and detached entrypoints are rejected',()=>{
 const urls=['https://example.com/index.html','app://evil/index.html','app://-/detached-window.html','app://-/index.html#x','app://-/index.html?initialRoute=%2Fthread&initialRoute=%2Fspotlight'];
 for(const url of urls)assert.equal(mainTargets([target(url)]).length,0,url);
 assert.throws(()=>selectMain([target('app://-/index.html'),target('app://-/index.html','second')]),/unique/);
});
