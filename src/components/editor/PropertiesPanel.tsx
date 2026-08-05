"use client";

import { FONT_FAMILIES, type Background, type Element } from "@/lib/template";

export function PropertiesPanel({
  selected,
  background,
  canEdit,
  templateId,
  onChangeElement,
  onChangeBackground,
}: {
  selected: Element | null;
  background: Background;
  canEdit: boolean;
  templateId: string;
  onChangeElement: (patch: Partial<Element>) => void;
  onChangeBackground: (bg: Background) => void;
}) {
  async function uploadImage(onUrl: (url: string) => void) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.set("file", file);
      form.set("templateId", templateId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        alert("Upload failed");
        return;
      }
      const data = (await res.json()) as { url: string };
      onUrl(data.url);
    };
    input.click();
  }

  if (!selected) {
    return (
      <aside className="w-60 shrink-0 overflow-y-auto border-l border-border bg-surface p-3">
        <p className="ck-label">Background</p>
        <label className="mt-3 block text-xs text-muted-foreground">Type</label>
        <select
          disabled={!canEdit}
          value={background.type}
          onChange={(e) => {
            const type = e.target.value as Background["type"];
            if (type === "color") {
              onChangeBackground({ type, color: background.color ?? "#0f172a" });
            } else if (type === "gradient") {
              onChangeBackground({
                type,
                gradient: background.gradient ?? {
                  from: "#0f172a",
                  to: "#134e4a",
                  angle: 135,
                },
              });
            } else {
              onChangeBackground({
                type,
                imageUrl: background.imageUrl ?? "",
              });
            }
          }}
          className="ck-input mt-1"
        >
          <option value="color">Color</option>
          <option value="gradient">Gradient</option>
          <option value="image">Image</option>
        </select>

        {background.type === "color" ? (
          <Field label="Color">
            <input
              type="color"
              disabled={!canEdit}
              value={background.color ?? "#000000"}
              onChange={(e) =>
                onChangeBackground({ type: "color", color: e.target.value })
              }
              className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent"
            />
          </Field>
        ) : null}

        {background.type === "gradient" ? (
          <>
            <Field label="From">
              <input
                type="color"
                disabled={!canEdit}
                value={background.gradient?.from ?? "#0f172a"}
                onChange={(e) =>
                  onChangeBackground({
                    type: "gradient",
                    gradient: {
                      from: e.target.value,
                      to: background.gradient?.to ?? "#134e4a",
                      angle: background.gradient?.angle ?? 135,
                    },
                  })
                }
                className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent"
              />
            </Field>
            <Field label="To">
              <input
                type="color"
                disabled={!canEdit}
                value={background.gradient?.to ?? "#134e4a"}
                onChange={(e) =>
                  onChangeBackground({
                    type: "gradient",
                    gradient: {
                      from: background.gradient?.from ?? "#0f172a",
                      to: e.target.value,
                      angle: background.gradient?.angle ?? 135,
                    },
                  })
                }
                className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent"
              />
            </Field>
            <Field label={`Angle (${background.gradient?.angle ?? 135}°)`}>
              <input
                type="range"
                min={0}
                max={360}
                disabled={!canEdit}
                value={background.gradient?.angle ?? 135}
                onChange={(e) =>
                  onChangeBackground({
                    type: "gradient",
                    gradient: {
                      from: background.gradient?.from ?? "#0f172a",
                      to: background.gradient?.to ?? "#134e4a",
                      angle: Number(e.target.value),
                    },
                  })
                }
                className="w-full accent-[var(--accent)]"
              />
            </Field>
          </>
        ) : null}

        {background.type === "image" ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                void uploadImage((url) =>
                  onChangeBackground({ type: "image", imageUrl: url }),
                )
              }
              className="ck-btn ck-btn-secondary w-full"
            >
              Upload image
            </button>
            {background.imageUrl ? (
              <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                {background.imageUrl}
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 overflow-y-auto border-l border-border bg-surface p-3">
      <p className="ck-label">
        <span className="font-mono">{selected.type}</span>
      </p>

      <Field label="Opacity">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          disabled={!canEdit}
          value={selected.opacity}
          onChange={(e) => onChangeElement({ opacity: Number(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </Field>

      {selected.type === "text" ? (
        <>
          <Field label="Content">
            <textarea
              disabled={!canEdit}
              value={selected.content}
              onChange={(e) => onChangeElement({ content: e.target.value })}
              rows={4}
              className="ck-input font-mono"
            />
          </Field>
          <Field label="Font">
            <select
              disabled={!canEdit}
              value={selected.fontFamily}
              onChange={(e) =>
                onChangeElement({
                  fontFamily: e.target.value as typeof selected.fontFamily,
                })
              }
              className="ck-input"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size">
            <input
              type="number"
              disabled={!canEdit}
              value={selected.fontSize}
              onChange={(e) =>
                onChangeElement({ fontSize: Number(e.target.value) || 12 })
              }
              className="ck-input font-mono"
            />
          </Field>
          <Field label="Weight">
            <select
              disabled={!canEdit}
              value={selected.fontWeight}
              onChange={(e) =>
                onChangeElement({
                  fontWeight: Number(e.target.value) as typeof selected.fontWeight,
                })
              }
              className="ck-input font-mono"
            >
              {[400, 500, 600, 700, 800].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Color">
            <input
              type="color"
              disabled={!canEdit}
              value={selected.color}
              onChange={(e) => onChangeElement({ color: e.target.value })}
              className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent"
            />
          </Field>
          <Field label="Align">
            <select
              disabled={!canEdit}
              value={selected.textAlign}
              onChange={(e) =>
                onChangeElement({
                  textAlign: e.target.value as typeof selected.textAlign,
                })
              }
              className="ck-input"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Field>
          <Field label="Line height">
            <input
              type="number"
              step={0.05}
              disabled={!canEdit}
              value={selected.lineHeight}
              onChange={(e) =>
                onChangeElement({ lineHeight: Number(e.target.value) || 1 })
              }
              className="ck-input font-mono"
            />
          </Field>
        </>
      ) : null}

      {selected.type === "rect" ? (
        <>
          <Field label="Fill">
            <input
              type="color"
              disabled={!canEdit}
              value={selected.fill}
              onChange={(e) => onChangeElement({ fill: e.target.value })}
              className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-border bg-transparent"
            />
          </Field>
          <Field label="Radius">
            <input
              type="range"
              min={0}
              max={200}
              disabled={!canEdit}
              value={selected.borderRadius}
              onChange={(e) =>
                onChangeElement({ borderRadius: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent)]"
            />
          </Field>
        </>
      ) : null}

      {selected.type === "image" ? (
        <>
          <div className="mt-3">
            <button
              type="button"
              disabled={!canEdit}
              onClick={() =>
                void uploadImage((url) => onChangeElement({ src: url }))
              }
              className="ck-btn ck-btn-secondary w-full"
            >
              Replace image
            </button>
          </div>
          <Field label="Image URL or {{variable}}">
            <input
              disabled={!canEdit}
              value={selected.src}
              onChange={(e) => onChangeElement({ src: e.target.value })}
              className="ck-input font-mono"
            />
          </Field>
          <Field label="Radius">
            <input
              type="range"
              min={0}
              max={200}
              disabled={!canEdit}
              value={selected.borderRadius}
              onChange={(e) =>
                onChangeElement({ borderRadius: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent)]"
            />
          </Field>
          <Field label="Fit">
            <select
              disabled={!canEdit}
              value={selected.objectFit}
              onChange={(e) =>
                onChangeElement({
                  objectFit: e.target.value as typeof selected.objectFit,
                })
              }
              className="ck-input"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>
        </>
      ) : null}
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <label className="block text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
