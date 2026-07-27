/**
 * Production-safe demo seed (no tsx). Run inside the app container:
 *   docker compose -f docker-compose.prod.yml --env-file .env.production exec app \
 *     node scripts/seed-demo.mjs
 */
import { createRequire } from "module";
import path from "path";

import { PrismaClient } from "@prisma/client";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const require = createRequire(import.meta.url);
const { Resvg } = require("@resvg/resvg-js");

const prisma = new PrismaClient();

function s3() {
  const region = process.env.S3_REGION ?? "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });
}

function publicUrl(key) {
  const base = process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

async function put(key, body, contentType) {
  await s3().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return publicUrl(key);
}

function createDemoLogoPng() {
  // Bundle Inter Bold — Docker slim has no system fonts.
  const fontPath = path.join(process.cwd(), "assets", "fonts", "Inter-Bold.ttf");
  const size = 160;
  const inset = 18;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="36" fill="#ffffff"/>
  <rect x="${inset}" y="${inset}" width="124" height="124" rx="28" fill="#0f766e"/>
  <text x="81.51" y="102.71" text-anchor="middle" font-family="Inter" font-size="64" font-weight="700" fill="#ffffff">CK</text>
</svg>`;
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: {
      fontFiles: [fontPath],
      defaultFontFamily: "Inter",
      loadSystemFonts: false,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

async function main() {
  const logoPng = createDemoLogoPng();
  const logoUrl = await put("demo/logo.png", logoPng, "image/png");
  console.log("Uploaded demo logo:", logoUrl);

  const background = {
    type: "gradient",
    gradient: { from: "#0f172a", to: "#0f766e", angle: 135 },
  };
  const elements = [
    {
      id: "logo",
      type: "image",
      x: 72,
      y: 72,
      width: 96,
      height: 96,
      opacity: 1,
      src: logoUrl,
      borderRadius: 22,
      objectFit: "cover",
    },
    {
      id: "title",
      type: "text",
      x: 72,
      y: 220,
      width: 1056,
      height: 220,
      opacity: 1,
      content: "{{title}}",
      fontFamily: "Inter",
      fontSize: 72,
      fontWeight: 700,
      color: "#f8fafc",
      textAlign: "left",
      lineHeight: 1.15,
    },
    {
      id: "accent",
      type: "rect",
      x: 72,
      y: 480,
      width: 120,
      height: 8,
      opacity: 1,
      fill: "#5eead4",
      borderRadius: 4,
    },
  ];

  await prisma.template.upsert({
    where: { id: "demo" },
    create: {
      id: "demo",
      userId: null,
      name: "Demo Card",
      background,
      elements,
    },
    update: {
      name: "Demo Card",
      background,
      elements,
      userId: null,
    },
  });

  console.log("Seeded demo → /img/demo.png?title=Hello+World");

  // Homepage OG card — keep in sync with src/lib/site-og-template.ts
  const siteBackground = {
    type: "gradient",
    gradient: { from: "#0f172a", to: "#0f766e", angle: 155 },
  };
  const siteElements = [
    {
      id: "logo",
      type: "image",
      x: 72,
      y: 56,
      width: 56,
      height: 56,
      opacity: 1,
      src: logoUrl,
      borderRadius: 14,
      objectFit: "cover",
    },
    {
      id: "wordmark",
      type: "text",
      x: 144,
      y: 64,
      width: 320,
      height: 44,
      opacity: 1,
      content: "CoverKit",
      fontFamily: "Playfair Display",
      fontSize: 32,
      fontWeight: 700,
      color: "#f8fafc",
      textAlign: "left",
      lineHeight: 1.2,
    },
    {
      id: "hero",
      type: "text",
      x: 72,
      y: 188,
      width: 1056,
      height: 160,
      opacity: 1,
      content: "Every page deserves\nits own social card",
      fontFamily: "Playfair Display",
      fontSize: 54,
      fontWeight: 700,
      color: "#f8fafc",
      textAlign: "left",
      lineHeight: 1.12,
    },
    {
      id: "support",
      type: "text",
      x: 72,
      y: 388,
      width: 1000,
      height: 72,
      opacity: 1,
      content:
        "Design one template. Every page gets a card, automatically.",
      fontFamily: "Inter",
      fontSize: 26,
      fontWeight: 400,
      color: "#cbd5e1",
      textAlign: "left",
      lineHeight: 1.35,
    },
    {
      id: "footer",
      type: "text",
      x: 72,
      y: 548,
      width: 700,
      height: 36,
      opacity: 1,
      content: "coverkit.dev · Free, no signup",
      fontFamily: "Inter",
      fontSize: 20,
      fontWeight: 500,
      color: "#5eead4",
      textAlign: "left",
      lineHeight: 1.2,
    },
  ];

  await prisma.template.upsert({
    where: { id: "site" },
    create: {
      id: "site",
      userId: null,
      name: "CoverKit site card",
      background: siteBackground,
      elements: siteElements,
    },
    update: {
      name: "CoverKit site card",
      background: siteBackground,
      elements: siteElements,
      userId: null,
    },
  });

  console.log("Seeded site → /img/site.png (homepage OG, no watermark)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
