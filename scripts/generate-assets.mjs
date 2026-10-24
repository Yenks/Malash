import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('thank-you-experience/public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Base SVG content
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><mask id="m"><rect width="64" height="64" fill="#fff"/><circle cx="38" cy="27" r="17" fill="#000"/></mask></defs><rect width="64" height="64" rx="15" fill="#6E1450"/><circle cx="29" cy="32" r="20" fill="#F4ECE1" mask="url(#m)"/><path d="M42 49C31 42 30 34 35.5 32.2c2.6-.8 5 .5 6.5 2.6 1.5-2.1 3.9-3.4 6.5-2.6C54 34 53 42 42 49z" fill="#F2B6E3"/></svg>`;

// Full bleed (square corners) version for apple-touch-icon
const svgSquare = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><mask id="m"><rect width="64" height="64" fill="#fff"/><circle cx="38" cy="27" r="17" fill="#000"/></mask></defs><rect width="64" height="64" fill="#6E1450"/><circle cx="29" cy="32" r="20" fill="#F4ECE1" mask="url(#m)"/><path d="M42 49C31 42 30 34 35.5 32.2c2.6-.8 5 .5 6.5 2.6 1.5-2.1 3.9-3.4 6.5-2.6C54 34 53 42 42 49z" fill="#F2B6E3"/></svg>`;

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4); // count

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function run() {
  console.log('Launching headless browser to render icons and OG preview...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Helper to render an SVG at specific dimension
  async function renderSvg(svgStr, size, outPath) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;">${svgStr.replace('<svg ', `<svg style="width:${size}px;height:${size}px;display:block;" `)}</body></html>`);
    const buffer = await page.screenshot({ type: 'png', omitBackground: true });
    if (outPath) fs.writeFileSync(outPath, buffer);
    return buffer;
  }

  // 1. Render sizes for ICO (16, 32, 48)
  console.log('Rendering favicon sizes for ICO...');
  const p16 = await renderSvg(svgFavicon, 16);
  const p32 = await renderSvg(svgFavicon, 32);
  const p48 = await renderSvg(svgFavicon, 48);

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 }
  ]);
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuffer);
  console.log('Created favicon.ico');

  // 2. Apple Touch Icon (180x180, square corners, no rounding)
  console.log('Rendering apple-touch-icon.png (180x180)...');
  await renderSvg(svgSquare, 180, path.join(outDir, 'apple-touch-icon.png'));

  // 3. icon-192.png and icon-512.png
  console.log('Rendering PWA icons (192, 512)...');
  await renderSvg(svgFavicon, 192, path.join(outDir, 'icon-192.png'));
  await renderSvg(svgFavicon, 512, path.join(outDir, 'icon-512.png'));

  // 4. icon-maskable-512.png (artwork scaled to ~60% on #6E1450 background)
  console.log('Rendering icon-maskable-512.png...');
  await page.setViewportSize({ width: 512, height: 512 });
  await page.setContent(`<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;overflow:hidden;background:#6E1450;width:512px;height:512px;display:flex;align-items:center;justify-content:center;">
  <div style="width:308px;height:308px;">
    ${svgFavicon.replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ')}
  </div>
</body>
</html>`);
  const maskableBuf = await page.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(outDir, 'icon-maskable-512.png'), maskableBuf);

  // 5. og-card.png and og-card-v1.png (1200x630, plum background, fine ivory star line-art frame, emblem, text, no names)
  console.log('Rendering Open Graph preview card (1200x630)...');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600&family=Sacramento&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    background: #6E1450;
    color: #F4ECE1;
    font-family: 'Exo 2', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }
  .frame-outer {
    position: absolute;
    inset: 32px;
    border: 2px solid rgba(244, 236, 225, 0.4);
    pointer-events: none;
  }
  .frame-inner {
    position: absolute;
    inset: 44px;
    border: 1px solid rgba(244, 236, 225, 0.2);
    pointer-events: none;
  }
  .corner-star {
    position: absolute;
    width: 24px;
    height: 24px;
    color: #F2B6E3;
  }
  .tl { top: 20px; left: 20px; }
  .tr { top: 20px; right: 20px; }
  .bl { bottom: 20px; left: 20px; }
  .br { bottom: 20px; right: 20px; }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    z-index: 2;
    padding: 0 40px;
  }
  .emblem {
    width: 96px;
    height: 96px;
    margin-bottom: 24px;
    filter: drop-shadow(0 6px 16px rgba(18, 3, 28, 0.4));
  }
  .headline {
    font-family: 'Sacramento', cursive;
    font-size: 72px;
    color: #F4ECE1;
    line-height: 1.1;
    margin-bottom: 16px;
    letter-spacing: 0.02em;
  }
  .divider {
    width: 180px;
    height: 2px;
    background: linear-gradient(90deg, transparent, #F2B6E3, transparent);
    margin-bottom: 20px;
  }
  .tagline {
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #C9B8E8;
  }
</style>
</head>
<body>
  <div class="frame-outer"></div>
  <div class="frame-inner"></div>

  <!-- Corner stars -->
  <svg class="corner-star tl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  <svg class="corner-star tr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  <svg class="corner-star bl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  <svg class="corner-star br" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>

  <div class="content">
    <div class="emblem">
      ${svgFavicon.replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ')}
    </div>
    <h1 class="headline">A letter is waiting for you</h1>
    <div class="divider"></div>
    <p class="tagline">From the GMSA-KNUST family</p>
  </div>
</body>
</html>`);

  await page.waitForTimeout(1000);
  const ogBuffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(outDir, 'og-card-v1.png'), ogBuffer);
  fs.writeFileSync(path.join(outDir, 'og-card.png'), ogBuffer);
  console.log(`Created og-card-v1.png and og-card.png (${(ogBuffer.length / 1024).toFixed(1)} KB)`);

  await browser.close();
  console.log('Asset generation complete.');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
