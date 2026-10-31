export const removeExpression = `(()=>{
  const style=document.getElementById('deep-dive-community-addon'),state=window.__deepDiveCommunityAddon;
  if(!style&&!state)return {removed:false,baseThemeUnchanged:true};
  style?.remove();
  if(state?.quotaRuntime&&window.__codexQuotaRAM===state.quotaRuntime){state.quotaRuntime.dispose();delete window.__codexQuotaRAM;document.querySelectorAll('.codex-quota-ram').forEach(e=>e.remove());}
  if(state?.ownsBaseMarker&&document.documentElement.dataset.heigeCodexSkin==='deep-dive-protocol'){
    if(state.previousBase===undefined)delete document.documentElement.dataset.heigeCodexSkin;
    else document.documentElement.dataset.heigeCodexSkin=state.previousBase;
  }
  delete window.__deepDiveCommunityAddon;return {removed:true,baseThemeUnchanged:true};
})()`;
export const applyExpression = (css,runtime,sha) => `(()=>{
  const root=document.documentElement;
  const previousBase=root.dataset.heigeCodexSkin;
  if(previousBase&&previousBase!=='deep-dive-protocol')throw Error('Another skin is active. Remove it first, then apply Deep Dive Protocol.');
  const nodes=[...document.querySelectorAll('.app-shell-left-panel button,[data-composer-dark][class*="ComposerLayoutRoot"] button')];
  if(!nodes.length)throw Error('Native controls not found; renderer compatibility check required.');
  const rect=e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};const before=nodes.map(rect);
  let el=document.getElementById('deep-dive-community-addon');const prior=el?.textContent,priorState=window.__deepDiveCommunityAddon,priorQuota=window.__codexQuotaRAM;
  const priorBars=new Set(document.querySelectorAll('.codex-quota-ram'));
  if(!el){el=document.createElement('style');el.id='deep-dive-community-addon';document.head.append(el);}
  try{
    root.dataset.heigeCodexSkin='deep-dive-protocol';
    el.textContent=${JSON.stringify(css)};
    const after=nodes.map(rect),maxDelta=Math.max(0,...before.flatMap((r,i)=>r.map((v,j)=>Math.abs(v-after[i][j]))));
    if(maxDelta>.5)throw Error('Control layout changed; reverted addon.');
    let quotaRuntime=priorState?.quotaRuntime??null;
    if(!priorQuota){const installed=${runtime.trim()};quotaRuntime=window.__codexQuotaRAM;if(!quotaRuntime)throw Error('Quota installation failed');}
    window.__deepDiveCommunityAddon={quotaRuntime,sha:${JSON.stringify(sha)},ownsBaseMarker:priorState?.ownsBaseMarker??previousBase!=='deep-dive-protocol',previousBase:priorState?priorState.previousBase:previousBase};
    return {installed:true,maxDelta,quotaVersion:window.__codexQuotaRAM?.version??null,quotaOwnership:quotaRuntime===window.__codexQuotaRAM?'addon':'shared',sha:${JSON.stringify(sha)}};
  }catch(error){
    if(previousBase===undefined)delete root.dataset.heigeCodexSkin;else root.dataset.heigeCodexSkin=previousBase;
    if(prior===undefined)el.remove();else el.textContent=prior;
    if(!priorQuota){window.__codexQuotaRAM?.dispose();delete window.__codexQuotaRAM;document.querySelectorAll('.codex-quota-ram').forEach(e=>{if(!priorBars.has(e))e.remove();});}
    if(priorState)window.__deepDiveCommunityAddon=priorState;else delete window.__deepDiveCommunityAddon;throw error;
  }
})()`;
