"use client";

import { elementLabel } from "@/lib/editor-utils";
import type { Element } from "@/lib/template";

export function ElementList({
  elements,
  selectedId,
  canEdit,
  onSelect,
  onAddText,
  onAddRect,
  onAddImage,
}: {
  elements: Element[];
  selectedId: string | null;
  canEdit: boolean;
  onSelect: (id: string | null) => void;
  onAddText: () => void;
  onAddRect: () => void;
  onAddImage: () => void;
}) {
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-2.5">
        <p className="ck-label px-1">Add</p>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(
            [
              ["Text", onAddText],
              ["Image", onAddImage],
              ["Rect", onAddRect],
            ] as const
          ).map(([label, onClick]) => (
            <button
              key={label}
              type="button"
              disabled={!canEdit}
              onClick={onClick}
              className="ck-btn ck-btn-secondary !px-1 !py-1.5 !text-[11px]"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="ck-label px-1.5">Layers</p>
        <ul className="mt-1.5 space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`relative w-full truncate rounded-[var(--radius-md)] px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                selectedId == null
                  ? "bg-surface-hover text-foreground"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {selectedId == null ? (
                <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent" />
              ) : null}
              Background
            </button>
          </li>
          {[...elements].reverse().map((el) => (
            <li key={el.id}>
              <button
                type="button"
                onClick={() => onSelect(el.id)}
                className={`relative w-full truncate rounded-[var(--radius-md)] px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                  selectedId === el.id
                    ? "bg-surface-hover text-foreground"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {selectedId === el.id ? (
                  <span className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-accent" />
                ) : null}
                <span className="font-mono text-[10px] uppercase text-faint">
                  {el.type}
                </span>{" "}
                {elementLabel(el)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
