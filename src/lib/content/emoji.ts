/** Suggestions shown under the emoji field of a "Niyə Barakatly?" card. */
export const FEATURE_EMOJI_SUGGESTIONS = [
  "🌿", "🌱", "🌾", "🍃", "🥬", "🥕", "🍎", "🍅", "🥚", "🥛",
  "🍯", "🧺", "🛡️", "✅", "🏅", "⭐", "💯", "🚚", "🚜", "⏱️",
  "📦", "📍", "💳", "🤝", "❤️", "👨‍🌾", "🏡", "♻️", "☀️", "💧",
] as const;

/**
 * True when the value is exactly one emoji. A single emoji can be several
 * code points (skin tones, "👨‍🌾" joined with zero-width joiners), so this
 * counts what the reader sees as one character, not string length.
 */
export function isSingleEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 16) return false;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(trimmed)];
  return graphemes.length === 1 && /\p{Extended_Pictographic}/u.test(trimmed);
}
