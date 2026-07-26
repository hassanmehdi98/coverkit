import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().trim().email().max(254),
  referrer: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const referrer =
    parsed.data.referrer?.slice(0, 2000) ||
    request.headers.get("referer")?.slice(0, 2000) ||
    null;

  try {
    await prisma.waitlistEntry.create({
      data: { email, referrer },
    });
  } catch (err: unknown) {
    // Unique constraint → already on the list
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ ok: true, already: true });
    }
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
