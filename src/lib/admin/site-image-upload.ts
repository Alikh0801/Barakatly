import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { validateProductImage } from "@/lib/farmer/image-upload";

function getImageExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return byType[file.type] ?? "jpg";
}

/** Uploads an admin-managed site image (hero, auth page, categories, ...)
 * to the shared product-images bucket under its own folder. */
export async function uploadSiteImage(
  supabase: SupabaseClient<Database>,
  file: File,
  folder: string,
): Promise<{ url: string } | { error: string }> {
  const validationError = validateProductImage(file);
  if (validationError) return { error: validationError };

  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${getImageExtension(file)}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[admin.uploadSiteImage]", uploadError.message);
    return { error: "Şəkil yüklənə bilmədi. Yenidən cəhd edin." };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  if (!data.publicUrl) {
    return { error: "Şəkil ünvanı alınmadı." };
  }

  return { url: data.publicUrl };
}
