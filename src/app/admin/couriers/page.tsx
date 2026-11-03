import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminCouriersPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminCouriers } from "@/lib/admin/queries";

export const metadata = { title: "Kuryerlər - Admin" };

export default async function AdminCouriersPage() {
  await requireAdmin();
  const couriers = await getAdminCouriers();

  return (
    <AdminPageShell
      title="Kuryerlər"
    >
      <AdminCouriersPanel couriers={couriers} />
    </AdminPageShell>
  );
}