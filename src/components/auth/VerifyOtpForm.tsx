"use client";

import { useActionState } from "react";
import {
  resendSignupOtp,
  verifySignupOtp,
  type AuthActionState,
} from "@/lib/auth/actions";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AuthActionState = {};

export function VerifyOtpForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(
    verifySignupOtp,
    initialState
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendSignupOtp,
    initialState
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        <span className="font-semibold text-zinc-900">{email}</span>{" "}
        ünvanına 6 rəqəmli təsdiq kodu göndərdik. Kodu aşağıda daxil edin.
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-zinc-700">
            Təsdiq kodu
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-lg font-semibold tracking-[0.5em] text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="000000"
          />
        </div>

        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              Yoxlanılır...
            </>
          ) : (
            "Təsdiqlə"
          )}
        </button>
      </form>

      <form action={resendAction}>
        <input type="hidden" name="email" value={email} />
        {resendState.success ? (
          <p className="mb-2 text-center text-sm text-emerald-700">
            {resendState.success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={resendPending}
          className="w-full text-center text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-70"
        >
          {resendPending ? "Göndərilir..." : "Kodu yenidən göndər"}
        </button>
      </form>
    </div>
  );
}
