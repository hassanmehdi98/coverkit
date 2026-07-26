import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createTemplateContent, type PresetId } from "@/lib/presets";
import { templateFromDb } from "@/lib/template";

export const runtime = "nodejs";

const postBodySchema = z.object({
  preset: z.enum(["blank", "blog", "saas", "podcast"]).optional(),
});

/** POST /api/templates — create from blank or a starter preset. */
export async function POST(request: NextRequest) {
  const session = await auth();

  let preset: PresetId = "blank";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const body = postBodySchema.parse(await request.json());
      preset = body.preset ?? "blank";
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
  }

  const content = createTemplateContent(preset);
  const id = nanoid(12);

  const row = await prisma.template.create({
    data: {
      id,
      userId: session?.user?.id ?? null,
      name: content.name,
      background: content.background as object,
      elements: content.elements as object,
    },
  });

  return NextResponse.json(templateFromDb(row), { status: 201 });
}

/** GET /api/templates — list templates for the signed-in user. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.template.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(templateFromDb));
}
