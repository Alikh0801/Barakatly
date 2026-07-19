import { AdminOrdersPanel } from "@/components/admin/AdminPanels";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminOrders } from "@/lib/admin/queries";

export const metadata = {
  title: "Sifarişlər — Admin",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const orders = await getAdminOrders(query);

  return (
    <AdminPageShell
      title="Sifarişlər"
      description="Axtarın, keçmişə baxın, fermer statusunu izləyin və sifariş statusunu müştəriyə göstərin"
    >
      <AdminOrdersPanel orders={orders} query={query} />
    </AdminPageShell>
  );
}
