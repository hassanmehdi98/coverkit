import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canEditTemplate, ownershipFlags } from "@/lib/ownership";
import {
  backgroundSchema,
  elementSchema,
  templateFromDb,
} from "@/lib/template";
import { deleteTemplateUploads } from "@/lib/template-assets";

export const runtime = "nodejs";

const putBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  background: backgroundSchema.optional(),
  elements: z.array(elementSchema).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const flags = ownershipFlags(row, session?.user?.id);
  return NextResponse.json({
    template: templateFromDb(row),
    ...flags,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canEditTemplate(row, session?.user?.id)) {
    return NextResponse.json(
      { error: "This template is owned by someone else." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid template payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.template.update({
    where: { id },
    data: {
      ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
      ...(parsed.data.background != null
        ? { background: parsed.data.background as object }
        : {}),
      ...(parsed.data.elements != null
        ? { elements: parsed.data.elements as object }
        : {}),
    },
  });

  return NextResponse.json(templateFromDb(updated));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  // Rename convenience endpoint (same ownership rules as PUT)
  const { id } = await context.params;
  const session = await auth();

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canEditTemplate(row, session?.user?.id)) {
    return NextResponse.json(
      { error: "This template is owned by someone else." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = z
    .object({ name: z.string().min(1).max(120) })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const updated = await prisma.template.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(templateFromDb(updated));
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();

  const row = await prisma.template.findUnique({ where: { id } });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete: owner for claimed; anyone with the link for anonymous
  if (!canEditTemplate(row, session?.user?.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Claimed templates: only the owner may delete (not anonymous passers-by)
  if (row.userId != null && row.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = templateFromDb(row);
  await deleteTemplateUploads(template.background, template.elements);
  await prisma.template.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
