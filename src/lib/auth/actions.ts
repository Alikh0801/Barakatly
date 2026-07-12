"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email və ya şifrə yanlışdır.";
  }
  if (normalized.includes("user already registered")) {
    return "Bu email artıq qeydiyyatdadır.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email ünvanınız hələ təsdiqlənməyib.";
  }
  if (normalized.includes("password")) {
    return "Şifrə ən azı 6 simvol olmalıdır.";
  }

  return "Əməliyyat uğursuz oldu. Yenidən cəhd edin.";
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email və şifrə mütləqdir." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Bütün sahələr mütləqdir." };
  }

  if (password.length < 6) {
    return { error: "Şifrə ən azı 6 simvol olmalıdır." };
  }

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: "customer",
      },
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
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
