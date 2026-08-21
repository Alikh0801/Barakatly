"use client";

import { useActionState } from "react";
import {
  resetAuthImageContent,
  updateAuthImageContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { AuthImageItems } from "@/lib/content/defaults";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};

export function AdminAuthImagePanel({ items }: { items: AuthImageItems }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateAuthImageContent,
    initialState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetAuthImageContent,
    initialState
  );

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200 xl:col-span-2">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Giriş səhifəsi şəkli</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Daxil ol və qeydiyyat səhifələrindəki şəkli dəyişin.
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

      <form action={updateAction} className="space-y-4">
        <div className="aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={items.imageUrl}
            alt="Giriş səhifəsi şəkli"
            className="h-full w-full object-cover"
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">
            Yeni şəkil (cihazdan yüklə)
          </span>
          <input
            name="image"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className="w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
          />
          <span className="block text-xs text-zinc-500">
            JPEG, PNG və ya WebP, maksimum 5 MB.
          </span>
        </label>

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
          Default şəklə qaytar
        </button>
      </form>
    </div>
  );
}
