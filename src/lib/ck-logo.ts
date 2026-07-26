import path from "path";

import { Resvg } from "@resvg/resvg-js";

/** SVG for the CoverKit CK mark (requires Inter Bold via Resvg fontFiles). */
export function ckMarkSvg(size = 160): string {
  const inset = size * (18 / 160);
  const inner = size - inset * 2;
  const radiusOuter = size * (36 / 160);
  const radiusInner = size * (28 / 160);
  const fontSize = size * (64 / 160);
  // Baseline tuned so glyph mass centers in the teal panel (Inter Bold).
  const textX = size * (81.51 / 160);
  const textY = size * (102.71 / 160);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radiusOuter}" fill="#ffffff"/>
  <rect x="${inset}" y="${inset}" width="${inner}" height="${inner}" rx="${radiusInner}" fill="#0f766e"/>
  <text x="${textX}" y="${textY}" text-anchor="middle" font-family="Inter" font-size="${fontSize}" font-weight="700" fill="#ffffff">CK</text>
</svg>`;
}

/** Render the CoverKit CK mark to a PNG buffer using bundled Inter Bold. */
export function renderCkLogoPng(size = 160): Buffer {
  const fontPath = path.join(
    process.cwd(),
    "assets",
    "fonts",
    "Inter-Bold.ttf",
  );
  const resvg = new Resvg(ckMarkSvg(size), {
    fitTo: { mode: "width", value: size },
    font: {
      fontFiles: [fontPath],
      defaultFontFamily: "Inter",
      loadSystemFonts: false,
    },
  });
  return Buffer.from(resvg.render().asPng());
}
