import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { requireAdmin } from "@/lib/admin/auth";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { getAdminPromoCodes } from "@/lib/admin/promo-queries";

export const metadata = { title: "Promokodlar - Admin" };

export default async function AdminPromoCodesPage() {
  await requireAdmin();
  const promoCodes = await getAdminPromoCodes();

  return (
    <AdminPageShell
      title="Promokodlar"
    >
      <AdminPromoCodesPanel promoCodes={promoCodes} />
    </AdminPageShell>
  );
}
