import { type NextRequest } from "next/server";
import { preAccessDenied } from "@/lib/pre-access";
import { CSP_HEADER, contentSecurityPolicy, createNonce } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // The test site asks for the testers' login before anything else.
  const denied = preAccessDenied(request);
  if (denied) return denied;

  // A new nonce for every response. Next.js reads it from the request's
  // CSP header and puts it on its scripts; the browser gets the same policy.
  const nonce = createNonce();
  const csp = contentSecurityPolicy(nonce);

  const response = await updateSession(request, { [CSP_HEADER]: csp, "x-nonce": nonce });
  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
