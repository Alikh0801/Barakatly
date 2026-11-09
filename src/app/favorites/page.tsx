import Link from "next/link";
import { redirect } from "next/navigation";
import { AppProductCard } from "@/components/app/AppShop";
import { AppScreenHeader } from "@/components/app/AppScreenHeader";
import { HeartIcon } from "@/components/app/icons";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { WishlistButton } from "@/components/shop/WishlistButton";
import {
  FavoriteItem,
  FavoritesCount,
  FavoritesSwitch,
} from "@/components/shop/FavoritesList";
import { getProfile } from "@/lib/auth/session";
import { getWishlistProducts } from "@/lib/wishlist/queries";

export const metadata = {
  title: "Sevimlilər",
};

export default async function FavoritesPage() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/signin?next=/favorites");
  }

  const products = await getWishlistProducts(profile.id);
  const productIds = products.map((product) => product.id);

  return (
    <SolidPageShell>
      <AppScreenHeader title="Sevimlilər" fallback="/account" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12 app:hidden">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Sevimlilər
        </h1>
        <FavoritesCount productIds={productIds} />

        <FavoritesSwitch
          productIds={productIds}
          empty={
            <div className="mt-8 rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-zinc-200">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
                className="mx-auto h-10 w-10 text-rose-300"
              >
                <path
                  d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3Z"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-3 text-base font-semibold text-zinc-900">
                Hələ sevimli məhsulunuz yoxdur
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Məhsul kartındakı ürək işarəsinə basın, məhsul burada
                saxlanılacaq.
              </p>
              <Link
                href="/shop"
                prefetch
                className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Mağazaya bax
              </Link>
            </div>
          }
        >
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <FavoriteItem key={product.id} productId={product.id}>
                <ProductCard product={product} />
              </FavoriteItem>
            ))}
          </div>
        </FavoritesSwitch>
      </div>

      {/* The installed app: the design's cards, two to a row. */}
      <div className="hidden px-6 pt-2 pb-8 font-app text-app-ink app:block">
        <FavoritesSwitch
          productIds={productIds}
          empty={
            <div className="py-16 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3eee2] text-rose-400">
                <HeartIcon className="h-9 w-9" />
              </span>
              <p className="mt-5 font-app-display text-xl font-bold">Hələ sevimli məhsulunuz yoxdur</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-app-muted">
                Məhsul kartındakı ürək işarəsinə basın, məhsul burada saxlanılacaq.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex h-12 items-center rounded-full bg-app-green px-7 text-sm font-bold text-white"
              >
                Mağazaya bax
              </Link>
            </div>
          }
        >
          <ul className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <FavoriteItem key={product.id} productId={product.id}>
                <li className="relative min-w-0">
                  <AppProductCard product={product} />
                  {/* Outside the card's link, so a tap never opens the product. */}
                  <WishlistButton
                    productId={product.id}
                    productTitle={product.title}
                    className="absolute top-2 right-2 h-8 w-8 shadow-none ring-0"
                  />
                </li>
              </FavoriteItem>
            ))}
          </ul>
        </FavoritesSwitch>
      </div>
    </SolidPageShell>
  );
}
