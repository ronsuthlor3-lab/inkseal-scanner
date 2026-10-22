import { getLanguage, t } from './lib/i18n.js';
import { $, el, initLanguage, link } from './lib/ui.js';

let state = { watchIds: [], enabled: true, hits: [], tabCount: 0 };

async function load() {
  const local = await chrome.storage.local.get(['watchIds', 'enabled', 'hits']);
  let tabCount = 0;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) {
    const key = `tab:${tab.id}`;
    tabCount = ((await chrome.storage.session.get(key))[key] || []).length;
  }
  state = { watchIds: local.watchIds || [], enabled: local.enabled ?? true, hits: local.hits || [], tabCount };
  render();
}

function render() {
  $('enabled').checked = state.enabled;
  $('tab-count').textContent = state.tabCount ? t('popThisTab', { n: state.tabCount }) : '';

  $('ids-box').replaceChildren(
    state.watchIds.length
      ? el('p', { class: 'muted' }, t('popWatching', { ids: state.watchIds.join(', ') }))
      : el('div', { class: 'report info' }, el('p', {}, t('popNoIds')), el('p', {}, el('button', { class: 'primary', onclick: openOptions }, t('popSetup')))),
  );

  const locale = getLanguage() === 'th' ? 'th-TH' : 'en-GB';
  const via = t('popVia');
  $('hits').replaceChildren(
    ...(state.hits.length
      ? state.hits.map((h) =>
          el(
            'li',
            {},
            el('div', { class: 'top' }, el('code', {}, h.id), el('span', { class: 'muted' }, new Date(h.time).toLocaleString(locale))),
            el('div', {}, `${t('popPage')}: `, link(h.pageUrl, h.pageTitle || undefined)),
            el('div', {}, `${t('popImage')}: `, link(h.imageUrl)),
            el('div', { class: 'muted' }, via[h.via] || h.via),
          ),
        )
      : [el('li', { class: 'muted' }, t('popEmpty'))]),
  );
  $('clear').disabled = !state.hits.length;
}

function openOptions() {
  chrome.runtime.openOptionsPage();
}

$('settings').addEventListener('click', openOptions);
$('enabled').addEventListener('change', (e) => chrome.storage.local.set({ enabled: e.target.checked }));
// Two clicks: the first asks, the second clears (dialogs are unreliable in popups).
$('clear').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  if (!b.dataset.armed) {
    b.dataset.armed = '1';
    b.textContent = t('popClearConfirm');
    setTimeout(() => { delete b.dataset.armed; b.textContent = t('popClear'); }, 4000);
    return;
  }
  delete b.dataset.armed;
  b.textContent = t('popClear');
  await chrome.storage.local.set({ hits: [] });
});
chrome.storage.onChanged.addListener(() => load());

await initLanguage(render);
await load();
