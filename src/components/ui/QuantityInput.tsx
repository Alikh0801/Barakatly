"use client";

import { useState, type KeyboardEvent } from "react";
import type { UnitType } from "@/types";
import {
  decimal,
  normalizeQuantity,
  parseQuantity,
  quantityStep,
} from "@/lib/shop/quantity";

const VARIANTS = {
  // Product page purchase panel.
  panel: {
    wrap: "inline-flex items-center rounded-xl bg-white ring-1 ring-zinc-200",
    button:
      "h-10 w-10 shrink-0 text-lg font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40",
    input: "h-10 text-base font-semibold",
    width: { narrow: "w-14", wide: "w-24" },
  },
  // Cart line.
  cart: {
    wrap: "inline-flex items-center rounded-full bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200",
    button:
      "shrink-0 px-3 py-1 text-sm font-medium text-zinc-900 hover:text-emerald-700 disabled:opacity-40",
    input: "h-7 text-sm font-semibold",
    width: { narrow: "w-12", wide: "w-[4.5rem]" },
  },
} as const;

/**
 * − [amount] + with a field the customer can type into. Weight moves in
 * 50 qr steps, volume in 0,5 l steps, other units in whole numbers (see
 * src/lib/shop/quantity.ts). The field holds the bare number in the
 * product's unit; typing "750" for weight still reads as grams.
 *
 * `onCommit` gets an amount on a step, between `min` and `max`: on +/−, on
 * Enter, on leaving the field, and — with `commitWhileTyping`, whole units
 * only — on every valid keystroke.
 */
export function QuantityInput({
  value,
  max,
  onCommit,
  unit = "piece",
  min,
  disabled = false,
  commitWhileTyping = false,
  variant = "panel",
  label = "Miqdar",
}: {
  value: number;
  max: number;
  onCommit: (quantity: number) => void;
  unit?: UnitType;
  min?: number;
  disabled?: boolean;
  commitWhileTyping?: boolean;
  variant?: keyof typeof VARIANTS;
  label?: string;
}) {
  // What is in the field while typing; null shows `value`.
  const [draft, setDraft] = useState<string | null>(null);
  const styles = VARIANTS[variant];
  const step = quantityStep(unit);
  const floor = min ?? step;
  const wholeUnits = step === 1;
  const limits = { min: floor, max: Math.max(max, floor) };

  function commit(quantity: number) {
    const next = normalizeQuantity(unit, quantity, limits);
    if (next > 0 && next !== value) onCommit(next);
  }

  function finishTyping() {
    if (draft === null) return;
    const parsed = parseQuantity(unit, draft);
    setDraft(null);
    // An emptied or unreadable field goes back to what it was.
    if (parsed !== null) commit(parsed);
  }

  function handleChange(text: string) {
    const cleaned = wholeUnits ? text.replace(/\D/g, "").slice(0, 6) : text.slice(0, 12);
    setDraft(cleaned);
    if (commitWhileTyping && wholeUnits && cleaned !== "") commit(Number(cleaned));
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
        onClick={() => commit(value - step)}
        disabled={disabled || value - step < floor - 1e-9}
        className={styles.button}
        aria-label="Azalt"
      >
        −
      </button>
      <input
        type="text"
        inputMode={wholeUnits ? "numeric" : "decimal"}
        // Just the number, in the product's unit ("2,5", "0,75"); the unit
        // is shown beside the price and on the quick picks.
        value={draft ?? decimal(value)}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={finishTyping}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={label}
        className={`${styles.input} ${wholeUnits ? styles.width.narrow : styles.width.wide} min-w-0 bg-transparent text-center text-zinc-900 tabular-nums outline-none focus:rounded-md focus:bg-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-60`}
      />
      <button
        type="button"
        onClick={() => commit(value + step)}
        disabled={disabled || value + step > limits.max + 1e-9}
        className={styles.button}
        aria-label="Artır"
      >
        +
      </button>
    </div>
  );
}
