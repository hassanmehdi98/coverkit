"use client";

import Link from "next/link";

type SaveState = "idle" | "saving" | "saved" | "error";

export function Toolbar({
  name,
  onNameChange,
  onNameBlur,
  canEdit,
  isAnonymous,
  saveState,
  onPreview,
  onClaim,
  onDuplicate,
  busy,
}: {
  name: string;
  onNameChange: (v: string) => void;
  onNameBlur: () => void;
  canEdit: boolean;
  isAnonymous: boolean;
  saveState: SaveState;
  onPreview: () => void;
  onClaim: () => void;
  onDuplicate: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-3 py-2">
      <Link href="/" className="text-sm font-semibold text-zinc-900">
        CoverKit
      </Link>

      <div className="mx-2 h-5 w-px bg-zinc-200" />

      {canEdit ? (
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameBlur}
          className="min-w-[160px] flex-1 border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none sm:max-w-xs"
          aria-label="Template name"
        />
      ) : (
        <span className="flex-1 truncate text-sm font-medium text-zinc-900">
          {name}
        </span>
      )}

      <span className="text-xs text-zinc-400">
        {saveState === "saving"
          ? "Saving..."
          : saveState === "saved"
            ? "Saved"
            : saveState === "error"
              ? "Save failed"
              : null}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {!canEdit ? (
          <button
            type="button"
            disabled={busy}
            onClick={onDuplicate}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Duplicate to edit
          </button>
        ) : null}

        {canEdit && isAnonymous ? (
          <button
            type="button"
            disabled={busy}
            onClick={onClaim}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            Save to my account
          </button>
        ) : null}

        <button
          type="button"
          onClick={onPreview}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          Preview PNG
        </button>
      </div>
    </div>
  );
}
