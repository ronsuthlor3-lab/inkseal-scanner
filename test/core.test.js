// Tests for the copied Inkseal core and the scanner's own pure logic.
// No dependencies: PNG files are written with node:zlib.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deflateSync } from 'node:zlib';
import { crc32, fingerprintBytes, formatFingerprint } from '../extension/core/bytes.js';
import { embedSealText, extractSealText } from '../extension/core/container.js';
import { readSeal, sealImage } from '../extension/core/seal.js';
import { embedWatermark, extractWatermark } from '../extension/core/watermark.js';
import { matchWatched, normalizeId, parseIdList } from '../extension/lib/ids.js';
import { verdict } from '../extension/lib/verdict.js';

function artwork(width = 320, height = 240) {
  const data = new Uint8Array(width * height * 4);
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = rand() * 30;
      data[i] = 60 + (x / width) * 150 + n;
      data[i + 1] = 40 + (y / height) * 160 + n;
      data[i + 2] = 120 + Math.sin(x / 30) * 60 + n;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function toPng({ width, height, data }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  return new Uint8Array(
    Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]),
  );
}

async function makeIdentity(name = 'Test Artist') {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKeyRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const fp6 = await fingerprintBytes(publicKeyRaw);
  return { name, contact: '', publicKeyRaw, privateKey: pair.privateKey, fingerprint: formatFingerprint(fp6), fp6 };
}

const identity = await makeIdentity();

test('watermark round-trips and carries the creator ID', () => {
  const img = artwork();
  assert.equal(extractWatermark(img), null);
  embedWatermark(img, identity.fp6, 'normal');
  const found = extractWatermark(img);
  assert.ok(found);
  assert.equal(found.fingerprint, identity.fingerprint);
});

test('readSeal tells valid, modified, forged and none apart', async () => {
  const img = artwork();
  embedWatermark(img, identity.fp6, 'normal');
  const plain = toPng(img);
  assert.equal((await readSeal(plain)).status, 'none');

  const { bytes } = await sealImage(plain, identity, { title: 'Sunset' });
  const ok = await readSeal(bytes);
  assert.equal(ok.status, 'valid');
  assert.equal(ok.manifest.fingerprint, identity.fingerprint);

  // Change one pixel byte inside IDAT -> hash differs, signature still genuine.
  const modified = toPng({ ...img, data: img.data.map((v, i) => (i === 4 ? v ^ 1 : v)) });
  const resealedText = extractSealText(bytes);
  assert.equal((await readSeal(embedSealText(modified, resealedText))).status, 'modified');

  const record = JSON.parse(resealedText);
  record.manifest.creator.name = 'Somebody Else';
  assert.equal((await readSeal(embedSealText(plain, JSON.stringify(record)))).status, 'forged');
});

test('normalizeId and parseIdList', () => {
  assert.equal(normalizeId('a1b2-c3d4-e5f6'), 'A1B2-C3D4-E5F6');
  assert.equal(normalizeId(' a1b2c3d4e5f6 '), 'A1B2-C3D4-E5F6');
  assert.equal(normalizeId('A1B2-C3D4-E5F'), null);
  assert.equal(normalizeId('G1B2-C3D4-E5F6'), null);
  assert.deepEqual(parseIdList('a1b2c3d4e5f6\nA1B2-C3D4-E5F6, nope'), { ids: ['A1B2-C3D4-E5F6'], invalid: ['nope'] });
});

test('matchWatched trusts the watermark, and the seal only when genuine', () => {
  const id = 'A1B2-C3D4-E5F6';
  const wm = { fingerprint: id, confidence: 0.9 };
  assert.deepEqual(matchWatched({ seal: { status: 'none' }, watermark: wm }, [id]), { id, via: 'watermark' });
  assert.deepEqual(matchWatched({ seal: { status: 'valid', manifest: { fingerprint: id } }, watermark: null }, [id]), { id, via: 'seal' });
  assert.deepEqual(matchWatched({ seal: { status: 'modified', manifest: { fingerprint: id } }, watermark: wm }, ['a1b2c3d4e5f6']), { id, via: 'both' });
  assert.equal(matchWatched({ seal: { status: 'forged', manifest: { fingerprint: id } }, watermark: null }, [id]), null);
  assert.equal(matchWatched({ seal: { status: 'none' }, watermark: wm }, ['FFFF-FFFF-FFFF']), null);
  assert.equal(matchWatched({ seal: { status: 'none' }, watermark: wm }, []), null);
});

test('verdict follows the web Verify tab rules', () => {
  const a = { fingerprint: 'AAAA-AAAA-AAAA' };
  const b = { fingerprint: 'BBBB-BBBB-BBBB' };
  assert.equal(verdict({ status: 'valid', manifest: a }, a).title, 'vValid');
  assert.equal(verdict({ status: 'valid', manifest: a }, null).title, 'vValid');
  const mm = verdict({ status: 'valid', manifest: a }, b);
  assert.equal(mm.title, 'vMismatch');
  assert.deepEqual(mm.vars, { wm: b.fingerprint, fp: a.fingerprint });
  assert.equal(verdict({ status: 'modified', manifest: a }, null).title, 'vModified');
  assert.equal(verdict({ status: 'forged', manifest: a }, null).title, 'vForged');
  assert.equal(verdict({ status: 'unreadable' }, null).title, 'vUnreadable');
  assert.equal(verdict({ status: 'unsupported', manifest: a }, null).title, 'vUnsupported');
  assert.equal(verdict({ status: 'none' }, a).title, 'vStripped');
  assert.equal(verdict({ status: 'none' }, null).title, 'vNone');
});
