import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user, from a verified token. getSession() would hand back
 * whatever the cookie says without checking it; getClaims() checks the
 * token's signature (locally, against the project's signing keys) first.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return { id: claims.sub, email: typeof claims.email === "string" && claims.email ? claims.email : null };
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});
