import { Resvg } from "@resvg/resvg-js";
import type { ReactNode } from "react";
import satori from "satori";

import { loadFonts, resolveFontWeight } from "@/lib/fonts";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  backgroundStyle,
  renderElementStyle,
  type Element,
  type Template,
} from "@/lib/template";
import {
  fetchImageAsDataUrl,
  resolveImageSrc,
  substituteVariables,
} from "@/lib/variables";

type SatoriNode = {
  type: string;
  props: {
    style?: Record<string, string | number | undefined>;
    src?: string;
    children?: string | SatoriNode | Array<string | SatoriNode | null>;
  };
};

/**
 * Convert a Template + URL variables into a PNG buffer.
 *
 * Pipeline: schema → Satori-compatible tree → SVG → resvg PNG.
 * Keep conversion comments up to date — this is the extension point for new element types.
 */
export async function renderTemplateToPng(
  template: Template,
  variables: Record<string, string>,
): Promise<Buffer> {
  const fonts = await loadFonts();

  // Resolve background image to a data URL before Satori (avoids localhost SSRF block).
  const background = { ...template.background };
  if (background.type === "image" && background.imageUrl) {
    const url = background.imageUrl;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      background.imageUrl = await fetchImageAsDataUrl(url);
    }
  }

  const elementNodes = await Promise.all(
    template.elements.map((el) => elementToNode(el, variables)),
  );

  // Site marketing card dogfoods the renderer — never stamp "made with CoverKit" on it.
  const showWatermark = template.id !== "site";

  const tree: SatoriNode = {
    type: "div",
    props: {
      style: backgroundStyle(background),
      children: [
        ...elementNodes.filter(Boolean),
        ...(showWatermark ? [watermarkNode()] : []),
      ] as SatoriNode[],
    },
  };

  const svg = await satori(tree as unknown as ReactNode, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: CANVAS_WIDTH,
    },
  });

  return Buffer.from(resvg.render().asPng());
}

async function elementToNode(
  element: Element,
  variables: Record<string, string>,
): Promise<SatoriNode | null> {
  const style = renderElementStyle(element);

  // Map fontWeight onto bundled 400/700 faces so Satori can resolve the font file.
  if (element.type === "text") {
    const weight = resolveFontWeight(element.fontWeight);
    const content = substituteVariables(element.content, variables);
    return {
      type: "div",
      props: {
        style: { ...style, fontWeight: weight },
        children: content,
      },
    };
  }

  if (element.type === "rect") {
    return {
      type: "div",
      props: { style },
    };
  }

  // image
  const src = await resolveImageSrc(element.src, variables);
  if (!src) {
    return null;
  }

  return {
    type: "div",
    props: {
      style,
      children: {
        type: "img",
        props: {
          src,
          style: {
            width: "100%",
            height: "100%",
            objectFit: element.objectFit,
            borderRadius: element.borderRadius,
          },
        },
      },
    },
  };
}

/** Hardcoded MVP watermark — plan gating comes later. */
function watermarkNode(): SatoriNode {
  return {
    type: "div",
    props: {
      style: {
        position: "absolute",
        right: 24,
        bottom: 18,
        fontFamily: "Inter",
        fontSize: 18,
        fontWeight: 400,
        color: "rgba(255,255,255,0.55)",
        letterSpacing: 0.2,
      },
      children: "made with coverkit.dev",
    },
  };
}
