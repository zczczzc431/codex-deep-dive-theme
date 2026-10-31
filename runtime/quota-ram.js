(() => {
  window.__codexQuotaRAM?.dispose();
  const cells = 14;
  let scheduled = false;
  const usagePattern = /^(?:5\s*小时|每周|1\s*周|5\s*hour|weekly)(?=\s|[\d%]|$)/i;
  const findUsageRows = () => {
    const rows = [];
    // Prefer the live menu rows themselves. In recent Codex builds the menu is
    // rendered in a portal and its ancestor also contains the chat transcript;
    // attaching to that ancestor produces zero-sized or off-screen bars.
    for (const menu of document.querySelectorAll('[role="menu"]')) {
      const candidates = [...menu.querySelectorAll('*')].filter(element => {
        const text = (element.textContent ?? '').trim().replace(/\s+/g, ' ');
        const rect = element.getBoundingClientRect?.();
        return Boolean(rect && rect.width > 0 && rect.height > 0 && (
          /(?:5\s*小时|5\s*hour)\s*[\d.]+\s*%/i.test(text) ||
          /(?:1\s*周|每周|weekly)\s*[\d.]+\s*%/i.test(text)
        ));
      });
      for (const pattern of [
        {kind: 'five-hour', re: /(?:5\s*小时|5\s*hour)\s*([\d.]+)\s*%/i, label: '5 小时'},
        {kind: 'weekly', re: /(?:1\s*周|每周|weekly)\s*([\d.]+)\s*%/i, label: '每周'},
      ]) {
        const candidate = candidates
          .filter(element => pattern.re.test((element.textContent ?? '').replace(/\s+/g, ' ')))
          .sort((a, b) => (a.textContent ?? '').length - (b.textContent ?? '').length)[0];
        if (!candidate) continue;
        const match = pattern.re.exec((candidate.textContent ?? '').replace(/\s+/g, ' '));
        const host = candidate.closest('[role="menuitem"],button') ?? candidate.parentElement ?? candidate;
        rows.push({host, text: `${pattern.label} ${match[1]}%`});
      }
      if (rows.length) return rows;
    }
    // Never fall back to arbitrary ancestors in the document. Chat history can
    // contain the words “5 小时” and “每周” and must never become a quota host.
    return rows;

  };
  const refresh = () => {
    if (document.documentElement.dataset.heigeCodexSkin !== 'deep-dive-protocol') {
      document.querySelectorAll('.codex-quota-ram').forEach(b => b.remove());
      return;
    }
    const rows = findUsageRows();
    const active = new Set();
    for (const {host, text} of rows) {
      if (!usagePattern.test(text)) continue;
      const match = /(?:剩余\s*)?([\d.]+)\s*%(?:\s*(?:remaining|left))?/i.exec(text);
      if (!match) continue;
      const remaining = Math.max(0, Math.min(100, Number(match[1])));
      const kind = /^5/.test(text) ? 'five-hour' : 'weekly';
      let bar = [...host.querySelectorAll(':scope > [data-heige-usage-bar]')].find(e => e.dataset.quotaWindow === kind);
      if (!bar) {
        bar = document.createElement('div');
        bar.setAttribute('data-heige-usage-bar', '');
        bar.dataset.quotaWindow = kind;
        host.appendChild(bar);
      }
      active.add(bar);
      bar.classList.add('codex-quota-ram');
      if (bar.children.length !== cells) {
        bar.replaceChildren(...Array.from({length:cells}, () => document.createElement('i')));
      }
      const label = kind === 'five-hour' ? '5 小时' : '每周';
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
    for (const bar of document.querySelectorAll('.codex-quota-ram')) {
      if (!active.has(bar)) bar.remove();
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
  document.addEventListener('click',queue,true);
  document.addEventListener('pointerup',queue,true);
  const timer = setInterval(refresh, 500);
  window.__codexQuotaRAM = {version:4,refresh,dispose(){observer.disconnect();themeObserver.disconnect();clearInterval(timer);document.removeEventListener('visibilitychange',queue);document.removeEventListener('click',queue,true);document.removeEventListener('pointerup',queue,true);document.querySelectorAll('.codex-quota-ram').forEach(bar=>bar.remove());},status(){return [...document.querySelectorAll('.codex-quota-ram')].map(b=>({remaining:Number(b.dataset.remaining),window:b.dataset.quotaWindow??null,cells:b.children.length,fills:[...b.children].map(c=>c.style.getPropertyValue('--ram-fill'))}));}};
  refresh();
  return {installed:true,version:4,bars:window.__codexQuotaRAM.status()};
})()
