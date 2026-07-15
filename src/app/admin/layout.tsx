import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-800"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
              🌿
            </span>
            Admin · Barakatly
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <Link href="/admin/payments" className="text-zinc-600 hover:text-zinc-900">
              Ödənişlər
            </Link>
            <Link href="/admin/orders" className="text-zinc-600 hover:text-zinc-900">
              Sifarişlər
            </Link>
            <Link href="/admin/farmers" className="text-zinc-600 hover:text-zinc-900">
              Fermerlər
            </Link>
            <Link href="/admin/products" className="text-zinc-600 hover:text-zinc-900">
              Məhsullar
            </Link>
            <Link href="/admin/categories" className="text-zinc-600 hover:text-zinc-900">
              Kateqoriyalar
            </Link>
            <Link href="/admin/couriers" className="text-zinc-600 hover:text-zinc-900">
              Kuryerlər
            </Link>
            <Link href="/" className="text-zinc-600 hover:text-zinc-900">
              Sayt
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
