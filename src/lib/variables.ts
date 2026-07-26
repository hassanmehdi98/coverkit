const VARIABLE_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
const MAX_VAR_LENGTH = 200;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 3000;

/** Strip HTML tags and cap length. Missing / empty → "". */
export function sanitizeVariableValue(value: string | undefined): string {
  if (value == null) return "";
  const stripped = value.replace(/<[^>]*>/g, "");
  return stripped.slice(0, MAX_VAR_LENGTH);
}

export function substituteVariables(
  input: string,
  variables: Record<string, string>,
): string {
  return input.replace(VARIABLE_RE, (_match, name: string) => {
    return sanitizeVariableValue(variables[name]);
  });
}

export function extractVariableNames(input: string): string[] {
  const names = new Set<string>();
  for (const match of input.matchAll(VARIABLE_RE)) {
    names.add(match[1]);
  }
  return [...names];
}

/** All {{variables}} across text content and image srcs. */
export function detectTemplateVariables(template: {
  elements: Array<{ type: string; content?: string; src?: string }>;
}): string[] {
  const names = new Set<string>();
  for (const el of template.elements) {
    if (el.type === "text" && el.content) {
      for (const n of extractVariableNames(el.content)) names.add(n);
    }
    if (el.type === "image" && el.src) {
      for (const n of extractVariableNames(el.src)) names.add(n);
    }
  }
  return [...names];
}

export function buildImageQueryString(
  sampleValues: Record<string, string>,
  variableNames: string[],
): string {
  const params = new URLSearchParams();
  for (const name of variableNames) {
    const value = sampleValues[name] ?? "";
    if (value) params.set(name, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function assertQueryParamsWithinLimit(
  params: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(params)) {
    if (value.length > MAX_VAR_LENGTH) {
      throw new QueryParamTooLongError(key, value.length);
    }
  }
}

export class QueryParamTooLongError extends Error {
  constructor(
    public readonly param: string,
    public readonly length: number,
  ) {
    super(
      `Query parameter "${param}" exceeds ${MAX_VAR_LENGTH} characters (${length})`,
    );
    this.name = "QueryParamTooLongError";
  }
}

/**
 * Resolve an image src that may contain {{variables}}.
 * Variable-backed URLs must be https; fetched with timeout + size cap.
 * Static https/http and data: URLs are returned as-is (or fetched to data URL for https vars).
 */
export async function resolveImageSrc(
  src: string,
  variables: Record<string, string>,
): Promise<string> {
  const containsVars = /\{\{[^{}]+\}\}/.test(src);
  const resolved = substituteVariables(src, variables).trim();
  if (!resolved) return "";

  if (resolved.startsWith("data:")) {
    return resolved;
  }

  // Variable-backed image srcs must be https (spec); always fetched with caps.
  if (containsVars) {
    if (!resolved.startsWith("https://")) {
      throw new Error("Image variable values must be https URLs");
    }
    return fetchImageAsDataUrl(resolved);
  }

  // Prefetch http(s) → data URL so Satori never hits localhost (SSRF block)
  // or remote hosts at SVG time. Allows http for local MinIO in dev.
  if (resolved.startsWith("https://") || resolved.startsWith("http://")) {
    return fetchImageAsDataUrl(resolved);
  }

  return resolved;
}

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch image (${response.status}): ${url}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`);
    }

    const contentType =
      response.headers.get("content-type")?.split(";")[0] ?? "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } finally {
    clearTimeout(timer);
  }
}
