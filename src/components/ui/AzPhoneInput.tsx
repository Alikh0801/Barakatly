"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AZ_LOCAL_DIGITS,
  AZ_PHONE_FORMAT_ERROR,
  AZ_PREFIX,
  azPhoneLocalPart,
  formatAzLocal,
  sanitizeAzLocalInput,
} from "@/lib/phone/az";

/** Caret position in the formatted string right after the nth digit. */
function caretAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) seen++;
    if (seen === digitCount) return i + 1;
  }
  return formatted.length;
}

/**
 * Local part of an Azerbaijani number behind a fixed +994 prefix. Accepts
 * exactly 9 digits, shown as XX XXX XX XX with the spaces inserted as you
 * type. The form receives the normalized +994XXXXXXXXX through a hidden
 * input, so every server action keeps reading the same value it always has.
 */
export function AzPhoneInput({
  id = "phone",
  name = "phone",
  defaultValue = "",
  required = true,
  label = "Telefon",
  error,
  onValueChange,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  label?: string;
  /** An error decided by the parent form (e.g. on submit); wins over the blur check. */
  error?: string | null;
  /** Called with the normalized value (+994XXXXXXXXX, or "" when empty). */
  onValueChange?: (value: string) => void;
}) {
  const [digits, setDigits] = useState(() =>
    sanitizeAzLocalInput(azPhoneLocalPart(defaultValue)),
  );
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const formatted = formatAzLocal(digits);
  const combined = digits ? `${AZ_PREFIX}${digits}` : "";

  // Reformatting a controlled input moves the caret to the end; put it back
  // after the same digit it followed, so editing mid-number stays sane.
  useLayoutEffect(() => {
    if (pendingCaret.current === null || !inputRef.current) return;
    inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  function update(nextDigits: string, digitsBeforeCaret: number) {
    setDigits(nextDigits);
    pendingCaret.current = caretAfterDigits(
      formatAzLocal(nextDigits),
      Math.min(digitsBeforeCaret, nextDigits.length),
    );
    onValueChange?.(nextDigits ? `${AZ_PREFIX}${nextDigits}` : "");
  }

  // Backspace/Delete next to a space would otherwise delete only the space,
  // which formatting immediately puts back — the key would seem dead.
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    if (start !== input.selectionEnd) return;

    if (event.key === "Backspace" && input.value[start - 1] === " ") {
      input.setSelectionRange(start - 1, start - 1);
    } else if (event.key === "Delete" && input.value[start] === " ") {
      input.setSelectionRange(start + 1, start + 1);
    }
  }

  const incomplete = digits.length > 0 && digits.length < AZ_LOCAL_DIGITS;
  const shownError = error ?? (touched && incomplete ? AZ_PHONE_FORMAT_ERROR : null);
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
        {required ? " *" : ""}
      </label>
      <div
        className={[
          "mt-1 flex overflow-hidden rounded-xl border bg-white focus-within:ring-2",
          shownError
            ? "border-rose-300 focus-within:ring-rose-400"
            : "border-zinc-200 focus-within:ring-emerald-500",
        ].join(" ")}
      >
        <span className="inline-flex shrink-0 items-center border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-700">
          {AZ_PREFIX}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="tel"
          inputMode="numeric"
          required={required}
          value={formatted}
          // 9 digits + 3 spaces
          maxLength={AZ_LOCAL_DIGITS + 3}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? errorId : undefined}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            const input = event.target;
            const caret = input.selectionStart ?? input.value.length;
            const before = input.value.slice(0, caret).replace(/\D/g, "").length;
            update(sanitizeAzLocalInput(input.value), before);
          }}
          onPaste={(event) => {
            // Handled by hand: a pasted "+994 50 …" must lose its country
            // code, which the 12-character maxLength would truncate first.
            event.preventDefault();
            const input = event.currentTarget;
            const pasted = event.clipboardData.getData("text");
            const whole = sanitizeAzLocalInput(pasted);

            // A complete number replaces everything; a fragment is spliced
            // in at the caret like a normal paste.
            if (whole.length === AZ_LOCAL_DIGITS) {
              update(whole, whole.length);
              return;
            }
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? start;
            const head = input.value.slice(0, start).replace(/\D/g, "");
            const tail = input.value.slice(end).replace(/\D/g, "");
            const inserted = pasted.replace(/\D/g, "");
            const next = sanitizeAzLocalInput(head + inserted + tail);
            update(next, head.length + inserted.length);
          }}
          onBlur={() => setTouched(true)}
          placeholder="50 123 45 67"
          autoComplete="tel-national"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-base tracking-wide text-zinc-900 outline-none"
        />
        <input type="hidden" name={name} value={combined} />
      </div>
      {shownError ? (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}
