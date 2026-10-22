// Thai and English strings for the popup, options and result pages.
// The chosen language is kept in chrome.storage.local so the content script uses it too.

export const STRINGS = {
  th: {
    appName: 'Inkseal Scanner',
    privacy: 'ทุกอย่างทำงานในเครื่องของคุณ ไม่มีการส่งข้อมูลหรือรายงานไปที่ใด',

    popScanning: 'สแกนหน้าเว็บ',
    popOn: 'เปิด',
    popOff: 'ปิด',
    popThisTab: 'แท็บนี้พบ {n} รูป',
    popNoIds: 'ยังไม่ได้ใส่รหัสผู้สร้างที่จะเฝ้าดู',
    popSetup: 'ตั้งค่ารหัสผู้สร้าง',
    popWatching: 'กำลังเฝ้าดู: {ids}',
    popFound: 'รูปที่พบ',
    popEmpty: 'ยังไม่พบรูปที่มีรหัสของคุณ',
    popClear: 'ล้างรายการ',
    popClearConfirm: 'กดอีกครั้งเพื่อลบทั้งหมด',
    popSettings: 'ตั้งค่า',
    popPage: 'หน้าเว็บ',
    popImage: 'รูป',
    popVia: { watermark: 'รหัสล่องหน', seal: 'ตราในไฟล์', both: 'รหัสล่องหน + ตราในไฟล์' },
    popHint: 'คลิกขวาที่รูปใดก็ได้ แล้วเลือก "ตรวจด้วย Inkseal" เพื่อดูรายละเอียด',

    optTitle: 'ตั้งค่า Inkseal Scanner',
    optIds: 'รหัสผู้สร้างที่จะเฝ้าดู',
    optIdsHelp: 'ใส่รหัสในรูปแบบ XXXX-XXXX-XXXX (ดูได้ในแท็บ "ตัวตน" ของเว็บ Inkseal) ใส่ได้หลายรหัส',
    optAdd: 'เพิ่ม',
    optRemove: 'ลบ',
    optNone: 'ยังไม่มีรหัส',
    optInvalid: 'รหัสไม่ถูกต้อง: {v} (ต้องเป็นเลขฐานสิบหก 12 ตัว เช่น A1B2-C3D4-E5F6)',
    optDuplicate: 'มีรหัสนี้อยู่แล้ว',
    optScanning: 'สแกนรูปบนหน้าเว็บโดยอัตโนมัติ',
    optScanningHelp: 'เมื่อปิด จะตรวจเฉพาะรูปที่คุณคลิกขวาเลือก "ตรวจด้วย Inkseal"',
    optLanguage: 'ภาษา',
    optHowTitle: 'ทำงานอย่างไร',
    optHow1: 'ส่วนขยายจะดูรูปขนาดอย่างน้อย 128×128 พิกเซลที่เลื่อนมาบนจอ (ไม่เกิน 150 รูปต่อหน้า)',
    optHow2: 'รูปจะถูกดาวน์โหลดซ้ำโดยไม่ส่งคุกกี้ (มักใช้สำเนาจากแคชของเบราว์เซอร์) แล้วอ่านรหัสล่องหนในเครื่องคุณ',
    optHow3: 'ถ้าพบรหัสของคุณ จะขึ้นตัวเลขบนไอคอน ป้ายเล็ก ๆ บนรูป และบันทึกไว้ในรายการ ไม่มีการรายงานไปที่ใด',
    optLimitsTitle: 'ข้อจำกัดที่ควรรู้',
    optLimits1: 'รูปที่ถูกย่อ ตัด หมุน หรือบีบอัดใหม่โดยแพลตฟอร์ม มักทำให้รหัสล่องหนหายไป โซเชียลมีเดียส่วนใหญ่ย่อรูปที่อัปโหลด',
    optLimits2: 'เว็บไซต์มักแสดงรูปย่อ (thumbnail) ส่วนขยายจะเห็นเฉพาะไฟล์ที่หน้าเว็บโหลดมาจริง',
    optLimits3: '"ไม่พบ" ไม่ได้แปลว่ารูปนั้นไม่ใช่ผลงานของคุณ และ "พบ" ก็ไม่ได้แปลว่าการใช้งานนั้นผิดกฎหมาย',
    optLimits4: 'รูปที่ต้องล็อกอินจึงดูได้ หรือรูปแบบ blob: จะตรวจไม่ได้',
    saved: 'บันทึกแล้ว',

    resTitle: 'ผลการตรวจด้วย Inkseal',
    resWorking: 'กำลังตรวจรูป…',
    resError: 'ตรวจรูปนี้ไม่ได้',
    resErrorText: 'ดาวน์โหลดรูปไม่สำเร็จ ({e}) รูปอาจต้องล็อกอินจึงดูได้ หรือเว็บไซต์ไม่อนุญาตให้ดาวน์โหลด ลองบันทึกรูปแล้วตรวจในเว็บ Inkseal',
    resExpired: 'ไม่พบผลการตรวจนี้แล้ว (อาจปิดเบราว์เซอร์ไปแล้ว) ลองคลิกขวาที่รูปอีกครั้ง',
    resImageUrl: 'ที่อยู่รูป',
    resPageUrl: 'หน้าเว็บ',
    resSize: 'ขนาดรูป',
    resYours: 'รูปนี้มีรหัสผู้สร้างที่คุณเฝ้าดู',
    resTooSmall: 'รูปเล็กเกินกว่าจะมีรหัสล่องหน',
    resTooLarge: 'รูปใหญ่เกินกว่าจะตรวจรหัสล่องหน',
    resDecode: 'ถอดรหัสภาพไม่ได้ ตรวจรหัสล่องหนไม่ได้',
    resWebNote: 'ตรวจด้วยกฎเดียวกับแท็บ "ตรวจสอบ" ของเว็บ Inkseal',
    resClose: 'ปิด',

    vValid: 'ของแท้ ไม่ถูกแก้ไข',
    vValidText: 'ลายเซ็นดิจิทัลถูกต้อง และไฟล์ไม่ถูกเปลี่ยนแปลงแม้แต่ไบต์เดียวหลังประทับตรา',
    vModified: 'ถูกแก้ไขหลังประทับตรา',
    vModifiedText: 'ลายเซ็นเป็นของจริง แต่ตัวรูปถูกเปลี่ยนหลังจากเจ้าของประทับตรา (เช่น ตัดต่อ ปรับสี หรือบันทึกใหม่)',
    vForged: 'ลายเซ็นปลอม',
    vForgedText: 'ข้อมูลผู้สร้างในไฟล์ถูกปลอมแปลง อย่าเชื่อข้อมูลในไฟล์นี้',
    vUnreadable: 'ข้อมูลตราเสียหาย',
    vUnreadableText: 'พบข้อมูล Inkseal แต่อ่านไม่ได้',
    vUnsupported: 'เบราว์เซอร์นี้ตรวจลายเซ็นไม่ได้',
    vUnsupportedText: 'พบตรา Inkseal แต่เบราว์เซอร์รุ่นนี้ยังไม่รองรับ Ed25519 จึงยืนยันลายเซ็นไม่ได้ กรุณาอัปเดต Chrome หรือ Edge (รุ่น 137 ขึ้นไป)',
    vStripped: 'ข้อมูลถูกลบ แต่ยังพบรหัสผู้สร้างล่องหน',
    vStrippedText: 'มีคนลบข้อมูลตราออกจากไฟล์ แต่ในพิกเซลยังมีรหัสผู้สร้างฝังอยู่ นำรหัสนี้ไปเทียบกับรหัสที่ศิลปินประกาศไว้ในโปรไฟล์',
    vNone: 'ไม่พบข้อมูล Inkseal',
    vNoneText: 'รูปนี้ไม่มีตราของ Inkseal หรือถูกตัด ย่อ หรือแก้ไขจนลายน้ำหายไป ไม่ได้แปลว่าเป็นงานขโมย',
    vMismatch: 'คำเตือน: รหัสล่องหนในรูปไม่ตรงกับผู้ประทับตรา',
    vMismatchText: 'รูปนี้มีรหัสผู้สร้างล่องหน {wm} แต่ถูกประทับตราโดย {fp} อาจมีคนนำผลงานของผู้อื่นมาประทับตราเป็นของตัวเอง',
    vStatus: 'สถานะ',
    vStatusNames: { valid: 'ถูกต้อง', modified: 'ถูกแก้ไข', forged: 'ปลอม', none: 'ไม่มีตรา', unreadable: 'อ่านไม่ได้', unsupported: 'ตรวจไม่ได้' },
    vCreator: 'ผู้สร้าง',
    vContact: 'ติดต่อ',
    vWork: 'ผลงาน',
    vLicense: 'สิทธิ์การใช้งาน',
    vSealedAt: 'ประทับตราเมื่อ',
    vSealedAtNote: '(เวลาที่ผู้สร้างระบุเอง)',
    vCreatorId: 'รหัสผู้สร้าง',
    vHiddenId: 'รหัสล่องหนในพิกเซล',
    vNotFound: 'ไม่พบ',
    vConfidence: 'ความชัด',
  },
  en: {
    appName: 'Inkseal Scanner',
    privacy: 'Everything runs on your device. Nothing is sent or reported anywhere.',

    popScanning: 'Scan pages',
    popOn: 'On',
    popOff: 'Off',
    popThisTab: '{n} found on this tab',
    popNoIds: 'You have not added a Creator ID to watch yet.',
    popSetup: 'Set up Creator IDs',
    popWatching: 'Watching: {ids}',
    popFound: 'Images found',
    popEmpty: 'No images with your ID found yet.',
    popClear: 'Clear list',
    popClearConfirm: 'Click again to clear all',
    popSettings: 'Settings',
    popPage: 'Page',
    popImage: 'Image',
    popVia: { watermark: 'hidden ID', seal: 'file seal', both: 'hidden ID + file seal' },
    popHint: 'Right-click any image and choose "Check with Inkseal" for details.',

    optTitle: 'Inkseal Scanner settings',
    optIds: 'Creator IDs to watch',
    optIdsHelp: 'Use the XXXX-XXXX-XXXX format (shown in the Identity tab of the Inkseal web app). You can add several.',
    optAdd: 'Add',
    optRemove: 'Remove',
    optNone: 'No IDs yet',
    optInvalid: 'Not a valid ID: {v} (it must be 12 hex characters, e.g. A1B2-C3D4-E5F6)',
    optDuplicate: 'That ID is already on the list',
    optScanning: 'Scan images on web pages automatically',
    optScanningHelp: 'When off, only images you right-click and "Check with Inkseal" are checked.',
    optLanguage: 'Language',
    optHowTitle: 'How it works',
    optHow1: 'The extension looks at images of at least 128×128 pixels as they scroll into view (at most 150 per page).',
    optHow2: 'Each image is downloaded again without cookies (usually straight from the browser cache) and the hidden ID is read on your device.',
    optHow3: 'When your ID is found you get a badge on the toolbar icon, a small label on the image and an entry in the list. Nothing is reported anywhere.',
    optLimitsTitle: 'Limits you should know',
    optLimits1: 'Resized, cropped, rotated or platform-recompressed images usually lose the hidden ID. Most social sites resize uploads.',
    optLimits2: 'Sites often show thumbnails; the extension only sees the file the page actually loaded.',
    optLimits3: '"Not found" does not prove an image is not yours, and "found" does not mean the use is illegal.',
    optLimits4: 'Images behind a login, and blob: images, cannot be checked.',
    saved: 'Saved',

    resTitle: 'Inkseal check',
    resWorking: 'Checking the image…',
    resError: 'Could not check this image',
    resErrorText: 'The image could not be downloaded ({e}). It may need a login, or the site refuses downloads. Save it and check it in the Inkseal web app instead.',
    resExpired: 'This result is gone (the browser may have been restarted). Right-click the image again.',
    resImageUrl: 'Image URL',
    resPageUrl: 'Page',
    resSize: 'Image size',
    resYours: 'This image carries a Creator ID you watch',
    resTooSmall: 'too small to hold a hidden ID',
    resTooLarge: 'too large to check for a hidden ID',
    resDecode: 'could not be decoded; hidden ID not checked',
    resWebNote: 'Checked with the same rules as the Verify tab of the Inkseal web app.',
    resClose: 'Close',

    vValid: 'Authentic and unmodified',
    vValidText: 'The digital signature is valid and the file has not changed by a single byte since it was sealed.',
    vModified: 'Modified after sealing',
    vModifiedText: 'The signature is genuine, but the image changed after the creator sealed it (edited, recoloured or re-saved).',
    vForged: 'Forged signature',
    vForgedText: 'The creator data in this file has been tampered with. Do not trust it.',
    vUnreadable: 'Damaged seal',
    vUnreadableText: 'Inkseal data was found but could not be read.',
    vUnsupported: 'This browser cannot check the signature',
    vUnsupportedText: 'An Inkseal seal was found, but this browser version does not support Ed25519 yet, so the signature cannot be verified. Please update Chrome or Edge (version 137 or later).',
    vStripped: 'Seal removed, hidden Creator ID still found',
    vStrippedText: 'Someone removed the seal from the file, but a Creator ID is still hidden in the pixels. Compare it with the ID the artist publishes on their profile.',
    vNone: 'No Inkseal data found',
    vNoneText: 'This image has no Inkseal seal, or it was cropped, resized or edited enough to erase the watermark. This alone does not mean it is stolen.',
    vMismatch: 'Warning: hidden ID does not match the sealer',
    vMismatchText: 'The pixels carry Creator ID {wm}, but the file was sealed by {fp}. Someone may have sealed another person\'s work as their own.',
    vStatus: 'Status',
    vStatusNames: { valid: 'valid', modified: 'modified', forged: 'forged', none: 'none', unreadable: 'unreadable', unsupported: 'cannot verify' },
    vCreator: 'Creator',
    vContact: 'Contact',
    vWork: 'Work',
    vLicense: 'License',
    vSealedAt: 'Sealed at',
    vSealedAtNote: '(stated by the creator)',
    vCreatorId: 'Creator ID',
    vHiddenId: 'Hidden ID in pixels',
    vNotFound: 'not found',
    vConfidence: 'clarity',
  },
};

let lang = 'en';

export async function detectLanguage() {
  let saved = null;
  try { ({ lang: saved } = await chrome.storage.local.get('lang')); } catch {}
  if (saved && STRINGS[saved]) return saved;
  return (navigator.language || '').toLowerCase().startsWith('th') ? 'th' : 'en';
}

/** Switch language and translate every [data-i18n] element. `persist` saves the choice. */
export function setLanguage(next, persist = false) {
  lang = STRINGS[next] ? next : 'en';
  if (persist) chrome.storage.local.set({ lang }).catch(() => {});
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
}

export function getLanguage() {
  return lang;
}

export function t(key, vars = {}) {
  const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (typeof s !== 'string') return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
