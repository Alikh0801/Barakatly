import { createClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http/same-origin";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  // Only this site's own sign-out form: another site posting here could
  // otherwise sign the visitor out.
  if (!sameOrigin(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
