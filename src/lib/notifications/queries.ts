import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";
import { getProfile } from "@/lib/auth/session";
import { cache } from "react";

export async function getNotifications(): Promise<Notification[]> {
  const profile = await getProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[notifications.getNotifications]", error.message);
    return [];
  }

  return data ?? [];
}

export const getUnreadNotificationCount = cache(async (): Promise<number> => {
  const profile = await getProfile();
  if (!profile) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("[notifications.getUnreadNotificationCount]", error.message);
    return 0;
  }

  return count ?? 0;
});
