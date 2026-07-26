import { readFile } from "fs/promises";
import path from "path";

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const FONT_FILES: Array<{
  name: string;
  weight: 400 | 700;
  file: string;
}> = [
  { name: "Inter", weight: 400, file: "Inter-Regular.ttf" },
  { name: "Inter", weight: 700, file: "Inter-Bold.ttf" },
  { name: "Roboto", weight: 400, file: "Roboto-Regular.ttf" },
  { name: "Roboto", weight: 700, file: "Roboto-Bold.ttf" },
  { name: "Playfair Display", weight: 400, file: "PlayfairDisplay-Regular.ttf" },
  { name: "Playfair Display", weight: 700, file: "PlayfairDisplay-Bold.ttf" },
  { name: "JetBrains Mono", weight: 400, file: "JetBrainsMono-Regular.ttf" },
  { name: "JetBrains Mono", weight: 700, file: "JetBrainsMono-Bold.ttf" },
];

let cachedFonts: SatoriFont[] | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

export async function loadFonts(): Promise<SatoriFont[]> {
  if (cachedFonts) return cachedFonts;

  const fontsDir = path.join(process.cwd(), "assets", "fonts");
  cachedFonts = await Promise.all(
    FONT_FILES.map(async (font) => {
      const data = await readFile(path.join(fontsDir, font.file));
      return {
        name: font.name,
        data: toArrayBuffer(data),
        weight: font.weight,
        style: "normal" as const,
      };
    }),
  );

  return cachedFonts;
}

/** Map schema weights onto the two bundled faces (400 / 700). */
export function resolveFontWeight(
  weight: 400 | 500 | 600 | 700 | 800,
): 400 | 700 {
  return weight >= 600 ? 700 : 400;
}
