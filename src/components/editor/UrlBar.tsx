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
    <div className="shrink-0 border-t border-border bg-surface-elevated px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="ck-label shrink-0">URL</span>
        <div
          ref={scrollRef}
          className="min-w-0 flex-1 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-surface-sunken px-2 py-1"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block whitespace-nowrap font-mono text-[11px] text-accent transition-colors hover:text-accent-hover"
            title={url}
          >
            {url}
          </a>
        </div>
        <button
          type="button"
          onClick={() => void copy("url", url)}
          className="ck-btn ck-btn-primary !px-2.5 !py-1 !text-[11px]"
        >
          {copied === "url" ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setShowMeta((v) => !v)}
          className="ck-btn ck-btn-secondary !px-2.5 !py-1 !text-[11px]"
          aria-expanded={showMeta}
        >
          {showMeta ? "Hide" : "Meta"}
        </button>
      </div>

      {showMeta ? (
        <div className="mt-2 flex gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-sunken px-2 py-1.5 font-mono text-[11px] text-muted">
            {meta}
          </code>
          <button
            type="button"
            onClick={() => void copy("meta", meta)}
            className="ck-btn ck-btn-secondary shrink-0 self-start !px-2.5 !py-1 !text-[11px]"
          >
            {copied === "meta" ? "Copied" : "Copy"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
