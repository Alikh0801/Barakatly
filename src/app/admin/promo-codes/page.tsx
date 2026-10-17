import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { getAdminPromoCodes } from "@/lib/admin/promo-queries";

export const metadata = { title: "Promokodlar - Admin" };

export default async function AdminPromoCodesPage() {
  const promoCodes = await getAdminPromoCodes();

  return (
    <AdminPageShell
      title="Promokodlar"
    >
      <AdminPromoCodesPanel promoCodes={promoCodes} />
    </AdminPageShell>
  );
}
