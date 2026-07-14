import Link from "next/link";
import { Suspense } from "react";
import { AuthNav } from "@/components/AuthNav";
import { CartNav } from "@/components/CartNav";
import { MobileNav } from "@/components/MobileNav";
import { NavLink } from "@/components/navigation/NavLink";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AuthNavSkeleton } from "@/components/skeletons";

function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

export function SiteHeader({
  variant = "hero",
}: {
  variant?: "hero" | "solid";
}) {
  const isHero = variant === "hero";

  const headerClass = isHero
    ? "absolute inset-x-0 top-0 z-20"
    : "sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur";

  const logoText = isHero ? "text-white" : "text-emerald-800";
  const navText = isHero
    ? "text-white/90 hover:text-white"
    : "text-zinc-600 hover:text-zinc-900";
  const iconClass = isHero
    ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
    : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200";

  return (
    <header className={headerClass}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 md:px-6">
        <Link
          href="/"
          prefetch
          className={`inline-flex min-w-0 items-center gap-2 font-semibold tracking-tight ${logoText}`}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/90 ring-1 ring-emerald-300/40">
            <span aria-hidden="true" className="text-base">
              🌿
            </span>
          </span>
          <span className={isHero ? "drop-shadow-sm" : ""}>Barakatly</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <NavLink className={navText} href="/shop">
            Mağaza
          </NavLink>
          <NavLink className={navText} href="/farmers">
            Fermerlər
          </NavLink>
          <NavLink className={navText} href="/about">
            Haqqımızda
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <MobileNav variant={variant} />
          <NavLink href="/shop" aria-label="Axtarış" className="hidden sm:inline-flex">
            <Icon className={iconClass}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                <path d="M16.5 16.5 21 21" strokeLinecap="round" />
              </svg>
            </Icon>
          </NavLink>
          <CartNav variant={variant} />
          <NotificationBell variant={variant} />
          <Suspense fallback={<AuthNavSkeleton variant={variant} />}>
            <AuthNav variant={variant} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
