// Dev harness: exercises the scanner's code paths in a normal page (see harness.html).

import { fingerprintBytes, formatFingerprint } from '../extension/core/bytes.js';
import { readSeal, sealImage } from '../extension/core/seal.js';
import { embedWatermark, extractWatermark } from '../extension/core/watermark.js';
import { analyzeBlob, analyzeUrl } from '../extension/lib/analyze.js';
import { setLanguage } from '../extension/lib/i18n.js';
import { matchWatched } from '../extension/lib/ids.js';
import { buildReport } from '../extension/lib/report.js';

const results = [];
function check(name, ok, detail = '') {
  results.push(ok);
  const li = document.createElement('li');
  li.className = ok ? 'pass' : 'fail';
  li.textContent = `${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ` (${detail})` : ''}`;
  document.getElementById('log').append(li);
}

function artwork(width, height, seed = 7) {
  const img = new ImageData(width, height);
  const d = img.data;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = rand() * 30;
      d[i] = 60 + (x / width) * 150 + n;
      d[i + 1] = 40 + (y / height) * 160 + n;
      d[i + 2] = 120 + Math.sin(x / 30) * 60 + n;
      d[i + 3] = 255;
    }
  }
  return img;
}

async function encode(img, type = 'image/png', quality) {
  const c = new OffscreenCanvas(img.width, img.height);
  c.getContext('2d').putImageData(img, 0, 0);
  return c.convertToBlob({ type, quality });
}

async function resize(blob, scale) {
  const bmp = await createImageBitmap(blob);
  const c = new OffscreenCanvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.convertToBlob({ type: 'image/png' });
}

const toDataUrl = (blob) => new Promise((r) => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); });

async function makeIdentity(name) {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const fp6 = await fingerprintBytes(publicKeyRaw);
  return { name, contact: 'https://example.com', publicKeyRaw, privateKey: pair.privateKey, fingerprint: formatFingerprint(fp6), fp6 };
}

