/**
 * A link stored by a user (a map link, an uploaded file) as an href only
 * when it is http(s): anything else, `javascript:` above all, comes back
 * null and the caller shows plain text instead of a link. React 19 only
 * warns about such hrefs, and the site has no CSP to stop them.
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}
