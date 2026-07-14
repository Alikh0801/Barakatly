import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types";

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
  const supabase = await createClient();

  await supabase.from("order_status_events").insert({
    order_id: params.orderId,
    order_item_id: params.orderItemId ?? null,
    status: params.status,
    changed_by: params.changedBy,
    note: params.note,
  });

  if (params.notification) {
    await supabase.from("notifications").insert({
      user_id: params.customerId,
      title: params.notification.title,
      body: params.notification.body,
      type: params.notification.type,
      metadata: { order_id: params.orderId },
    });
  }
}

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, string>;
}) {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    metadata: params.metadata ?? {},
  });
}
