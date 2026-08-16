"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Daxil olmalısınız." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("[notifications.markNotificationRead]", error.message);
    return { error: "Bildiriş yenilənmədi." };
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const profile = await getProfile();
  if (!profile) return { error: "Daxil olmalısınız." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    console.error("[notifications.markAllNotificationsRead]", error.message);
    return { error: "Bildirişlər yenilənmədi." };
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const profile = await getProfile();
  if (!profile) return { error: "Daxil olmalısınız." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", profile.id);

  if (error) {
    console.error("[notifications.deleteNotification]", error.message);
    return { error: "Bildiriş silinmədi." };
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAllNotifications() {
  const profile = await getProfile();
  if (!profile) return { error: "Daxil olmalısınız." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", profile.id);

  if (error) {
    console.error("[notifications.deleteAllNotifications]", error.message);
    return { error: "Bildirişlər silinmədi." };
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  return { success: true };
}
