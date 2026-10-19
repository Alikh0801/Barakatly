"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

/** Marks this admin's farmer status-change notifications as seen. */
export async function markFarmerOrderUpdatesSeen() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null)
    .not("metadata->>item_status", "is", null);

  if (error) {
    console.error("[admin.markFarmerOrderUpdatesSeen]", error.message);
    return;
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/notifications");
}
