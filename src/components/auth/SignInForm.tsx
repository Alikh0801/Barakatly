"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, type AuthActionState } from "@/lib/auth/actions";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Turnstile } from "@/components/auth/Turnstile";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AuthActionState = {};
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [captchaToken, setCaptchaToken] = useState("");
  const [widgetAttempt, setWidgetAttempt] = useState(0);
  const [lastState, setLastState] = useState(state);

  // Turnstile tokens are single-use. Every time a new action response comes
  // back (useActionState returns a fresh object per submit), remount the widget
  // so a retry always gets a brand-new token — otherwise re-submitting reuses
  // the spent token and Cloudflare rejects it as "timeout-or-duplicate".
  // Done during render (not an effect) per React's state-reset guidance.
  if (state !== lastState) {
    setLastState(state);
    if (state.error) {
      setCaptchaToken("");
      setWidgetAttempt((n) => n + 1);
    }
  }

  return (
    <div className="space-y-4">
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

        {TURNSTILE_SITE_KEY ? (
          <>
            <input type="hidden" name="captchaToken" value={captchaToken} />
            <Turnstile
              key={widgetAttempt}
              siteKey={TURNSTILE_SITE_KEY}
              onToken={setCaptchaToken}
            />
          </>
        ) : null}

        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)}
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
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-medium text-zinc-400">və ya</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <GoogleAuthButton next={next} />

      <p className="text-center text-sm text-zinc-600">
        Hesabınız yoxdur?{" "}
        <Link href="/signup" className="font-semibold text-emerald-700 hover:underline">
          Qeydiyyatdan keçin
        </Link>
      </p>
    </div>
  );
}
