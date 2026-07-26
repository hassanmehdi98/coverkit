/**
 * Production-safe demo seed (no tsx). Run inside the app container:
 *   docker compose -f docker-compose.prod.yml --env-file .env.production exec app \
 *     node scripts/seed-demo.mjs
 */
import { readFileSync } from "fs";
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
  // Path-based SVG — no system fonts required (Docker slim has none).
  const svgPath = path.join(process.cwd(), "assets", "brand", "ck-mark.svg");
  const svg = readFileSync(svgPath, "utf8");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 160 } });
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
