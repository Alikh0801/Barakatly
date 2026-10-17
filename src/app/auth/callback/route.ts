import { NextResponse } from "next/server";
import { ensureFarmerRecord } from "@/lib/farmer/ensure";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

async function finalizeAuthSession(origin: string, next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureFarmerRecord(user.id);
  }

  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/shop";
  return NextResponse.redirect(`${origin}${safeNext}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/shop";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return finalizeAuthSession(origin, next);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return finalizeAuthSession(origin, next);
    }
  }

  // An expired password reset link goes back to the reset form, where the
  // 6-digit code from the same email still works.
  if (next === "/reset-password" || type === "recovery") {
    return NextResponse.redirect(`${origin}/forgot-password?error=link-expired`);
  }

  return NextResponse.redirect(
    `${origin}/signin?error=auth&message=link-expired`
  );
}
