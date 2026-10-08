import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_TOO_LARGE_ERROR,
  PRODUCT_IMAGE_TYPE_ERROR,
  isProductImageMimeType,
} from "@/lib/farmer/image-upload";

/** Site image folders the admin panels upload into from the browser. */
export type SiteImageFolder = "hero" | "auth";

/**
 * Turns a path the admin's browser uploaded into a public URL.
 *
 * Site images go browser → Storage, and the action only gets the path: a
 * hero form now carries two photos, and two full-size photos would blow
 * through Vercel's ~4.5 MB function payload cap. The path is
 * client-supplied, so it must sit in `folder` and exist as an allowed
 * image within the size limit.
 */
export async function resolveSiteImagePath(
  supabase: SupabaseClient<Database>,
  path: string,
  folder: SiteImageFolder,
): Promise<{ url: string } | { error: string }> {
  if (!new RegExp(`^${folder}/[\\w-]+\\.(jpg|png|webp)$`).test(path)) {
    return { error: "Şəkil tapılmadı. Yenidən seçin." };
  }

  const bucket = supabase.storage.from("product-images");
  const { data, error } = await bucket.info(path);
  if (error || !data) return { error: "Şəkil tapılmadı. Yenidən seçin." };
  if ((data.size ?? 0) > PRODUCT_IMAGE_MAX_BYTES) {
    return { error: PRODUCT_IMAGE_TOO_LARGE_ERROR };
  }
  if (!isProductImageMimeType(data.contentType ?? "")) {
    return { error: PRODUCT_IMAGE_TYPE_ERROR };
  }
  return { url: bucket.getPublicUrl(path).data.publicUrl };
}
