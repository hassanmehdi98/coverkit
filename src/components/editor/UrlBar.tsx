"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import { buildImageUrl } from "@/lib/variables";

export function UrlBar({
  appUrl,
  templateId,
  sampleValues,
  variableNames,
}: {
  appUrl: string;
  templateId: string;
  sampleValues: Record<string, string>;
  variableNames: string[];
}) {
  const [copied, setCopied] = useState<"url" | "meta" | null>(null);
  const [showMeta, setShowMeta] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const url = useMemo(
    () => buildImageUrl(appUrl, templateId, sampleValues, variableNames),
    [appUrl, templateId, sampleValues, variableNames],
  );

  // Query params update at the end of the URL — keep that end in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [url]);

  const meta = `<meta property="og:image" content="${url}" />`;

  async function copy(kind: "url" | "meta", text: string) {
    await navigator.clipboard.writeText(text);
    track("get_url_copied", { kind, templateId });
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-white px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Image URL
        </span>
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block whitespace-nowrap font-mono text-xs text-blue-700 underline-offset-2 hover:underline"
            title={url}
          >
            {url}
          </a>
        </div>
        <button
          type="button"
          onClick={() => void copy("url", url)}
          className="shrink-0 rounded bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800"
        >
          {copied === "url" ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setShowMeta((v) => !v)}
          className="shrink-0 rounded border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          aria-expanded={showMeta}
        >
          {showMeta ? "Hide meta" : "Meta tag"}
        </button>
      </div>

      {showMeta ? (
        <div className="mt-2 flex gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded border border-zinc-200 bg-zinc-50 px-2 py-1.5 font-mono text-xs text-zinc-800">
            {meta}
          </code>
          <button
            type="button"
            onClick={() => void copy("meta", meta)}
            className="shrink-0 self-start rounded border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
          >
            {copied === "meta" ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
