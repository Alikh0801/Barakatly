import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminProductsPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminPendingProducts } from "@/lib/admin/queries";

export const metadata = { title: "Məhsullar — Admin" };

export default async function AdminProductsPage() {
  const products = await getAdminPendingProducts();

  return (
    <AdminPageShell
      title="Gözləyən məhsullar"
      description="Final qiymət təyin edib mağazaya buraxın"
    >
      <AdminProductsPanel products={products} />
    </AdminPageShell>
  );
}
