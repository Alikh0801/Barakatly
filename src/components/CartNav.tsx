"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useCartHydrated } from "@/hooks/useCartHydrated";
import { Skeleton } from "@/components/ui/Skeleton";

export function CartNav({
  variant = "hero",
}: {
  variant?: "hero" | "solid";
}) {
  const hydrated = useCartHydrated();
  const totalItems = useCartStore((s) => s.totalItems());

  const iconWrap =
    variant === "hero"
      ? "relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/15"
      : "relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200";

  return (
    <Link href="/cart" aria-label="Səbət" className={iconWrap}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path
          d="M7 7h14l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L5 3H2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
        <path d="M17.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
      {hydrated ? (
        totalItems > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
            {totalItems > 9 ? "9+" : totalItems}
          </span>
        ) : null
      ) : (
        <Skeleton className="absolute -right-1 -top-1 h-4 w-4 rounded-full" />
      )}
    </Link>
  );
}
