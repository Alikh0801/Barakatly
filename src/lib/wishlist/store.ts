"use client";

import { create } from "zustand";

type WishlistState = {
  /** null until loaded, or for guests (who have no list). */
  ids: Set<string> | null;
  signedIn: boolean;
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
  signedIn: false,
  set: (ids) => set({ ids: ids ? new Set(ids) : null, signedIn: ids !== null }),
  toggleLocal: (productId, saved) =>
    set((state) => {
      const next = new Set(state.ids ?? []);
      if (saved) next.add(productId);
      else next.delete(productId);
      return { ids: next };
    }),
}));
