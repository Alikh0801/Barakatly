"use client";

import { useActionState } from "react";
import {
  resetWhyBarakatlyContent,
  updateWhyBarakatlyContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};

export function AdminWhyBarakatlyPanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateWhyBarakatlyContent,
    initialState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetWhyBarakatlyContent,
    initialState
  );

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Niyə Barakatly?
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Ana səhifədəki bu bölmənin başlıq və mətnini dəyişin.
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
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">Başlıq</span>
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={title}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">Mətn</span>
          <textarea
            name="body"
            required
            maxLength={500}
            rows={4}
            defaultValue={body}
            className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={updatePending || resetPending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {updatePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Yadda saxla
          </button>
        </div>
      </form>

      <form action={resetAction}>
        <button
          type="submit"
          disabled={updatePending || resetPending}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-70"
        >
          {resetPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Default mətnə qaytar
        </button>
      </form>
    </div>
  );
}
