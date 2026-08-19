import { AdminBanksPanel } from "@/components/admin/AdminBanksPanel";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminBanks } from "@/lib/admin/queries";

export const metadata = {
  title: "Kartlar — Admin",
};

export default async function AdminBanksPage() {
  const banks = await getAdminBanks();

  return (
    <AdminPageShell
      title="Kartlar"
      description="Müştərilərə göstərilən ödəniş kartlarını idarə edin"
    >
      <AdminBanksPanel banks={banks} />
    </AdminPageShell>
  );
}
