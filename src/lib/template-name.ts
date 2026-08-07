const VARIABLE_RE = /\{\{\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\}\}/g;
const MAX_NAME_LENGTH = 80;
const MIN_STRIPPED_LENGTH = 2;

type TextLike = { type: string; content?: string };

/** Remove {{variables}} and collapse whitespace. */
export function stripTemplateText(content: string): string {
  return content
    .replace(VARIABLE_RE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateName(name: string): string {
  if (name.length <= MAX_NAME_LENGTH) return name;
  return `${name.slice(0, MAX_NAME_LENGTH - 1).trimEnd()}…`;
}

/**
 * Prefer literal text around {{title}}; if no title field exists, use the
 * first useful stripped text element; otherwise `fallback` (preset label).
 */
export function deriveTemplateName(
  elements: TextLike[],
  fallback: string,
): string {
  const texts = elements.filter(
    (el): el is TextLike & { content: string } =>
      el.type === "text" && typeof el.content === "string",
  );

  const titleEl = texts.find((el) => /\{\{\s*title\s*\}\}/i.test(el.content));
  if (titleEl) {
    const fromTitle = stripTemplateText(titleEl.content);
    if (fromTitle.length >= MIN_STRIPPED_LENGTH) {
      return truncateName(fromTitle);
    }
    return truncateName(fallback.trim() || "Untitled card");
  }

  for (const el of texts) {
    const stripped = stripTemplateText(el.content);
    if (stripped.length >= MIN_STRIPPED_LENGTH) {
      return truncateName(stripped);
    }
  }

  return truncateName(fallback.trim() || "Untitled card");
}

/** Return `base`, or `base 2`, `base 3`, … until unused among `existing`. */
export function uniqueTemplateName(
  base: string,
  existing: Iterable<string>,
): string {
  const taken = new Set(existing);
  const root = base.trim() || "Untitled card";
  if (!taken.has(root)) return root;

  for (let n = 2; n < 10_000; n++) {
    const candidate = `${root} ${n}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${root} ${Date.now()}`;
}
