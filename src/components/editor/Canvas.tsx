"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { clamp, snap, updateElement } from "@/lib/editor-utils";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  backgroundStyle,
  renderElementStyle,
  type Element,
  type Template,
} from "@/lib/template";
import { substituteVariables } from "@/lib/variables";

type DragMode =
  | { kind: "move"; id: string; startX: number; startY: number; origX: number; origY: number }
  | {
      kind: "resize";
      id: string;
      startX: number;
      startY: number;
      origW: number;
      origH: number;
      origX: number;
      origY: number;
    };

function InlineTextEditor({
  content,
  onChange,
  onCommit,
  onCancel,
}: {
  content: string;
  onChange: (next: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const finished = useRef(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.textContent = content;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // Mount only — don't reset while the user is typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish(kind: "commit" | "cancel") {
    if (finished.current) return;
    finished.current = true;
    if (kind === "commit") onCommit();
    else onCancel();
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Edit text"
      onPointerDown={(e) => e.stopPropagation()}
      onInput={() => onChange(ref.current?.innerText ?? "")}
      onBlur={() => finish("commit")}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          finish("cancel");
        }
      }}
      style={{
        outline: "none",
        width: "100%",
        minHeight: "100%",
        cursor: "text",
      }}
    />
  );
}

export function Canvas({
  template,
  sampleValues,
  selectedId,
  canEdit,
  onSelect,
  onChangeElements,
}: {
  template: Template;
  sampleValues: Record<string, string>;
  selectedId: string | null;
  canEdit: boolean;
  onSelect: (id: string | null) => void;
  onChangeElements: (elements: Element[]) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const dragRef = useRef<DragMode | null>(null);
  const elementsRef = useRef(template.elements);
  elementsRef.current = template.elements;
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingSnapshotRef = useRef<string | null>(null);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pad = 32;
    const sx = (el.clientWidth - pad) / CANVAS_WIDTH;
    const sy = (el.clientHeight - pad) / CANVAS_HEIGHT;
    setScale(Math.min(sx, sy, 1));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (editingId && !template.elements.some((el) => el.id === editingId)) {
      setEditingId(null);
    }
  }, [editingId, template.elements]);

  useEffect(() => {
    if (!canEdit) return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (target.isContentEditable) return;
      if (editingId) return;
      if (!selectedId) return;

      const el = template.elements.find((x) => x.id === selectedId);
      if (!el) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onChangeElements(template.elements.filter((x) => x.id !== selectedId));
        onSelect(null);
        return;
      }

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      if (e.key === "ArrowRight") dx = step;
      if (e.key === "ArrowUp") dy = -step;
      if (e.key === "ArrowDown") dy = step;
      if (dx || dy) {
        e.preventDefault();
        onChangeElements(
          updateElement(template.elements, selectedId, {
            x: clamp(el.x + dx, 0, CANVAS_WIDTH - 8),
            y: clamp(el.y + dy, 0, CANVAS_HEIGHT - 8),
          }),
        );
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    canEdit,
    selectedId,
    editingId,
    template.elements,
    onChangeElements,
    onSelect,
  ]);

  function onPointerMove(e: PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !canEdit) return;

    const s = scaleRef.current || 1;
    const dx = (e.clientX - drag.startX) / s;
    const dy = (e.clientY - drag.startY) / s;
    const els = elementsRef.current;

    if (drag.kind === "move") {
      onChangeElements(
        updateElement(els, drag.id, {
          x: snap(clamp(drag.origX + dx, 0, CANVAS_WIDTH - 8)),
          y: snap(clamp(drag.origY + dy, 0, CANVAS_HEIGHT - 8)),
        }),
      );
    } else {
      onChangeElements(
        updateElement(els, drag.id, {
          width: snap(clamp(drag.origW + dx, 24, CANVAS_WIDTH)),
          height: snap(clamp(drag.origH + dy, 24, CANVAS_HEIGHT)),
        }),
      );
    }
  }

  function onPointerUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }

  function startMove(e: ReactPointerEvent, el: Element) {
    if (editingId === el.id) {
      e.stopPropagation();
      return;
    }
    if (!canEdit) return;
    e.stopPropagation();
    onSelect(el.id);
    dragRef.current = {
      kind: "move",
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function startResize(e: ReactPointerEvent, el: Element) {
    if (!canEdit) return;
    e.stopPropagation();
    onSelect(el.id);
    dragRef.current = {
      kind: "resize",
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origW: el.width,
      origH: el.height,
      origX: el.x,
      origY: el.y,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function beginTextEdit(el: Element) {
    if (!canEdit || el.type !== "text") return;
    dragRef.current = null;
    editingSnapshotRef.current = el.content;
    onSelect(el.id);
    setEditingId(el.id);
  }

  const bg = backgroundStyle(template.background) as CSSProperties;

  return (
    <div
      ref={viewportRef}
      className="app-grid-subtle relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-surface-sunken"
      onPointerDown={() => onSelect(null)}
    >
      <div
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            ...bg,
          }}
          className="shadow-[var(--shadow-md)] ring-1 ring-border"
        >
          {template.elements.map((el) => {
            const style = renderElementStyle(el) as CSSProperties;
            const selected = selectedId === el.id;
            const editing = editingId === el.id;

            let body: ReactNode = null;
            if (el.type === "text") {
              body = editing ? (
                <InlineTextEditor
                  content={editingSnapshotRef.current ?? el.content}
                  onChange={(next) => {
                    onChangeElements(
                      updateElement(elementsRef.current, el.id, {
                        content: next,
                      }),
                    );
                  }}
                  onCommit={() => {
                    editingSnapshotRef.current = null;
                    setEditingId(null);
                  }}
                  onCancel={() => {
                    const snapshot = editingSnapshotRef.current;
                    if (snapshot != null) {
                      onChangeElements(
                        updateElement(elementsRef.current, el.id, {
                          content: snapshot,
                        }),
                      );
                    }
                    editingSnapshotRef.current = null;
                    setEditingId(null);
                  }}
                />
              ) : (
                substituteVariables(el.content, sampleValues)
              );
            } else if (el.type === "image") {
              const src = substituteVariables(el.src, sampleValues);
              body = src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: el.objectFit,
                    borderRadius: el.borderRadius,
                  }}
                />
              ) : null;
            }

            return (
              <div
                key={el.id}
                style={style}
                className={selected ? "outline outline-2 outline-accent" : undefined}
                onPointerDown={(e) => startMove(e, el)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  beginTextEdit(el);
                }}
              >
                {body}
                {selected && canEdit && !editing ? (
                  <div
                    onPointerDown={(e) => startResize(e, el)}
                    className="absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-[var(--radius-sm)] border-2 border-accent bg-foreground"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
