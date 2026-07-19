import type { Notification, NotificationType, UserRole } from "@/types";

function metadataString(
  metadata: Notification["metadata"],
  key: string,
): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getNotificationOrderId(
  metadata: Notification["metadata"],
): string | null {
  return metadataString(metadata, "order_id");
}

/** Role-aware destination for notification action links. */
export function getNotificationHref(
  notification: Pick<Notification, "type" | "metadata">,
  role: UserRole,
): string | null {
  const orderId = getNotificationOrderId(notification.metadata);
  const productId = metadataString(notification.metadata, "product_id");
  const type = notification.type as NotificationType;

  if (role === "admin") {
    switch (type) {
      case "payment_received":
        return "/admin/payments";
      case "farmer_registration":
        return "/admin/farmers";
      case "product_submission":
        return "/admin/products";
      case "order_confirmed":
      case "order_prepared":
      case "order_picked_up":
      case "order_delivered":
        return "/admin/orders";
      default:
        if (orderId) return "/admin/orders";
        if (productId) return "/admin/products";
        return null;
    }
  }

  if (role === "farmer") {
    if (orderId || type.startsWith("order_")) return "/farmer/orders";
    if (productId || type === "product_approval") return "/farmer/products";
    return "/farmer";
  }

  if (role === "courier") {
    if (orderId || type.startsWith("order_")) return "/courier";
    return "/courier";
  }

  // customer
  if (orderId) return `/orders/${orderId}`;
  return null;
}

export function getNotificationActionLabel(
  notification: Pick<Notification, "type">,
  role: UserRole,
): string {
  if (role === "admin") {
    switch (notification.type) {
      case "payment_received":
        return "Ödənişə bax";
      case "farmer_registration":
        return "Fermerlərə bax";
      case "product_submission":
        return "Məhsullara bax";
      default:
        return "Sifarişlərə bax";
    }
  }

  if (role === "farmer") {
    if (notification.type === "product_approval") return "Məhsullara bax";
    return "Sifarişlərə bax";
  }

  return "Sifarişə bax";
}
