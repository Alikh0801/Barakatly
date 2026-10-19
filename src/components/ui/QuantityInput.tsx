"use client";

import { useState, type KeyboardEvent } from "react";

const VARIANTS = {
  // Product page purchase panel.
  panel: {
    wrap: "inline-flex items-center rounded-xl bg-white ring-1 ring-zinc-200",
    button:
      "h-10 w-10 shrink-0 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40",
    input: "h-10 w-14 text-base font-semibold",
  },
  // Cart line.
  cart: {
    wrap: "inline-flex items-center rounded-full bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200",
    button:
      "shrink-0 px-3 py-1 text-sm font-medium text-zinc-900 hover:text-emerald-700 disabled:opacity-40",
    input: "h-7 w-12 text-sm font-semibold",
  },
} as const;

/**
 * − [number] + with a field the customer can type into, for large amounts.
 * `onCommit` gets a whole number between 1 and `max`: on +/−, on Enter, on
 * leaving the field, and — with `commitWhileTyping` — on every valid keystroke.
 */
export function QuantityInput({
  value,
  max,
  onCommit,
  disabled = false,
  commitWhileTyping = false,
  variant = "panel",
  label = "Miqdar",
}: {
  value: number;
  max: number;
  onCommit: (quantity: number) => void;
  disabled?: boolean;
  commitWhileTyping?: boolean;
  variant?: keyof typeof VARIANTS;
  label?: string;
}) {
  // What is in the field while typing; null shows `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const styles = VARIANTS[variant];
  const limit = Math.max(1, Math.floor(max));

  function clamp(quantity: number) {
    return Math.min(limit, Math.max(1, Math.floor(quantity)));
  }

  function commit(quantity: number) {
    const next = clamp(quantity);
    if (next !== value) onCommit(next);
  }

  function finishTyping() {
    if (draft === null) return;
    const parsed = Number(draft);
    setDraft(null);
    // An emptied field goes back to what it was.
    if (draft !== "" && Number.isFinite(parsed)) commit(parsed);
  }

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 6);
    setDraft(digits);
    if (commitWhileTyping && digits !== "") commit(Number(digits));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraft(null);
      event.currentTarget.blur();
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        onClick={() => commit(value - 1)}
        disabled={disabled || value <= 1}
        className={styles.button}
        aria-label="Azalt"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft ?? String(value)}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={finishTyping}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={label}
        className={`${styles.input} min-w-0 bg-transparent text-center text-zinc-900 tabular-nums outline-none focus:rounded-md focus:bg-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-60`}
      />
      <button
        type="button"
        onClick={() => commit(value + 1)}
        disabled={disabled || value >= limit}
        className={styles.button}
        aria-label="Artır"
      >
        +
      </button>
    </div>
  );
}
