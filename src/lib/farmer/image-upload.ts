import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type ProductImageMime = (typeof PRODUCT_IMAGE_MIME_TYPES)[number];

export const PRODUCT_IMAGE_EXTENSIONS: Record<ProductImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const PRODUCT_IMAGE_TOO_LARGE_ERROR = "Şəkil 5 MB-dan böyük ola bilməz.";
export const PRODUCT_IMAGE_TYPE_ERROR =
  "Şəkil JPEG, PNG və ya WebP formatında olmalıdır.";

export function isProductImageMimeType(type: string): type is ProductImageMime {
  return (PRODUCT_IMAGE_MIME_TYPES as readonly string[]).includes(type);
}

export function validateProductImage(file: File): string | null {
  if (file.size === 0) {
    return "Şəkil faylı seçin.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return PRODUCT_IMAGE_TOO_LARGE_ERROR;
  }
  if (!isProductImageMimeType(file.type)) {
    return PRODUCT_IMAGE_TYPE_ERROR;
  }
  return null;
}

/** Farmer uploads live under `<user id>/uploads/<file>.<ext>`. */
export function productImageUploadPath(userId: string, file: File): string {
  const extension = isProductImageMimeType(file.type)
    ? PRODUCT_IMAGE_EXTENSIONS[file.type]
    : "jpg";
  return `${userId}/uploads/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function isOwnProductImagePath(path: string, userId: string): boolean {
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}/uploads/[\\w-]+\\.(jpg|png|webp)$`).test(path);
}

/**
 * Turns storage paths uploaded by the browser into public URLs, in order.
 *
 * The images no longer travel inside the Server Action: five 5 MB photos
 * could never fit Vercel's ~4.5 MB function payload cap, and failed as a
 * bare 413. The paths are client-supplied, so each must sit in the caller's
 * own folder and exist as an image within the size limit.
 */
export async function resolveUploadedProductImages(
  supabase: SupabaseClient<Database>,
  userId: string,
  paths: string[],
): Promise<{ urls: string[] } | { error: string }> {
  if (paths.some((path) => !isOwnProductImagePath(path, userId))) {
    return { error: "Şəkil tapılmadı. Yenidən seçin." };
  }

  const bucket = supabase.storage.from("product-images");
  const infos = await Promise.all(paths.map((path) => bucket.info(path)));

  for (const { data, error } of infos) {
    if (error || !data) return { error: "Şəkil tapılmadı. Yenidən seçin." };
    if ((data.size ?? 0) > PRODUCT_IMAGE_MAX_BYTES) {
      return { error: PRODUCT_IMAGE_TOO_LARGE_ERROR };
    }
    if (!isProductImageMimeType(data.contentType ?? "")) {
      return { error: PRODUCT_IMAGE_TYPE_ERROR };
    }
  }

  return { urls: paths.map((path) => bucket.getPublicUrl(path).data.publicUrl) };
}
