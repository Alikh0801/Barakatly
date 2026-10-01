import type { UploadOutcome } from "@/lib/files/use-background-uploads";
import {
  PRODUCT_IMAGE_TOO_LARGE_ERROR,
  productImageUploadPath,
  validateProductImage,
} from "@/lib/farmer/image-upload";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads one product photo from the browser straight to the product-images
 * bucket and returns its storage path. The action only ever receives paths:
 * five 5 MB photos could never fit Vercel's ~4.5 MB function payload cap.
 */
export async function uploadProductImage(
  file: File,
  userId: string,
): Promise<UploadOutcome> {
  const invalid = validateProductImage(file);
  if (invalid) return { error: `${file.name}: ${invalid}` };

  const path = productImageUploadPath(userId, file);
  const { error } = await createClient()
    .storage.from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[farmer.uploadProductImage]", error.message);
    return {
      error: /exceed|too large|payload/i.test(error.message)
        ? `${file.name}: ${PRODUCT_IMAGE_TOO_LARGE_ERROR}`
        : `${file.name}: Şəkil yüklənə bilmədi. Yenidən cəhd edin.`,
    };
  }
  return { path };
}
