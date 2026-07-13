"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cart";

export function useCartHydrated() {
  return useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
