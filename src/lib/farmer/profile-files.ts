import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Files on a farmer's profile besides posts: the cover photo and
 * certificates. Both go from the browser straight to the farmer-media bucket
 * under the farmer's own folder; actions only receive the storage path and
 * check it here.
 */

const COVER_MAX_BYTES = 10 * 1024 * 1024;
const CERTIFICATE_MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const CERTIFICATE_EXTENSIONS: Record<string, string> = {
  ...IMAGE_EXTENSIONS,
  "application/pdf": "pdf",
};

const COVER_TYPE_ERROR = "Yalnız JPEG, PNG və ya WebP şəkil qəbul olunur.";
export const COVER_TOO_LARGE_ERROR = "Şəkil 10 MB-dan böyük ola bilməz.";
const CERTIFICATE_TYPE_ERROR =
  "Yalnız JPEG, PNG, WebP şəkil və ya PDF fayl qəbul olunur.";
export const CERTIFICATE_TOO_LARGE_ERROR = "Fayl 10 MB-dan böyük ola bilməz.";
const NOT_FOUND_ERROR = "Fayl tapılmadı. Yenidən seçin.";

export type ProfileFileKind = "cover" | "certificates";
export type CertificateFileType = "image" | "pdf";

export function validateCoverFile(file: File): string | null {
  if (!IMAGE_EXTENSIONS[file.type]) return COVER_TYPE_ERROR;
  if (file.size > COVER_MAX_BYTES) return COVER_TOO_LARGE_ERROR;
  return null;
}

export function validateCertificateFile(file: File): string | null {
  if (!CERTIFICATE_EXTENSIONS[file.type]) return CERTIFICATE_TYPE_ERROR;
  if (file.size > CERTIFICATE_MAX_BYTES) return CERTIFICATE_TOO_LARGE_ERROR;
  return null;
}

/** `<user id>/<kind>/<time>-<uuid>.<ext>` */
export function profileFileUploadPath(
  userId: string,
  kind: ProfileFileKind,
  mimeType: string,
): string {
  const extension = CERTIFICATE_EXTENSIONS[mimeType] ?? "bin";
  return `${userId}/${kind}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function isOwnPath(path: string, userId: string, kind: ProfileFileKind): boolean {
  const escaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const extensions = kind === "cover" ? "jpg|png|webp" : "jpg|png|webp|pdf";
  return new RegExp(`^${escaped}/${kind}/[\\w-]+\\.(${extensions})$`).test(path);
}

/**
 * Turns a path the browser uploaded to into a public URL, after checking it
 * sits in the caller's own folder and holds an allowed file within the limit.
 */
export async function resolveProfileFilePath(
  supabase: SupabaseClient<Database>,
  userId: string,
  kind: ProfileFileKind,
  path: string,
): Promise<{ url: string; fileType: CertificateFileType } | { error: string }> {
  if (!isOwnPath(path, userId, kind)) return { error: NOT_FOUND_ERROR };

  const bucket = supabase.storage.from("farmer-media");
  const { data, error } = await bucket.info(path);
  if (error || !data) return { error: NOT_FOUND_ERROR };

  const contentType = data.contentType ?? "";
  const allowed = kind === "cover" ? IMAGE_EXTENSIONS : CERTIFICATE_EXTENSIONS;
  if (!allowed[contentType]) {
    return { error: kind === "cover" ? COVER_TYPE_ERROR : CERTIFICATE_TYPE_ERROR };
  }
  const limit = kind === "cover" ? COVER_MAX_BYTES : CERTIFICATE_MAX_BYTES;
  if ((data.size ?? 0) > limit) {
    return {
      error: kind === "cover" ? COVER_TOO_LARGE_ERROR : CERTIFICATE_TOO_LARGE_ERROR,
    };
  }

  return {
    url: bucket.getPublicUrl(path).data.publicUrl,
    fileType: contentType === "application/pdf" ? "pdf" : "image",
  };
}

/** The storage path inside farmer-media of one of its public URLs. */
export function farmerMediaPathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/farmer-media/";
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}
