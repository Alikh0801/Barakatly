import {
  FARMER_MEDIA_TOO_LARGE_ERROR,
  farmerPostUploadPath,
  validateFarmerMedia,
} from "@/lib/farmer/media-upload";
import { createClient } from "@/lib/supabase/client";

/**
 * Uploads post photos/videos from the browser straight to the farmer-media
 * bucket, in parallel, and returns their storage paths in order. Files
 * uploaded in an earlier attempt come from `cache` instead of being sent
 * again. `onProgress` reports how many files have finished.
 */
export async function uploadPostMedia(
  files: File[],
  userId: string,
  cache: Map<File, string>,
  onProgress?: (done: number, total: number) => void,
): Promise<{ paths: string[] } | { error: string }> {
  for (const file of files) {
    const invalid = validateFarmerMedia(file);
    if (invalid) return { error: `${file.name}: ${invalid}` };
  }

  const bucket = createClient().storage.from("farmer-media");
  let done = files.filter((file) => cache.has(file)).length;
  onProgress?.(done, files.length);

  type Outcome = { path: string } | { error: string };
  const results = await Promise.all(
    files.map(async (file): Promise<Outcome> => {
      const cached = cache.get(file);
      if (cached) return { path: cached };

      const path = farmerPostUploadPath(userId, file);
      const { error } = await bucket.upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) {
        console.error("[farmer.uploadPostMedia]", error.message);
        return {
          error: /exceed|too large|payload/i.test(error.message)
            ? `${file.name}: ${FARMER_MEDIA_TOO_LARGE_ERROR}`
            : "Fayl yüklənə bilmədi. Yenidən cəhd edin.",
        };
      }
      cache.set(file, path);
      onProgress?.(++done, files.length);
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
