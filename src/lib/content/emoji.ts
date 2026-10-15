/** Suggestions shown under the emoji field of a "Niyə Barakatly?" card, by theme. */
export const FEATURE_EMOJI_GROUPS: { id: string; label: string; emojis: string[] }[] = [
  {
    id: "farm",
    label: "Təsərrüfat",
    emojis: ["🌿", "🌱", "🌾", "🍃", "🌳", "🌻", "🌸", "🍀", "🚜", "👨‍🌾", "👩‍🌾", "🐄", "🐑", "🐐", "🐓", "🐝", "🏡", "☀️", "💧", "🌦️"],
  },
  {
    id: "food",
    label: "Məhsullar",
    emojis: ["🥬", "🥕", "🍅", "🥒", "🌽", "🥔", "🧅", "🧄", "🌶️", "🍆", "🍎", "🍐", "🍑", "🍒", "🍇", "🍉", "🍋", "🍓", "🥚", "🥛", "🧀", "🍯", "🍞", "🥜", "🫒", "🍵"],
  },
  {
    id: "quality",
    label: "Keyfiyyət",
    emojis: ["🛡️", "✅", "✔️", "🏅", "🥇", "🏆", "⭐", "🌟", "💯", "👍", "🔍", "🧪", "📜", "♻️", "🌍", "💚"],
  },
  {
    id: "delivery",
    label: "Çatdırılma",
    emojis: ["🚚", "🛵", "🚲", "📦", "🧺", "🛒", "⏱️", "⏰", "📅", "📍", "🗺️", "🏠", "💳", "💵", "📱", "📞"],
  },
  {
    id: "community",
    label: "İcma",
    emojis: ["🤝", "❤️", "🫶", "👨‍👩‍👧", "👥", "😊", "🙌", "💬", "🎁", "🎉", "🏘️", "🇦🇿"],
  },
];

export const FEATURE_EMOJI_SUGGESTIONS = FEATURE_EMOJI_GROUPS.flatMap((group) => group.emojis);

/**
 * True when the value is exactly one emoji. A single emoji can be several
 * code points (skin tones, flags, "👨‍🌾" joined with zero-width joiners), so this
 * counts what the reader sees as one character, not string length.
 */
export function isSingleEmoji(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 16) return false;
  const graphemes = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(trimmed)];
  // Flags such as 🇦🇿 are a pair of regional-indicator letters, not pictographs.
  return (
    graphemes.length === 1 &&
    (/\p{Extended_Pictographic}/u.test(trimmed) || /^\p{Regional_Indicator}{2}$/u.test(trimmed))
  );
}
