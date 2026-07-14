import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

function getImageExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return byType[file.type] ?? "jpg";
}

export function validateProductImage(file: File): string | null {
  if (file.size === 0) {
    return "Şəkil faylı seçin.";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "Şəkil 5 MB-dan böyük ola bilməz.";
  }
  if (
    !PRODUCT_IMAGE_MIME_TYPES.includes(
      file.type as (typeof PRODUCT_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return "Şəkil JPEG, PNG və ya WebP formatında olmalıdır.";
  }
  return null;
}

export async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  userId: string,
  productId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const validationError = validateProductImage(file);
  if (validationError) return { error: validationError };

  const path = `${userId}/${productId}/${Date.now()}-${crypto.randomUUID()}.${getImageExtension(file)}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[farmer.uploadProductImage]", uploadError.message);
    return { error: "Şəkil yüklənə bilmədi. Yenidən cəhd edin." };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  if (!data.publicUrl) {
    return { error: "Şəkil ünvanı alınmadı." };
  }

  return { url: data.publicUrl };
}
