/**
 * The session cookies' flags, the same for the server, the proxy and the
 * browser client. httpOnly stays off: @supabase/ssr's browser client reads
 * the session from them. Secure is left off only in development, where the
 * site runs on plain http://localhost.
 */
export const SUPABASE_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
