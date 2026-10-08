import type { SiteImageFolder } from "@/lib/admin/site-image-upload";
import {
  PRODUCT_IMAGE_EXTENSIONS,
  PRODUCT_IMAGE_TOO_LARGE_ERROR,
  isProductImageMimeType,
  validateProductImage,
} from "@/lib/farmer/image-upload";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a hero/login image from the admin's browser straight to the
 * product-images bucket and returns its storage path, for the action to
 * verify with resolveSiteImagePath. Admins may write these shared folders
 * under the bucket's insert policy (migration 032).
 */
export async function uploadSiteImageFromBrowser(
  file: File,
  folder: SiteImageFolder,
): Promise<{ path: string } | { error: string }> {
  const invalid = validateProductImage(file);
  if (invalid) return { error: invalid };

  const extension = isProductImageMimeType(file.type)
    ? PRODUCT_IMAGE_EXTENSIONS[file.type]
    : "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await createClient()
    .storage.from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[admin.uploadSiteImageFromBrowser]", error.message);
    return {
      error: /exceed|too large|payload/i.test(error.message)
        ? PRODUCT_IMAGE_TOO_LARGE_ERROR
        : "Şəkil yüklənə bilmədi. Yenidən cəhd edin.",
    };
  }
  return { path };
}
