import { AdminOrdersPanel } from "@/components/admin/AdminPanels";
import { getAdminOrders } from "@/lib/admin/queries";

export const metadata = {
  title: "Sifarişlər — Admin",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Sifarişlər
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Status keçidlərini idarə edin və müştərilərə bildiriş göndərin
      </p>
      <div className="mt-8">
        <AdminOrdersPanel orders={orders} />
      </div>
    </div>
  );
}
