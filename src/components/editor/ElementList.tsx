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
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 p-3">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Add
        </p>
        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            disabled={!canEdit}
            onClick={onAddText}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
          >
            Text
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={onAddImage}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
          >
            Image
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={onAddRect}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-left text-sm text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
          >
            Rectangle
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Layers
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`w-full truncate rounded px-2 py-1.5 text-left text-sm ${
                selectedId == null
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Background
            </button>
          </li>
          {[...elements].reverse().map((el) => (
            <li key={el.id}>
              <button
                type="button"
                onClick={() => onSelect(el.id)}
                className={`w-full truncate rounded px-2 py-1.5 text-left text-sm ${
                  selectedId === el.id
                    ? "bg-sky-600 text-white"
                    : "text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                <span className="text-[10px] opacity-70 uppercase">
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
