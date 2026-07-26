import { nanoid } from "nanoid";

import type { Element, ImageElement, RectElement, TextElement } from "@/lib/template";

export const GRID = 8;

export function snap(value: number, grid: number = GRID): number {
  return Math.round(value / grid) * grid;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function createTextElement(): TextElement {
  return {
    id: nanoid(10),
    type: "text",
    x: 80,
    y: 80,
    width: 600,
    height: 120,
    opacity: 1,
    content: "New text {{title}}",
    fontFamily: "Inter",
    fontSize: 48,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "left",
    lineHeight: 1.2,
  };
}

export function createRectElement(): RectElement {
  return {
    id: nanoid(10),
    type: "rect",
    x: 80,
    y: 80,
    width: 240,
    height: 160,
    opacity: 1,
    fill: "#ffffff",
    borderRadius: 16,
  };
}

export function createImageElement(src: string): ImageElement {
  return {
    id: nanoid(10),
    type: "image",
    x: 80,
    y: 80,
    width: 200,
    height: 200,
    opacity: 1,
    src,
    borderRadius: 16,
    objectFit: "cover",
  };
}

export function updateElement(
  elements: Element[],
  id: string,
  patch: Partial<Element>,
): Element[] {
  return elements.map((el) =>
    el.id === id ? ({ ...el, ...patch, type: el.type } as Element) : el,
  );
}

export function elementLabel(el: Element): string {
  switch (el.type) {
    case "text":
      return el.content.slice(0, 28) || "Text";
    case "image":
      return "Image";
    case "rect":
      return "Rectangle";
  }
}
