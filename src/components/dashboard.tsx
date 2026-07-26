"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PresetPicker } from "@/components/preset-picker";
import type { Template } from "@/lib/template";

export function Dashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/templates");
    if (res.status === 401) {
      setError("Sign in to view your dashboard.");
      setTemplates([]);
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Failed to load templates");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Template[];
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Delete this template? Uploaded images will be removed.")) return;
    setBusyId(id);
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      setError("Failed to delete");
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function commitRename(id: string) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    setBusyId(id);
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("Failed to rename");
      return;
    }
    const updated = (await res.json()) as Template;
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Templates saved to your account</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPresets((v) => !v)}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          New template
        </button>
      </div>

      {showPresets ? (
        <div className="mt-6 rounded-lg border border-zinc-200 p-4">
          <PresetPicker />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-zinc-500">Loading...</p>
      ) : templates.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500">
          No templates yet. Create one, or open an edit link and save it to your account.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
            >
              <Link href={`/t/${t.id}/edit`} className="block bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/img/${t.id}.png?title=${encodeURIComponent(t.name)}`}
                  alt=""
                  width={300}
                  className="h-auto w-full"
                />
              </Link>
              <div className="space-y-2 p-3">
                {renamingId === t.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => void commitRename(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void commitRename(t.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    className="block w-full truncate text-left text-sm font-medium text-zinc-900"
                    onClick={() => {
                      setRenamingId(t.id);
                      setRenameValue(t.name);
                    }}
                    title="Click to rename"
                  >
                    {t.name}
                  </button>
                )}
                <p className="text-xs text-zinc-500">
                  {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/t/${t.id}/edit`}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => void remove(t.id)}
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
