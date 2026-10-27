const AZ: Record<string, string> = {
  "İ": "i", "I": "i", "ı": "i", "Ə": "e", "ə": "e", "Ö": "o", "ö": "o",
  "Ü": "u", "ü": "u", "Ş": "s", "ş": "s", "Ç": "c", "ç": "c", "Ğ": "g", "ğ": "g",
};

/**
 * Search form of a text: Azerbaijani letters become their plain Latin
 * counterparts, then lower case, so "badimcan tutmasi" finds "Badımcan
 * tutması". The same rule as the database's az_normalize(), which fills
 * products.search_text.
 *
 * Letters are replaced before lower-casing: "İ".toLowerCase() is "i̇" (i plus
 * a combining dot) and would no longer match "inek".
 */
export function azNormalize(value: string): string {
  return value.replace(/[İIıƏəÖöÜüŞşÇçĞğ]/g, (ch) => AZ[ch]).toLowerCase().trim();
}

const AZ_ALPHABET = "abcçdeəfgğhxıijkqlmnoöprsştuüvyz";

function azRank(ch: string): number {
  const lower = ch === "İ" ? "i" : ch === "I" ? "ı" : ch.toLowerCase();
  const index = AZ_ALPHABET.indexOf(lower);
  return index >= 0 ? index : AZ_ALPHABET.length + (lower.codePointAt(0) ?? 0);
}

/**
 * Azerbaijani alphabetical order (… h, x, ı, i …, k, q, l …) without Intl:
 * the browser's ICU data may lack the "az" collation that Node has, and a
 * list sorted differently on the two sides fails hydration.
 */
export function compareAz(a: string, b: string): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const diff = azRank(a[i]) - azRank(b[i]);
    if (diff !== 0) return diff;
  }
  return a.length - b.length;
}
