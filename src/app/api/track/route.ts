import { after, userAgent, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records one page view for the admin "Statistika" page. Called by
 * PageViewTracker with navigator.sendBeacon on every page the visitor opens.
 *
 * Nothing that identifies a person is stored: no user id and no IP. The
 * region comes from Vercel's geo headers, the device from the user agent,
 * and the visitor id is a random id the browser keeps for itself.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 2000;
/** One request in this many also clears rows past the 21-day retention. */
const PURGE_EVERY = 200;

const noContent = () => new Response(null, { status: 204 });

function cleanPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0];
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 300) return null;
  // The admin's own browsing would only skew the numbers.
  if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/")) return null;
  return path;
}

function referrerHost(value: unknown, ownHost: string | null): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    if (!host || host === ownHost?.replace(/^www\./, "")) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

function header(request: NextRequest, name: string): string | null {
  const value = request.headers.get(name);
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return noContent();

  let body: { path?: unknown; referrer?: unknown; visitorId?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return noContent();
  }

  const path = cleanPath(body.path);
  if (!path) return noContent();

  const agent = userAgent(request);
  if (agent.isBot) return noContent();

  const deviceType = agent.device.type;
  const device =
    deviceType === "mobile" || deviceType === "tablet"
      ? deviceType
      : deviceType === undefined
        ? "desktop"
        : "other";

  const user = await getSessionUser();
  const visitorId =
    typeof body.visitorId === "string" && UUID.test(body.visitorId) ? body.visitorId : null;

  const row = {
    path,
    referrer_host: referrerHost(body.referrer, request.nextUrl.hostname),
    country: header(request, "x-vercel-ip-country"),
    region: header(request, "x-vercel-ip-country-region"),
    city: header(request, "x-vercel-ip-city"),
    device,
    browser: agent.browser.name?.slice(0, 40) ?? null,
    os: agent.os.name?.slice(0, 40) ?? null,
    visitor_id: visitorId,
    is_authenticated: Boolean(user),
  } as const;

  // The visitor never waits for the database.
  after(async () => {
    const admin = createAdminClient();

    let viewerRole: string | null = null;
    if (user) {
      const { data } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
      viewerRole = data?.role ?? null;
      if (viewerRole === "admin") return;
    }

    const { error } = await admin.from("page_views").insert({ ...row, viewer_role: viewerRole });
    if (error) console.error("[track]", error.message);

    if (Math.random() < 1 / PURGE_EVERY) {
      const { error: purgeError } = await admin.rpc("purge_old_page_views");
      if (purgeError) console.error("[track.purge]", purgeError.message);
    }
  });

  return noContent();
}
