import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {applyExpression,removeExpression} from '../scripts/renderer.mjs';
function fixture({base='deep-dive-protocol',controls=true,delta=0}={}) {
  const elements=new Map(),bars=[];
  const document={documentElement:{dataset:{heigeCodexSkin:base}},getElementById:id=>elements.get(id),
    createElement:()=>({textContent:'',remove(){elements.delete(this.id);}}),head:{append:e=>elements.set(e.id,e)},
    querySelectorAll:s=>s==='.codex-quota-ram'?bars:controls?[{getBoundingClientRect:()=>({x:elements.has('deep-dive-community-addon')?delta:0,y:0,width:20,height:20})}]:[]};
  const window={},context=vm.createContext({document,window});
  return {window,elements,run:code=>vm.runInContext(code,context)};
}
const runtime='(()=>{window.__codexQuotaRAM={version:1,dispose(){window.disposed=(window.disposed??0)+1}};return window.__codexQuotaRAM})()';
test('remove without addon preserves shared runtime',()=>{const f=fixture(),shared={dispose(){throw Error('must not dispose')}};f.window.__codexQuotaRAM=shared;f.run(removeExpression);assert.equal(f.window.__codexQuotaRAM,shared);});
test('repeated apply/remove preserves shared runtime',()=>{const f=fixture(),shared={version:1,dispose(){throw Error('must not dispose')}};f.window.__codexQuotaRAM=shared;for(let i=0;i<2;i++)assert.equal(f.run(applyExpression('css',runtime,'sha')).quotaOwnership,'shared');f.run(removeExpression);assert.equal(f.window.__codexQuotaRAM,shared);assert.equal(f.elements.size,0);});
test('owned runtime disposed on removal',()=>{const f=fixture();f.run(applyExpression('css',runtime,'sha'));f.run(applyExpression('css',runtime,'sha'));f.run(removeExpression);assert.equal(f.window.disposed,1);assert.equal(f.window.__codexQuotaRAM,undefined);});
test('external replacement runtime survives removal',()=>{const f=fixture();f.run(applyExpression('css',runtime,'sha'));const shared={dispose(){throw Error('must not dispose')}};f.window.__codexQuotaRAM=shared;f.run(removeExpression);assert.equal(f.window.__codexQuotaRAM,shared);});
test('runtime failure restores prior style and state',()=>{const f=fixture(),old=f.run("(()=>{const e=document.createElement('style');e.id='deep-dive-community-addon';e.textContent='old';document.head.append(e);return e})()"),state={sha:'old'};f.window.__deepDiveCommunityAddon=state;assert.throws(()=>f.run(applyExpression('new',"(()=>{throw Error('installation failed')})()",'new')));assert.equal(old.textContent,'old');assert.equal(f.window.__deepDiveCommunityAddon,state);});
test('partial runtime failure cleans resources',()=>{const f=fixture();assert.throws(()=>f.run(applyExpression('css',`(()=>{${runtime};throw Error('partial failure')})()`,'sha')));assert.equal(f.window.disposed,1);assert.equal(f.elements.size,0);assert.equal(f.window.__codexQuotaRAM,undefined);});
test('layout shift rolls back',()=>{const f=fixture({delta:1});assert.throws(()=>f.run(applyExpression('css',runtime,'sha')),/layout changed/);assert.equal(f.elements.size,0);assert.equal(f.window.__codexQuotaRAM,undefined);});
for(const options of [{base:'other'},{controls:false}])test('incompatible renderer rejects '+JSON.stringify(options),()=>{const f=fixture(options);assert.throws(()=>f.run(applyExpression('css',runtime,'sha')));assert.equal(f.elements.size,0);});
