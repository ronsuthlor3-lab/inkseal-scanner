// Tiny DOM helpers shared by the extension pages.

import { detectLanguage, setLanguage } from './i18n.js';

export const $ = (id) => document.getElementById(id);

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

/** Load the saved language, wire the TH/EN buttons, and call `render` after every switch. */
export async function initLanguage(render = () => {}) {
  setLanguage(await detectLanguage());
  for (const b of document.querySelectorAll('[data-lang]')) {
    b.addEventListener('click', () => {
      setLanguage(b.dataset.lang, true);
      render();
    });
  }
  render();
}

/** Shorten a URL for display, keeping the host and the end of the path. */
export function shortUrl(url, max = 60) {
  if (url.startsWith('data:')) return url.slice(0, 30) + '…';
  if (url.length <= max) return url;
  return url.slice(0, max - 18) + '…' + url.slice(-17);
}

/** Only http(s) links are made clickable. */
export function link(url, text = shortUrl(url)) {
  return /^https?:/i.test(url) ? el('a', { href: url, target: '_blank', rel: 'noopener noreferrer', title: url }, text) : el('span', { title: url }, text);
}
