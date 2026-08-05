"use client";

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
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-1.5">
      {canEdit ? (
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameBlur}
          className="min-w-[160px] flex-1 border-0 bg-transparent text-sm font-medium tracking-tight text-foreground outline-none placeholder:text-faint sm:max-w-xs"
          aria-label="Template name"
        />
      ) : (
        <span className="flex-1 truncate text-sm font-medium tracking-tight text-foreground">
          {name}
        </span>
      )}

      <span className="font-mono text-[11px] text-muted-foreground">
        {saveState === "saving"
          ? "saving…"
          : saveState === "saved"
            ? "saved"
            : saveState === "error"
              ? "save failed"
              : null}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {!canEdit ? (
          <button
            type="button"
            disabled={busy}
            onClick={onDuplicate}
            className="ck-btn ck-btn-primary !py-1.5"
          >
            Duplicate to edit
          </button>
        ) : null}

        {canEdit && isAnonymous ? (
          <button
            type="button"
            disabled={busy}
            onClick={onClaim}
            className="ck-btn ck-btn-secondary !py-1.5"
          >
            Save to my account
          </button>
        ) : null}

        <button
          type="button"
          onClick={onPreview}
          className="ck-btn ck-btn-secondary !py-1.5"
        >
          Preview PNG
        </button>
      </div>
    </div>
  );
}
