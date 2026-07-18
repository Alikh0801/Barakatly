import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  AdminApprovedProductsPanel,
  AdminProductsPanel,
} from "@/components/admin/AdminPortalPanels";
import {
  getAdminApprovedProducts,
  getAdminPendingProducts,
} from "@/lib/admin/queries";

export const metadata = { title: "Məhsullar — Admin" };

export default async function AdminProductsPage() {
  const [pending, approved] = await Promise.all([
    getAdminPendingProducts(),
    getAdminApprovedProducts(),
  ]);

  return (
    <AdminPageShell
      title="Məhsullar"
      description="Gözləyən məhsulları təsdiqləyin və təsdiqlənmişlərin son qiymətini yeniləyin"
    >
      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Gözləyən təsdiqlər
          </h2>
          <AdminProductsPanel products={pending} />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Təsdiqlənmiş məhsullar — qiymət yenilə
          </h2>
          <AdminApprovedProductsPanel products={approved} />
        </section>
      </div>
    </AdminPageShell>
  );
}
