"use client";

import { usePathname, useRouter } from "next/navigation";
import { saveWishlisted, useWishlist } from "@/lib/wishlist/store";

/**
 * Requests for one product go out one after another, so they cannot reach
 * the server out of order, and a tap overtaken by a newer one is skipped:
 * only the latest state is sent, and only its failure rolls the heart back.
 */
const latestTap = new Map<string, number>();
const queue = new Map<string, Promise<unknown>>();
let tapCounter = 0;

function sendLatest(productId: string, tap: number, save: boolean) {
  const run = (queue.get(productId) ?? Promise.resolve()).then(() =>
    latestTap.get(productId) === tap ? saveWishlisted(productId, save) : "skipped",
  );
  queue.set(productId, run);
  return run;
}

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
  const saved = useWishlist((state) => state.ids?.has(productId) ?? false);
  const loaded = useWishlist((state) => state.loaded);
  const signedIn = useWishlist((state) => state.signedIn);
  const toggleLocal = useWishlist((state) => state.toggleLocal);

  function goToSignIn() {
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
  }

  async function toggle() {
    // Before the first load answers, try anyway: the server says if the
    // visitor is a guest.
    if (loaded && !signedIn) {
      goToSignIn();
      return;
    }
    const next = !saved;
    const tap = ++tapCounter;
    latestTap.set(productId, tap);
    // The heart changes at once; the request follows in the background.
    toggleLocal(productId, next);

    const result = await sendLatest(productId, tap, next);
    if (result !== "error" && result !== "needs-auth") return;
    if (latestTap.get(productId) !== tap) return;
    toggleLocal(productId, !next);
    if (result === "needs-auth") goToSignIn();
  }

  return (
    <button
      type="button"
      data-static-hover
      onClick={toggle}
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
