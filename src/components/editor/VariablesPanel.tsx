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
      <div className="border-t border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
        No variables yet. Type{" "}
        <span className="font-mono text-accent">{"{{title}}"}</span> in a text
        field.
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-surface px-3 py-2">
      <p className="ck-label">Sample params</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((name) => (
          <label
            key={name}
            className="flex min-w-[140px] flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-sunken px-2 py-1"
          >
            <span className="shrink-0 font-mono text-[11px] text-accent">
              {name}
            </span>
            <input
              value={values[name] ?? ""}
              onChange={(e) => onChange(name, e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-faint"
              placeholder="value"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
