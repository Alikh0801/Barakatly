import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminCouriersPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminCouriers } from "@/lib/admin/queries";

export const metadata = { title: "Kuryerlər — Admin" };

export default async function AdminCouriersPage() {
  const couriers = await getAdminCouriers();

  return (
    <AdminPageShell
      title="Kuryerlər"
      description="Kuryer hesabları yaradın və aktivliyi idarə edin"
    >
      <AdminCouriersPanel couriers={couriers} />
    </AdminPageShell>
  );
}