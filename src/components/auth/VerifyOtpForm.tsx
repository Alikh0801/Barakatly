"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  resendSignupOtp,
  verifySignupOtp,
  type AuthActionState,
} from "@/lib/auth/actions";
import { Turnstile, type TurnstileHandle } from "@/components/auth/Turnstile";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AuthActionState = {};
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function VerifyOtpForm({
  email,
  next,
}: {
  email: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(
    verifySignupOtp,
    initialState
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendSignupOtp,
    initialState
  );
  const [isResending, startResend] = useTransition();
  const [resendCaptchaError, setResendCaptchaError] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const resendBusy = resendPending || isResending;

  // Supabase captcha protection also covers the resend endpoint, so this needs
  // its own fresh token.
  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResendCaptchaError("");
    const formData = new FormData();
    formData.set("email", email);

    if (TURNSTILE_SITE_KEY) {
      const token = await turnstileRef.current?.getToken();
      if (!token) {
        setResendCaptchaError(
          "Təhlükəsizlik yoxlaması tamamlanmadı. Yenidən cəhd edin."
        );
        return;
      }
      formData.set("captchaToken", token);
    }

    startResend(() => resendAction(formData));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Hesabınızı təsdiqləmək üçün{" "}
        <span className="font-semibold text-zinc-900">{email}</span> ünvanına
        göndərilən 6 rəqəmli kodu daxil edin. Kod əlinizdə yoxdursa, aşağıdan
        yenidən göndərə bilərsiniz.
      </p>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
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

      <form onSubmit={handleResend}>
        {TURNSTILE_SITE_KEY ? (
          <div className="mb-3">
            <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} />
          </div>
        ) : null}
        {resendState.success ? (
          <p className="mb-2 text-center text-sm text-emerald-700">
            {resendState.success}
          </p>
        ) : null}
        {resendState.error || resendCaptchaError ? (
          <p className="mb-2 text-center text-sm text-rose-700">
            {resendCaptchaError || resendState.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={resendBusy}
          className="w-full text-center text-sm font-semibold text-emerald-700 hover:underline disabled:opacity-70"
        >
          {resendBusy ? "Göndərilir..." : "Kodu yenidən göndər"}
        </button>
      </form>
    </div>
  );
}
