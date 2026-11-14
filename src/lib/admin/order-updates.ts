import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Farmer and courier updates on an order reach the admins as notifications
 * with an `item_status`. They stay unread, red on the orders page and in the
 * sidebar badge, until an admin acts on the order for the customer; this
 * marks them read then. Every admin gets their own copy, and one admin
 * acting settles it for all of them.
 *
 * With `orderItemId`, only the updates about that line of the order.
 */
export async function clearOrderUpdates(
  orderIds: string[],
  { orderItemId }: { orderItemId?: string } = {},
) {
  if (orderIds.length === 0) return;

  try {
    const admin = createAdminClient();
    const { data: admins, error } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    if (error || !admins?.length) {
      if (error) console.error("[admin.clearOrderUpdates.admins]", error.message);
      return;
    }

    let query = admin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in(
        "user_id",
        admins.map((row) => row.id),
      )
      .is("read_at", null)
      .not("metadata->>item_status", "is", null)
      .in("metadata->>order_id", orderIds);
    if (orderItemId) query = query.eq("metadata->>order_item_id", orderItemId);

    const { error: updateError } = await query;
    if (updateError) {
      console.error("[admin.clearOrderUpdates]", updateError.message);
    }
  } catch (error) {
    console.error("[admin.clearOrderUpdates]", error);
  }
}
