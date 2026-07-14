import Link from "next/link";
import { FarmerPendingCard } from "@/components/farmer/FarmerPanels";
import { requireFarmer } from "@/lib/farmer/auth";
import {
  getFarmerOrderItems,
  getFarmerProducts,
} from "@/lib/farmer/queries";

export const metadata = { title: "Fermer paneli — BARAKATLY" };

export default async function FarmerDashboardPage() {
  const { farmer } = await requireFarmer();

  if (farmer.status !== "approved") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-semibold text-zinc-900">Fermer paneli</h1>
        <div className="mt-8">
          <FarmerPendingCard farmer={farmer} />
        </div>
      </div>
    );
  }

  const [products, items] = await Promise.all([
    getFarmerProducts(farmer.id),
    getFarmerOrderItems(farmer.id),
  ]);

  const pendingProducts = products.filter((p) => p.status === "pending").length;
  const activeItems = items.filter(
    (item) => !["picked_up", "delivered"].includes(item.status)
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">{farmer.farm_name}</h1>
      <p className="mt-2 text-sm text-zinc-500">Fermer paneli</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/farmer/products"
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <div className="text-sm text-zinc-500">Məhsullar</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">
            {products.length}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {pendingProducts} gözləyən
          </div>
        </Link>
        <Link
          href="/farmer/orders"
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <div className="text-sm text-zinc-500">Aktiv sifarişlər</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">
            {activeItems}
          </div>
        </Link>
        <Link
          href="/farmer/products/new"
          className="rounded-3xl bg-emerald-600 p-6 text-white shadow-sm"
        >
          <div className="text-sm text-emerald-100">Yeni məhsul</div>
          <div className="mt-2 text-xl font-semibold">Əlavə et →</div>
        </Link>
      </div>
    </div>
  );
}
