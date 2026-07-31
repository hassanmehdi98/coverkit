"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Canvas } from "@/components/editor/Canvas";
import { ElementList } from "@/components/editor/ElementList";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { Toolbar } from "@/components/editor/Toolbar";
import { UrlBar } from "@/components/editor/UrlBar";
import { VariablesPanel } from "@/components/editor/VariablesPanel";
import {
  createImageElement,
  createRectElement,
  createTextElement,
  updateElement,
} from "@/lib/editor-utils";
import { track } from "@/lib/analytics";
import type { Background, Element, Template } from "@/lib/template";
import {
  buildImageQueryString,
  detectTemplateVariables,
} from "@/lib/variables";

type EditorPayload = {
  template: Template;
  canEdit: boolean;
  isOwner: boolean;
  isAnonymous: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function Editor({
  templateId,
  initialClaim,
  appUrl,
}: {
  templateId: string;
  initialClaim: boolean;
  appUrl: string;
}) {
  const router = useRouter();
  const { status } = useSession();

  const [meta, setMeta] = useState<Omit<EditorPayload, "template"> | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({
    title: "Page title",
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Serialized name/background/elements from the last successful save (or load). */
  const lastSavedRef = useRef<string | null>(null);
  const persistInFlight = useRef(false);

  function snapshotOf(t: Template) {
    return JSON.stringify({
      name: t.name,
      background: t.background,
      elements: t.elements,
    });
  }

  const load = useCallback(async () => {
    const res = await fetch(`/api/templates/${templateId}`);
    if (!res.ok) {
      setLoadError(res.status === 404 ? "Template not found" : "Failed to load");
      return;
    }
    const json = (await res.json()) as EditorPayload;
    lastSavedRef.current = snapshotOf(json.template);
    setTemplate(json.template);
    setMeta({
      canEdit: json.canEdit,
      isOwner: json.isOwner,
      isAnonymous: json.isAnonymous,
    });
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    track("editor_opened", { templateId });
  }, [templateId]);

  // Claim after Google redirect
  useEffect(() => {
    if (!initialClaim || status !== "authenticated" || !meta?.isAnonymous) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      const res = await fetch(`/api/templates/${templateId}/claim`, {
        method: "POST",
      });
      if (cancelled) return;
      setBusy(false);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to claim");
        return;
      }
      track("template_claimed", { templateId, source: "oauth_return" });
      router.replace(`/t/${templateId}/edit`);
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [initialClaim, status, meta?.isAnonymous, templateId, router, load]);

  const variableNames = useMemo(
    () => (template ? detectTemplateVariables(template) : []),
    [template],
  );

  // Keep sampleValues keys in sync with detected variables
  useEffect(() => {
    setSampleValues((prev) => {
      const next = { ...prev };
      for (const name of variableNames) {
        if (next[name] == null) {
          next[name] =
            name === "title"
              ? "Page title"
              : name === "author"
                ? "Alex Writer"
                : name === "product"
                  ? "Acme"
                  : name === "tagline"
                    ? "A short product tagline"
                    : name === "show"
                      ? "The Deep Dive"
                      : name === "episode"
                        ? "42"
                        : name;
        }
      }
      return next;
    });
  }, [variableNames]);

  const persist = useCallback(
    async (draft: Template) => {
      if (!meta?.canEdit || persistInFlight.current) return;
      const snap = snapshotOf(draft);
      if (snap === lastSavedRef.current) return;

      persistInFlight.current = true;
      setSaveState("saving");
      setError(null);
      try {
        const res = await fetch(`/api/templates/${templateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            background: draft.background,
            elements: draft.elements,
          }),
        });
        if (res.status === 403) {
          setSaveState("error");
          setError(
            "This template belongs to someone else. Duplicate it if you want to edit.",
          );
          await load();
          return;
        }
        if (!res.ok) {
          setSaveState("error");
          setError("Failed to save");
          return;
        }
        const updated = (await res.json()) as Template;
        // Mark the draft we sent as saved (not the server echo), so key-order /
        // normalization differences don't look like new edits.
        lastSavedRef.current = snap;
        // Keep local draft; only refresh ownership flags from the server.
        setMeta((m) =>
          m
            ? {
                ...m,
                isAnonymous: updated.userId == null,
                isOwner: updated.userId != null,
              }
            : m,
        );
        setSaveState("saved");
        setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      } finally {
        persistInFlight.current = false;
      }
    },
    [meta?.canEdit, templateId, load],
  );

  // Debounced autosave — only when the draft differs from last save
  useEffect(() => {
    if (!template || !meta?.canEdit) return;
    if (snapshotOf(template) === lastSavedRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(template);
    }, 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [template, meta?.canEdit, persist]);

  function patchTemplate(patch: Partial<Template>) {
    setTemplate((t) => (t ? { ...t, ...patch } : t));
  }

  function setElements(elements: Element[]) {
    patchTemplate({ elements });
  }

  function setBackground(background: Background) {
    patchTemplate({ background });
  }

  async function uploadAndAddImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !template) return;
      const form = new FormData();
      form.set("file", file);
      form.set("templateId", templateId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        setError("Image upload failed");
        return;
      }
      const data = (await res.json()) as { url: string };
      const el = createImageElement(data.url);
      setElements([...template.elements, el]);
      setSelectedId(el.id);
    };
    input.click();
  }

  async function claim() {
    if (status !== "authenticated") {
      track("sign_in", { source: "claim" });
      await signIn("google", {
        callbackUrl: `/t/${templateId}/edit?claim=1`,
      });
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/templates/${templateId}/claim`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Failed to claim");
      return;
    }
    track("template_claimed", { templateId, source: "editor" });
    await load();
  }

  async function duplicate() {
    setBusy(true);
    const res = await fetch(`/api/templates/${templateId}/duplicate`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to duplicate");
      return;
    }
    const copy = (await res.json()) as Template;
    router.push(`/t/${copy.id}/edit`);
  }

  function previewPng() {
    const qs = buildImageQueryString(sampleValues, variableNames);
    track("png_previewed", { templateId });
    window.open(`/img/${templateId}.png${qs}`, "_blank");
  }

  if (loadError) {
    return (
      <div className="p-8 text-sm text-red-600">{loadError}</div>
    );
  }

  if (!template || !meta) {
    return (
      <div className="p-8 text-sm text-zinc-500">Loading editor...</div>
    );
  }

  const selected =
    template.elements.find((el) => el.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <Toolbar
        name={template.name}
        onNameChange={(name) => patchTemplate({ name })}
        onNameBlur={() => {
          if (template) void persist(template);
        }}
        canEdit={meta.canEdit}
        isAnonymous={meta.isAnonymous}
        saveState={saveState}
        onPreview={previewPng}
        onClaim={() => void claim()}
        onDuplicate={() => void duplicate()}
        busy={busy}
      />

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!meta.canEdit ? (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Read-only. This template is owned by someone else. Duplicate to edit.
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <ElementList
          elements={template.elements}
          selectedId={selectedId}
          canEdit={meta.canEdit}
          onSelect={setSelectedId}
          onAddText={() => {
            const el = createTextElement();
            setElements([...template.elements, el]);
            setSelectedId(el.id);
          }}
          onAddRect={() => {
            const el = createRectElement();
            setElements([...template.elements, el]);
            setSelectedId(el.id);
          }}
          onAddImage={() => void uploadAndAddImage()}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Canvas
            template={template}
            sampleValues={sampleValues}
            selectedId={selectedId}
            canEdit={meta.canEdit}
            onSelect={setSelectedId}
            onChangeElements={setElements}
          />
          <VariablesPanel
            names={variableNames}
            values={sampleValues}
            onChange={(name, value) =>
              setSampleValues((prev) => ({ ...prev, [name]: value }))
            }
          />
        </div>

        <PropertiesPanel
          selected={selected}
          background={template.background}
          canEdit={meta.canEdit}
          templateId={templateId}
          onChangeElement={(patch) => {
            if (!selectedId) return;
            setTemplate((t) =>
              t
                ? {
                    ...t,
                    elements: updateElement(t.elements, selectedId, patch),
                  }
                : t,
            );
          }}
          onChangeBackground={setBackground}
        />
      </div>

      <UrlBar
        appUrl={appUrl}
        templateId={templateId}
        sampleValues={sampleValues}
        variableNames={variableNames}
      />
    </div>
  );
}
