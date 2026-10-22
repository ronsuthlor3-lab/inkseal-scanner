// Content script: notices images as they scroll into view and asks the service worker
// to check them. It only reads image URLs; it never changes the page except for the
// small label it draws on top of an image that carries one of your Creator IDs.
//
// Classic script (content scripts cannot be modules), so it has no imports.

(() => {
  if (globalThis.__inksealScanner) return;
  globalThis.__inksealScanner = true;

  const MIN_SIZE = 128; // smaller images cannot hold the watermark
  const MAX_PER_PAGE = 150; // stop after this many checks on one page
  const BATCH = 6; // images handed over per tick
  const TICK_MS = 500;

  const LABEL = {
    th: 'Inkseal: ผลงานของคุณ',
    en: 'Inkseal: your work',
  };

  let active = false;
  let lang = 'en';
  let sent = 0;
  const seen = new Set(); // image URLs already handed over
  const matches = new Map(); // image URL -> {id, via}
  const queue = new Set(); // <img> elements waiting for a tick
  let timer = null;

  // ---------- finding images ----------

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        queue.add(e.target);
      }
      schedule();
    },
    { rootMargin: '300px' },
  );

  function schedule() {
    if (!timer && queue.size) timer = setTimeout(tick, TICK_MS);
  }

  function tick() {
    timer = null;
    let n = 0;
    for (const img of queue) {
      queue.delete(img);
      consider(img);
      if (++n >= BATCH) break;
    }
    schedule();
  }

  function urlOf(img) {
    return img.currentSrc || img.src || '';
  }

  function consider(img) {
    if (!active || !img.isConnected) return;
    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', () => { queue.add(img); schedule(); }, { once: true });
      return;
    }
    if (img.naturalWidth < MIN_SIZE || img.naturalHeight < MIN_SIZE) return;
    const url = urlOf(img);
    if (!/^(https?:|data:image\/)/i.test(url)) return; // blob: URLs belong to the page and cannot be refetched
    if (matches.has(url)) label(img, matches.get(url));
    if (seen.has(url) || sent >= MAX_PER_PAGE) return;
    seen.add(url);
    sent++;
    send(url);
  }

  async function send(url) {
    let res;
    try {
      res = await chrome.runtime.sendMessage({ type: 'scan', url });
    } catch {
      stop(); // the extension was reloaded or removed; this copy of the script is orphaned
      return;
    }
    if (!res?.match) return;
    matches.set(url, res.match);
    for (const img of document.images) if (urlOf(img) === url) label(img, res.match);
  }

  function watch(img) {
    if (img.__inksealWatched === urlOf(img)) return;
    img.__inksealWatched = urlOf(img);
    io.observe(img);
  }

  function watchTree(node) {
    if (node.nodeType !== 1) return;
    if (node.tagName === 'IMG') watch(node);
    else if (node.firstElementChild) for (const img of node.querySelectorAll('img')) watch(img);
  }

  let pendingNodes = [];
  let mutationTimer = null;
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'attributes') pendingNodes.push(r.target);
      else for (const n of r.addedNodes) pendingNodes.push(n);
    }
    if (!mutationTimer) {
      mutationTimer = setTimeout(() => {
        mutationTimer = null;
        const nodes = pendingNodes;
        pendingNodes = [];
        for (const n of nodes) watchTree(n);
      }, TICK_MS);
    }
  });

  function start() {
    if (active) return;
    active = true;
    for (const img of document.images) watch(img);
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });
  }

  function stop() {
    active = false;
    io.disconnect();
    mo.disconnect();
    queue.clear();
    for (const img of document.images) delete img.__inksealWatched;
  }

  // ---------- labels ----------

  let root = null;
  const labels = new Map(); // <img> -> label element

  function overlayRoot() {
    if (root) return root;
    const host = document.createElement('inkseal-scanner-overlay');
    host.style.cssText = 'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483646;';
    root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      .l { position: fixed; max-width: 260px; padding: 2px 7px; border-radius: 9px;
           font: 600 11px/16px system-ui, "Segoe UI", "Noto Sans Thai", sans-serif;
           color: #fff; background: rgba(27, 42, 107, .88); box-shadow: 0 1px 3px rgba(0,0,0,.35);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .l code { font: 500 10px/16px ui-monospace, Consolas, monospace; opacity: .85; margin-left: 4px; }`;
    root.append(style);
    document.documentElement.append(host);
    window.addEventListener('scroll', place, { passive: true, capture: true });
    window.addEventListener('resize', place, { passive: true });
    setInterval(place, 1000); // catches layout shifts that fire no event
    return root;
  }

  function label(img, match) {
    let el = labels.get(img);
    if (!el) {
      el = document.createElement('div');
      el.className = 'l';
      overlayRoot().append(el);
      labels.set(img, el);
    }
    el.replaceChildren(LABEL[lang] || LABEL.en, Object.assign(document.createElement('code'), { textContent: match.id }));
    el.title = `${LABEL[lang] || LABEL.en} ${match.id}`;
    place();
  }

  let placing = false;
  function place() {
    if (placing) return;
    placing = true;
    requestAnimationFrame(() => {
      placing = false;
      for (const [img, el] of labels) {
        const r = img.getBoundingClientRect();
        const visible = img.isConnected && r.width >= 40 && r.height >= 24 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        el.style.display = visible ? '' : 'none';
        if (!visible) continue;
        el.style.left = `${Math.max(0, r.left) + 6}px`;
        el.style.top = `${Math.max(0, r.top) + 6}px`;
        el.style.maxWidth = `${Math.max(60, r.width - 12)}px`;
      }
    });
  }

  // ---------- settings ----------

  function apply({ watchIds = [], enabled = true, lang: l }) {
    lang = l === 'th' || l === 'en' ? l : (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
    if (enabled && watchIds.length) start();
    else stop();
  }

  chrome.storage.local.get(['watchIds', 'enabled', 'lang']).then(apply, () => {});

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !('watchIds' in changes || 'enabled' in changes || 'lang' in changes)) return;
    if ('watchIds' in changes) {
      // Different IDs: check everything again (the service worker still has the analysis cached).
      seen.clear();
      matches.clear();
      sent = 0;
      clearLabels();
      stop();
    }
    chrome.storage.local.get(['watchIds', 'enabled', 'lang']).then((s) => {
      apply(s);
      if (!active) clearLabels();
      // redraw in the new language
      else for (const [img, el] of labels) matches.has(urlOf(img)) ? label(img, matches.get(urlOf(img))) : el.remove();
    }, () => {});
  });

  function clearLabels() {
    for (const el of labels.values()) el.remove();
    labels.clear();
  }
})();
