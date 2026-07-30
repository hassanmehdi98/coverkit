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
    <div className="w-full">
      <label className="block font-[family-name:var(--font-landing-sans)] text-sm text-[color:var(--landing-muted)]">
        Type a title to update the preview
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full rounded-md border border-white/15 bg-black/25 px-4 py-3 text-base text-white outline-none ring-[color:var(--landing-accent)] placeholder:text-white/35 focus:ring-2"
          placeholder="Page title"
          maxLength={200}
        />
      </label>

      <div className="mt-5 overflow-hidden rounded-sm shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={debounced}
          src={src}
          alt="Live Open Graph card preview"
          width={1200}
          height={630}
          className={`h-auto w-full transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-xs text-[color:var(--landing-muted)] underline decoration-white/25 underline-offset-2 transition hover:text-white hover:decoration-white/50"
        >
          {displayUrl}
        </a>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="shrink-0 rounded border border-white/15 px-2 py-1 font-[family-name:var(--font-landing-sans)] text-xs text-[color:var(--landing-muted)] transition hover:border-white/30 hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
