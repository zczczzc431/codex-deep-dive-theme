(() => {
  window.__codexQuotaRAM?.dispose();
  const cells = 14;
  let scheduled = false;
  const refresh = () => {
    if (document.documentElement.dataset.heigeCodexSkin !== 'deep-dive-protocol') {
      document.querySelectorAll('[data-heige-usage-bar]').forEach(b => b.remove());
      return;
    }
    for (const row of document.querySelectorAll('[role="menu"] [role="menuitem"]')) {
      const content = row.querySelector(':scope > [data-menu-row-content]');
      const text = (content?.textContent ?? row.textContent ?? '').trim();
      if (!/^(?:5\s*小时|每周|5\s*hour|weekly)/i.test(text)) continue;
      const match = /(?:剩余\s*([\d.]+)\s*%|([\d.]+)\s*%\s*(?:remaining|left))/i.exec(text);
      if (!match) { row.querySelector(':scope > [data-heige-usage-bar]')?.remove(); continue; }
      const remaining = Math.max(0, Math.min(100, Number(match[1] ?? match[2])));
      let bar = row.querySelector(':scope > [data-heige-usage-bar]');
      if (!bar) {
        bar = document.createElement('div');
        bar.setAttribute('data-heige-usage-bar', '');
        row.appendChild(bar);
      }
      bar.classList.add('codex-quota-ram');
      if (bar.children.length !== cells) {
        bar.replaceChildren(...Array.from({length:cells}, () => document.createElement('i')));
      }
      const label = /^5/.test(text) ? '5 小时' : '每周';
      const aria = `${label}：剩余 ${remaining}%，已用 ${100 - remaining}%`;
      if (bar.getAttribute('aria-label') !== aria) bar.setAttribute('aria-label', aria);
      bar.setAttribute('role', 'meter');
      for (const [name,value] of Object.entries({'aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(remaining),'data-remaining':String(remaining)})) {
        if (bar.getAttribute(name) !== value) bar.setAttribute(name,value);
      }
      [...bar.children].forEach((cell,index) => {
        const fill = Math.max(0, Math.min(1, remaining / 100 * cells - index));
        const value = `${(fill * 100).toFixed(4)}%`;
        if (cell.style.getPropertyValue('--ram-fill') !== value) cell.style.setProperty('--ram-fill',value);
        const used = fill === 0 ? 'true' : 'false';
        if (cell.dataset.used !== used) cell.dataset.used = used;
        if (!cell.hasAttribute('aria-hidden')) cell.setAttribute('aria-hidden','true');
      });
    }
  };
  const queue = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled=false; refresh(); });
  };
  const observer = new MutationObserver(queue);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  const themeObserver = new MutationObserver(queue);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-heige-codex-skin']});
  document.addEventListener('visibilitychange',queue);
  window.__codexQuotaRAM = {version:1,refresh,dispose(){observer.disconnect();themeObserver.disconnect();document.removeEventListener('visibilitychange',queue);},status(){return [...document.querySelectorAll('.codex-quota-ram')].map(b=>({remaining:Number(b.dataset.remaining),cells:b.children.length,fills:[...b.children].map(c=>c.style.getPropertyValue('--ram-fill'))}));}};
  refresh();
  return {installed:true,version:1,bars:window.__codexQuotaRAM.status()};
})()
