import { AdminOrdersPanel } from "@/components/admin/AdminPanels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminOrders, getUnseenFarmerOrderUpdates } from "@/lib/admin/queries";
import { firstPayment } from "@/lib/orders/payment";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sifarişlər - Admin",
};

export default async function AdminOrdersPage() {
  const [orders, farmerUpdates] = await Promise.all([
    getAdminOrders(),
    getUnseenFarmerOrderUpdates(),
  ]);
  const supabase = await createClient();

  const ordersWithReceipts = await Promise.all(
    orders.map(async (order) => {
      const receiptPath = firstPayment(order.payments)?.receipt_url ?? null;
      let receiptSignedUrl: string | null = null;
      if (receiptPath) {
        const { data } = await supabase.storage
          .from("payment-receipts")
          .createSignedUrl(receiptPath, 3600);
        receiptSignedUrl = data?.signedUrl ?? null;
      }
      return { ...order, receiptSignedUrl };
    })
  );

  return (
    <AdminPageShell
      title="Sifarişlər"
    >
      <AdminOrdersPanel orders={ordersWithReceipts} farmerUpdates={farmerUpdates} />
    </AdminPageShell>
  );
}
