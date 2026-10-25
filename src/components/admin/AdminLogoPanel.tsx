"use client";

import { useActionState, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  resetSiteLogo,
  updateSiteLogo,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import { siteLogoError } from "@/lib/admin/site-logo";
import { useSiteImageSubmit } from "@/lib/admin/use-site-image-submit";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};
const LOGO_FILE_FIELDS = [{ input: "logo", path: "logo_path" }];

/** Pixel size of an image file, or null when the browser can't read it. */
async function imageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

export function AdminLogoPanel({ logoUrl }: { logoUrl: string }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateSiteLogo,
    initialState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetSiteLogo,
    initialState
  );
  const { onSubmit, uploading, uploadError, clearUploadError } = useSiteImageSubmit(
    updateAction,
    "logo",
    LOGO_FILE_FIELDS
  );
  // The chosen file, checked here so a wrong one is never uploaded. It
  // belongs to the logo it was picked against, so a save forgets it.
  const [picked, setPicked] = useState<{ file: File; forUrl: string } | null>(null);
  const file = picked?.forUrl === logoUrl ? picked.file : null;
  const [fileError, setFileError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  // Only the last action's outcome is shown, so a reset after a failed save
  // doesn't keep showing the old error.
  const [lastAction, setLastAction] = useState<"update" | "reset">("update");
  const lastState = lastAction === "update" ? updateState : resetState;
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const saving = uploading || updatePending;
  const error = fileError ?? uploadError ?? lastState.error;

  async function handleFileChange(next: File | null) {
    clearUploadError();
    setFileError(null);
    setPicked(null);
    if (!next) return;

    setChecking(true);
    const size = await imageSize(next);
    setChecking(false);
    const invalid = siteLogoError({
      type: next.type,
      size: next.size,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
    });
    if (invalid) {
      setFileError(invalid);
      return;
    }
    setPicked({ file: next, forUrl: logoUrl });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!file) {
      event.preventDefault();
      setFileError((current) => current ?? "Loqo faylı seçin.");
      return;
    }
    setLastAction("update");
    void onSubmit(event);
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5 xl:col-span-2">
      <h2 className="text-lg font-semibold text-zinc-900">Loqo</h2>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {!error && lastState.success && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {lastState.success}
        </p>
      )}

      {/* Keyed on the saved logo so a successful save clears the picker. */}
      <form
        key={logoUrl}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl ?? logoUrl}
            alt="Loqo"
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
          />
          <FileSelectField
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            caption="Yeni loqo"
            hint="Kvadrat şəkil, ən azı 512×512 piksel. Saytda dairəvi kəsilir, ona görə vacib hissə mərkəzdə olsun."
            onFileChange={(next) => void handleFileChange(next)}
          />
        </div>

        <button
          type="submit"
          disabled={saving || resetPending || checking}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? <Spinner className="h-3.5 w-3.5" /> : null}
          {uploading ? "Şəkil yüklənir..." : "Yadda saxla"}
        </button>
      </form>

      <form
        action={resetAction}
        onSubmit={() => {
          clearUploadError();
          setFileError(null);
          setLastAction("reset");
        }}
      >
        <button
          type="submit"
          disabled={saving || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-70"
        >
          {resetPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Default loqoya qaytar
        </button>
      </form>
    </div>
  );
}
