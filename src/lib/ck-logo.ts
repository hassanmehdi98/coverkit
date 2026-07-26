import { readFileSync } from "fs";
import path from "path";

import { Resvg } from "@resvg/resvg-js";

/** Render the CoverKit CK mark to a PNG buffer (path-based SVG, no system fonts). */
export function renderCkLogoPng(size = 160): Buffer {
  const svgPath = path.join(process.cwd(), "assets", "brand", "ck-mark.svg");
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  return Buffer.from(resvg.render().asPng());
}
