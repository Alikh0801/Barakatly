"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PREFETCH_ROUTES = ["/shop", "/cart", "/checkout", "/orders", "/account"];

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
