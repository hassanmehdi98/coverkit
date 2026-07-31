import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { resolveExistingUserId } from "@/lib/session-user";
import { templateFromDb } from "@/lib/template";

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

  const copy = await prisma.template.create({
    data: {
      id: nanoid(12),
      userId,
      name: `${row.name} (copy)`,
      background: row.background ?? {},
      elements: row.elements ?? [],
    },
  });

  return NextResponse.json(templateFromDb(copy), { status: 201 });
}
