import { AdminBanksPanel } from "@/components/admin/AdminBanksPanel";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminBanks } from "@/lib/admin/queries";

export const metadata = {
  title: "Kartlar - Admin",
};

export default async function AdminBanksPage() {
  await requireAdmin();
  const banks = await getAdminBanks();

  return (
    <AdminPageShell
      title="Kartlar"
    >
      <AdminBanksPanel banks={banks} />
    </AdminPageShell>
  );
}
