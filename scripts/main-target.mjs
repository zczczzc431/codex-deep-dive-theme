export function mainTargets(targets){
 if(!Array.isArray(targets))throw Error('Invalid CDP target list');
 return targets.filter(t=>{if(t.type!=='page'||typeof t.url!=='string')return false;try{const u=new URL(t.url);const route=u.searchParams.get('initialRoute')??'';return u.protocol==='app:'&&u.hostname==='-'&&!u.username&&!u.password&&!u.port&&!u.hash&&u.pathname==='/index.html'&&u.searchParams.getAll('initialRoute').length<=1&&!/^\/(avatar-overlay|detached-window|spotlight)(?:[/?#]|$)/i.test(route);}catch{return false;}});
}
export function selectMain(targets){const matches=mainTargets(targets);const requested=process.argv.find(a=>a.startsWith('--target-id='))?.slice(12);const selected=requested?matches.filter(t=>t.id===requested):matches;if(selected.length!==1)throw Error('A unique Codex main renderer was not found. Nothing was applied.');return selected[0];}
export function selectedPort(){const arg=process.argv.find(a=>a.startsWith('--port='));const port=Number(arg?.slice(7)??9341);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid CDP port');return port;}
