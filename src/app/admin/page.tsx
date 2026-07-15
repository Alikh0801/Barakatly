import Link from "next/link";
import {
  getAdminCategories,
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
  const [payments, orders, farmers, products, couriers, categories] =
    await Promise.all([
      getPendingPayments(),
      getAdminOrders(),
      getAdminFarmers(),
      getAdminPendingProducts(),
      getAdminCouriers(),
      getAdminCategories(),
    ]);

  const activeOrders = orders.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  ).length;
  const pendingFarmers = farmers.filter(
    (farmer) => farmer.status === "pending"
  ).length;

  const tiles = [
    {
      href: "/admin/payments",
      label: "Gözləyən ödənişlər",
      value: payments.length,
      hint: "Təsdiq gözləyən",
    },
    {
      href: "/admin/orders",
      label: "Aktiv sifarişlər",
      value: activeOrders,
      hint: "İcrada olan",
    },
    {
      href: "/admin/farmers",
      label: "Gözləyən fermerlər",
      value: pendingFarmers,
      hint: "Yoxlama tələb olunur",
    },
    {
      href: "/admin/products",
      label: "Gözləyən məhsullar",
      value: products.length,
      hint: "Təsdiq gözləyən",
    },
    {
      href: "/admin/categories",
      label: "Kateqoriyalar",
      value: categories.length,
      hint: "Kataloq bölmələri",
    },
    {
      href: "/admin/couriers",
      label: "Kuryerlər",
      value: couriers.length,
      hint: "Çatdırılma komandası",
    },
  ];

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          İcmal
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          İdarə paneli
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Ödəniş, sifariş, fermer, məhsul, kateqoriya və kuryer əməliyyatlarını
          buradan izləyin.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-2xl bg-white p-5 ring-1 ring-zinc-200 transition hover:ring-emerald-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-zinc-600">
                  {tile.label}
                </div>
                <div className="mt-1 text-xs text-zinc-400">{tile.hint}</div>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    d="M9 6h9v9M18 6 6 18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900">
              {tile.value}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
