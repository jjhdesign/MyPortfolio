// Shared project loader — reads real data from ../projects (read-only).
(function () {
  const ROOT = '../projects';
  const YEARS = [2026, 2025, 2024];
  const MAX_ID = 30;
  const CATS = ['UX/UI', 'BRANDING', 'EDITORIAL', 'MARKETING', 'WEB'];
  const THUMBS = ['thumbnail.jpg', 'thumbnail.jpeg', 'thumbnail.png', '1.jpg', '1.jpeg', '1.png'];

  async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('404');
    const buf = await res.arrayBuffer();
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch { return new TextDecoder('euc-kr').decode(buf); }
  }

  function normCat(c) {
    const u = (c || '').trim().toUpperCase();
    return u === 'UI/UX' ? 'UX/UI' : u;
  }

  function parseInfo(text) {
    const [head, ...rest] = text.replace(/\r/g, '').split(/^===\s*$/m);
    const meta = {};
    head.split('\n').forEach(line => {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    });
    const desc = rest.join('===').trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    return { meta, desc };
  }

  let cache;
  function load() {
    if (cache) return cache;
    const jobs = [];
    for (const y of YEARS) for (let id = 1; id <= MAX_ID; id++) {
      jobs.push(fetchText(`${ROOT}/${y}/${id}/info.txt`)
        .then(t => { const { meta, desc } = parseInfo(t); return { year: y, id, meta, desc, cat: normCat(meta.category), title: meta.title || `Untitled ${id}` }; })
        .catch(() => null));
    }
    return (cache = Promise.all(jobs).then(r => r.filter(Boolean).sort((a, b) => b.year - a.year || b.id - a.id)));
  }

  window.Projects = { ROOT, CATS, THUMBS, load };
})();
