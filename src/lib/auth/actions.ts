"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  FARMER_APPLICATION_PATH,
  notifyApplicationReceived,
} from "@/lib/farmer/application";
import {
  emailAlreadyRegistered,
  isDuplicateSignUpUser,
  isEmailNotConfirmed,
  isAlreadyRegistered,
  isCaptchaError,
  isEmailRateLimited,
  translateAuthError,
} from "@/lib/auth/signup";
import { getSupabaseEnvError } from "@/lib/auth/urls";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
import { notifyAdmins } from "@/lib/notifications/helpers";
import { safeNext } from "@/lib/url/safe-next";
import { logAuthFailure } from "@/lib/audit/log";

export type AuthActionState = {
  error?: string;
  success?: string;
  /** Email awaiting a 6-digit signup code. When set, the UI shows the OTP step. */
  otpEmail?: string;
};

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "").trim();

  if (!email || !password) {
    return { error: "Email və şifrə mütləqdir." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: captchaToken ? { captchaToken } : undefined,
  });

  if (error) {
    await logAuthFailure("signin", email, error.message);
    // Şifrə düzgündür, amma email hələ təsdiqlənməyib: istifadəçi qeydiyyatda
    // gələn kodu yaza bilmədən səhifəni bağlayıb. Onu OTP addımına qaytar —
    // kod hələ də etibarlıdır, orada "yenidən göndər" də var.
    if (isEmailNotConfirmed(error.message)) {
      return { otpEmail: email };
    }
    return { error: translateAuthError(error.message) };
  }

  redirect(safeNext(next));
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (!fullName || !email || !password || !passwordConfirm) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  if (password.length < 6) {
    return { error: "Şifrə ən azı 6 simvol olmalıdır." };
  }

  if (password !== passwordConfirm) {
    return { error: "Şifrələr uyğun gəlmir." };
  }

  const captchaToken = String(formData.get("captchaToken") ?? "").trim();

  const supabase = await createClient();

  // The answer is the code step whether or not the address already has an
  // account, so the form can't be used to find out who is registered. A
  // still-unconfirmed account gets a new code; a confirmed one gets none,
  // and the code step says to sign in instead.
  if (await emailAlreadyRegistered(email)) {
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (resendError && isCaptchaError(resendError.message)) {
      return { error: translateAuthError(resendError.message) };
    }
    return { otpEmail: email };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "customer",
      },
      captchaToken: captchaToken || undefined,
    },
  });

  if (error) {
    console.error("[auth.signUp]", error.message);
    if (isAlreadyRegistered(error.message)) return { otpEmail: email };
    return { error: translateAuthError(error.message) };
  }

  if (isDuplicateSignUpUser(data.user)) {
    return { otpEmail: email };
  }

  if (data.user && !data.session) {
    return { otpEmail: email };
  }

  redirect("/shop");
}

export async function verifySignupOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  if (!email) {
    return { error: "Email tapılmadı. Yenidən qeydiyyatdan keçin." };
  }
  if (!token || token.length < 6) {
    return { otpEmail: email, error: "6 rəqəmli kodu daxil edin." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error || !data.user) {
    await logAuthFailure("signup_otp", email, error?.message ?? "no user");
    return {
      otpEmail: email,
      error: translateAuthError(error?.message ?? "invalid token"),
    };
  }

  // Creates the pending farmers row when signup metadata carries farm details
  // (i.e. this was a farmer signup, not a plain customer one).
  const farmer = await ensureFarmerRecord(data.user.id);
  if (farmer?.status === "pending") {
    const fullName = String(data.user.user_metadata?.full_name ?? "").trim();
    await notifyAdmins({
      type: "farmer_registration",
      title: "Yeni fermer qeydiyyatı",
      body: `${fullName || "Yeni fermer"} təsdiq gözləyir.`,
      metadata: { farmer_id: farmer.id },
    });
    // The applicant hears it too, and lands on the page that says what
    // happens next instead of the shop.
    await notifyApplicationReceived(data.user.id, fullName);
    redirect(FARMER_APPLICATION_PATH);
  }

  redirect(safeNext(next));
}

export async function resendSignupOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  const captchaToken = String(formData.get("captchaToken") ?? "").trim();
  if (!email) {
    return { error: "Email tapılmadı. Yenidən qeydiyyatdan keçin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: captchaToken ? { captchaToken } : undefined,
  });

  if (error) {
    await logAuthFailure("signup_otp_resend", email, error.message);
    // Only the captcha and the limit are worth saying: anything else would
    // tell whether the address has an (already confirmed) account.
    if (isCaptchaError(error.message) || isEmailRateLimited(error.message)) {
      return { otpEmail: email, error: translateAuthError(error.message) };
    }
  }

  return { otpEmail: email, success: "Yeni kod göndərildi." };
}
