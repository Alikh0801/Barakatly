"use client";

import { create } from "zustand";

type WishlistState = {
  /** null until loaded, or for guests (who have no list). */
  ids: Set<string> | null;
  /** Whether the first load has answered, so a guest can be told apart. */
  loaded: boolean;
  signedIn: boolean;
  /** Products hearted since the page was opened (see FavoritesList). */
  addedThisVisit: Set<string>;
  set: (ids: string[] | null) => void;
  toggleLocal: (productId: string, saved: boolean) => void;
};

/**
 * Which products the visitor has hearted, shared by every card on the
 * page. Loaded once per visit by WishlistLoader; hearts update it at once
 * and roll back if the server refuses.
 */
export const useWishlist = create<WishlistState>((set) => ({
  ids: null,
  loaded: false,
  signedIn: false,
  addedThisVisit: new Set(),
  set: (ids) =>
    set((state) => {
      // Keep hearts tapped while the first load was still on its way.
      const merged = ids ? new Set([...ids, ...state.addedThisVisit]) : null;
      return { ids: merged, loaded: true, signedIn: ids !== null };
    }),
  toggleLocal: (productId, saved) =>
    set((state) => {
      const next = new Set(state.ids ?? []);
      const added = new Set(state.addedThisVisit);
      if (saved) {
        next.add(productId);
        added.add(productId);
      } else {
        next.delete(productId);
        added.delete(productId);
      }
      return { ids: next, addedThisVisit: added };
    }),
}));

export async function fetchWishlistIds(): Promise<string[] | null> {
  const response = await fetch("/api/wishlist", { cache: "no-store" });
  if (!response.ok) throw new Error(`wishlist ${response.status}`);
  const body = (await response.json()) as { ids: string[] | null };
  return body.ids;
}

export type WishlistSaveResult = "ok" | "needs-auth" | "error";

export async function saveWishlisted(productId: string, save: boolean): Promise<WishlistSaveResult> {
  try {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, save }),
    });
    if (response.status === 401) return "needs-auth";
    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
