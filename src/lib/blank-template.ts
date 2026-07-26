import { createTemplateContent } from "@/lib/presets";

/** @deprecated Prefer createTemplateContent from presets — kept for compatibility. */
export function createBlankTemplateContent() {
  return createTemplateContent("blank");
}
