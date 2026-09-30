export const removeExpression = `(()=>{
  const style=document.getElementById('deep-dive-community-addon'),state=window.__deepDiveCommunityAddon;
  if(!style&&!state)return {removed:false,baseThemeUnchanged:true};
  style?.remove();
  if(state?.quotaRuntime&&window.__codexQuotaRAM===state.quotaRuntime){state.quotaRuntime.dispose();delete window.__codexQuotaRAM;document.querySelectorAll('.codex-quota-ram').forEach(e=>e.remove());}
  delete window.__deepDiveCommunityAddon;return {removed:true,baseThemeUnchanged:true};
})()`;
export const applyExpression = (css,runtime,sha) => `(()=>{
  if(document.documentElement.dataset.heigeCodexSkin!=='deep-dive-protocol')throw Error('Apply the Deep Dive Protocol base theme first.');
  const nodes=[...document.querySelectorAll('.app-shell-left-panel button,[data-composer-dark][class*="ComposerLayoutRoot"] button')];
  if(!nodes.length)throw Error('Native controls not found; renderer compatibility check required.');
  const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};const before=nodes.map(rect);
  let el=document.getElementById('deep-dive-community-addon');const prior=el?.textContent,priorState=window.__deepDiveCommunityAddon,priorQuota=window.__codexQuotaRAM;
  const priorBars=new Set(document.querySelectorAll('.codex-quota-ram'));
  if(!el){el=document.createElement('style');el.id='deep-dive-community-addon';document.head.append(el);}
  try{
    el.textContent=${JSON.stringify(css)};
    const after=nodes.map(rect),maxDelta=Math.max(0,...before.flatMap((r,i)=>r.map((v,j)=>Math.abs(v-after[i][j]))));
    if(maxDelta>.5)throw Error('Control layout changed; reverted addon.');
    let quotaRuntime=priorState?.quotaRuntime??null;
    if(!priorQuota){const installed=${runtime.trim()};quotaRuntime=window.__codexQuotaRAM;if(!quotaRuntime)throw Error('Quota installation failed');}
    window.__deepDiveCommunityAddon={quotaRuntime,sha:${JSON.stringify(sha)}};
    return {installed:true,maxDelta,quotaVersion:window.__codexQuotaRAM?.version??null,quotaOwnership:quotaRuntime===window.__codexQuotaRAM?'addon':'shared',sha:${JSON.stringify(sha)}};
  }catch(error){
    if(prior===undefined)el.remove();else el.textContent=prior;
    if(!priorQuota){window.__codexQuotaRAM?.dispose();delete window.__codexQuotaRAM;document.querySelectorAll('.codex-quota-ram').forEach(e=>{if(!priorBars.has(e))e.remove();});}
    if(priorState)window.__deepDiveCommunityAddon=priorState;else delete window.__deepDiveCommunityAddon;throw error;
  }
})()`;
