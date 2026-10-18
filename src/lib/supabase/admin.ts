import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { IS_PRE } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // The test site can carry its own key under a separate name, for when
  // the dashboard won't let a branch override SUPABASE_SERVICE_ROLE_KEY.
  const key =
    (IS_PRE && process.env.SUPABASE_SERVICE_ROLE_KEY_PRE) ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY konfiqurasiya olunmayıb.");
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
