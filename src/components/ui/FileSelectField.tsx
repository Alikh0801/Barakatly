"use client";

import { useRef, useState } from "react";

/**
 * A native <input type="file"> stretched to fill its container (the usual
 * `file:` Tailwind-variant pattern) is clickable anywhere across that full
 * width, including the blank space next to the visible button — clicking
 * "beside" the button still opens the file picker, which reads as a bug.
 * This keeps the input itself hidden and clickable only through its own
 * button, so the interactive area matches what's visually a button.
 */
export function FileSelectField({
  name,
  accept,
  required,
  caption,
  hint,
  buttonLabel = "Cihazdan seç",
}: {
  name: string;
  accept?: string;
  required?: boolean;
  caption?: string;
  hint?: string;
  buttonLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="space-y-1.5">
      {caption ? (
        <span className="block text-xs font-medium text-zinc-600">
          {caption}
        </span>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(event) => {
          setFileName(event.target.files?.[0]?.name ?? null);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          {buttonLabel}
        </button>
        <span className="truncate text-sm text-zinc-500">
          {fileName ?? "Fayl seçilməyib"}
        </span>
      </div>
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
    </div>
  );
}
