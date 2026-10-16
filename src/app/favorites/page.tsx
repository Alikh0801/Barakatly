import Link from "next/link";
import { redirect } from "next/navigation";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { ProductCard } from "@/components/shop/ProductCard";
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
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
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
    </SolidPageShell>
  );
}
