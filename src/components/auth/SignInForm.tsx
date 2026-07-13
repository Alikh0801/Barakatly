"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AuthActionState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 touch-manipulation"
          placeholder="siz@email.com"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Şifrə"
        autoComplete="current-password"
      />

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
            Giriş edilir...
          </>
        ) : (
          "Daxil ol"
        )}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Hesabınız yoxdur?{" "}
        <Link href="/signup" className="font-semibold text-emerald-700 hover:underline">
          Qeydiyyatdan keçin
        </Link>
      </p>
    </form>
  );
}
