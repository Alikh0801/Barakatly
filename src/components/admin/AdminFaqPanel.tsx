"use client";

import { useActionState, useState } from "react";
import {
  resetFaqContent,
  updateFaqContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { FaqItem } from "@/lib/content/defaults";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};

export function AdminFaqPanel({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateFaqContent,
    initialState
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetFaqContent,
    initialState
  );
  const [rows, setRows] = useState<FaqItem[]>(items);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">
          Tez-tez verilən suallar
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          FAQ başlığını, sualları və cavabları dəyişin. Yeni sual əlavə edə və
          ya silə bilərsiniz.
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
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">
            Bölmə başlığı
          </span>
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={title}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
          />
        </label>

        <input type="hidden" name="faq_count" value={rows.length} />

        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={`faq-${index}`}
              className="space-y-3 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Sual {index + 1}
                </p>
                <button
                  type="button"
                  disabled={rows.length <= 1 || updatePending || resetPending}
                  onClick={() =>
                    setRows((current) =>
                      current.filter((_, rowIndex) => rowIndex !== index)
                    )
                  }
                  className="text-xs font-semibold text-rose-600 disabled:opacity-40"
                >
                  Sil
                </button>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Sual</span>
                <input
                  name={`faq_question_${index}`}
                  required
                  maxLength={200}
                  value={row.question}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, question: event.target.value }
                          : item
                      )
                    )
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-zinc-600">Cavab</span>
                <textarea
                  name={`faq_answer_${index}`}
                  required
                  maxLength={1000}
                  rows={3}
                  value={row.answer}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, answer: event.target.value }
                          : item
                      )
                    )
                  }
                  className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={rows.length >= 20 || updatePending || resetPending}
            onClick={() =>
              setRows((current) => [
                ...current,
                { question: "", answer: "" },
              ])
            }
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-50"
          >
            Sual əlavə et
          </button>
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
          Default suallara qaytar
        </button>
      </form>
    </div>
  );
}
