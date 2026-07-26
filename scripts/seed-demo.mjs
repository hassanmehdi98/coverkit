/**
 * Production-safe demo seed (no tsx). Run inside the app container:
 *   docker compose -f docker-compose.prod.yml --env-file .env.production exec app \
 *     node scripts/seed-demo.mjs
 */
import { createRequire } from "module";
import { PrismaClient } from "@prisma/client";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

async function main() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="36" fill="#ffffff"/>
  <rect x="18" y="18" width="124" height="124" rx="28" fill="#0f766e"/>
  <text x="80" y="98" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="52" font-weight="700" fill="#ffffff">CK</text>
</svg>`;
  const png = Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 160 } }).render().asPng());
  const logoUrl = await put("demo/logo.png", png, "image/png");

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
