import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { Resvg } from "@resvg/resvg-js";

import { putObject } from "../src/lib/storage";

const prisma = new PrismaClient();

async function createDemoLogoPng(): Promise<Buffer> {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect width="160" height="160" rx="36" fill="#ffffff"/>
  <rect x="18" y="18" width="124" height="124" rx="28" fill="#0f766e"/>
  <text x="80" y="98" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="52" font-weight="700" fill="#ffffff">CK</text>
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 160 },
  });
  return Buffer.from(resvg.render().asPng());
}

async function main() {
  const logoPng = await createDemoLogoPng();
  const logoUrl = await putObject({
    key: "demo/logo.png",
    body: logoPng,
    contentType: "image/png",
  });
  console.log("Uploaded demo logo:", logoUrl);

  const background = {
    type: "gradient" as const,
    gradient: {
      from: "#0f172a",
      to: "#0f766e",
      angle: 135,
    },
  };

  const elements = [
    {
      id: "logo",
      type: "image" as const,
      x: 72,
      y: 72,
      width: 96,
      height: 96,
      opacity: 1,
      src: logoUrl,
      borderRadius: 22,
      objectFit: "cover" as const,
    },
    {
      id: "title",
      type: "text" as const,
      x: 72,
      y: 220,
      width: 1056,
      height: 220,
      opacity: 1,
      content: "{{title}}",
      fontFamily: "Inter" as const,
      fontSize: 72,
      fontWeight: 700 as const,
      color: "#f8fafc",
      textAlign: "left" as const,
      lineHeight: 1.15,
    },
    {
      id: "accent",
      type: "rect" as const,
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

  console.log("Seeded template id=demo");
  console.log("Try: /img/demo.png?title=Hello+World");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
