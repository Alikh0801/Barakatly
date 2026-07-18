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

/** Valid AZ mobile/landline in E.164-ish form: +994 + 9 digits. */
export function isValidAzPhone(raw: string): boolean {
  const normalized = normalizeAzPhone(raw);
  return /^\+994\d{9}$/.test(normalized);
}

export function azPhoneLocalPart(raw: string | null | undefined): string {
  const normalized = normalizeAzPhone(raw ?? "");
  if (normalized.startsWith(AZ_PREFIX)) {
    return normalized.slice(AZ_PREFIX.length);
  }
  return (raw ?? "").replace(/\D/g, "").replace(/^994/, "").replace(/^0/, "");
}

export { AZ_PREFIX };
