import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";

/**
 * Refreshes the session and passes the request on. `requestHeaders` are
 * added to what the page sees (the CSP with its nonce, see proxy.ts).
 */
export async function updateSession(request: NextRequest, requestHeaders: Record<string, string> = {}) {
  const forward = () => {
    const headers = new Headers(request.headers);
    for (const [name, value] of Object.entries(requestHeaders)) headers.set(name, value);
    return NextResponse.next({ request: { headers } });
  };
  let supabaseResponse = forward();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = forward();
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refreshes an expired session and writes the new cookies. getClaims()
  // checks the token locally against the project's cached signing keys and
  // only calls Supabase when the token needs refreshing, so pages don't wait
  // on the Auth server before their first byte.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
