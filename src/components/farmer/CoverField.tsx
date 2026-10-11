"use client";

import { useEffect, useRef, useState } from "react";
import { uploadProfileFile } from "@/lib/farmer/upload-profile-file";
import { validateCoverFile } from "@/lib/farmer/profile-files";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Cover photo picker for the profile edit form. The photo uploads as soon as
 * it is picked, straight to Storage, and the form then carries only its path
 * (`cover_path`) — or `remove_cover` when the farmer clears it.
 */
export function CoverField({
  userId,
  initialUrl,
  onBusyChange,
}: {
  userId: string;
  initialUrl: string | null;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [path, setPath] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function showPreview(next: string | null) {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = next?.startsWith("blob:") ? next : null;
    setPreviewUrl(next);
  }

  async function pick(file: File) {
    const invalid = validateCoverFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setUploading(true);
    onBusyChange?.(true);
    const result = await uploadProfileFile(file, userId, "cover");
    setUploading(false);
    onBusyChange?.(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    showPreview(URL.createObjectURL(file));
    setPath(result.path);
    setRemoved(false);
  }

  function clear() {
    showPreview(null);
    setPath(null);
    setRemoved(Boolean(initialUrl));
    setError(null);
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-zinc-700">Arxa plan şəkli</span>
      <div className="relative aspect-[4/1] min-h-28 w-full overflow-hidden rounded-xl bg-[#23382b] ring-1 ring-zinc-200">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Arxa plan şəkli" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            Arxa plan şəkli yoxdur
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-sm font-medium text-white">
            <Spinner className="h-4 w-4" />
            Yüklənir...
          </div>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void pick(file);
        }}
      />
      {path ? <input type="hidden" name="cover_path" value={path} /> : null}
      {removed ? <input type="hidden" name="remove_cover" value="1" /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
        >
          {previewUrl ? "Şəkli dəyiş" : "Şəkil seç"}
        </button>
        {previewUrl ? (
          <button
            type="button"
            disabled={uploading}
            onClick={clear}
            className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          >
            Sil
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-rose-600">{error}</p>
      ) : (
        <p className="text-xs text-zinc-500">
          Üfüqi şəkil, ən azı 1920×600 piksel tövsiyə olunur. JPEG, PNG və ya WebP, maksimum 10 MB. Dəyişiklik admin təsdiqindən sonra görünür.
        </p>
      )}
    </div>
  );
}
