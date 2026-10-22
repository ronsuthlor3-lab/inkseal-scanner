# Inkseal Scanner

[ภาษาไทย](README.th.md)

A browser extension for Chrome and Edge that spots images carrying **your hidden Inkseal Creator ID** while you browse.
It is a companion to [Inkseal](https://ronsuthlor3-lab.github.io/inkseal/), the free tool that seals artwork with a
handwritten signature, an Ed25519 digital signature and an invisible watermark.

**Everything stays on your device.** The extension never reports, uploads or sends anything anywhere. It has no
analytics and loads no remote code.

## What it does

- **Watch your Creator IDs.** In the settings page, enter one or more IDs (`XXXX-XXXX-XXXX`, shown in the Identity tab of the Inkseal web app).
- **Scans images as you browse.** Images of at least 128×128 pixels are checked as they scroll into view (at most 150 per page, a few at a time, never the same URL twice).
- **Tells you when it finds one.** A count on the toolbar icon, a small label on the image (“Inkseal: your work” + ID), and an entry in the popup list (page, image URL, time).
- **“Check with Inkseal” on any image.** Right-click an image to see creator, title, seal status (valid / modified / forged / none), hidden ID and the mismatch warning — the same rules as the Verify tab of the web app.
- Thai and English interface.

## Install (unpacked)

The extension is not in the Chrome Web Store / Edge Add-ons yet.

1. Download this repository (green **Code** button → **Download ZIP**) and unzip it, or `git clone` it.
2. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and choose the **`extension`** folder inside the repository.
5. Click the Inkseal icon (pin it from the puzzle-piece menu) → **Set up Creator IDs**.

Requires Chrome or Edge 116+. Verifying the Ed25519 seal needs version 137+; on older versions the extension says
“cannot verify” instead of calling a seal forged. The hidden ID works on any supported version.

## Permissions, and why

| Permission | Why it is needed |
| --- | --- |
| `storage` | Keeps your watched IDs, the on/off switch, the language and the list of found images on your device. |
| `contextMenus` | Adds “Check with Inkseal” to the right-click menu of images. |
| Host access to all sites (`<all_urls>`) | The content script must run on the pages you visit to see their images, and the service worker must download each image itself to read its pixels (a page’s canvas would be blocked by CORS). Requests are made **without cookies**, usually served from the browser cache. |

Not requested: `tabs`, `history`, `webRequest`, `notifications`, `downloads`, `scripting`. No remote servers are contacted
other than the sites that host the images you are already looking at.

Turn **Scan pages** off in the popup if you only want the right-click check; the content script then does nothing.

## Honest limits

- **Resized, cropped, rotated or recompressed images usually lose the hidden ID.** Most social networks resize and
  recompress uploads, so a reposted copy there will often not be detected. The harness in this repo confirms that a
  copy scaled to 50% loses the mark.
- Sites usually show thumbnails. The extension checks only the file the page actually loaded, not the original.
- Images behind a login (the extension does not send your cookies), `blob:` images, and images larger than 25 MB / 36 MP are not checked.
- **“Not found” does not prove an image isn’t yours**, and **“found” does not prove misuse** — it may be a licensed or
  shared copy. Treat a match as a lead to look into, not as evidence on its own.
- The hidden ID is 48 bits with a CRC-16 check; a false match on a random image is very unlikely but not impossible.
- A page can make an image look different from the file it loaded (CSS filters, canvas). The extension reads the file.

## Development

```
extension/          the extension (load this folder unpacked)
  core/             copied unchanged from Inkseal core (watermark, seal, container, bytes)
  lib/              scanner logic: analyze, ids, verdict, report, i18n, ui
  background.js     service worker: downloads + checks images, badge, list, context menu
  content.js        finds images on pages, draws labels
test/core.test.js   node --test, no dependencies
dev/harness.html    runs the scanning code in a normal page with a stubbed chrome.* API
dev/serve.ps1       tiny static server for the harness (Windows, no Node needed)
```

- Tests: `node --test test/core.test.js` (Node 20+). CI runs them on Node 20 and 22.
- Harness: serve the repo root (`powershell -ExecutionPolicy Bypass -File dev/serve.ps1`, or any static server) and
  open `http://localhost:8765/dev/harness.html`. Add `?fakeio` when the page is not being rendered (hidden or headless
  browser), where IntersectionObserver never fires.
- `extension/core/` must stay identical to [Inkseal’s core](https://github.com/ronsuthlor3-lab/inkseal/tree/main/core)
  (copied from commit `128cade`). Fix bugs there first, then copy.

## License

[MIT](LICENSE)
