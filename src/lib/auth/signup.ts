import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeLike } from "@/lib/supabase/like";

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
      // Case-insensitive but literal: an unescaped "_" in the address would
      // match any character, so ali_xov@… collided with ali.xov@….
      .ilike("email", escapeLike(normalized))
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

/** Supabase: hesab var, şifrə düzgündür, amma email hələ təsdiqlənməyib. */
export function isEmailNotConfirmed(message: string): boolean {
  return message.toLowerCase().includes("email not confirmed");
}

/** Sign-up refused because the address has an account. */
export function isAlreadyRegistered(message: string): boolean {
  return message.toLowerCase().includes("already") && message.toLowerCase().includes("registered");
}

/** The captcha token was missing or rejected: nothing else was checked. */
export function isCaptchaError(message: string): boolean {
  return message.toLowerCase().includes("captcha");
}

/** Supabase email göndərmə limitinə çatıb (kod artıq göndərilmiş olur). */
export function isEmailRateLimited(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes("rate limit") || normalized.includes("too many");
}

/**
 * Hints about how the site is set up (Supabase, Vercel) are for whoever is
 * running it locally; visitors to the real site get a plain message.
 */
const SHOW_SETUP_HINTS = process.env.NODE_ENV !== "production";
const GENERIC_AUTH_ERROR = "Əməliyyat alınmadı. Bir az sonra yenidən cəhd edin.";

function setupHint(hint: string): string {
  return SHOW_SETUP_HINTS ? hint : GENERIC_AUTH_ERROR;
}

export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email və ya şifrə yanlışdır.";
  }
  if (normalized.includes("captcha")) {
    return "Təhlükəsizlik yoxlaması uğursuz oldu. Səhifəni yeniləyib yenidən cəhd edin.";
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
    return setupHint("Redirect URL icazəli deyil. Supabase-də https://barakatly.az/auth/callback əlavə edin.");
  }
  if (normalized.includes("error sending confirmation email")) {
    return setupHint("Təsdiq emaili göndərilmədi. Supabase email konfiqurasiyasını yoxlayın.");
  }
  if (normalized.includes("signup") && normalized.includes("disabled")) {
    return "Qeydiyyat müvəqqəti olaraq bağlıdır.";
  }
  if (
    normalized.includes("database error") ||
    normalized.includes("saving new user")
  ) {
    return setupHint("Profil yaradıla bilmədi. Database migration-ları yoxlanmalıdır.");
  }
  if (normalized.includes("invalid api key")) {
    return setupHint("Supabase API açarı yanlışdır. Vercel environment variables yoxlayın.");
  }
  if (normalized.includes("rate limit")) {
    return "Çox sayda cəhd etdiniz. Bir az gözləyin.";
  }
  if (normalized.includes("different from the old password")) {
    return "Yeni şifrə köhnə şifrədən fərqli olmalıdır.";
  }
  if (normalized.includes("auth session missing")) {
    return "Sessiyanın vaxtı bitib. Şifrəni bərpa etməyə yenidən başlayın.";
  }
  if (normalized.includes("password")) {
    return "Şifrə ən azı 6 simvol olmalıdır.";
  }
  if (normalized.includes("invalid email")) {
    return "Email formatı düzgün deyil.";
  }

  console.error("[auth.error]", message);
  return GENERIC_AUTH_ERROR;
}
