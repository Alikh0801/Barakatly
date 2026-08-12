"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  emailAlreadyRegistered,
  isDuplicateSignUpUser,
  translateAuthError,
} from "@/lib/auth/signup";
import { getAuthCallbackUrl, getSupabaseEnvError } from "@/lib/auth/urls";

export type AuthActionState = {
  error?: string;
  success?: string;
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

  const supabase = await createClient();
  const callbackUrl = getAuthCallbackUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "customer",
      },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("[auth.signUp]", error.message, { callbackUrl });
    return { error: translateAuthError(error.message) };
  }

  if (isDuplicateSignUpUser(data.user)) {
    return { error: "Bu email artıq qeydiyyatdadır. Daxil olun." };
  }

  if (data.user && !data.session) {
    return {
      success:
        "Qeydiyyat tamamlandı. Email ünvanınıza göndərilən təsdiq linkinə klikləyin.",
    };
  }

  redirect("/");
}
