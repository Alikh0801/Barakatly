"use client";

import { useActionState } from "react";
import {
  approveCategory,
  approveSubcategory,
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
} from "@/lib/admin/category-actions";
import type { AdminPortalActionState } from "@/lib/admin/portal-actions";
import type { AdminCategory } from "@/lib/admin/queries";
import type { Subcategory } from "@/types";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";
import { FormPendingSpinner } from "@/components/ui/FormPendingSpinner";

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
  const approvedCount = categories.filter((category) => category.approved).length;

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 ring-1 ring-zinc-200"
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
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm placeholder:text-zinc-500"
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Sıra</span>
            <p className="flex h-[42px] items-center gap-2 rounded-xl bg-zinc-50 px-3 text-sm text-zinc-600 ring-1 ring-zinc-200">
              <span className="font-semibold text-zinc-900">{approvedCount + 1}</span>
              avtomatik
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <FileSelectField
              name="image"
              accept="image/jpeg,image/png,image/webp"
              caption="Şəkil"
            />
          </div>
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
            <CategoryCard key={category.id} category={category} total={approvedCount} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Keeps the position field to digits, two at most. */
function digitsOnly(event: React.FormEvent<HTMLInputElement>) {
  const input = event.currentTarget;
  input.value = input.value.replace(/\D/g, "").slice(0, 2);
}

function CategoryCard({ category, total }: { category: AdminCategory; total: number }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCategory,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategory,
    initialState
  );
  const [approveState, approveAction, approvePending] = useActionState(
    approveCategory,
    initialState
  );

  return (
    <article
      className={`rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ${
        category.approved ? "ring-zinc-200" : "ring-amber-300"
      }`}
    >
      {(updateState.error || deleteState.error || approveState.error) && (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {updateState.error ?? deleteState.error ?? approveState.error}
        </p>
      )}
      {(updateState.success || deleteState.success || approveState.success) && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {updateState.success ?? deleteState.success ?? approveState.success}
        </p>
      )}

      {!category.approved ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-200">
          <span className="text-sm font-medium text-amber-800">
            Fermer əlavə edib — təsdiq gözləyir
            {category.liveProductCount > 0 ? (
              <span className="mt-0.5 block text-xs font-normal">
                Bu kateqoriyada {category.liveProductCount} məhsul artıq mağazadadır. Kateqoriyanı
                təsdiqləyin və ya həmin məhsulları başqa kateqoriyaya keçirin.
              </span>
            ) : null}
          </span>
          <form action={approveAction}>
            <input type="hidden" name="category_id" value={category.id} />
            <button
              type="submit"
              disabled={approvePending}
              className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-70"
            >
              {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
              Təsdiqlə
            </button>
          </form>
        </div>
      ) : null}

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="category_id" value={category.id} />
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200">
            {category.position !== null ? (
              <span className="absolute left-1 top-1 z-10 rounded-md bg-zinc-900/80 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                {category.position}
              </span>
            ) : null}
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
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
              />
            </label>
            {category.position !== null ? (
              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-zinc-600">Sıra (1–{total})</span>
                <input
                  // Re-read the number after a move shifts this card's place.
                  key={category.position}
                  name="sort_order"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{1,2}"
                  maxLength={2}
                  required
                  defaultValue={category.position}
                  onInput={digitsOnly}
                  title={`1 ilə ${total} arasında rəqəm`}
                  className="w-20 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-base font-semibold text-zinc-900 sm:text-sm"
                />
              </label>
            ) : null}
            <div className="sm:col-span-2 lg:col-span-1">
              <FileSelectField
                name="image"
                accept="image/jpeg,image/png,image/webp"
                caption={
                  category.image_url ? "Yeni şəkil (dəyişmək üçün)" : "Şəkil"
                }
              />
            </div>
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

      <SubcategoriesSection category={category} />
    </article>
  );
}

function SubcategoriesSection({ category }: { category: AdminCategory }) {
  const [createState, createAction, createPending] = useActionState(
    createSubcategory,
    initialState
  );

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <h3 className="text-sm font-semibold text-zinc-900">Alt kateqoriyalar</h3>

      {category.subcategories.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {category.subcategories.map((sub) => (
            <SubcategoryRow key={sub.id} subcategory={sub} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">Alt kateqoriya yoxdur.</p>
      )}

      {createState.error ? (
        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {createState.error}
        </p>
      ) : null}
      {createState.success ? (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {createState.success}
        </p>
      ) : null}

      <form action={createAction} className="mt-3 flex flex-wrap gap-2">
        <input type="hidden" name="category_id" value={category.id} />
        <input
          name="name_az"
          required
          placeholder="Yeni alt kateqoriya"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
        <button
          type="submit"
          disabled={createPending}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {createPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Əlavə et
        </button>
      </form>
    </div>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: Subcategory }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveSubcategory,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteSubcategory,
    initialState
  );

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-100">
      <span className="flex items-center gap-2 text-sm text-zinc-800">
        {subcategory.name_az}
        {!subcategory.approved ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Təsdiq gözləyir
          </span>
        ) : null}
      </span>
      <div className="flex items-center gap-2">
        {!subcategory.approved ? (
          <form action={approveAction}>
            <input type="hidden" name="subcategory_id" value={subcategory.id} />
            <button
              type="submit"
              disabled={approvePending || deletePending}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-70"
            >
              <FormPendingSpinner className="h-3 w-3" />
              Təsdiqlə
            </button>
          </form>
        ) : null}
        <form action={deleteAction}>
          <input type="hidden" name="subcategory_id" value={subcategory.id} />
          <button
            type="submit"
            disabled={approvePending || deletePending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline disabled:opacity-70"
          >
            <FormPendingSpinner className="h-3 w-3" />
            Sil
          </button>
        </form>
      </div>
      {approveState.error || deleteState.error ? (
        <p className="w-full text-xs text-rose-600">
          {approveState.error ?? deleteState.error}
        </p>
      ) : null}
    </li>
  );
}
