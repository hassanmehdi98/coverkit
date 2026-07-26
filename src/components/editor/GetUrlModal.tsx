"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import type { Template } from "@/lib/template";
import { detectTemplateVariables } from "@/lib/variables";

export function GetUrlModal({
  template,
  sampleValues,
  onClose,
}: {
  template: Template;
  sampleValues: Record<string, string>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<"url" | "meta" | null>(null);
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://example.com";

  const vars = useMemo(
    () => detectTemplateVariables(template),
    [template],
  );

  const url = useMemo(() => {
    const params = new URLSearchParams();
    for (const name of vars) {
      params.set(
        name,
        sampleValues[name] || `{{YOUR_${name.toUpperCase()}}}`,
      );
    }
    const query = params.toString();
    return `${origin}/img/${template.id}.png${query ? `?${query}` : ""}`;
  }, [origin, template.id, sampleValues, vars]);

  const meta = `<meta property="og:image" content="${url}" />`;

  async function copy(kind: "url" | "meta", text: string) {
    await navigator.clipboard.writeText(text);
    track("get_url_copied", { kind, templateId: template.id });
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="get-url-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="get-url-title" className="text-lg font-semibold text-zinc-900">
            Get URL
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Close
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          Image URL for this template. Change query params per page.
        </p>

        <label className="mt-4 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Image URL
        </label>
        <div className="mt-1 flex gap-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs text-zinc-800"
          />
          <button
            type="button"
            onClick={() => void copy("url", url)}
            className="shrink-0 rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
          >
            {copied === "url" ? "Copied" : "Copy"}
          </button>
        </div>

        <label className="mt-4 block text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Meta tag
        </label>
        <div className="mt-1 flex gap-2">
          <textarea
            readOnly
            value={meta}
            rows={3}
            className="min-w-0 flex-1 resize-none rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs text-zinc-800"
          />
          <button
            type="button"
            onClick={() => void copy("meta", meta)}
            className="shrink-0 self-start rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            {copied === "meta" ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
