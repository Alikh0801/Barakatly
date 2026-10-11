import {
  CERTIFICATE_TOO_LARGE_ERROR,
  COVER_TOO_LARGE_ERROR,
  profileFileUploadPath,
  validateCertificateFile,
  validateCoverFile,
  type ProfileFileKind,
} from "@/lib/farmer/profile-files";
import { createClient } from "@/lib/supabase/client";

/** Wide enough for a full-width cover on a 1440px screen at 2× density. */
const COVER_MAX_WIDTH = 2880;

/**
 * Phone photos are often 4000px+ and several MB. Scale the cover down in the
 * browser so the upload is quick and always fits the limit. Falls back to
 * the original file if the browser cannot decode it.
 */
async function shrinkCover(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COVER_MAX_WIDTH / bitmap.width);
    if (scale === 1 && file.type === "image/jpeg") {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * Uploads a cover photo or certificate from the browser straight to the
 * farmer-media bucket and returns its storage path for the action to check.
 */
export async function uploadProfileFile(
  file: File,
  userId: string,
  kind: ProfileFileKind,
): Promise<{ path: string } | { error: string }> {
  const invalid = kind === "cover" ? validateCoverFile(file) : validateCertificateFile(file);
  if (invalid) return { error: invalid };

  const body = kind === "cover" ? await shrinkCover(file) : file;
  const contentType = body.type || file.type;
  const path = profileFileUploadPath(userId, kind, contentType);

  const { error } = await createClient()
    .storage.from("farmer-media")
    .upload(path, body, { contentType, upsert: false });

  if (error) {
    console.error("[farmer.uploadProfileFile]", error.message);
    return {
      error: /exceed|too large|payload/i.test(error.message)
        ? kind === "cover"
          ? COVER_TOO_LARGE_ERROR
          : CERTIFICATE_TOO_LARGE_ERROR
        : "Fayl yüklənə bilmədi. Yenidən cəhd edin.",
    };
  }
  return { path };
}
