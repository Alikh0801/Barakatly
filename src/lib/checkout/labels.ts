import type { OrderStatus, PaymentStatus } from "@/types";

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "awaiting_confirmation":
      return "Təsdiq gözlənilir";
    case "confirmed":
      return "Təsdiqləndi";
    case "farmer_accepted":
      return "Fermer qəbul etdi";
    case "preparing":
      return "Hazırlanır";
    case "awaiting_courier":
      return "Kuryer tərəfindən götürülməyi gözləyir";
    case "picked_up":
      return "Kuryer yola çıxdı";
    case "delivered":
      return "Çatdırıldı";
    case "cancelled":
      return "Ləğv edildi";
    default:
      return status;
  }
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case "pending":
      return "Yoxlanılır";
    case "confirmed":
      return "Təsdiqləndi";
    case "rejected":
      return "Rədd edildi";
    default:
      return status;
  }
}
