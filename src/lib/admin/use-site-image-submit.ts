"use client";

import { startTransition, useState, type FormEvent } from "react";
import type { SiteImageFolder } from "@/lib/admin/site-image-upload";
import { uploadSiteImageFromBrowser } from "@/lib/admin/upload-site-image-browser";

/**
 * Submit handler for the hero and login-page forms. Chosen photos go from
 * the browser straight to Storage first, and the action receives only their
 * paths: a high-resolution photo posted through the action itself would hit
 * Vercel's ~4.5 MB request limit and fail with 413.
 *
 * Each entry of `fileFields` names a file input, the path field the action
 * reads for it, and an optional label that prefixes its upload errors.
 */
export function useSiteImageSubmit(
  action: (formData: FormData) => void,
  folder: SiteImageFolder,
  fileFields: { input: string; path: string; label?: string }[],
) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Dispatched by hand so React does not reset the form: on an error the
    // admin keeps their text and chosen files.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUploadError(null);

    const files = fileFields.flatMap((field) => {
      const file = formData.get(field.input);
      formData.delete(field.input);
      return file instanceof File && file.size > 0 ? [{ file, field }] : [];
    });

    if (files.length > 0) {
      setUploading(true);
      const results = await Promise.all(
        files.map(({ file }) => uploadSiteImageFromBrowser(file, folder)),
      );
      setUploading(false);

      for (const [index, result] of results.entries()) {
        const { label, path } = files[index].field;
        if ("error" in result) {
          setUploadError(label ? `${label}: ${result.error}` : result.error);
          return;
        }
        formData.set(path, result.path);
      }
    }

    startTransition(() => action(formData));
  }

  return {
    onSubmit,
    uploading,
    uploadError,
    clearUploadError: () => setUploadError(null),
  };
}
