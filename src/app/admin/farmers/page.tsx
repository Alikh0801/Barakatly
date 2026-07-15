import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFarmersPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminFarmers } from "@/lib/admin/queries";

export const metadata = { title: "Fermerlər — Admin" };

export default async function AdminFarmersPage() {
  const farmers = await getAdminFarmers();

  return (
    <AdminPageShell
      title="Fermerlər"
      description="Müraciətləri təsdiqləyin və ya rədd edin"
    >
      <AdminFarmersPanel farmers={farmers} />
    </AdminPageShell>
  );
}
