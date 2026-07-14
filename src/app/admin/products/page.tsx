import { AdminProductsPanel } from "@/components/admin/AdminPortalPanels";
import { getAdminPendingProducts } from "@/lib/admin/queries";

export const metadata = { title: "Məhsullar — Admin" };

export default async function AdminProductsPage() {
  const products = await getAdminPendingProducts();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Gözləyən məhsullar</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Final qiymət təyin edib mağazaya buraxın
      </p>
      <div className="mt-8">
        <AdminProductsPanel products={products} />
      </div>
    </div>
  );
}
