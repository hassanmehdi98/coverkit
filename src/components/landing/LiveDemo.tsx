"use client";

import { useEffect, useState } from "react";

export function LiveDemo() {
  const [title, setTitle] = useState("Launch week is live");
  const [debounced, setDebounced] = useState(title);
  const [fade, setFade] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(title), 280);
    return () => clearTimeout(t);
  }, [title]);

  useEffect(() => {
    setFade(false);
    const t = requestAnimationFrame(() => setFade(true));
    return () => cancelAnimationFrame(t);
  }, [debounced]);

  const encodedTitle = encodeURIComponent(title);
  const path = `/img/demo.png?title=${encodedTitle}`;
  const displayUrl = `coverkit.dev${path}`;
  const src = `/img/demo.png?title=${encodeURIComponent(debounced || " ")}&t=${encodeURIComponent(debounced)}`;

  async function copyUrl() {
    await navigator.clipboard.writeText(`https://${displayUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="ck-product-frame w-full">
      <div className="ck-product-chrome">
        <div className="ck-product-dots" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] border border-border bg-surface-sunken px-2.5 py-1 font-mono text-[11px] text-muted">
          {displayUrl}
        </div>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="ck-btn ck-btn-secondary shrink-0 !px-2 !py-1 !text-[11px]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <label className="block">
          <span className="ck-label">title param</span>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="hidden font-mono text-xs text-faint sm:inline">
              ?title=
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ck-input font-mono text-sm"
              placeholder="Page title"
              maxLength={200}
            />
          </div>
        </label>

        <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={debounced}
            src={src}
            alt="Live Open Graph card preview"
            width={1200}
            height={630}
            className={`h-auto w-full transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
          />
        </div>

        <pre className="overflow-x-auto rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2.5 font-mono text-[11px] leading-relaxed text-muted">
          <span className="text-faint">{"<"}</span>
          <span className="text-accent">meta</span>
          <span className="text-muted"> property=</span>
          <span className="text-foreground">{`"og:image"`}</span>
          <span className="text-muted"> content=</span>
          <span className="text-accent">{`"${displayUrl}"`}</span>
          <span className="text-faint">{" />"}</span>
        </pre>
      </div>
    </div>
  );
}
