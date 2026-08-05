"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { track } from "@/lib/analytics";
import { PRESET_META, type PresetId } from "@/lib/presets";

export function PresetPicker({
  ctaLabel = "Create",
}: {
  ctaLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<PresetId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(preset: PresetId) {
    setBusy(preset);
    setError(null);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Could not create template");
      return;
    }
    const created = (await res.json()) as { id: string };
    track("template_created", { preset });
    router.push(`/t/${created.id}/edit`);
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PRESET_META.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy != null}
            onClick={() => void create(p.id)}
            className="group rounded-[var(--radius-lg)] border border-border bg-surface-elevated p-4 text-left shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong hover:bg-surface-hover disabled:opacity-50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {busy === p.id ? "Creating…" : p.label}
              </p>
              <span className="font-mono text-[10px] text-faint transition-colors group-hover:text-accent">
                {p.id}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {p.description}
            </p>
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
        {ctaLabel} · no signup required
      </p>
    </div>
  );
}
