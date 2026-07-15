"use client";

import { useActionState, useState } from "react";
import {
  createBank,
  deleteBank,
  toggleBankActive,
  updateBank,
  type AdminBankActionState,
} from "@/lib/admin/bank-actions";
import { formatPanDisplay } from "@/lib/admin/bank-format";
import type { AdminBank } from "@/lib/admin/queries";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminBankActionState = {};

export function AdminBanksPanel({ banks }: { banks: AdminBank[] }) {
  const [createState, createAction, createPending] = useActionState(
    createBank,
    initialState
  );
  const [pan, setPan] = useState("");

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        onSubmit={() => {
          // Clear after FormData is captured from the current controlled value.
          queueMicrotask(() => setPan(""));
        }}
        className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200"
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Kart məlumatları
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Bank adı və 16 rəqəmli kart nömrəsini daxil edin. Aktiv
            qeydlər sifariş ödənişi zamanı müştəriyə görünəcək.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Bankın adı</span>
            <input
              name="name"
              required
              placeholder="Məs: Kapital Bank"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm placeholder:text-zinc-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              16 rəqəmli kart nömrəsi
            </span>
            <input
              name="pan_number"
              required
              inputMode="numeric"
              autoComplete="off"
              placeholder="XXXX XXXX XXXX XXXX"
              value={pan}
              onChange={(event) => setPan(formatPanDisplay(event.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm tracking-wider text-zinc-900 placeholder:text-zinc-400"
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
          Kart məlumatı əlavə et
        </button>
      </form>

      {banks.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-zinc-200">
          <p className="font-medium text-zinc-900">Kart məlumatı yoxdur</p>
          <p className="mt-1 text-sm text-zinc-600">
            Yuxarıdan bank əlavə edin ki, müştəri ödəniş edə bilsin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map((bank) => (
            <BankCard key={bank.id} bank={bank} />
          ))}
        </div>
      )}
    </div>
  );
}

function BankCard({ bank }: { bank: AdminBank }) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateBank,
    initialState
  );
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleBankActive,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBank,
    initialState
  );
  const [pan, setPan] = useState(formatPanDisplay(bank.pan_number));

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 ring-1 ring-zinc-200">
      {(updateState.error || toggleState.error || deleteState.error) && (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {updateState.error ?? toggleState.error ?? deleteState.error}
        </p>
      )}
      {(updateState.success || toggleState.success || deleteState.success) && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {updateState.success ?? toggleState.success ?? deleteState.success}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span
          className={[
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
            bank.is_active
              ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
              : "bg-zinc-100 text-zinc-600 ring-zinc-200",
          ].join(" ")}
        >
          {bank.is_active ? "Aktiv — müştəriyə görünür" : "Deaktiv"}
        </span>
      </div>

      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="bank_id" value={bank.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Bankın adı</span>
            <input
              name="name"
              required
              defaultValue={bank.name}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">
              16 rəqəmli kart nömrəsi
            </span>
            <input
              name="pan_number"
              required
              inputMode="numeric"
              autoComplete="off"
              value={pan}
              onChange={(event) => setPan(formatPanDisplay(event.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm tracking-wider text-zinc-900"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={updatePending || togglePending || deletePending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {updatePending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Yadda saxla
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={toggleAction}>
          <input type="hidden" name="bank_id" value={bank.id} />
          <input
            type="hidden"
            name="is_active"
            value={bank.is_active ? "true" : "false"}
          />
          <button
            type="submit"
            disabled={updatePending || togglePending || deletePending}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-70"
          >
            {togglePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            {bank.is_active ? "Deaktiv et" : "Aktiv et"}
          </button>
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="bank_id" value={bank.id} />
          <button
            type="submit"
            disabled={updatePending || togglePending || deletePending}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70"
          >
            {deletePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Sil
          </button>
        </form>
      </div>
    </article>
  );
}
