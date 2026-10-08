"use client";

import { useActionState } from "react";
import {
  resetHeroContent,
  updateHeroContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { HeroItems } from "@/lib/content/defaults";
import { useSiteImageSubmit } from "@/lib/admin/use-site-image-submit";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};
const HERO_FILE_FIELDS = [
  { input: "image", path: "image_path" },
  { input: "mobile_image", path: "mobile_image_path", label: "Mobil şəkil" },
];

export function AdminHeroPanel({
  title,
  body,
  items,
}: {
  title: string;
  body: string;
  items: HeroItems;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateHeroContent,
    initialState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetHeroContent,
    initialState
  );
  const { onSubmit, uploading, uploadError, clearUploadError } = useSiteImageSubmit(
    updateAction,
    "hero",
    HERO_FILE_FIELDS
  );
  const saving = uploading || updatePending;
  const error = uploadError ?? updateState.error ?? resetState.error;

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200 xl:col-span-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Hero</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Ana səhifənin ilk bölməsindəki fon şəklini və mətnləri dəyişin.
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {!error && (updateState.success || resetState.success) && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {updateState.success ?? resetState.success}
        </p>
      )}

      {/* Keyed on the saved images so a successful save clears the file
          pickers, while a failed one keeps everything the admin entered. */}
      <form key={`${items.imageUrl}|${items.mobileImageUrl}`} onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Fon şəkli</h3>
          <div className="aspect-[21/9] w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items.imageUrl}
              alt="Hero fon şəkli"
              className="h-full w-full object-cover"
            />
          </div>
          <FileSelectField
            name="image"
            accept="image/jpeg,image/png,image/webp"
            caption="Yeni şəkil"
            hint="Üfüqi şəkil, ən azı 2400×1600 piksel tövsiyə olunur. JPEG, PNG və ya WebP, maksimum 5 MB. Boş buraxsanız mövcud şəkil qalır."
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Mobil şəkil <span className="font-normal text-zinc-500">(istəyə bağlı)</span>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Telefon və şaquli tutulmuş planşetlərdə fon şəklinin yerinə göstərilir.
              Üfüqi şəkil dar ekranda kəsildiyi üçün burada şaquli şəkil daha yaxşı görünür.
            </p>
          </div>
          {items.mobileImageUrl ? (
            <div className="space-y-3">
              <div className="aspect-[9/16] w-32 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={items.mobileImageUrl}
                  alt="Hero mobil şəkli"
                  className="h-full w-full object-cover"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="remove_mobile_image"
                  value="1"
                  className="h-4 w-4 rounded border-zinc-300 accent-emerald-600"
                />
                Mobil şəkli sil (telefonlarda fon şəkli göstərilsin)
              </label>
            </div>
          ) : (
            <p className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 ring-1 ring-zinc-100">
              Mobil şəkil yoxdur — telefonlarda fon şəkli göstərilir.
            </p>
          )}
          <FileSelectField
            name="mobile_image"
            accept="image/jpeg,image/png,image/webp"
            caption={items.mobileImageUrl ? "Yeni mobil şəkil" : "Mobil şəkil"}
            hint="Şaquli şəkil (9:16), 1440×2560 piksel tövsiyə olunur, ən azı 1080×1920. JPEG, PNG və ya WebP, maksimum 5 MB."
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Başlıq</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">
                1-ci sətir
              </span>
              <input
                name="title"
                required
                maxLength={60}
                defaultValue={title}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">
                2-ci sətir (rəngli vurğu)
              </span>
              <input
                name="highlight"
                required
                maxLength={60}
                defaultValue={items.highlight}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Alt mətn</span>
            <textarea
              name="body"
              required
              maxLength={400}
              rows={3}
              defaultValue={body}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? <Spinner className="h-3.5 w-3.5" /> : null}
          {uploading ? "Şəkil yüklənir..." : "Yadda saxla"}
        </button>
      </form>

      <form action={resetAction} onSubmit={clearUploadError}>
        <button
          type="submit"
          disabled={saving || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-70"
        >
          {resetPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Default mətnə və şəklə qaytar
        </button>
      </form>
    </div>
  );
}
