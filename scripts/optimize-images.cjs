/**
 * Resize the bundled images to the largest size the app actually displays.
 *
 * Why this exists: Android decodes an image to width × height × 4 bytes
 * regardless of the box it's drawn in, and these assets are flat-colour art
 * that compresses to almost nothing while decoding enormous. `rentivo.png`
 * shipped at 8334×8334 — 0.47 MB on disk, but 265 MB of bitmap, which on its
 * own exhausted the heap and killed the app on the onboarding screen.
 *
 * Originals are kept in assets/images/_original/, so this is repeatable and
 * lossless at the source. Re-run after replacing any of them:
 *
 *   npm run optimize:images
 */
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const SRC = path.join(__dirname, '..', 'assets', 'images', '_original');
const OUT = path.join(__dirname, '..', 'assets', 'images');

// Width targets: the largest on-screen size, times roughly three for the
// densest screens. Photographs go out as JPEG; anything needing transparency
// stays PNG.
const TARGETS = [
  // The app icon. Stores want 1024 and nothing renders it larger.
  { file: 'rentivo.png', width: 1024, format: 'png' },
  // Splash wordmark, drawn 220pt wide.
  { file: 'logo-name.png', width: 880, format: 'png' },
  // The mark, drawn at 72pt at most.
  { file: 'logo-green.png', width: 256, format: 'png' },
  // Photographs, drawn full-bleed at most.
  { file: 'image.png', width: 1080, format: 'jpeg', out: 'image.jpg' },
  { file: 'onboarding.jpg', width: 1080, format: 'jpeg' },
  { file: 'onboarding_3.jpg', width: 1080, format: 'jpeg' },
];

// Category thumbnails are drawn at 76pt, so ~3x that is plenty. They were
// decoding 11 MB between them for tiles the size of a postage stamp.
const CATEGORY_WIDTH = 240;

const QUALITY = 82;
const mb = (n) => (n / 1048576).toFixed(2);

(async () => {
  let beforeTotal = 0;
  let afterTotal = 0;
  let decodedBefore = 0;
  let decodedAfter = 0;

  for (const { file, width, format, out } of TARGETS) {
    const src = path.join(SRC, file);
    if (!fs.existsSync(src)) {
      console.log(`skip ${file} — no original`);
      continue;
    }

    const image = await Jimp.read(src);
    const w0 = image.getWidth();
    const h0 = image.getHeight();
    decodedBefore += (w0 * h0 * 4) / 1048576;
    beforeTotal += fs.statSync(src).size;

    // Never upscale — a small original stays as it is.
    if (w0 > width) image.resize(width, Jimp.AUTO);

    // image.png is a photograph despite its .png original, so it is written
    // out as image.jpg — bytes matching extension.
    const mime = format === 'jpeg' ? Jimp.MIME_JPEG : Jimp.MIME_PNG;
    if (format === 'jpeg') image.quality(QUALITY);

    const buffer = await image.getBufferAsync(mime);
    fs.writeFileSync(path.join(OUT, out ?? file), buffer);

    const w1 = image.getWidth();
    const h1 = image.getHeight();
    decodedAfter += (w1 * h1 * 4) / 1048576;
    afterTotal += buffer.length;

    console.log(
      `${file.padEnd(20)} ${`${w0}x${h0}`.padStart(11)} → ${`${w1}x${h1}`.padEnd(11)}` +
        ` ${mb(fs.statSync(src).size)} → ${mb(buffer.length)} MB` +
        `   decoded ${((w0 * h0 * 4) / 1048576).toFixed(1)} → ${((w1 * h1 * 4) / 1048576).toFixed(1)} MB`,
    );
  }

  // Category thumbnails for Home's "Browse by category" row. Same trap as
  // above at a smaller scale: 0.41 MB on disk between them, but 11 MB decoded
  // for tiles the size of a postage stamp.
  //
  // Cover-cropped square rather than scaled by width, because the tile is
  // square and draws them with contentFit="cover" — anything outside the
  // square would be decoded and then thrown away.
  const catSrc = path.join(SRC, 'categories');
  const catOut = path.join(OUT, 'categories');
  if (fs.existsSync(catSrc)) {
    fs.mkdirSync(catOut, { recursive: true });
    const files = fs.readdirSync(catSrc).filter((f) => /\.(jpe?g|png)$/i.test(f));

    for (const file of files) {
      const src = path.join(catSrc, file);
      const image = await Jimp.read(src);
      const w0 = image.getWidth();
      const h0 = image.getHeight();
      decodedBefore += (w0 * h0 * 4) / 1048576;
      beforeTotal += fs.statSync(src).size;

      image.cover(CATEGORY_WIDTH, CATEGORY_WIDTH);
      image.quality(QUALITY);

      const buffer = await image.getBufferAsync(Jimp.MIME_JPEG);
      fs.writeFileSync(path.join(catOut, file), buffer);

      const w1 = image.getWidth();
      const h1 = image.getHeight();
      decodedAfter += (w1 * h1 * 4) / 1048576;
      afterTotal += buffer.length;

      console.log(
        `${`categories/${file}`.padEnd(20)} ${`${w0}x${h0}`.padStart(11)} → ${`${w1}x${h1}`.padEnd(11)}` +
          ` ${mb(fs.statSync(src).size)} → ${mb(buffer.length)} MB` +
          `   decoded ${((w0 * h0 * 4) / 1048576).toFixed(1)} → ${((w1 * h1 * 4) / 1048576).toFixed(1)} MB`,
      );
    }
  }

  console.log(
    `\ntotal on disk  ${mb(beforeTotal)} → ${mb(afterTotal)} MB` +
      `\ntotal decoded  ${decodedBefore.toFixed(0)} → ${decodedAfter.toFixed(0)} MB`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
