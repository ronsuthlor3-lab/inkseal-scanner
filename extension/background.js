// Service worker: downloads and checks images for the content script and the context
// menu, keeps the list of matches and the toolbar badge. Nothing is ever sent anywhere:
// the only network requests are the image downloads themselves.

import { analyzeUrl } from './lib/analyze.js';
import { matchWatched } from './lib/ids.js';

const MENU_ID = 'inkseal-check';
const MAX_HITS = 500;
const CACHE_SIZE = 300;
const CONCURRENCY = 2;

// ---------- small work queue, so a busy page cannot hog the CPU ----------

let running = 0;
const waiting = [];

function enqueue(job) {
  return new Promise((resolve, reject) => {
    waiting.push({ job, resolve, reject });
    pump();
  });
}

function pump() {
  while (running < CONCURRENCY && waiting.length) {
    const { job, resolve, reject } = waiting.shift();
    running++;
    job().then(resolve, reject).finally(() => {
      running--;
      pump();
    });
  }
}

// ---------- results cache (lives as long as the service worker) ----------

const cache = new Map();

function analyzeCached(url) {
  if (cache.has(url)) {
    const hit = cache.get(url);
    cache.delete(url);
    cache.set(url, hit); // most recently used goes last
    return hit;
  }
  const p = enqueue(() => analyzeUrl(url)).catch((err) => ({ error: err?.message || 'FAILED' }));
  cache.set(url, p);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return p;
}

// ---------- matches list and badge ----------

let writeChain = Promise.resolve();
const serialized = (fn) => (writeChain = writeChain.then(fn, fn));

function recordHit(tab, pageUrl, imageUrl, match) {
  return serialized(async () => {
    const { hits = [] } = await chrome.storage.local.get('hits');
    const rest = hits.filter((h) => !(h.pageUrl === pageUrl && h.imageUrl === imageUrl));
    rest.unshift({ pageUrl, pageTitle: tab?.title || '', imageUrl, id: match.id, via: match.via, time: Date.now() });
    await chrome.storage.local.set({ hits: rest.slice(0, MAX_HITS) });

    if (tab?.id === undefined || tab.id < 0) return;
    const key = `tab:${tab.id}`;
    const { [key]: urls = [] } = await chrome.storage.session.get(key);
    if (!urls.includes(imageUrl)) urls.push(imageUrl);
    await chrome.storage.session.set({ [key]: urls });
    await setBadge(tab.id, urls.length);
  });
}

async function setBadge(tabId, count) {
  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#b3261e' });
    await chrome.action.setBadgeText({ tabId, text: count ? String(count) : '' });
  } catch {
    // the tab was closed meanwhile
  }
}

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== 'loading') return;
  serialized(async () => {
    await chrome.storage.session.remove(`tab:${tabId}`);
    await setBadge(tabId, 0);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  serialized(() => chrome.storage.session.remove(`tab:${tabId}`));
});

// ---------- messages from the content script ----------

async function handleScan(msg, sender) {
  const { watchIds = [], enabled = true } = await chrome.storage.local.get(['watchIds', 'enabled']);
  if (!enabled || !watchIds.length) return { skipped: true };
  const result = await analyzeCached(msg.url);
  if (result.error) return { error: result.error };
  const match = matchWatched(result, watchIds);
  if (match) await recordHit(sender.tab, sender.tab?.url || sender.url || '', msg.url, match);
  return { match };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'scan' && typeof msg.url === 'string' && sender.tab) {
    handleScan(msg, sender).then(sendResponse, () => sendResponse({ error: 'FAILED' }));
    return true;
  }
  return false;
});

// ---------- context menu: "Check with Inkseal" ----------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_ID, title: chrome.i18n.getMessage('menuCheck'), contexts: ['image'] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.srcUrl) return;
  const key = `check:${crypto.randomUUID()}`;
  const base = { imageUrl: info.srcUrl, pageUrl: info.pageUrl || tab?.url || '', time: Date.now() };
  await chrome.storage.session.set({ [key]: { ...base, state: 'working' } });
  await chrome.windows.create({
    url: chrome.runtime.getURL(`result.html#${encodeURIComponent(key)}`),
    type: 'popup',
    width: 460,
    height: 640,
  });

  // A manual check always downloads the image again rather than trusting the cache.
  let entry;
  try {
    entry = { ...base, state: 'done', result: await enqueue(() => analyzeUrl(info.srcUrl)) };
  } catch (err) {
    entry = { ...base, state: 'error', error: err?.message || 'FAILED' };
  }
  await chrome.storage.session.set({ [key]: entry });
});
