"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { AdminNavBadges } from "@/lib/admin/queries";

type NavItem = {
  href: string;
  label: string;
  badgeKey?: keyof AdminNavBadges;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/admin/payments",
    label: "Ödənişlər",
    badgeKey: "payments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/orders",
    label: "Sifarişlər",
    badgeKey: "orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M7 7h12l-1.2 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.7L6 4H3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </svg>
    ),
  },
  {
    href: "/admin/farmers",
    label: "Fermerlər",
    badgeKey: "farmers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M12 3c2.5 2.8 3.8 5.2 3.8 7.4A3.8 3.8 0 1 1 8.2 10.4C8.2 8.2 9.5 5.8 12 3Z" strokeLinejoin="round" />
        <path d="M12 14v7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/products",
    label: "Məhsullar",
    badgeKey: "products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" strokeLinejoin="round" />
        <path d="M12 20v-7M4 8.5l8 4.5 8-4.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/categories",
    label: "Kateqoriyalar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M4 6h4v4H4V6Zm6 0h4v4h-4V6Zm6 0h4v4h-4V6ZM4 12h4v4H4v-4Zm6 0h4v4h-4v-4Zm6 0h4v4h-4v-4Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/couriers",
    label: "Kuryerlər",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M3 7h11v10H3V7Z" strokeLinejoin="round" />
        <path d="M14 10h4l3 3v4h-7v-7Z" strokeLinejoin="round" />
        <circle cx="7" cy="18.5" r="1.5" />
        <circle cx="17.5" cy="18.5" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/content",
    label: "Məzmun",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="M5 5h14v14H5V5Z" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h8M8 15h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActive(pathname: string, item: NavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function formatBadge(count: number) {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}

export function AdminSidebar({
  badges = { payments: 0, orders: 0, farmers: 0, products: 0 },
}: {
  badges?: AdminNavBadges;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const activeItem = navItems.find((item) => isActive(pathname, item));
  const activeLabel = activeItem?.label ?? "Admin";
  const activeBadge =
    activeItem?.badgeKey != null
      ? formatBadge(badges[activeItem.badgeKey])
      : null;
  const totalPending =
    badges.payments + badges.orders + badges.farmers + badges.products;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:gap-3 sm:px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 ring-1 ring-zinc-200"
          aria-label="Menyunu aç"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
          {totalPending > 0 ? (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          ) : null}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {activeLabel}
            </p>
            {activeBadge ? (
              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
                {activeBadge}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-zinc-500">Admin · Barakatly</p>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-200"
        >
          Sayt
        </Link>
      </header>

      {open ? (
        <button
          type="button"
          aria-label="Menyunu bağla"
          className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-zinc-200 bg-white pt-[env(safe-area-inset-top)] transition-transform duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:w-[260px] lg:translate-x-0 lg:pt-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-5">
          <Link href="/admin/payments" className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                B
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                  Barakatly
                </p>
                <p className="truncate text-xs text-zinc-500">Admin panel</p>
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Bağla"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            İdarəetmə
          </p>
          {navItems.map((item) => {
            const active = isActive(pathname, item);
            const badge =
              item.badgeKey != null ? formatBadge(badges[item.badgeKey]) : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                ].join(" ")}
              >
                <span className={active ? "text-emerald-700" : "text-zinc-400"}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badge ? (
                  <span
                    className={[
                      "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-500 text-white",
                    ].join(" ")}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-zinc-400">
              <path d="M15 6h4v4M19 6l-8 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 19H6a1 1 0 0 1-1-1V7" strokeLinecap="round" />
            </svg>
            Sayta qayıt
          </Link>
        </div>
      </aside>
    </>
  );
}
