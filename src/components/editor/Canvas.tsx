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
    if (!canEdit) return;

    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
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
  }, [canEdit, selectedId, template.elements, onChangeElements, onSelect]);

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

  const bg = backgroundStyle(template.background) as CSSProperties;

  return (
    <div
      ref={viewportRef}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-zinc-200/80"
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
          className="shadow-lg"
        >
          {template.elements.map((el) => {
            const style = renderElementStyle(el) as CSSProperties;
            const selected = selectedId === el.id;

            let body: ReactNode = null;
            if (el.type === "text") {
              body = substituteVariables(el.content, sampleValues);
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
                className={selected ? "outline outline-2 outline-sky-500" : undefined}
                onPointerDown={(e) => startMove(e, el)}
              >
                {body}
                {selected && canEdit ? (
                  <div
                    onPointerDown={(e) => startResize(e, el)}
                    className="absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-sm border-2 border-sky-500 bg-white"
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
