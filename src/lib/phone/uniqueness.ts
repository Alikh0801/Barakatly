import { createAdminClient } from "@/lib/supabase/admin";

/**
 * True when the (normalized) phone already belongs to a different profile.
 *
 * Uses the service-role client on purpose: profiles RLS only lets a user read
 * their own row, so a user-scoped query could never see another account's
 * phone. The DB partial unique index is the hard guarantee; this gives a clear
 * message before we hit it.
 */
export async function isPhoneTakenByAnother(
  phone: string,
  exceptUserId?: string,
): Promise<boolean> {
  if (!phone) return false;

  const admin = createAdminClient();
  let query = admin.from("profiles").select("id").eq("phone", phone);
  if (exceptUserId) query = query.neq("id", exceptUserId);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error("[phone.isPhoneTakenByAnother]", error.message);
    return false; // fail open — the unique index still blocks duplicates
  }
  return Boolean(data);
}
