/**
 * Where to send someone after signing in: a path on this site, or the
 * fallback. Parsed as a URL against a throw-away origin, so anything a
 * browser would read as another site ("//evil.com", "/\evil.com", a
 * scheme, tabs or newlines in between) comes out with a different origin
 * and is refused. Backslashes are refused outright: browsers treat them as
 * slashes.
 */
export function safeNext(next: string | null | undefined, fallback = "/shop"): string {
  if (!next || next.includes("\\")) return fallback;
  try {
    const url = new URL(next, "https://x.invalid");
    return url.origin === "https://x.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
