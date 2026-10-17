"use client";

import { useActionState } from "react";
import {
  resetWhyBarakatlyContent,
  updateWhyBarakatlyContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { WhyBarakatlyFeature } from "@/lib/content/defaults";
import { Spinner } from "@/components/ui/Spinner";
import { ToggleableCard } from "@/components/admin/ToggleableCard";
import { EmojiField } from "@/components/admin/EmojiField";

const initialState: AdminContentActionState = {};

export function AdminWhyBarakatlyPanel({
  title,
  body,
  items,
}: {
  title: string;
  body: string;
  items: WhyBarakatlyFeature[];
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
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Niyə Barakatly?
        </h2>
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
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              Bölmə başlığı
            </span>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={title}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              Bölmə mətni
            </span>
            <textarea
              name="body"
              required
              maxLength={500}
              rows={3}
              defaultValue={body}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900">Kartlar</h3>
          {items.map((item, index) => (
            <ToggleableCard
              key={`${item.title}-${index}`}
              label={`Kart ${index + 1}`}
              name={`feature_enabled_${index}`}
              defaultEnabled={item.enabled}
            >
              <EmojiField name={`feature_icon_${index}`} defaultValue={item.icon} />
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Başlıq</span>
                <input
                  name={`feature_title_${index}`}
                  required
                  maxLength={80}
                  defaultValue={item.title}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Mətn</span>
                <textarea
                  name={`feature_description_${index}`}
                  required
                  maxLength={300}
                  rows={3}
                  defaultValue={item.description}
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
                />
              </label>
            </ToggleableCard>
          ))}
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
          Default mətnə qaytar
        </button>
      </form>
    </div>
  );
}
