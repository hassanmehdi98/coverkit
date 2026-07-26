import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  properties: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().max(80).optional(),
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
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  await prisma.analyticsEvent.create({
    data: {
      name: parsed.data.name,
      properties: (parsed.data.properties ?? {}) as object,
      sessionId: parsed.data.sessionId ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
