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
