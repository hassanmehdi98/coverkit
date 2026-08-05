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
    <div className="app-grid flex-1">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ck-section-label">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Templates
            </h1>
            <p className="mt-1 text-sm text-muted">
              Saved to your account · click a name to rename
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPresets((v) => !v)}
            className="ck-btn ck-btn-accent"
          >
            {showPresets ? "Close" : "New template"}
          </button>
        </div>

        {showPresets ? (
          <div className="ck-product-frame mt-6 p-4 md:p-5">
            <PresetPicker />
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-danger">{error}</p>
        ) : null}

        {loading ? (
          <p className="mt-12 font-mono text-sm text-muted-foreground">loading…</p>
        ) : templates.length === 0 ? (
          <div className="ck-panel mt-12 rounded-[var(--radius-lg)] px-6 py-14 text-center">
            <p className="text-sm font-medium text-foreground">No templates yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Create one here, or open an edit link and save it to your account.
            </p>
            <button
              type="button"
              onClick={() => setShowPresets(true)}
              className="ck-btn ck-btn-secondary mt-6"
            >
              New template
            </button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <li key={t.id} className="ck-card group">
                <Link href={`/t/${t.id}/edit`} className="block bg-surface-sunken">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/img/${t.id}.png?title=${encodeURIComponent(t.name)}`}
                    alt=""
                    width={300}
                    className="h-auto w-full"
                  />
                </Link>
                <div className="space-y-2.5 p-3">
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
                      className="ck-input"
                    />
                  ) : (
                    <button
                      type="button"
                      className="block w-full truncate text-left text-sm font-medium tracking-tight text-foreground transition-colors hover:text-accent"
                      onClick={() => {
                        setRenamingId(t.id);
                        setRenameValue(t.name);
                      }}
                      title="Click to rename"
                    >
                      {t.name}
                    </button>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/t/${t.id}/edit`}
                        className="ck-btn ck-btn-secondary !px-2 !py-1 !text-[11px]"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === t.id}
                        onClick={() => void remove(t.id)}
                        className="ck-btn ck-btn-danger !px-2 !py-1 !text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
