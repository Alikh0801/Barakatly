import type {
  NotificationType,
  OrderItemStatus,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import { getOrderStatusLabel, getPaymentStatusLabel } from "@/lib/checkout/labels";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "awaiting_confirmation",
  "confirmed",
  "farmer_accepted",
  "preparing",
  "picked_up",
  "delivered",
];

export const ADMIN_STATUS_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
  awaiting_confirmation: ["cancelled"],
  confirmed: ["farmer_accepted", "preparing", "cancelled"],
  farmer_accepted: ["preparing", "cancelled"],
  preparing: ["picked_up", "cancelled"],
  picked_up: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const FARMER_ITEM_STATUS_TRANSITIONS: Record<
  OrderItemStatus,
  OrderItemStatus[]
> = {
  new: ["accepted"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: [],
  picked_up: [],
  delivered: [],
};

export const COURIER_ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
  awaiting_confirmation: [],
  confirmed: [],
  farmer_accepted: [],
  preparing: ["picked_up"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function getFarmerStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Gözləyir";
    case "approved":
      return "Təsdiqləndi";
    case "rejected":
      return "Rədd edildi";
    case "suspended":
      return "Dayandırılıb";
    default:
      return status;
  }
}

export function getProductStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Gözləyir";
    case "approved":
      return "Təsdiqləndi";
    case "rejected":
      return "Rədd edildi";
    default:
      return status;
  }
}

export function getOrderItemStatusLabel(status: OrderItemStatus): string {
  switch (status) {
    case "new":
      return "Yeni";
    case "accepted":
      return "Qəbul edildi";
    case "preparing":
      return "Hazırlanır";
    case "ready":
      return "Hazırdır";
    case "picked_up":
      return "Götürüldü";
    case "delivered":
      return "Çatdırıldı";
    default:
      return status;
  }
}

export function getEventStatusLabel(status: string): string {
  const orderStatuses: OrderStatus[] = [
    "awaiting_confirmation",
    "confirmed",
    "farmer_accepted",
    "preparing",
    "picked_up",
    "delivered",
    "cancelled",
  ];

  if (orderStatuses.includes(status as OrderStatus)) {
    return getOrderStatusLabel(status as OrderStatus);
  }

  if (status === "payment_confirmed") return "Ödəniş təsdiqləndi";
  if (status === "payment_rejected") return "Ödəniş rədd edildi";

  return status;
}

export function getPaymentBadgeTone(status: PaymentStatus) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200";
  }
}

export function getOrderStatusTone(status: OrderStatus) {
  switch (status) {
    case "delivered":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "cancelled":
      return "bg-rose-50 text-rose-800 ring-rose-200";
    case "awaiting_confirmation":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
}

export function getNotificationTypeLabel(type: NotificationType): string {
  switch (type) {
    case "payment_received":
      return "Ödəniş";
    case "order_confirmed":
      return "Sifariş təsdiqi";
    case "order_prepared":
      return "Hazırlıq";
    case "order_picked_up":
      return "Çatdırılma";
    case "order_delivered":
      return "Çatdırıldı";
    case "farmer_registration":
      return "Fermer";
    case "farmer_approval":
      return "Fermer";
    case "product_submission":
      return "Məhsul";
    case "product_approval":
      return "Məhsul";
    default:
      return "Bildiriş";
  }
}

export { getOrderStatusLabel, getPaymentStatusLabel };