try {
  const me = await makeIdentity('Test Artist');
  const other = await makeIdentity('Someone Else');

  // 1. Core round-trip on raw pixels.
  const px = artwork(640, 480);
  embedWatermark(px, me.fp6, 'normal');
  check('extractWatermark finds the embedded ID', extractWatermark(px)?.fingerprint === me.fingerprint, me.fingerprint);

  // 2. Files the scanner will meet.
  const sealedPng = new Blob([(await sealImage(new Uint8Array(await (await encode(px)).arrayBuffer()), me, { title: 'Sunset', license: 'CC BY 4.0' })).bytes], { type: 'image/png' });
  const strong = artwork(640, 480, 11);
  embedWatermark(strong, me.fp6, 'strong');
  const jpeg90 = await encode(strong, 'image/jpeg', 0.9);
  const otherPx = artwork(480, 360, 3);
  embedWatermark(otherPx, other.fp6, 'normal');
  const otherPng = await encode(otherPx);
  const plainPng = await encode(artwork(480, 360, 5));
  const halfPng = await resize(sealedPng, 0.5);
  const smallPng = await encode(artwork(100, 100, 9));

  // 3. analyzeBlob = what the service worker runs on each image.
  const a = await analyzeBlob(sealedPng);
  check('sealed PNG: seal is valid', a.seal.status === 'valid', a.seal.status);
  check('sealed PNG: hidden ID found', a.watermark?.fingerprint === me.fingerprint);
  check('sealed PNG: matches watched ID', matchWatched(a, [me.fingerprint])?.via === 'both');
  const j = await analyzeBlob(jpeg90);
  check('JPEG q90 (strong): hidden ID survives', j.watermark?.fingerprint === me.fingerprint, j.watermark ? `clarity ${Math.round(j.watermark.confidence * 100)}%` : 'not found');
  const o = await analyzeBlob(otherPng);
  check('other creator: not matched', o.watermark?.fingerprint === other.fingerprint && !matchWatched(o, [me.fingerprint]));
  const p = await analyzeBlob(plainPng);
  check('unmarked image: nothing found', !p.watermark && p.seal.status === 'none');
  const h = await analyzeBlob(halfPng);
  check('resized to 50%: mark is lost (known limit)', !h.watermark, h.watermark ? 'unexpectedly found' : 'lost as expected');

  // Tampering with the sealed file: the seal says "modified" or "forged".
  const sealedBytes = new Uint8Array(await sealedPng.arrayBuffer());
  const tampered = sealedBytes.slice();
  tampered[100] ^= 0xff; // inside IDAT
  const t = await readSeal(tampered).catch(() => ({ status: 'unreadable' }));
  check('tampered file is not reported as valid', t.status !== 'valid', t.status);

  // analyzeUrl over HTTP (fetch path used by the service worker).
  const icon = await analyzeUrl(new URL('../extension/icons/icon128.png', location.href).href);
  check('analyzeUrl over HTTP works', icon.seal.status === 'none' && !icon.watermark);
  const bad = await analyzeUrl(new URL('./missing.png', location.href).href).then(() => 'no error', (e) => e.message);
  check('missing image gives an error, not a crash', bad.startsWith('HTTP_'), bad);

  // 4. Result report, as the "Check with Inkseal" window shows it.
  setLanguage('th');
  document.getElementById('report').replaceChildren(
    ...buildReport({ state: 'done', imageUrl: 'https://example.com/art/sunset.png', pageUrl: 'https://example.com/gallery', result: a }, [me.fingerprint]),
  );
  const reportText = document.getElementById('report').textContent;
  check('report shows "ของแท้" verdict and creator', reportText.includes('ของแท้') && reportText.includes('Test Artist') && reportText.includes(me.fingerprint));

  // 5. content.js with a stubbed chrome API.
  const scanned = [];
  const shadowRoots = [];
  const realAttach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const root = realAttach.call(this, init);
    shadowRoots.push(root);
    return root;
  };
  globalThis.chrome = {
    runtime: {
      async sendMessage(msg) {
        scanned.push(msg.url);
        const r = await analyzeUrl(msg.url);
        return { match: matchWatched(r, [me.fingerprint]) };
      },
    },
    storage: {
      local: { get: async () => ({ watchIds: [me.fingerprint], enabled: true, lang: 'th' }) },
      onChanged: { addListener() {} },
    },
  };
  const figures = [
    ['sealed PNG (mine)', sealedPng],
    ['JPEG q90 (mine)', jpeg90],
    ['other creator', otherPng],
    ['unmarked', plainPng],
    ['resized 50% (mine)', halfPng],
    ['100×100 (skipped)', smallPng],
  ];
  const urls = {};
  for (const [name, blob] of figures) {
    const url = await toDataUrl(blob);
    urls[name] = url;
    const fig = document.createElement('figure');
    const img = new Image();
    img.src = url;
    img.alt = name;
    fig.append(img, Object.assign(document.createElement('figcaption'), { textContent: name }));
    document.getElementById('imgs').append(fig);
  }
  // ?fakeio: for a page that is not being rendered (hidden or headless browser), where
  // IntersectionObserver and requestAnimationFrame never fire. Uses layout instead.
  if (new URLSearchParams(location.search).has('fakeio')) {
    globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
    globalThis.IntersectionObserver = class {
      constructor(cb, opts) { this.cb = cb; this.margin = parseInt(opts?.rootMargin) || 0; this.els = new Set(); this.t = setInterval(() => this.poll(), 200); }
      observe(el) { this.els.add(el); }
      unobserve(el) { this.els.delete(el); }
      disconnect() { this.els.clear(); }
      poll() {
        const h = innerHeight || 900;
        const hits = [...this.els].filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > -this.margin && r.top < h + this.margin; });
        if (hits.length) this.cb(hits.map((target) => ({ target, isIntersecting: true })));
      }
    };
    check('NOTE: running with simulated IntersectionObserver/rAF (?fakeio)', true);
  }
  const s = document.createElement('script');
  s.src = '../extension/content.js';
  document.head.append(s);

  document.getElementById('imgs').scrollIntoView();
  const deadline = Date.now() + 15000;
  const labelCount = () => shadowRoots.reduce((n, r) => n + r.querySelectorAll('.l').length, 0);
  while (Date.now() < deadline && (labelCount() < 2 || scanned.length < 5)) await new Promise((r) => setTimeout(r, 250));
  await new Promise((r) => setTimeout(r, 1000));

  check('content.js scanned the 5 large images', scanned.length === 5, `${scanned.length} scanned`);
  check('content.js skipped the 100×100 image', !scanned.includes(urls['100×100 (skipped)']));
  const labels = shadowRoots.flatMap((r) => [...r.querySelectorAll('.l')].map((l) => l.textContent));
  check('labels drawn on exactly my 2 surviving images', labels.length === 2 && labels.every((l) => l.includes('ผลงานของคุณ') && l.includes(me.fingerprint)), labels.join(' | '));
} catch (err) {
  check('harness crashed', false, err?.stack || String(err));
}

const passed = results.filter(Boolean).length;
document.getElementById('summary').textContent = `${passed}/${results.length} passed`;
document.title = `harness ${passed}/${results.length}`;
globalThis.harnessDone = { passed, total: results.length };
