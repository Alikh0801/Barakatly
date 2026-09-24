import {
  PRODUCT_IMAGE_TOO_LARGE_ERROR,
  productImageUploadPath,
  validateProductImage,
} from "@/lib/farmer/image-upload";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads product photos from the browser straight to the product-images
 * bucket, in parallel, and returns their storage paths in the same order.
 * Files already uploaded in an earlier attempt are taken from `cache`
 * rather than sent again.
 */
export async function uploadProductImages(
  files: File[],
  userId: string,
  cache: Map<File, string>,
): Promise<{ paths: string[] } | { error: string }> {
  for (const file of files) {
    const invalid = validateProductImage(file);
    if (invalid) return { error: `${file.name}: ${invalid}` };
  }

  const bucket = createClient().storage.from("product-images");
  type Outcome = { path: string } | { error: string };
  const results = await Promise.all(
    files.map(async (file): Promise<Outcome> => {
      const cached = cache.get(file);
      if (cached) return { path: cached };

      const path = productImageUploadPath(userId, file);
      const { error } = await bucket.upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        console.error("[farmer.uploadProductImages]", error.message);
        return {
          error: /exceed|too large|payload/i.test(error.message)
            ? `${file.name}: ${PRODUCT_IMAGE_TOO_LARGE_ERROR}`
            : "Şəkil yüklənə bilmədi. Yenidən cəhd edin.",
        };
      }
      cache.set(file, path);
      return { path };
    }),
  );

  const paths: string[] = [];
  for (const result of results) {
    if ("error" in result) return { error: result.error };
    paths.push(result.path);
  }
  return { paths };
}
