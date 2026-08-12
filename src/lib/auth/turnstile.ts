const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side, exactly once.
 *
 * We do this ourselves instead of relying on Supabase's built-in captcha
 * protection: GoTrue re-verified the single-use token on its internal
 * email-send retry, which made Cloudflare return `timeout-or-duplicate`.
 * Verifying here once — with Supabase captcha protection turned off — avoids
 * the double spend.
 *
 * When no secret key is configured (e.g. local dev), verification is skipped
 * so the flow is not blocked.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // captcha not configured on this environment
  if (!token) return false;

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("[auth.verifyTurnstileToken]", error);
    return false;
  }
}
