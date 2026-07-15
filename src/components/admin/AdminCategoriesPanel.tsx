"use client";

import { useActionState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/admin/category-actions";
import type { AdminPortalActionState } from "@/lib/admin/portal-actions";
import type { AdminCategory } from "@/lib/admin/queries";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminPortalActionState = {};

export function AdminCategoriesPanel({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const [createState, createAction, createPending] = useActionState(
    createCategory,
    initialState
  );

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
      >
        <h2 className="text-lg font-semibold text-zinc-900">
          Yeni kateqoriya
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-zinc-600">Ad</span>
            <input
              name="name_az"
              required
              placeholder="Məs: Tərəvəzlər"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Sıra</span>
            <input
              name="sort_order"
              type="number"
              required
              defaultValue={categories.length + 1}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
            />
          </label>
          <label className="block space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-zinc-600">
              Şəkili URL kimi yerləşdir
            </span>
            <input
              name="image_url"
              type="url"
              placeholder="https://..."
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
          </label>
        </div>
        {createState.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {createState.error}
          </p>
        ) : null}
        {createState.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {createState.success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={createPending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {createPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Kateqoriya əlavə et
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
          <p className="font-medium text-zinc-900">Kateqoriya yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: AdminCategory }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCategory,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    initialState
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      {(updateState.error || deleteState.error) && (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {updateState.error ?? deleteState.error}
        </p>
      )}
      {(updateState.success || deleteState.success) && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {updateState.success ?? deleteState.success}
        </p>
      )}

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="category_id" value={category.id} />
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
            {category.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.image_url}
                alt={category.name_az}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Şəkil yox
              </div>
            )}
          </div>
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">Ad</span>
              <input
                name="name_az"
                required
                defaultValue={category.name_az}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-zinc-600">Sıra</span>
              <input
                name="sort_order"
                type="number"
                required
                defaultValue={category.sort_order}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
              />
            </label>
            <label className="block space-y-1.5 sm:col-span-2 lg:col-span-1">
              <span className="text-xs font-medium text-zinc-600">
                Şəkili URL kimi yerləşdir
              </span>
              <input
                name="image_url"
                type="url"
                defaultValue={category.image_url ?? ""}
                placeholder="https://..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500"
              />
            </label>
          </div>
        </div>
        <p className="text-xs text-zinc-500">Slug: {category.slug}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={updatePending || deletePending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {updatePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Yadda saxla
          </button>
        </div>
      </form>

      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="category_id" value={category.id} />
        <button
          type="submit"
          disabled={updatePending || deletePending}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70"
        >
          {deletePending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Sil
        </button>
      </form>
    </article>
  );
}
