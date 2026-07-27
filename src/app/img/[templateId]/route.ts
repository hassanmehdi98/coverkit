import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  getCachedPng,
  putCachedPng,
  renderCacheKey,
} from "@/lib/render-cache";
import { renderTemplateToPng } from "@/lib/render";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { templateFromDb } from "@/lib/template";
import {
  QueryParamTooLongError,
  assertQueryParamsWithinLimit,
  sanitizeVariableValue,
} from "@/lib/variables";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = 60;

function pngResponse(body: Buffer, cacheHit: boolean): NextResponse {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-CoverKit-Cache": cacheHit ? "HIT" : "MISS",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> },
) {
  let templateId = "unknown";
  const variables: Record<string, string> = {};

  try {
    const ip = clientIpFromRequest(request);
    const { allowed } = checkRateLimit(ip, RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 60 renders per minute." },
        { status: 429 },
      );
    }

    const { templateId: rawId } = await context.params;
    templateId = rawId.replace(/\.png$/i, "");

    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      variables[key] = value;
    });

    try {
      assertQueryParamsWithinLimit(variables);
    } catch (err) {
      if (err instanceof QueryParamTooLongError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    // Sanitize for substitution (also applied again inside substituteVariables)
    for (const key of Object.keys(variables)) {
      variables[key] = sanitizeVariableValue(variables[key]);
    }

    const row = await prisma.template.findUnique({ where: { id: templateId } });
    if (!row) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const cacheHash = renderCacheKey(row.id, row.updatedAt, variables);
    const cached = await getCachedPng(cacheHash);
    if (cached) {
      return pngResponse(cached, true);
    }

    const template = templateFromDb(row);
    const png = await renderTemplateToPng(template, variables);

    // Best-effort cache write — render still succeeds if MinIO/S3 is unhappy.
    try {
      await putCachedPng(cacheHash, png);
    } catch (cacheErr) {
      console.warn("Failed to write render cache:", cacheErr);
    }

    return pngResponse(png, false);
  } catch (err) {
    console.error("Render failed:", err);
    Sentry.captureException(err, {
      tags: { templateId },
      extra: { queryParams: variables },
    });
    return NextResponse.json(
      { error: "Failed to render template" },
      { status: 500 },
    );
  }
}
