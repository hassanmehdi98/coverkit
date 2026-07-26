import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { templateFromDb } from "@/lib/template";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Claim an anonymous template for the signed-in user. */
export async function POST(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await context.params;
  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (row.userId != null) {
    if (row.userId === session.user.id) {
      return NextResponse.json(templateFromDb(row));
    }
    return NextResponse.json(
      { error: "Template already claimed by another user" },
      { status: 409 },
    );
  }

  const updated = await prisma.template.update({
    where: { id },
    data: { userId: session.user.id },
  });

  return NextResponse.json(templateFromDb(updated));
}
