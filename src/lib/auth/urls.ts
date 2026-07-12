/**
 * Returns the app base URL without trailing slash.
 * On Vercel, auto-detects production URL when env is missing or still points to localhost.
 */
export function getAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim()
    .split(/\s+/)[0]
    ?.replace(/\/+$/, "");

  if (process.env.VERCEL) {
    const vercelHost =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim();

    if (vercelHost) {
      const vercelBase = `https://${vercelHost.replace(/\/+$/, "")}`;
      if (explicit && !explicit.includes("localhost")) {
        return explicit;
      }
      return vercelBase;
    }
  }

  if (explicit) return explicit;
  return "http://localhost:3000";
}

export function getAuthCallbackUrl() {
  return `${getAppUrl()}/auth/callback`;
}

export function getAuthConfirmUrl() {
  return `${getAppUrl()}/auth/confirm`;
}

function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseEnvError(): string | null {
  if (!hasSupabaseEnv()) {
    return "Supabase konfiqurasiyası tapılmadı. Vercel environment variables yoxlanmalıdır.";
  }
  return null;
}
