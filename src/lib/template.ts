import { z } from "zod";

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 630;

export const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Playfair Display",
  "JetBrains Mono",
] as const;

export type FontFamily = (typeof FONT_FAMILIES)[number];

const baseElementSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  opacity: z.number().min(0).max(1),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontFamily: z.enum(FONT_FAMILIES),
  fontSize: z.number().positive(),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
    z.literal(800),
  ]),
  color: z.string(),
  textAlign: z.enum(["left", "center", "right"]),
  lineHeight: z.number().positive(),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  borderRadius: z.number().min(0),
  objectFit: z.enum(["cover", "contain"]),
});

export const rectElementSchema = baseElementSchema.extend({
  type: z.literal("rect"),
  fill: z.string(),
  borderRadius: z.number().min(0),
});

export const elementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  imageElementSchema,
  rectElementSchema,
]);

export const backgroundSchema = z.object({
  type: z.enum(["color", "gradient", "image"]),
  color: z.string().optional(),
  gradient: z
    .object({
      from: z.string(),
      to: z.string(),
      angle: z.number(),
    })
    .optional(),
  imageUrl: z.string().optional(),
});

export const templateSchema = z.object({
  id: z.string().min(1),
  userId: z.string().nullable(),
  name: z.string(),
  createdAt: z.string(),
  background: backgroundSchema,
  elements: z.array(elementSchema),
});

export type TextElement = z.infer<typeof textElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type RectElement = z.infer<typeof rectElementSchema>;
export type Element = z.infer<typeof elementSchema>;
export type Background = z.infer<typeof backgroundSchema>;
export type Template = z.infer<typeof templateSchema>;

export type TemplateRecord = {
  id: string;
  userId: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  background: unknown;
  elements: unknown;
};

/** Map a Prisma Template row into the shared Template shape. */
export function templateFromDb(row: TemplateRecord): Template {
  return templateSchema.parse({
    id: row.id,
    userId: row.userId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    background: row.background,
    elements: row.elements,
  });
}

type StyleObject = Record<string, string | number>;

/**
 * Single source of truth for element CSS.
 * Only Satori-supported properties — used by the server renderer and (later) the editor.
 */
export function renderElementStyle(element: Element): StyleObject {
  const base: StyleObject = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    opacity: element.opacity,
  };

  switch (element.type) {
    case "text":
      return {
        ...base,
        display: "flex",
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        color: element.color,
        textAlign: element.textAlign,
        lineHeight: element.lineHeight,
        justifyContent:
          element.textAlign === "center"
            ? "center"
            : element.textAlign === "right"
              ? "flex-end"
              : "flex-start",
        alignItems: "flex-start",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      };
    case "image":
      return {
        ...base,
        borderRadius: element.borderRadius,
        overflow: "hidden",
        display: "flex",
      };
    case "rect":
      return {
        ...base,
        backgroundColor: element.fill,
        borderRadius: element.borderRadius,
      };
  }
}

export function backgroundStyle(background: Background): StyleObject {
  const base: StyleObject = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    display: "flex",
    position: "relative",
    overflow: "hidden",
  };

  switch (background.type) {
    case "color":
      return {
        ...base,
        backgroundColor: background.color ?? "#000000",
      };
    case "gradient": {
      const g = background.gradient ?? {
        from: "#111827",
        to: "#4f46e5",
        angle: 135,
      };
      return {
        ...base,
        backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
      };
    }
    case "image":
      return {
        ...base,
        backgroundColor: "#000000",
        ...(background.imageUrl
          ? {
              backgroundImage: `url("${background.imageUrl}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
      };
  }
}
