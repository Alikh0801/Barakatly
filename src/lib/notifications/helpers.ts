import { createAdminClient } from "@/lib/supabase/admin";
import { adminLinkForType, sendAdminTelegram } from "@/lib/notifications/telegram";
import type { NotificationType } from "@/types";

export async function notifyAdmins(params: {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}) {
  try {
    const admin = createAdminClient();
    const { data: admins, error } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error || !admins?.length) {
      console.error("[notifications.notifyAdmins]", error?.message);
      return;
    }

    const { error: insertError } = await admin.from("notifications").insert(
      admins.map((adminUser) => ({
        user_id: adminUser.id,
        title: params.title,
        body: params.body,
        type: params.type,
        metadata: params.metadata ?? {},
      })),
    );

    if (insertError) {
      console.error("[notifications.notifyAdmins.insert]", insertError.message);
    }

    // Also push to Telegram (no-op if Telegram isn't configured).
    await sendAdminTelegram(
      `🔔 ${params.title}\n${params.body}\n\n${adminLinkForType(params.type)}`,
    );
  } catch (error) {
    console.error("[notifications.notifyAdmins]", error);
  }
}

export async function insertEventAndNotify(params: {
  orderId: string;
  customerId: string;
  status: string;
  note: string;
  changedBy: string;
  orderItemId?: string | null;
  notification?: {
    type: NotificationType;
    title: string;
    body: string;
  } | null;
}) {
  // Events and notifications are written only from the server: the API
  // can't insert them (migration 20261030120000). Every caller is a server
  // action that has already checked the farmer, courier or admin may touch
  // this order.
  const supabase = createAdminClient();

  const { error: eventError } = await supabase
    .from("order_status_events")
    .insert({
      order_id: params.orderId,
      order_item_id: params.orderItemId ?? null,
      status: params.status,
      changed_by: params.changedBy,
      note: params.note,
    });

  if (eventError) {
    console.error("[notifications.insertEventAndNotify.event]", eventError.message);
  }

  if (params.notification) {
    const { error: notifyError } = await supabase.from("notifications").insert({
      user_id: params.customerId,
      title: params.notification.title,
      body: params.notification.body,
      type: params.notification.type,
      metadata: { order_id: params.orderId },
    });

    if (notifyError) {
      console.error(
        "[notifications.insertEventAndNotify.notify]",
        notifyError.message,
      );
    }
  }
}

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}) {
  // Server only, like insertEventAndNotify: callers are admin and courier
  // actions that pick the recipient themselves.
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("[notifications.notifyUser]", error.message);
  }
}
