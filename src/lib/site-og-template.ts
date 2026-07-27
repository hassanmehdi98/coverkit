import type { Background, Element } from "@/lib/template";

/** CoverKit's own homepage OG card — dogfooded via /img/site.png (no watermark). */
export function createSiteOgTemplate(logoUrl: string): {
  name: string;
  background: Background;
  elements: Element[];
} {
  return {
    name: "CoverKit site card",
    background: {
      type: "gradient",
      gradient: { from: "#0f172a", to: "#0f766e", angle: 155 },
    },
    elements: [
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
        // Controlled break — avoids a lonely "social card" orphan at feed size.
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
    ],
  };
}
