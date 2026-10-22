import { t } from './lib/i18n.js';
import { parseIdList } from './lib/ids.js';
import { $, el, initLanguage } from './lib/ui.js';

let watchIds = [];

function render() {
  $('ids').replaceChildren(
    ...(watchIds.length
      ? watchIds.map((id) =>
          el('li', {}, el('code', {}, id), el('button', { class: 'small', onclick: () => save(watchIds.filter((x) => x !== id)) }, t('optRemove'))),
        )
      : [el('li', { class: 'muted' }, t('optNone'))]),
  );
}

async function save(next) {
  watchIds = next;
  await chrome.storage.local.set({ watchIds });
  render();
}

$('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { ids, invalid } = parseIdList($('id-input').value);
  if (invalid.length) {
    $('id-error').textContent = t('optInvalid', { v: invalid.join(', ') });
    return;
  }
  const fresh = ids.filter((id) => !watchIds.includes(id));
  if (ids.length && !fresh.length) {
    $('id-error').textContent = t('optDuplicate');
    return;
  }
  $('id-error').textContent = '';
  $('id-input').value = '';
  await save([...watchIds, ...fresh]);
});

$('enabled').addEventListener('change', (e) => chrome.storage.local.set({ enabled: e.target.checked }));

const stored = await chrome.storage.local.get(['watchIds', 'enabled']);
watchIds = stored.watchIds || [];
$('enabled').checked = stored.enabled ?? true;
await initLanguage(render);
