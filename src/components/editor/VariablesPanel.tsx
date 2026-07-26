"use client";

export function VariablesPanel({
  names,
  values,
  onChange,
}: {
  names: string[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  if (names.length === 0) {
    return (
      <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        No variables yet. Type {"{{title}}"} in a text field.
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        Sample values (preview)
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        {names.map((name) => (
          <label key={name} className="flex min-w-[160px] flex-1 flex-col gap-1">
            <span className="font-mono text-xs text-zinc-600">{`{{${name}}}`}</span>
            <input
              value={values[name] ?? ""}
              onChange={(e) => onChange(name, e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
              placeholder={name}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
