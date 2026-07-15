import { AdminOrdersPanel } from "@/components/admin/AdminPanels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminOrders } from "@/lib/admin/queries";

export const metadata = {
  title: "Sifarişlər — Admin",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <AdminPageShell
      title="Sifarişlər"
      description="Status keçidlərini idarə edin və müştərilərə bildiriş göndərin"
    >
      <AdminOrdersPanel orders={orders} />
    </AdminPageShell>
  );
}
