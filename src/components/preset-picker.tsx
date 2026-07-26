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
      <div className="grid gap-3 sm:grid-cols-2">
        {PRESET_META.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy != null}
            onClick={() => void create(p.id)}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-left hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
          >
            <p className="text-sm font-semibold text-zinc-900">
              {busy === p.id ? "Creating..." : p.label}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{p.description}</p>
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <p className="mt-3 text-xs text-zinc-400">{ctaLabel}. No signup required.</p>
    </div>
  );
}
