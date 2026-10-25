/**
 * Rules for the site logo the admin uploads. Shared by the admin panel,
 * which checks a file before uploading it, and the action, which checks the
 * stored file again since the browser can be bypassed.
 */

export const SITE_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const SITE_LOGO_MIN_SIDE = 512;
export const SITE_LOGO_MIME_TYPES = ["image/png", "image/webp"] as const;

export const SITE_LOGO_TYPE_ERROR = "Loqo PNG və ya WebP formatında olmalıdır.";
export const SITE_LOGO_TOO_LARGE_ERROR = "Loqo 2 MB-dan böyük ola bilməz.";
export const SITE_LOGO_SHAPE_ERROR = `Loqo kvadrat olmalıdır, ən azı ${SITE_LOGO_MIN_SIDE}×${SITE_LOGO_MIN_SIDE} piksel.`;

export function isSiteLogoMimeType(type: string): boolean {
  return (SITE_LOGO_MIME_TYPES as readonly string[]).includes(type);
}

/** The error for a logo of this type, size and pixel size, or null. */
export function siteLogoError(file: {
  type: string;
  size: number;
  width: number;
  height: number;
}): string | null {
  if (!isSiteLogoMimeType(file.type)) return SITE_LOGO_TYPE_ERROR;
  if (file.size > SITE_LOGO_MAX_BYTES) return SITE_LOGO_TOO_LARGE_ERROR;
  if (file.width !== file.height || file.width < SITE_LOGO_MIN_SIDE) {
    return SITE_LOGO_SHAPE_ERROR;
  }
  return null;
}

/**
 * Reads the type and pixel size from the header of a PNG or WebP file, or
 * returns null for anything else.
 */
export function readLogoHeader(
  bytes: Uint8Array,
): { type: string; width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));

  // PNG: signature, then the IHDR chunk with big-endian width and height.
  if (
    bytes.length >= 24 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a &&
    ascii(12, 4) === "IHDR"
  ) {
    return { type: "image/png", width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (bytes.length < 30 || ascii(0, 4) !== "RIFF" || ascii(8, 4) !== "WEBP") {
    return null;
  }

  const chunk = ascii(12, 4);
  if (chunk === "VP8X") {
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
    return { type: "image/webp", width, height };
  }
  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const [b0, b1, b2, b3] = bytes.subarray(21, 25);
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { type: "image/webp", width, height };
  }
  if (chunk === "VP8 ") {
    const width = view.getUint16(26, true) & 0x3fff;
    const height = view.getUint16(28, true) & 0x3fff;
    return { type: "image/webp", width, height };
  }
  return null;
}
