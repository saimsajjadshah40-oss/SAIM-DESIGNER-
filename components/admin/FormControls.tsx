"use client";

import { cn } from "@/lib/utils";

export const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-ink px-3.5 text-[0.95rem] text-white placeholder:text-slate-500 outline-none transition hover:border-slate-600 focus:border-electric focus:ring-4 focus:ring-electric/15 aria-[invalid=true]:border-red-500/70";

export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-200">
        {label} {required && <span className="text-glow">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-ink p-4">
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-white">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition",
          checked ? "border-electric bg-brand" : "border-line bg-ink-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5.5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function Card({
  title,
  description,
  children,
  className,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-ink", className)}>
      <header className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Edit a list of short strings as one-per-line text. */
export function ListInput({
  id,
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value.join("\n")}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      onBlur={(e) =>
        onChange(
          e.target.value
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
      className={cn(inputClass, "py-2.5")}
    />
  );
}
