import { IS_PRE } from "@/lib/env";

/**
 * The Content-Security-Policy, built per request with that request's nonce.
 *
 * Sent as Content-Security-Policy-Report-Only for now: the browser blocks
 * nothing and reports what it would have blocked to /api/csp-report (Vercel
 * logs). Once the reports are clean, CSP_ENFORCE turns it into the real
 * header. Next.js reads the nonce from either header and puts it on its own
 * scripts.
 */
export const CSP_ENFORCE = false;
export const CSP_HEADER = CSP_ENFORCE ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
export const CSP_REPORT_PATH = "/api/csp-report";

/**
 * Pictures and videos may sit in either Supabase project: the test site's
 * data is copied from the live one. The database allows the same
 * (migration 20261102120000).
 */
const SUPABASE_STORAGE = "https://*.supabase.co";

function supabaseOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
}

export function contentSecurityPolicy(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = supabaseOrigin();
  const supabaseWs = supabase?.replace(/^http/, "ws");
  // The Vercel toolbar on the test site (comments, deployment info).
  const vercelLive = IS_PRE ? ["https://vercel.live"] : [];

  const directives: Record<string, (string | null | undefined)[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "https://challenges.cloudflare.com",
      ...vercelLive,
      // React's dev tooling evaluates code; production never does.
      isDev ? "'unsafe-eval'" : null,
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabase, SUPABASE_STORAGE, "https://images.unsplash.com", ...vercelLive, IS_PRE ? "https://vercel.com" : null],
    "media-src": ["'self'", "blob:", supabase, SUPABASE_STORAGE],
    "font-src": ["'self'", ...vercelLive],
    "connect-src": ["'self'", supabase, supabaseWs, ...vercelLive, IS_PRE ? "wss://ws-us3.pusher.com" : null],
    "frame-src": ["https://challenges.cloudflare.com", ...vercelLive],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "report-uri": [CSP_REPORT_PATH],
  };

  return Object.entries(directives)
    .map(([name, values]) => [name, ...values.filter(Boolean)].join(" "))
    .join("; ");
}

/** A fresh, unguessable nonce for one response. */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
