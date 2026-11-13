// Shared timeline renderer (About 연표).
// Desktop: vertical timetable (renderV). Mobile: horizontal, scroll sideways (renderH).
// Block length follows its period; overlapping items go to separate lanes.
(function () {
  const NOW = { y: 2026, m: 11 };            // mockup "today"
  const idx = (y, m) => y * 12 + (m - 1);
  const ym = i => `${Math.floor(i / 12)}.${String(i % 12 + 1).padStart(2, '0')}`;
  const nowEnd = idx(NOW.y, NOW.m) + 1;      // exclusive end of current month

  // "2024.03 ~" | "2018.02 ~ 2021.01" | "2024.03 - 2024.06" | "2024.12"
  function parseRange(k) {
    const d = [...String(k).matchAll(/(\d{4})\.(\d{1,2})/g)].map(x => idx(+x[1], +x[2]));
    if (!d.length) return null;
    const open = /[~\-–—]\s*$/.test(String(k).trim());
    const start = d[0];
    const end = d[1] != null ? d[1] + 1 : open ? nowEnd : start + 1; // exclusive
    return { start, end, open };
  }

  const sortItems = items => [...items].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // greedy lane packing: overlapping items get separate lanes
  function pack(items) {
    const ends = [];
    items.forEach(it => {
      let l = ends.findIndex(e => e <= it.start);
      if (l < 0) { l = ends.length; ends.push(0); }
      ends[l] = it.end; it.lane = l;
    });
    return ends.length;
  }

  // piecewise scale: every start/end is a key; segment length clamped
  function scale(items, showNow, px, segMin, segMax) {
    const keys = [...new Set([...items.flatMap(i => [i.start, i.end]), ...(showNow ? [nowEnd] : [])])].sort((a, b) => a - b);
    const pos = [0];
    for (let k = 1; k < keys.length; k++)
      pos[k] = pos[k - 1] + Math.min(segMax, Math.max(segMin, (keys[k] - keys[k - 1]) * px));
    return { at: m => pos[keys.indexOf(m)], total: pos[pos.length - 1] };
  }

  const tip = it => (it.tip ? ` title="${it.tip}"` : '');

  /**
   * Desktop — vertical timetable: time runs top→bottom, overlaps become columns.
   * items: [{ start, end, html, cls?, tip? }]
   */
  function renderV(items, opts = {}) {
    const { px = 24, segMin = 84, segMax = 168, showNow = true } = opts;
    if (!items.length) return '';
    items = sortItems(items);
    const cols = pack(items);
    const { at, total } = scale(items, showNow, px, segMin, segMax);

    const marks = [...new Set(items.map(i => i.start))];
    const axis = marks.map(m => `<span class="tl-label" style="top:${at(m)}px">${ym(m)}</span>`).join('')
      + (showNow ? `<span class="tl-label now" style="top:${at(nowEnd)}px">현재</span>` : '');
    const lines = marks.map(m => `<i class="tl-line" style="top:${at(m)}px"></i>`).join('')
      + (showNow ? `<i class="tl-line now" style="top:${at(nowEnd)}px"></i>` : '');
    const blocks = items.map(it => `<div class="tl-block ${it.cls || ''}"${tip(it)}
      style="top:${at(it.start)}px;height:${at(it.end) - at(it.start) - 4}px;left:calc(${it.lane} * 100% / ${cols});width:calc(100% / ${cols} - 6px)">${it.html}</div>`).join('');

    return `<div class="tl-scroll"><div class="tl" style="height:${total + 24}px">
      <div class="tl-axis">${axis}</div>
      <div class="tl-track">${lines}${blocks}</div>
    </div></div>`;
  }

  /**
   * Mobile — horizontal: time runs left→right (scroll sideways), overlaps become rows.
   */
  function renderH(items, opts = {}) {
    const { px = 20, segMin = 140, segMax = 200, row = 80, showNow = true } = opts;
    const GAP = 6, HEAD = 32, TAIL = 64;
    if (!items.length) return '';
    items = sortItems(items);
    const rows = pack(items);
    const { at, total } = scale(items, showNow, px, segMin, segMax);

    const marks = [...new Set(items.map(i => i.start))];
    const labels = marks.map(m => `<span class="tlh-label" style="left:${at(m)}px">${ym(m)}</span>`).join('')
      + (showNow ? `<span class="tlh-label now" style="left:${at(nowEnd)}px">현재</span>` : '');
    const lines = marks.map(m => `<i class="tlh-line" style="left:${at(m)}px"></i>`).join('')
      + (showNow ? `<i class="tlh-line now" style="left:${at(nowEnd)}px"></i>` : '');
    const blocks = items.map(it => `<div class="tl-block tlh-block ${it.cls || ''}"${tip(it)}
      style="left:${at(it.start)}px;width:${at(it.end) - at(it.start) - 4}px;top:${HEAD + it.lane * (row + GAP)}px;height:${row}px">${it.html}</div>`).join('');

    return `<div class="tlh-scroll"><div class="tlh" style="width:${total + TAIL}px;height:${HEAD + rows * (row + GAP)}px">${lines}${labels}${blocks}</div></div>`;
  }

  // mouse drag → horizontal scroll (touch/trackpad already scroll natively)
  function enableDrag(scroller) {
    if (!scroller) return;
    let startX = 0, startLeft = 0, dragging = false, moved = false;
    scroller.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = false; startX = e.clientX; startLeft = scroller.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) { moved = true; scroller.classList.add('dragging'); }
      scroller.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => { dragging = false; scroller.classList.remove('dragging'); });
    scroller.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  window.Timeline = { NOW, idx, ym, parseRange, renderV, renderH, enableDrag };
})();
