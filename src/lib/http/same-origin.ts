/**
 * Whether a state-changing request came from this site: its Origin header
 * names the host it was sent to. Browsers send Origin on every POST, so a
 * missing one is refused too.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
