"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getWishlistIds } from "@/lib/wishlist/actions";
import { useWishlist } from "@/lib/wishlist/store";

/**
 * Loads the visitor's favourites once, so every heart on the page knows
 * whether it is filled. A guest is checked again on navigation: signing in
 * happens without a full page load.
 */
export function WishlistLoader() {
  const pathname = usePathname();
  const signedIn = useWishlist((state) => state.signedIn);
  const setIds = useWishlist((state) => state.set);

  useEffect(() => {
    if (signedIn) return;
    let cancelled = false;
    getWishlistIds()
      .then((ids) => {
        if (!cancelled) setIds(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, signedIn, setIds]);

  return null;
}
