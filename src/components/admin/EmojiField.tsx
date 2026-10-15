"use client";

import { useId, useState } from "react";
import { FEATURE_EMOJI_SUGGESTIONS, isSingleEmoji } from "@/lib/content/emoji";

/**
 * Emoji for a content card: type or paste any emoji, or pick one of the
 * suggestions. The preview shows it on the same dark green as the site.
 */
export function EmojiField({ name, defaultValue }: { name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const inputId = useId();
  const valid = isSingleEmoji(value);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-xs font-medium text-zinc-600">
        İkon (emoji)
      </label>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-xl ring-1 ring-white/10"
        >
          {valid ? value.trim() : "?"}
        </span>
        <input
          id={inputId}
          name={name}
          required
          maxLength={16}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={!valid}
          className="w-24 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-xl text-zinc-900"
        />
        {!valid ? (
          <span className="text-xs text-rose-600">Bir emoji yazın və ya aşağıdan seçin.</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Təklif olunan emojilər">
        {FEATURE_EMOJI_SUGGESTIONS.map((emoji) => {
          const selected = value.trim() === emoji;
          return (
            <button
              key={emoji}
              type="button"
              data-static-hover
              onClick={() => setValue(emoji)}
              aria-label={`${emoji} seç`}
              aria-pressed={selected}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors ${
                selected ? "bg-emerald-100 ring-2 ring-emerald-500" : "hover:bg-zinc-100"
              }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
