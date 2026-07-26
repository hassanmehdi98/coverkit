import { deleteObject } from "@/lib/storage";
import type { Background, Element } from "@/lib/template";

/** Collect our-bucket object keys referenced by a template. */
export function collectTemplateObjectKeys(
  background: Background,
  elements: Element[],
): string[] {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) return [];

  const urls: string[] = [];
  if (background.type === "image" && background.imageUrl) {
    urls.push(background.imageUrl);
  }
  for (const el of elements) {
    if (el.type === "image" && el.src && !el.src.includes("{{")) {
      urls.push(el.src);
    }
  }

  const keys: string[] = [];
  for (const url of urls) {
    if (url.startsWith(`${base}/`)) {
      keys.push(url.slice(base.length + 1));
    }
  }
  return [...new Set(keys)];
}

export async function deleteTemplateUploads(
  background: Background,
  elements: Element[],
): Promise<void> {
  const keys = collectTemplateObjectKeys(background, elements);
  await Promise.all(
    keys.map(async (key) => {
      try {
        await deleteObject(key);
      } catch (err) {
        console.warn("Failed to delete S3 object", key, err);
      }
    }),
  );
}
