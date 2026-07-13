"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAuthCallbackUrl, getSupabaseEnvError } from "@/lib/auth/urls";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email və ya şifrə yanlışdır.";
  }
  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered")
  ) {
    return "Bu email artıq qeydiyyatdadır.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email ünvanınız hələ təsdiqlənməyib.";
  }
  if (
    normalized.includes("redirect") &&
    (normalized.includes("not allowed") || normalized.includes("invalid"))
  ) {
    return "Redirect URL icazəli deyil. Supabase-də https://barakatly.vercel.app/auth/callback əlavə edin.";
  }
  if (normalized.includes("error sending confirmation email")) {
    return "Təsdiq emaili göndərilmədi. Supabase email konfiqurasiyasını yoxlayın.";
  }
  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "Qeydiyyat müvəqqəti olaraq bağlıdır.";
  }
  if (
    normalized.includes("database error") ||
    normalized.includes("saving new user")
  ) {
    return "Profil yaradıla bilmədi. Database migration-ları yoxlanmalıdır.";
  }
  if (normalized.includes("invalid api key")) {
    return "Supabase API açarı yanlışdır. Vercel environment variables yoxlayın.";
  }
  if (normalized.includes("rate limit")) {
    return "Çox sayda cəhd etdiniz. Bir az gözləyin.";
  }
  if (normalized.includes("password")) {
    return "Şifrə ən azı 6 simvol olmalıdır.";
  }
  if (normalized.includes("invalid email")) {
    return "Email formatı düzgün deyil.";
  }

  return `Əməliyyat uğursuz oldu: ${message}`;
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const envError = getSupabaseEnvError();
  if (envError) return { error: envError };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "").trim();

  if (!email || !password) {
    return { error: "Email və şifrə mütləqdir." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

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

  if (data.user && !data.session) {
    return {
      success:
        "Qeydiyyat tamamlandı. Email ünvanınıza göndərilən təsdiq linkinə klikləyin.",
    };
  }

  redirect("/");
}
