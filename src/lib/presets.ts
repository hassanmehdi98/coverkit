import { nanoid } from "nanoid";

import type { Background, Element } from "@/lib/template";

export type PresetId = "blank" | "blog" | "saas" | "podcast";

export type TemplateContent = {
  name: string;
  background: Background;
  elements: Element[];
};

export const PRESET_META: Array<{
  id: PresetId;
  label: string;
  description: string;
}> = [
  { id: "blank", label: "Blank", description: "Title on a simple background" },
  {
    id: "blog",
    label: "Blog post",
    description: "Headline and author",
  },
  {
    id: "saas",
    label: "Product / SaaS",
    description: "Product name and tagline",
  },
  {
    id: "podcast",
    label: "Podcast episode",
    description: "Show name and episode title",
  },
];

function text(
  partial: Omit<Extract<Element, { type: "text" }>, "id" | "type" | "opacity"> & {
    opacity?: number;
  },
): Element {
  return {
    id: nanoid(10),
    type: "text",
    opacity: partial.opacity ?? 1,
    ...partial,
  };
}

function rect(
  partial: Omit<Extract<Element, { type: "rect" }>, "id" | "type" | "opacity"> & {
    opacity?: number;
  },
): Element {
  return {
    id: nanoid(10),
    type: "rect",
    opacity: partial.opacity ?? 1,
    ...partial,
  };
}

export function createTemplateContent(preset: PresetId = "blank"): TemplateContent {
  switch (preset) {
    case "blog":
      return {
        name: "Blog post",
        background: {
          type: "gradient",
          gradient: { from: "#1c1917", to: "#292524", angle: 160 },
        },
        elements: [
          rect({
            x: 72,
            y: 72,
            width: 72,
            height: 8,
            fill: "#f59e0b",
            borderRadius: 4,
          }),
          text({
            x: 72,
            y: 120,
            width: 1056,
            height: 280,
            content: "{{title}}",
            fontFamily: "Playfair Display",
            fontSize: 68,
            fontWeight: 700,
            color: "#fafaf9",
            textAlign: "left",
            lineHeight: 1.15,
          }),
          text({
            x: 72,
            y: 480,
            width: 700,
            height: 48,
            content: "by {{author}}",
            fontFamily: "Inter",
            fontSize: 28,
            fontWeight: 500,
            color: "#a8a29e",
            textAlign: "left",
            lineHeight: 1.2,
          }),
        ],
      };

    case "saas":
      return {
        name: "Product / SaaS",
        background: {
          type: "gradient",
          gradient: { from: "#020617", to: "#0e7490", angle: 135 },
        },
        elements: [
          text({
            x: 72,
            y: 100,
            width: 500,
            height: 40,
            content: "{{product}}",
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            fontWeight: 500,
            color: "#67e8f9",
            textAlign: "left",
            lineHeight: 1.2,
          }),
          text({
            x: 72,
            y: 180,
            width: 900,
            height: 240,
            content: "{{title}}",
            fontFamily: "Inter",
            fontSize: 64,
            fontWeight: 700,
            color: "#f8fafc",
            textAlign: "left",
            lineHeight: 1.12,
          }),
          text({
            x: 72,
            y: 460,
            width: 800,
            height: 60,
            content: "{{tagline}}",
            fontFamily: "Inter",
            fontSize: 28,
            fontWeight: 400,
            color: "#94a3b8",
            textAlign: "left",
            lineHeight: 1.3,
          }),
        ],
      };

    case "podcast":
      return {
        name: "Podcast episode",
        background: {
          type: "gradient",
          gradient: { from: "#18181b", to: "#3f1d1d", angle: 120 },
        },
        elements: [
          rect({
            x: 72,
            y: 72,
            width: 120,
            height: 120,
            fill: "#e11d48",
            borderRadius: 28,
          }),
          text({
            x: 220,
            y: 90,
            width: 800,
            height: 40,
            content: "{{show}}",
            fontFamily: "Inter",
            fontSize: 22,
            fontWeight: 600,
            color: "#fda4af",
            textAlign: "left",
            lineHeight: 1.2,
          }),
          text({
            x: 220,
            y: 130,
            width: 800,
            height: 48,
            content: "Episode {{episode}}",
            fontFamily: "Inter",
            fontSize: 20,
            fontWeight: 400,
            color: "#a1a1aa",
            textAlign: "left",
            lineHeight: 1.2,
          }),
          text({
            x: 72,
            y: 260,
            width: 1056,
            height: 240,
            content: "{{title}}",
            fontFamily: "Roboto",
            fontSize: 56,
            fontWeight: 700,
            color: "#fafafa",
            textAlign: "left",
            lineHeight: 1.15,
          }),
        ],
      };

    case "blank":
    default:
      return {
        name: "Untitled card",
        background: {
          type: "gradient",
          gradient: { from: "#0f172a", to: "#134e4a", angle: 135 },
        },
        elements: [
          text({
            x: 72,
            y: 220,
            width: 1056,
            height: 200,
            content: "{{title}}",
            fontFamily: "Inter",
            fontSize: 64,
            fontWeight: 700,
            color: "#f8fafc",
            textAlign: "left",
            lineHeight: 1.15,
          }),
        ],
      };
  }
}
