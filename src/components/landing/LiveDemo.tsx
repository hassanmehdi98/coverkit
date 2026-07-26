"use client";

import { useEffect, useState } from "react";

export function LiveDemo() {
  const [title, setTitle] = useState("Launch week is live");
  const [debounced, setDebounced] = useState(title);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(title), 280);
    return () => clearTimeout(t);
  }, [title]);

  useEffect(() => {
    setFade(false);
    const t = requestAnimationFrame(() => setFade(true));
    return () => cancelAnimationFrame(t);
  }, [debounced]);

  const src = `/img/demo.png?title=${encodeURIComponent(debounced || " ")}&t=${encodeURIComponent(debounced)}`;

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
    </div>
  );
}
