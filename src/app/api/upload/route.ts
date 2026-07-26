import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

import { putObject } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data with a file field" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const templateId = String(form.get("templateId") ?? "anon");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only jpg, png, and webp are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 5MB limit" },
      { status: 400 },
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeTemplate =
      templateId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "anon";
    const key = `uploads/${safeTemplate}/${nanoid(12)}.${EXT[file.type]}`;

    const url = await putObject({
      key,
      body: bytes,
      contentType: file.type,
    });

    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("Upload failed:", err);
    return NextResponse.json(
      { error: "Failed to store upload. Check S3/MinIO credentials." },
      { status: 500 },
    );
  }
}
