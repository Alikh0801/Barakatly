import Link from "next/link";
import {
  getAdminCouriers,
  getAdminFarmers,
  getAdminOrders,
  getAdminPendingProducts,
  getPendingPayments,
} from "@/lib/admin/queries";

export const metadata = {
  title: "Admin — BARAKATLY",
};

export default async function AdminPage() {
  const [payments, orders, farmers, products, couriers] = await Promise.all([
    getPendingPayments(),
    getAdminOrders(),
    getAdminFarmers(),
    getAdminPendingProducts(),
    getAdminCouriers(),
  ]);

  const activeOrders = orders.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  ).length;
  const pendingFarmers = farmers.filter((farmer) => farmer.status === "pending").length;

  const tiles = [
    { href: "/admin/payments", label: "Gözləyən ödənişlər", value: payments.length },
    { href: "/admin/orders", label: "Aktiv sifarişlər", value: activeOrders },
    { href: "/admin/farmers", label: "Gözləyən fermerlər", value: pendingFarmers },
    { href: "/admin/products", label: "Gözləyən məhsullar", value: products.length },
    { href: "/admin/couriers", label: "Kuryerlər", value: couriers.length },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Admin panel
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Ödəniş, sifariş, fermer, məhsul və kuryer idarəsi
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
          >
            <div className="text-sm text-zinc-500">{tile.label}</div>
            <div className="mt-2 text-3xl font-semibold text-zinc-900">
              {tile.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
