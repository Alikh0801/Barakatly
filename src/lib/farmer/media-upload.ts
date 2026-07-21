import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FarmerPostMediaType } from "@/types/database";

export const FARMER_MEDIA_MAX_BYTES = 50 * 1024 * 1024;
export const FARMER_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const FARMER_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

function getExtension(file: File): string {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return byType[file.type] ?? "bin";
}

export function mediaTypeForFile(file: File): FarmerPostMediaType | null {
  if (
    FARMER_IMAGE_MIME_TYPES.includes(
      file.type as (typeof FARMER_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return "image";
  }
  if (
    FARMER_VIDEO_MIME_TYPES.includes(
      file.type as (typeof FARMER_VIDEO_MIME_TYPES)[number]
    )
  ) {
    return "video";
  }
  return null;
}

export function validateFarmerMedia(file: File): string | null {
  if (file.size === 0) return "Fayl seçin.";
  if (file.size > FARMER_MEDIA_MAX_BYTES) {
    return "Fayl 50 MB-dan böyük ola bilməz.";
  }
  if (!mediaTypeForFile(file)) {
    return "Yalnız JPEG/PNG/WebP şəkil və ya MP4/WebM/MOV video qəbul olunur.";
  }
  return null;
}

export async function uploadFarmerMedia(
  supabase: SupabaseClient<Database>,
  userId: string,
  folder: string,
  file: File
): Promise<{ url: string; mediaType: FarmerPostMediaType } | { error: string }> {
  const validationError = validateFarmerMedia(file);
  if (validationError) return { error: validationError };

  const mediaType = mediaTypeForFile(file);
  if (!mediaType) return { error: "Fayl tipi dəstəklənmir." };

  const path = `${userId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${getExtension(file)}`;

  const { error: uploadError } = await supabase.storage
    .from("farmer-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[farmer.uploadFarmerMedia]", uploadError.message);
    return { error: "Fayl yüklənə bilmədi. Yenidən cəhd edin." };
  }

  const { data } = supabase.storage.from("farmer-media").getPublicUrl(path);
  if (!data.publicUrl) {
    return { error: "Fayl ünvanı alınmadı." };
  }

  return { url: data.publicUrl, mediaType };
}
