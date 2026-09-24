const AZ_PREFIX = "+994";

/** Strip spaces/dashes and normalize to +994XXXXXXXXX when possible. */
export function normalizeAzPhone(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let digits = trimmed.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    digits = `+${digits.slice(1).replace(/\D/g, "")}`;
  } else {
    digits = digits.replace(/\D/g, "");
  }

  if (digits.startsWith("00994")) {
    digits = `+${digits.slice(2)}`;
  } else if (digits.startsWith("994")) {
    digits = `+${digits}`;
  } else if (digits.startsWith("0") && digits.length === 10) {
    digits = `${AZ_PREFIX}${digits.slice(1)}`;
  } else if (/^\d{9}$/.test(digits)) {
    digits = `${AZ_PREFIX}${digits}`;
  }

  return digits;
}

/** Valid AZ mobile/landline in E.164-ish form: +994 + 9 digits, no trunk 0. */
export function isValidAzPhone(raw: string): boolean {
  const normalized = normalizeAzPhone(raw);
  return /^\+994[1-9]\d{8}$/.test(normalized);
}

/** Digits after +994: always exactly this many. */
export const AZ_LOCAL_DIGITS = 9;

export const AZ_PHONE_FORMAT_ERROR =
  "Telefon nömrəsi 9 rəqəmdən ibarət olmalıdır (məs: 50 123 45 67).";

/**
 * Reduces whatever was typed or pasted into the local-part box to at most 9
 * digits. A pasted full number (+994…, 00994…) loses its country code and a
 * leading trunk 0 is dropped — but only a 12+ digit paste counts as having a
 * country code, since 99 is itself a valid operator prefix.
 */
export function sanitizeAzLocalInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00994")) digits = digits.slice(5);
  else if (digits.startsWith("994") && digits.length >= 12) digits = digits.slice(3);
  return digits.replace(/^0+/, "").slice(0, AZ_LOCAL_DIGITS);
}

/** Groups local digits as XX XXX XX XX, e.g. "501234567" → "50 123 45 67". */
export function formatAzLocal(digits: string): string {
  const groups = [2, 3, 2, 2];
  const parts: string[] = [];
  let index = 0;
  for (const size of groups) {
    if (index >= digits.length) break;
    parts.push(digits.slice(index, index + size));
    index += size;
  }
  return parts.join(" ");
}

export function azPhoneLocalPart(raw: string | null | undefined): string {
  const normalized = normalizeAzPhone(raw ?? "");
  if (normalized.startsWith(AZ_PREFIX)) {
    return normalized.slice(AZ_PREFIX.length);
  }
  return (raw ?? "").replace(/\D/g, "").replace(/^994/, "").replace(/^0/, "");
}

export { AZ_PREFIX };
