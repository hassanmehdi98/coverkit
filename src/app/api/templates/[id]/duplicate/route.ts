import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveExistingUserId } from "@/lib/session-user";
import { templateFromDb } from "@/lib/template";
import {
  deriveTemplateName,
  uniqueTemplateName,
} from "@/lib/template-name";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Duplicate a template.
 * Logged out → anonymous copy. Signed in → owned copy.
 */
export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await resolveExistingUserId(session?.user?.id);

  const elements = Array.isArray(row.elements) ? row.elements : [];
  const existing = userId
    ? await prisma.template.findMany({
        where: { userId },
        select: { name: true },
      })
    : [{ name: row.name }];

  const baseName = deriveTemplateName(
    elements as Array<{ type: string; content?: string }>,
    row.name.replace(/\s+\d+$/, "").replace(/\s+\(copy\)$/i, "") || row.name,
  );
  const name = uniqueTemplateName(
    baseName,
    existing.map((t) => t.name),
  );

  const copy = await prisma.template.create({
    data: {
      id: nanoid(12),
      userId,
      name,
      background: row.background ?? {},
      elements: row.elements ?? [],
    },
  });

  return NextResponse.json(templateFromDb(copy), { status: 201 });
}
