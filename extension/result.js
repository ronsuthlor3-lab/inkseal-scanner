import { buildReport } from './lib/report.js';
import { $, initLanguage } from './lib/ui.js';

const key = decodeURIComponent(location.hash.slice(1));
let entry = null;
let watchIds = [];

function render() {
  $('report').replaceChildren(...buildReport(entry, watchIds));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'session' && key in changes) {
    entry = changes[key].newValue ?? null;
    render();
  }
});
$('close').addEventListener('click', () => window.close());

if (key.startsWith('check:')) entry = (await chrome.storage.session.get(key))[key] ?? null;
({ watchIds = [] } = await chrome.storage.local.get('watchIds'));
await initLanguage(render);
