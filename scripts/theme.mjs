import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import {applyExpression,removeExpression} from './renderer.mjs';

const action=process.argv[2]??'status';
if(!['apply','status','remove','check'].includes(action))throw Error('Usage: node scripts/theme.mjs apply|status|remove|check [--port=9341]');
const portArg=process.argv.slice(3).find(v=>v.startsWith('--port='));
const port=Number(portArg?.slice(7)??9341);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
const needsAssets=action==='apply'||action==='check';
const css=needsAssets?await readFile(new URL('../theme/deep-dive.css',import.meta.url),'utf8'):'';
const runtime=needsAssets?await readFile(new URL('../runtime/quota-ram.js',import.meta.url),'utf8'):'';
const sha=createHash('sha256').update(css).digest('hex');
const expected=needsAssets?(await readFile(new URL('../theme/deep-dive.css.sha256',import.meta.url),'utf8')).trim():sha;
if(sha!==expected)throw Error('Theme checksum mismatch; review edits and regenerate SHA-256 before applying.');
if(needsAssets)new vm.Script(runtime);
if(action==='check'){
  for(const text of [css,runtime])if(/sk-[a-zA-Z0-9]{15,}|gh[pousr]_[a-zA-Z0-9]{20,}|[CG]:\\(?:Users|gaoshuacodex)\\/i.test(text))throw Error('Potential private credential/path in distributable');
  for(const selector of ['data-composer-dark','data-app-action-sidebar-thread-row','data-thread-user-message-navigation-tooltip-preview','data-response-annotation-target'])if(!css.includes(selector))throw Error('Missing '+selector);
  console.log(JSON.stringify({ok:true,sha,node:process.version}));process.exit(0);
}
const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(5000)})).json();
if(!Array.isArray(targets))throw Error('Invalid CDP target list');
const matches=targets.filter(t=>t.type==='page'&&typeof t.url==='string'&&t.url.startsWith('app://-/index.html'));
if(matches.length>1)throw Error('Multiple Codex main renderers found; refusing to modify an ambiguous window.');
const target=matches[0];
if(!target)throw Error('Codex main renderer unavailable. Open Codex with loopback debugging enabled; this tool never starts or restarts it.');
const address=new URL(target.webSocketDebuggerUrl);
if(address.protocol!=='ws:'||!['127.0.0.1','localhost','[::1]'].includes(address.hostname)||Number(address.port)!==port)throw Error('Only the selected local loopback CDP port is allowed.');
const ws=new WebSocket(address);let id=0;const pending=new Map();
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('CDP connect timed out')),5000);ws.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});ws.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('CDP connect failed'))},{once:true});});
ws.addEventListener('message',e=>{let msg;try{msg=JSON.parse(e.data);}catch{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Malformed CDP response'));}pending.clear();ws.close();return;}if(!msg||typeof msg!=='object')return;const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(msg.error.message)):p.resolve(msg.result);});
ws.addEventListener('close',()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('CDP closed'));}pending.clear();});
const call=(method,params)=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP request timed out'));},10000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
try{
  let expression;
  if(action==='status')expression=`(()=>({baseTheme:document.documentElement.dataset.heigeCodexSkin,installed:!!document.getElementById('deep-dive-community-addon'),quotaVersion:window.__codexQuotaRAM?.version??null}))()`;
  if(action==='remove')expression=removeExpression;
  if(action==='apply')expression=applyExpression(css,runtime,sha);
  const out=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(out.exceptionDetails)throw Error(out.exceptionDetails.exception?.description??out.exceptionDetails.text);
  console.log(JSON.stringify(out.result.value,null,2));
}finally{ws.close();}
