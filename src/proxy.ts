import { type NextRequest } from "next/server";
import { preAccessDenied } from "@/lib/pre-access";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // The test site asks for the testers' login before anything else.
  const denied = preAccessDenied(request);
  if (denied) return denied;

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
