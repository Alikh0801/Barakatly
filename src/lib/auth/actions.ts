"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  emailAlreadyRegistered,
  isDuplicateSignUpUser,
  translateAuthError,
} from "@/lib/auth/signup";
import { getSupabaseEnvError } from "@/lib/auth/urls";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";

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
    return { error: translateAuthError(error.message) };
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(safeNext);
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

  if (await emailAlreadyRegistered(email)) {
    return { error: "Bu email artıq qeydiyyatdadır. Daxil olun." };
  }

  const captchaToken = String(formData.get("captchaToken") ?? "").trim();

  const supabase = await createClient();

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
    return { error: translateAuthError(error.message) };
  }

  if (isDuplicateSignUpUser(data.user)) {
    return { error: "Bu email artıq qeydiyyatdadır. Daxil olun." };
  }

  if (data.user && !data.session) {
    return { otpEmail: email };
  }

  redirect("/");
}

export async function verifySignupOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

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
    console.error("[auth.verifySignupOtp]", error?.message);
    return {
      otpEmail: email,
      error: translateAuthError(error?.message ?? "invalid token"),
    };
  }

  await ensureFarmerRecord(data.user.id);
  redirect("/");
}

export async function resendSignupOtp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email tapılmadı. Yenidən qeydiyyatdan keçin." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    console.error("[auth.resendSignupOtp]", error.message);
    return { otpEmail: email, error: translateAuthError(error.message) };
  }

  return { otpEmail: email, success: "Yeni kod göndərildi." };
}
