import type { UploadOutcome } from "@/lib/files/use-background-uploads";
import {
  FARMER_MEDIA_TOO_LARGE_ERROR,
  farmerPostUploadPath,
  validateFarmerMedia,
} from "@/lib/farmer/media-upload";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads one post photo/video from the browser straight to the
 * farmer-media bucket and returns its storage path. The action only ever
 * receives paths: a 50 MB video could never fit Vercel's ~4.5 MB function
 * payload cap.
 */
export async function uploadPostMediaFile(
  file: File,
  userId: string,
): Promise<UploadOutcome> {
  const invalid = validateFarmerMedia(file);
  if (invalid) return { error: `${file.name}: ${invalid}` };

  const path = farmerPostUploadPath(userId, file);
  const { error } = await createClient()
    .storage.from("farmer-media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[farmer.uploadPostMediaFile]", error.message);
    return {
      error: /exceed|too large|payload/i.test(error.message)
        ? `${file.name}: ${FARMER_MEDIA_TOO_LARGE_ERROR}`
        : `${file.name}: Fayl yüklənə bilmədi. Yenidən cəhd edin.`,
    };
  }
  return { path };
}
