export const DELIVERY_FEE = 5;

/**
 * Must match the payment-receipts bucket's file_size_limit (migration 031).
 * Receipts upload from the browser straight to Storage, so this is no
 * longer bounded by the Server Action body limit or Vercel's request cap.
 */
export const RECEIPT_MAX_BYTES = 7 * 1024 * 1024;
export const RECEIPT_MAX_LABEL = "7 MB";

export const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const RECEIPT_EXTENSIONS: Record<(typeof RECEIPT_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const RECEIPT_TOO_LARGE_ERROR = `Çek faylı ${RECEIPT_MAX_LABEL}-dan böyük ola bilməz.`;
export const RECEIPT_TYPE_ERROR =
  "Çek JPEG, PNG, WebP və ya PDF formatında olmalıdır.";

export function isReceiptMimeType(
  type: string,
): type is (typeof RECEIPT_MIME_TYPES)[number] {
  return (RECEIPT_MIME_TYPES as readonly string[]).includes(type);
}

/** Receipts live under the uploader's own folder: `<user id>/<file>.<ext>`. */
export function isOwnReceiptPath(path: string, userId: string): boolean {
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}/[\\w-]+\\.(jpg|png|webp|pdf)$`).test(path);
}
