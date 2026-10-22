// Fetch an image and run the Inkseal checks on it. Runs in the service worker
// (and in the dev harness page): it needs fetch, createImageBitmap and OffscreenCanvas.

import { detectFormat } from '../core/container.js';
import { readSeal } from '../core/seal.js';
import { canHoldWatermark, extractWatermark } from '../core/watermark.js';

export const MAX_BYTES = 25 * 1024 * 1024;
export const MAX_PIXELS = 36_000_000;

let ed25519Support;
/** True when this browser can verify Ed25519 signatures (Chrome/Edge 137+). */
export function supportsEd25519() {
  ed25519Support ??= crypto.subtle
    .generateKey({ name: 'Ed25519' }, false, ['sign', 'verify'])
    .then(() => true, () => false);
  return ed25519Support;
}

/**
 * Download image bytes. Cookies are never sent: the extension sees only what an
 * anonymous visitor would see. The browser HTTP cache is used when possible, so an
 * image already shown on the page is usually not downloaded a second time.
 */
export async function fetchImage(url) {
  if (!/^(https?|data):/i.test(url)) throw new Error('UNSUPPORTED_URL');
  const res = await fetch(url, { credentials: 'omit', cache: 'force-cache' });
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  const length = Number(res.headers.get('content-length'));
  if (length > MAX_BYTES) throw new Error('TOO_LARGE');
  const blob = await res.blob();
  if (blob.size > MAX_BYTES) throw new Error('TOO_LARGE');
  return blob;
}

/** Decode to RGBA at the image's own size (the watermark does not survive scaling). */
async function decodePixels(blob) {
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  try {
    const { width, height } = bmp;
    if (!canHoldWatermark(width, height)) return { width, height, pixels: null };
    if (width * height > MAX_PIXELS) throw new Error('TOO_LARGE');
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    return { width, height, pixels: ctx.getImageData(0, 0, width, height) };
  } finally {
    bmp.close();
  }
}

/**
 * Same checks as the Verify tab of the Inkseal web app.
 * @returns {Promise<{seal: object, watermark: object|null, width?: number, height?: number, decodeError?: string}>}
 */
export async function analyzeBlob(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let seal = { status: 'none' };
  if (detectFormat(bytes)) {
    try {
      seal = await readSeal(bytes);
    } catch {
      seal = { status: 'unreadable' };
    }
    // Without Ed25519 support every signature would look forged. Say so instead of accusing anyone.
    if (seal.status === 'forged' && !(await supportsEd25519())) seal = { status: 'unsupported', manifest: seal.manifest };
  }
  // Keep only what the UI needs, so results stay small in storage and messages.
  if (seal.manifest) seal = { status: seal.status, manifest: seal.manifest };

  const result = { seal, watermark: null };
  try {
    const { width, height, pixels } = await decodePixels(blob);
    Object.assign(result, { width, height });
    if (pixels) result.watermark = extractWatermark(pixels);
  } catch (err) {
    result.decodeError = err?.message === 'TOO_LARGE' ? 'TOO_LARGE' : 'DECODE_FAILED';
  }
  return result;
}

export async function analyzeUrl(url) {
  return analyzeBlob(await fetchImage(url));
}
