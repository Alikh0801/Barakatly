"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Prefetch only public routes — avoid auth/checkout noise for every visitor. */
const PREFETCH_ROUTES = ["/shop", "/farmers", "/about", "/cart", "/search"];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const runPrefetch = () => {
      for (const route of PREFETCH_ROUTES) {
        router.prefetch(route);
      }
    };

    const timeout = globalThis.setTimeout(runPrefetch, 1200);
    return () => globalThis.clearTimeout(timeout);
  }, [router]);

  return null;
}
