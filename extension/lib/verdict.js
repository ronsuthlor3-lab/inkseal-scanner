// The headline of a check, with the same rules as the Verify tab of the Inkseal web app.

/**
 * @param {{status: string, manifest?: object}} seal  result of readSeal (or {status:'unsupported'})
 * @param {{fingerprint: string} | null} watermark    result of extractWatermark
 * @returns {{kind: 'ok'|'warn'|'bad'|'info'|'none', title: string, text: string, vars?: object, mismatch: boolean}}
 *   title/text are i18n keys.
 */
export function verdict(seal, watermark) {
  const m = seal?.manifest;
  const mismatch = Boolean(m && watermark && watermark.fingerprint !== m.fingerprint);
  const status = seal?.status ?? 'none';
  if (status === 'valid' && !mismatch) return { kind: 'ok', title: 'vValid', text: 'vValidText', mismatch };
  if (mismatch) {
    return { kind: 'bad', title: 'vMismatch', text: 'vMismatchText', vars: { wm: watermark.fingerprint, fp: m.fingerprint }, mismatch };
  }
  if (status === 'modified') return { kind: 'warn', title: 'vModified', text: 'vModifiedText', mismatch };
  if (status === 'forged') return { kind: 'bad', title: 'vForged', text: 'vForgedText', mismatch };
  if (status === 'unreadable') return { kind: 'bad', title: 'vUnreadable', text: 'vUnreadableText', mismatch };
  if (status === 'unsupported') return { kind: 'info', title: 'vUnsupported', text: 'vUnsupportedText', mismatch };
  if (watermark) return { kind: 'info', title: 'vStripped', text: 'vStrippedText', mismatch };
  return { kind: 'none', title: 'vNone', text: 'vNoneText', mismatch };
}
