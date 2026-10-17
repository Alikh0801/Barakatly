"use client";

import { useActionState } from "react";
import {
  updateContactContent,
  type AdminContentActionState,
} from "@/lib/admin/content-actions";
import type { ContactItems } from "@/lib/content/defaults";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminContentActionState = {};

export function AdminContactPanel({ contact }: { contact: ContactItems }) {
  const [state, action, pending] = useActionState(updateContactContent, initialState);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Əlaqə məlumatları</h2>
      </div>

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>
      ) : null}

      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Telefon</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              maxLength={20}
              defaultValue={contact.phone}
              placeholder="+994 50 123 45 67"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-zinc-600">Email</span>
            <input
              name="email"
              type="email"
              maxLength={120}
              defaultValue={contact.email}
              placeholder="info@barakatly.az"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Yadda saxla
        </button>
      </form>
    </div>
  );
}
