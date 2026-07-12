/**
 * Returns a clean app base URL without trailing slash.
 * Guards against accidental spaces or multiple URLs in env values.
 */
export function getAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
  const first = raw.split(/\s+/)[0]?.trim() ?? "http://localhost:3000";
  return first.replace(/\/+$/, "");
}

export function getAuthCallbackUrl() {
  return `${getAppUrl()}/auth/callback`;
}

export function getAuthConfirmUrl() {
  return `${getAppUrl()}/auth/confirm`;
}
