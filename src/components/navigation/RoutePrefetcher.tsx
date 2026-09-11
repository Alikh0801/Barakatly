"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Prefetch only public routes — avoid auth/checkout noise for every visitor.
 * Kept short: each entry is an extra RSC request competing with the page's
 * own images on a throttled mobile connection.
 */
const PREFETCH_ROUTES = ["/shop", "/cart"];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const runPrefetch = () => {
      for (const route of PREFETCH_ROUTES) {
        router.prefetch(route);
      }
    };

    // Wait for an idle moment instead of a fixed delay, so prefetching can
    // never start while the browser is still painting the hero.
    if (typeof globalThis.requestIdleCallback === "function") {
      const handle = globalThis.requestIdleCallback(runPrefetch, {
        timeout: 5000,
      });
      return () => globalThis.cancelIdleCallback(handle);
    }

    const timeout = globalThis.setTimeout(runPrefetch, 3000);
    return () => globalThis.clearTimeout(timeout);
  }, [router]);

  return null;
}
