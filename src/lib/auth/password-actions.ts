"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isEmailRateLimited, translateAuthError } from "@/lib/auth/signup";
import { getAuthCallbackUrl, getSupabaseEnvError } from "@/lib/auth/urls";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetState = {
  error?: string;
  success?: string;
  /** Set once the reset email has gone out: the form moves to the code step. */
  resetEmail?: string;
};

const MIN_PASSWORD_LENGTH = 6;

/** Where the link in the reset email lands, after /auth/callback signs in. */
const RESET_PASSWORD_PATH = "/reset-password";

function checkNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Şifrə ən azı ${MIN_PASSWORD_LENGTH} simvol olmalıdır.`;
  }
  if (password !== confirm) return "Şifrələr uyğun gəlmir.";
  return null;
}

/**
 * Sends the reset email: a 6-digit code for this form and a link for
 * opening it elsewhere. The answer is the same whether or not the address
 * has an account, so the form can't be used to find out who is registered.
 */
export async function requestPasswordReset(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const captchaToken = String(formData.get("captchaToken") ?? "").trim();
  const resend = formData.get("resend") === "1";

  if (!email) return { error: "Email ünvanını daxil edin." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAuthCallbackUrl()}?next=${encodeURIComponent(RESET_PASSWORD_PATH)}`,
    captchaToken: captchaToken || undefined,
  });

  if (error) {
    console.error("[auth.requestPasswordReset]", error.message);
    // The limit means a code went out moments ago: carry on to the code step.
    if (isEmailRateLimited(error.message)) {
      return {
        resetEmail: email,
        error: resend
          ? "Kod bir az əvvəl göndərilib. Bir neçə dəqiqə sonra yenidən cəhd edin."
          : undefined,
      };
    }
    return { error: translateAuthError(error.message), resetEmail: resend ? email : undefined };
  }

  return { resetEmail: email, success: resend ? "Yeni kod göndərildi." : undefined };
}

/** Checks the emailed code, then sets the new password and signs the user in. */
export async function resetPasswordWithCode(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").replace(/\s/g, "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  if (!email) return { error: "Email tapılmadı. Yenidən başlayın." };
  if (!/^\d{6}$/.test(token)) {
    return { resetEmail: email, error: "6 rəqəmli kodu daxil edin." };
  }
  const passwordError = checkNewPassword(password, confirm);
  if (passwordError) return { resetEmail: email, error: passwordError };

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (verifyError) {
    console.error("[auth.resetPasswordWithCode.verify]", verifyError.message);
    return { resetEmail: email, error: translateAuthError(verifyError.message) };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) {
    console.error("[auth.resetPasswordWithCode.update]", updateError.message);
    return { resetEmail: email, error: translateAuthError(updateError.message) };
  }

  redirect("/shop");
}

/** The link in the email signs the user in first; this sets the new password. */
export async function setNewPassword(
  _prev: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");
  const passwordError = checkNewPassword(password, confirm);
  if (passwordError) return { error: passwordError };

  const user = await getSessionUser();
  if (!user) {
    return { error: "Linkin vaxtı bitib. Şifrəni bərpa etməyə yenidən başlayın." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[auth.setNewPassword]", error.message);
    return { error: translateAuthError(error.message) };
  }

  redirect("/shop");
}
