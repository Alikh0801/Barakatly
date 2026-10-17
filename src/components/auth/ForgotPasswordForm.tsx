"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import {
  requestPasswordReset,
  resetPasswordWithCode,
  setNewPassword,
  type PasswordResetState,
} from "@/lib/auth/password-actions";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Turnstile, type TurnstileHandle } from "@/components/auth/Turnstile";
import { Spinner } from "@/components/ui/Spinner";

const initialState: PasswordResetState = {};
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const CAPTCHA_ERROR = "Təhlükəsizlik yoxlaması tamamlanmadı. Yenidən cəhd edin.";

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 touch-manipulation";
const submitClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70";

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
      {children}
    </p>
  );
}

function SubmitButton({ busy, busyLabel, label }: { busy: boolean; busyLabel: string; label: string }) {
  return (
    <button type="submit" disabled={busy} className={submitClass}>
      {busy ? (
        <>
          <Spinner className="h-4 w-4" />
          {busyLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

/** Adds a fresh Turnstile token to the form data; false if none came. */
async function addCaptcha(
  formData: FormData,
  turnstile: React.RefObject<TurnstileHandle | null>,
) {
  if (!TURNSTILE_SITE_KEY) return true;
  const token = await turnstile.current?.getToken();
  if (!token) return false;
  formData.set("captchaToken", token);
  return true;
}

/**
 * "Şifrəni unutmusunuz?": the email step, then the step with the 6-digit
 * code from the email and the new password. Submitting by hand (not via
 * the form `action`) keeps what was typed when the server says no.
 */
export function ForgotPasswordForm() {
  const [requestState, requestAction, requestPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [resetState, resetAction, resetPending] = useActionState(
    resetPasswordWithCode,
    initialState,
  );
  const [requesting, startRequest] = useTransition();
  const [resetting, startReset] = useTransition();
  const [captchaError, setCaptchaError] = useState("");
  // "Başqa email yaz" sets this to the answer it leaves behind, so the form
  // goes back to the email step until the next answer arrives.
  const [dismissed, setDismissed] = useState<PasswordResetState | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const email = requestState === dismissed ? undefined : requestState.resetEmail;
  const requestError = requestState === dismissed ? undefined : requestState.error;

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaptchaError("");
    const formData = new FormData(event.currentTarget);
    if (!(await addCaptcha(formData, turnstileRef))) {
      setCaptchaError(CAPTCHA_ERROR);
      return;
    }
    startRequest(() => requestAction(formData));
  }

  async function handleResend() {
    if (!email) return;
    setCaptchaError("");
    const formData = new FormData();
    formData.set("email", email);
    formData.set("resend", "1");
    if (!(await addCaptcha(formData, turnstileRef))) {
      setCaptchaError(CAPTCHA_ERROR);
      return;
    }
    startRequest(() => requestAction(formData));
  }

  function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startReset(() => resetAction(formData));
  }

  if (!email) {
    const busy = requestPending || requesting;
    return (
      <form onSubmit={handleRequest} className="space-y-4">
        <p className="text-sm text-zinc-600">
          Hesabınızın email ünvanını yazın. Şifrəni yeniləmək üçün sizə 6 rəqəmli kod göndərəcəyik.
        </p>
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
            defaultValue={requestState.resetEmail}
            key={requestState.resetEmail ?? ""}
            className={inputClass}
            placeholder="siz@email.com"
          />
        </div>

        {TURNSTILE_SITE_KEY ? <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} /> : null}

        {captchaError || requestError ? <ErrorNote>{captchaError || requestError}</ErrorNote> : null}

        <SubmitButton busy={busy} busyLabel="Göndərilir..." label="Kodu göndər" />

        <p className="text-center text-sm text-zinc-600">
          Şifrəni xatırladınız?{" "}
          <Link href="/signin" className="font-semibold text-emerald-700 hover:underline">
            Daxil olun
          </Link>
        </p>
      </form>
    );
  }

  const resetBusy = resetPending || resetting;
  const resendBusy = requestPending || requesting;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        <span className="font-semibold text-zinc-900">{email}</span> ünvanında hesab varsa, ora 6 rəqəmli
        kod göndərdik. Kodu və yeni şifrənizi daxil edin. Məktub görünmürsə, spam qovluğuna baxın.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-zinc-700">
            Kod
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-center text-lg font-semibold tracking-[0.5em] text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
            placeholder="000000"
          />
        </div>

        <PasswordInput
          id="new-password"
          name="password"
          label="Yeni şifrə"
          autoComplete="new-password"
          minLength={6}
        />
        <PasswordInput
          id="new-password-confirm"
          name="password_confirm"
          label="Yeni şifrə (təkrar)"
          autoComplete="new-password"
          minLength={6}
        />

        {resetState.error ? <ErrorNote>{resetState.error}</ErrorNote> : null}

        <SubmitButton busy={resetBusy} busyLabel="Yenilənir..." label="Şifrəni yenilə" />
      </form>

      <div className="space-y-3 border-t border-zinc-100 pt-4">
        {TURNSTILE_SITE_KEY ? <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} /> : null}
        {requestState.success ? (
          <p className="text-center text-sm text-emerald-700">{requestState.success}</p>
        ) : null}
        {captchaError || requestState.error ? (
          <p className="text-center text-sm text-rose-700">{captchaError || requestState.error}</p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendBusy}
            className="font-semibold text-emerald-700 hover:underline disabled:opacity-70"
          >
            {resendBusy ? "Göndərilir..." : "Kodu yenidən göndər"}
          </button>
          <span aria-hidden="true" className="text-zinc-300">·</span>
          <button
            type="button"
            onClick={() => {
              setCaptchaError("");
              setDismissed(requestState);
            }}
            className="font-semibold text-zinc-600 hover:underline"
          >
            Başqa email yaz
          </button>
        </div>
      </div>
    </div>
  );
}

/** /reset-password: the link in the email has signed the user in already. */
export function SetNewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, initialState);
  const [isPending, startTransition] = useTransition();
  const busy = pending || isPending;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        id="new-password"
        name="password"
        label="Yeni şifrə"
        autoComplete="new-password"
        minLength={6}
      />
      <PasswordInput
        id="new-password-confirm"
        name="password_confirm"
        label="Yeni şifrə (təkrar)"
        autoComplete="new-password"
        minLength={6}
      />
      {state.error ? <ErrorNote>{state.error}</ErrorNote> : null}
      <SubmitButton busy={busy} busyLabel="Yenilənir..." label="Şifrəni yenilə" />
    </form>
  );
}
