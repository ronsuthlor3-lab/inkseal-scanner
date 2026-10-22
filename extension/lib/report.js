// Builds the report shown after "Check with Inkseal", mirroring the web app's Verify tab.

import { getLanguage, t } from './i18n.js';
import { matchWatched } from './ids.js';
import { el, link } from './ui.js';
import { verdict } from './verdict.js';

/** @param entry {imageUrl, pageUrl, state: 'working'|'done'|'error', result?, error?} */
export function buildReport(entry, watchIds = []) {
  if (!entry) return [el('div', { class: 'report none' }, el('p', {}, t('resExpired')))];
  if (entry.state === 'working') return [el('p', { class: 'muted' }, t('resWorking'))];

  const where = el(
    'div',
    { class: 'card' },
    el('dl', { class: 'details' }, el('dt', {}, t('resImageUrl')), el('dd', {}, link(entry.imageUrl)), entry.pageUrl ? [el('dt', {}, t('resPageUrl')), el('dd', {}, link(entry.pageUrl))] : null),
  );
  if (entry.state === 'error') {
    return [el('div', { class: 'report bad' }, el('h3', {}, t('resError')), el('p', {}, t('resErrorText', { e: entry.error }))), where];
  }

  const { seal, watermark } = entry.result;
  const m = seal.manifest;
  const v = verdict(seal, watermark);
  const mine = matchWatched(entry.result, watchIds);

  const rows = [];
  const row = (label, ...value) => rows.push(el('dt', {}, label), el('dd', {}, ...value));
  row(t('vStatus'), t('vStatusNames')[seal.status] || seal.status);
  if (m && seal.status !== 'forged') {
    row(t('vCreator'), m.creator?.name || '—');
    if (m.creator?.contact) row(t('vContact'), m.creator.contact);
    if (m.work?.title) row(t('vWork'), m.work.title);
    if (m.work?.license) row(t('vLicense'), m.work.license);
    const when = new Date(m.sealedAt);
    row(t('vSealedAt'), isNaN(when) ? String(m.sealedAt) : when.toLocaleString(getLanguage() === 'th' ? 'th-TH' : 'en-GB'), ' ', el('span', { class: 'muted small' }, t('vSealedAtNote')));
    row(t('vCreatorId'), el('code', {}, m.fingerprint));
  }
  let hidden;
  if (watermark) hidden = [el('code', {}, watermark.fingerprint), ` (${t('vConfidence')} ${Math.round(watermark.confidence * 100)}%)`];
  else if (entry.result.decodeError) hidden = `${t('vNotFound')} — ${t(entry.result.decodeError === 'TOO_LARGE' ? 'resTooLarge' : 'resDecode')}`;
  else if (entry.result.width && entry.result.width * entry.result.height < 128 * 128) hidden = `${t('vNotFound')} — ${t('resTooSmall')}`;
  else hidden = t('vNotFound');
  row(t('vHiddenId'), hidden);
  if (entry.result.width) row(t('resSize'), `${entry.result.width} × ${entry.result.height}`);

  return [
    mine ? el('div', { class: 'report mine' }, el('p', {}, `${t('resYours')}: `, el('code', {}, mine.id))) : null,
    el('div', { class: `report ${v.kind}` }, el('h3', {}, t(v.title)), el('p', {}, t(v.text, v.vars))),
    el('div', { class: 'card' }, el('dl', { class: 'details' }, rows)),
    where,
    el('p', { class: 'muted small' }, t('resWebNote')),
  ].filter(Boolean);
}
