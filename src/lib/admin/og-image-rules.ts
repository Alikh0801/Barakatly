/**
 * Rules for the link-preview picture the admin uploads. Shared by the admin
 * panel, which checks a file before uploading it, and the action, which
 * checks the stored file again since the browser can be bypassed.
 *
 * WhatsApp skips a preview picture much over 600 KB, and every app crops
 * one far from 1.91:1 (1200×630).
 */

export const OG_IMAGE_MAX_BYTES = 600 * 1024;
export const OG_IMAGE_MIN_WIDTH = 1200;
export const OG_IMAGE_MIME_TYPES = ["image/png", "image/jpeg"] as const;

export const OG_IMAGE_TYPE_ERROR = "Şəkil JPEG və ya PNG formatında olmalıdır.";
export const OG_IMAGE_TOO_LARGE_ERROR = "Şəkil 600 KB-dan böyük ola bilməz.";
export const OG_IMAGE_SHAPE_ERROR =
  "Şəkil 1200×630 nisbətində (1,91:1) olmalıdır, eni ən azı 1200 piksel.";

/** The error for a preview picture of this type, size and pixel size, or null. */
export function ogImageError(file: {
  type: string;
  size: number;
  width: number;
  height: number;
}): string | null {
  if (!(OG_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return OG_IMAGE_TYPE_ERROR;
  if (file.size > OG_IMAGE_MAX_BYTES) return OG_IMAGE_TOO_LARGE_ERROR;
  const ratio = file.height > 0 ? file.width / file.height : 0;
  if (file.width < OG_IMAGE_MIN_WIDTH || ratio < 1.85 || ratio > 1.97) return OG_IMAGE_SHAPE_ERROR;
  return null;
}
