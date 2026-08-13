"use client";

import { useActionState } from "react";
import {
  updateAccountProfile,
  type AccountActionState,
} from "@/lib/account/actions";
import { AzPhoneInput } from "@/components/ui/AzPhoneInput";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AccountActionState = {};

export function AccountProfileForm({
  fullName,
  phone,
  email,
  roleLabel,
}: {
  fullName: string;
  phone: string;
  email: string;
  roleLabel: string;
}) {
  const [state, action, pending] = useActionState(
    updateAccountProfile,
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-zinc-700"
        >
          Ad və soyad
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          maxLength={80}
          defaultValue={fullName}
          autoComplete="name"
          placeholder="Adınız Soyadınız"
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>

      <AzPhoneInput
        id="phone"
        name="phone"
        label="Telefon nömrəsi"
        required={false}
        defaultValue={phone}
      />

      <ReadOnlyField label="Email" value={email} hint="Email dəyişdirilə bilməz." />
      <ReadOnlyField label="Rol" value={roleLabel} />

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? <Spinner className="h-4 w-4" /> : null}
        {pending ? "Yadda saxlanılır..." : "Yadda saxla"}
      </button>
    </form>
  );
}

function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-zinc-700">{label}</span>
      <div className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base text-zinc-600">
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}
