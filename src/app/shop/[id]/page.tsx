import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetailImage } from "@/components/shop/ProductDetailImage";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { ProductTabs } from "@/components/shop/ProductTabs";
import { SimilarProducts } from "@/components/shop/SimilarProducts";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { getProductById, getSimilarProductsByCategory } from "@/lib/shop/queries";
import { getPublicFarmerProducts } from "@/lib/farmers/queries";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
} from "@/lib/shop/format";

const STATIC_RATING_AVERAGE = 4.8;
const STATIC_RATING_TOTAL = 128;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return { title: "Məhsul" };
  }

  const imageUrl = getProductImageUrl(product.product_images);
  const description =
    product.description?.slice(0, 160) ||
    "Fermerdən birbaşa təzə məhsul";

  return {
    title: `${product.title} — BARAKATLY`,
    description,
    alternates: { canonical: `/shop/${product.id}` },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: `/shop/${product.id}`,
      images: imageUrl ? [{ url: imageUrl, alt: product.title }] : undefined,
    },
  };
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M10 2.5l6 2.2v4.3c0 4-2.6 6.9-6 8.5-3.4-1.6-6-4.5-6-8.5V4.7l6-2.2Z"
        strokeLinejoin="round"
      />
      <path d="m7.3 10 1.9 1.9 3.5-3.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const farmer = product.farmer;

  const farmerProducts = farmer ? await getPublicFarmerProducts(farmer.id) : [];
  const farmerOtherProducts = farmerProducts.filter((p) => p.id !== product.id);

  const similarProducts =
    farmerOtherProducts.length > 0
      ? farmerOtherProducts.slice(0, 4)
      : product.category
        ? await getSimilarProductsByCategory(product.category.slug, product.id)
        : [];

  const similarHref =
    farmerOtherProducts.length > 0 && farmer
      ? `/farmers/${farmer.id}`
      : product.category
        ? `/shop?category=${product.category.slug}`
        : "/shop";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500">
        <Link href="/shop" prefetch className="hover:text-zinc-800">
          Mağaza
        </Link>
        {product.category ? (
          <>
            <span className="text-zinc-300">/</span>
            <Link
              href={`/shop?category=${product.category.slug}`}
              prefetch
              className="hover:text-zinc-800"
            >
              {product.category.name_az}
            </Link>
          </>
        ) : null}
        <span className="text-zinc-300">/</span>
        <span className="truncate text-zinc-700">{product.title}</span>
      </nav>

      <div className="mt-6 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl bg-zinc-100 ring-1 ring-zinc-200 lg:sticky lg:top-24">
          <ProductDetailImage images={product.product_images} alt={product.title} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-1 font-medium text-amber-600">
              <StarIcon />
              {STATIC_RATING_AVERAGE.toFixed(1)}
            </span>
            <span className="text-zinc-300">·</span>
            <span>{STATIC_RATING_TOTAL} rəy</span>
            <span className="text-zinc-300">·</span>
            <span>{product.sold_count} satış</span>
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            {product.title}
          </h1>

          {product.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
              {product.description}
            </p>
          ) : null}

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-zinc-500">
              {formatUnit(product.unit_type)}
            </span>
          </div>

          <ProductPurchasePanel product={product} />

          <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <ShieldIcon />
            Təhlükəsiz ödəniş · Fermerdən birbaşa göndərilir
          </p>

          <section className="mt-8 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-100">
            {farmer ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                  {farmer.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={farmer.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    farmer.farm_name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-zinc-900">
                      {farmer.farm_name}
                    </span>
                    {farmer.verified_at ? (
                      <VerifiedIcon className="h-4 w-4 shrink-0" />
                    ) : null}
                  </div>
                  {farmer.location_text ? (
                    <p className="truncate text-xs text-zinc-500">
                      {farmer.location_text}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/farmers/${farmer.id}`}
                  prefetch
                  className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-100"
                >
                  Profil
                </Link>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Satıcı məlumatı mövcud deyil.</p>
            )}
          </section>
        </div>
      </div>

      <ProductTabs description={product.description} />

      <SimilarProducts
        title="Bənzər məhsullar"
        products={similarProducts}
        viewAllHref={similarHref}
      />
    </div>
  );
}
