import { createHash } from "crypto";

import { getObjectBuffer, putObject } from "@/lib/storage";

export function renderCacheKey(
  templateId: string,
  templateUpdatedAt: Date | string,
  params: Record<string, string>,
): string {
  const updatedAt =
    typeof templateUpdatedAt === "string"
      ? templateUpdatedAt
      : templateUpdatedAt.toISOString();

  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return createHash("sha256")
    .update(`${templateId}|${updatedAt}|${sorted}`)
    .digest("hex");
}

export function renderCacheObjectKey(hash: string): string {
  return `render-cache/${hash}.png`;
}

export async function getCachedPng(hash: string): Promise<Buffer | null> {
  try {
    return await getObjectBuffer(renderCacheObjectKey(hash));
  } catch {
    return null;
  }
}

export async function putCachedPng(hash: string, png: Buffer): Promise<void> {
  await putObject({
    key: renderCacheObjectKey(hash),
    body: png,
    contentType: "image/png",
  });
}
