"use client";

import { useActionState } from "react";
import {
  resetHeroContent,
  updateHeroContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { HeroItems } from "@/lib/content/defaults";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};

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

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200 xl:col-span-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Hero</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Ana səhifənin ilk bölməsindəki fon şəklini və mətnləri dəyişin.
        </p>
      </div>

      {(updateState.error || resetState.error) && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {updateState.error ?? resetState.error}
        </p>
      )}
      {(updateState.success || resetState.success) && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {updateState.success ?? resetState.success}
        </p>
      )}

      <form action={updateAction} className="space-y-6">
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
            hint="JPEG, PNG və ya WebP, maksimum 5 MB. Boş buraxsanız mövcud şəkil qalır."
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
          disabled={updatePending || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {updatePending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Yadda saxla
        </button>
      </form>

      <form action={resetAction}>
        <button
          type="submit"
          disabled={updatePending || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-70"
        >
          {resetPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Default mətnə və şəklə qaytar
        </button>
      </form>
    </div>
  );
}
