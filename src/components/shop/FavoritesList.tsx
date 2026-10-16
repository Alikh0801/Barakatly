"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useWishlist } from "@/lib/wishlist/store";

/**
 * The favourites page is rendered on the server, but follows the hearts on
 * it: a card whose heart is tapped off leaves at once, without waiting for
 * the page to render again.
 */
function useVisibleIds(productIds: string[]) {
  const ids = useWishlist((state) => state.ids);
  const loaded = useWishlist((state) => state.loaded);
  if (!loaded || !ids) return productIds;
  return productIds.filter((id) => ids.has(id));
}

export function FavoritesCount({ productIds }: { productIds: string[] }) {
  const router = useRouter();
  const visible = useVisibleIds(productIds);
  const addedThisVisit = useWishlist((state) => state.addedThisVisit);
  const refreshed = useRef(false);

  // The browser may show this page from its short-lived cache; a product
  // hearted elsewhere since then is fetched with one refresh.
  useEffect(() => {
    if (refreshed.current) return;
    if ([...addedThisVisit].some((id) => !productIds.includes(id))) {
      refreshed.current = true;
      router.refresh();
    }
  }, [addedThisVisit, productIds, router]);

  if (visible.length === 0) return null;
  return <p className="mt-2 text-sm text-zinc-500">{visible.length} məhsul</p>;
}

export function FavoriteItem({
  productId,
  children,
}: {
  productId: string;
  children: React.ReactNode;
}) {
  const ids = useWishlist((state) => state.ids);
  const loaded = useWishlist((state) => state.loaded);
  if (loaded && ids && !ids.has(productId)) return null;
  return <>{children}</>;
}

/** Shows `children` (the grid) while something is left, `empty` once nothing is. */
export function FavoritesSwitch({
  productIds,
  empty,
  children,
}: {
  productIds: string[];
  empty: React.ReactNode;
  children: React.ReactNode;
}) {
  const visible = useVisibleIds(productIds);
  return <>{visible.length === 0 ? empty : children}</>;
}
