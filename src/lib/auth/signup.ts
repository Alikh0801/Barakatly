import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Supabase signUp returns a user with empty identities when the email
 * already exists (anti-enumeration). Treat that as a duplicate registration.
 */
export function isDuplicateSignUpUser(user: User | null | undefined): boolean {
  if (!user) return false;
  return !Array.isArray(user.identities) || user.identities.length === 0;
}

/** Best-effort check against profiles (service role). */
export async function emailAlreadyRegistered(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", normalized)
      .maybeSingle();

    if (error) {
      console.error("[auth.emailAlreadyRegistered]", error.message);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error("[auth.emailAlreadyRegistered]", error);
    return false;
  }
}

export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email və ya şifrə yanlışdır.";
  }
  if (normalized.includes("captcha")) {
    return "Təhlükəsizlik yoxlaması uğursuz oldu. Səhifəni yeniləyib yenidən cəhd edin.";
  }
  if (
    normalized.includes("user already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("already registered")
  ) {
    return "Bu email artıq qeydiyyatdadır. Daxil olun.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email ünvanınız hələ təsdiqlənməyib.";
  }
  if (
    (normalized.includes("token") || normalized.includes("otp")) &&
    (normalized.includes("expired") || normalized.includes("invalid"))
  ) {
    return "Kod yanlışdır və ya vaxtı bitib. Yenidən göndərin.";
  }
  if (
    normalized.includes("redirect") &&
    (normalized.includes("not allowed") || normalized.includes("invalid"))
  ) {
    return "Redirect URL icazəli deyil. Supabase-də https://barakatly.az/auth/callback əlavə edin.";
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
