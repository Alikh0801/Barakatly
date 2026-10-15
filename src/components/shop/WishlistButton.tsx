"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { setWishlisted } from "@/lib/wishlist/actions";
import { useWishlist } from "@/lib/wishlist/store";

/** Heart on a product card: adds the product to "Sevimlilər" or removes it. */
export function WishlistButton({
  productId,
  productTitle,
  className = "",
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const saved = useWishlist((state) => state.ids?.has(productId) ?? false);
  const signedIn = useWishlist((state) => state.signedIn);
  const toggleLocal = useWishlist((state) => state.toggleLocal);

  function goToSignIn() {
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
  }

  function toggle() {
    if (!signedIn) {
      goToSignIn();
      return;
    }
    const next = !saved;
    toggleLocal(productId, next);
    startTransition(async () => {
      const result = await setWishlisted(productId, next);
      if (!result.ok) {
        toggleLocal(productId, !next);
        if (result.needsAuth) goToSignIn();
        return;
      }
      // The favourites page lists hearted products: drop the card at once.
      if (!next && pathname === "/favorites") router.refresh();
    });
  }

  return (
    <button
      type="button"
      data-static-hover
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `${productTitle} sevimlilərdən çıxar` : `${productTitle} sevimlilərə əlavə et`}
      title={saved ? "Sevimlilərdən çıxar" : "Sevimlilərə əlavə et"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 backdrop-blur transition-colors hover:bg-white ${
        saved ? "text-rose-500" : "text-zinc-500 hover:text-rose-500"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        className={`h-[18px] w-[18px] transition-transform ${saved ? "scale-110" : ""}`}
      >
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
