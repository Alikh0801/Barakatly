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

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function getExtension(file: File): string {
  return EXTENSIONS[file.type] ?? "bin";
}

export const FARMER_MEDIA_TOO_LARGE_ERROR = "Fayl 50 MB-dan böyük ola bilməz.";

function mediaTypeForMime(type: string): FarmerPostMediaType | null {
  if ((FARMER_IMAGE_MIME_TYPES as readonly string[]).includes(type)) return "image";
  if ((FARMER_VIDEO_MIME_TYPES as readonly string[]).includes(type)) return "video";
  return null;
}

export function mediaTypeForFile(file: File): FarmerPostMediaType | null {
  return mediaTypeForMime(file.type);
}

export function validateFarmerMedia(file: File): string | null {
  if (file.size === 0) return "Fayl seçin.";
  if (file.size > FARMER_MEDIA_MAX_BYTES) {
    return FARMER_MEDIA_TOO_LARGE_ERROR;
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

/** Post media uploaded by the browser: `<user id>/posts/<file>.<ext>`. */
export function farmerPostUploadPath(userId: string, file: File): string {
  return `${userId}/posts/${Date.now()}-${crypto.randomUUID()}.${getExtension(file)}`;
}

function isOwnPostMediaPath(path: string, userId: string): boolean {
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^${escaped}/posts/[\\w-]+\\.(jpg|png|webp|mp4|webm|mov)$`,
  ).test(path);
}

/**
 * Turns post media the browser already uploaded into public URLs with their
 * media type, in order.
 *
 * Posting the files through the Server Action could never work for video:
 * Vercel caps function payloads at ~4.5 MB against a 50 MB media limit. The
 * paths are client-supplied, so each must sit in the caller's own folder and
 * exist as an allowed image or video within the size limit.
 */
export async function resolveUploadedPostMedia(
  supabase: SupabaseClient<Database>,
  userId: string,
  paths: string[],
): Promise<
  { items: { url: string; mediaType: FarmerPostMediaType }[] } | { error: string }
> {
  if (paths.some((path) => !isOwnPostMediaPath(path, userId))) {
    return { error: "Fayl tapılmadı. Yenidən seçin." };
  }

  const bucket = supabase.storage.from("farmer-media");
  const infos = await Promise.all(paths.map((path) => bucket.info(path)));
  const items: { url: string; mediaType: FarmerPostMediaType }[] = [];

  for (const [index, { data, error }] of infos.entries()) {
    if (error || !data) return { error: "Fayl tapılmadı. Yenidən seçin." };
    if ((data.size ?? 0) > FARMER_MEDIA_MAX_BYTES) {
      return { error: FARMER_MEDIA_TOO_LARGE_ERROR };
    }
    const mediaType = mediaTypeForMime(data.contentType ?? "");
    if (!mediaType) return { error: "Fayl tipi dəstəklənmir." };
    items.push({
      url: bucket.getPublicUrl(paths[index]).data.publicUrl,
      mediaType,
    });
  }

  return { items };
}
