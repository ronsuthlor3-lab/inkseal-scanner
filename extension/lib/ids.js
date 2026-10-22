// Creator IDs and how a scan result is matched against the IDs the user watches.
// Pure functions: used by the service worker, the extension pages and the Node tests.

/**
 * Turn user input into the canonical "A1B2-C3D4-E5F6" form, or null if it is not an ID.
 * Accepts lower case, spaces and missing dashes ("a1b2c3d4e5f6").
 */
export function normalizeId(input) {
  const hex = String(input ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!/^[0-9A-F]{12}$/.test(hex)) return null;
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

/** Split free text (one ID per line, or separated by commas) into unique canonical IDs. */
export function parseIdList(text) {
  const ids = [];
  const invalid = [];
  for (const part of String(text ?? '').split(/[\n,;]+/)) {
    if (!part.trim()) continue;
    const id = normalizeId(part);
    if (!id) invalid.push(part.trim());
    else if (!ids.includes(id)) ids.push(id);
  }
  return { ids, invalid };
}

/**
 * Does a scan result carry one of the watched IDs?
 * The hidden watermark counts on its own. The file's seal counts only when its
 * signature is genuine ('valid' or 'modified'), because anyone can write a fake one.
 * @returns {{id: string, via: 'watermark'|'seal'|'both'} | null}
 */
export function matchWatched(result, watched) {
  if (!result || !watched?.length) return null;
  const set = new Set(watched.map(normalizeId).filter(Boolean));
  const wm = result.watermark?.fingerprint;
  const seal = result.seal;
  const sealFp = seal && ['valid', 'modified'].includes(seal.status) ? seal.manifest?.fingerprint : null;
  const wmHit = wm && set.has(wm) ? wm : null;
  const sealHit = sealFp && set.has(sealFp) ? sealFp : null;
  if (wmHit && sealHit) return { id: wmHit, via: wmHit === sealHit ? 'both' : 'watermark' };
  if (wmHit) return { id: wmHit, via: 'watermark' };
  if (sealHit) return { id: sealHit, via: 'seal' };
  return null;
}
