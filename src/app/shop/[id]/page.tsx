import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDetailImage } from "@/components/shop/ProductDetailImage";
import { ProductPurchasePanel } from "@/components/shop/ProductPurchasePanel";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import { getProductById } from "@/lib/shop/queries";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
  unitLabel,
} from "@/lib/shop/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  return {
    title: product ? `${product.title} — BARAKATLY` : "Məhsul — BARAKATLY",
    description: product?.description ?? "Fermerdən birbaşa təzə məhsul",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const imageUrl = getProductImageUrl(product.product_images);
  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const farmer = product.farmer;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Link
        href="/shop"
        prefetch
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Mağazaya qayıt
      </Link>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl bg-zinc-100 ring-1 ring-zinc-200 lg:sticky lg:top-24">
          <ProductDetailImage src={imageUrl} alt={product.title} />
        </div>

        <div>
          {product.category ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          ) : null}

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            {product.title}
          </h1>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-zinc-500">
              {formatUnit(product.unit_type)}
            </span>
          </div>

          {product.description ? (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-zinc-900">Təsvir</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-600 md:text-base">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">
              Bu məhsul üçün təsvir hələ əlavə olunmayıb.
            </p>
          )}

          <section className="mt-8 border-t border-zinc-200 pt-6">
            <h2 className="text-sm font-semibold text-zinc-900">
              Satıcı məlumatı
            </h2>
            {farmer ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/farmers/${farmer.id}`}
                    prefetch
                    className="text-base font-semibold text-emerald-800 hover:underline"
                  >
                    {farmer.farm_name}
                  </Link>
                  {farmer.verified_at ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <VerifiedIcon className="h-4 w-4" />
                      Təsdiqlənib
                    </span>
                  ) : null}
                </div>
                {farmer.location_text ? (
                  <p className="text-sm text-zinc-600">{farmer.location_text}</p>
                ) : null}
                {farmer.description ? (
                  <p className="text-sm leading-6 text-zinc-600">
                    {farmer.description}
                  </p>
                ) : null}
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-zinc-500">Mövcud miqdar</dt>
                    <dd className="mt-0.5 font-medium text-zinc-900">
                      {product.quantity_available} {unitLabel(product.unit_type)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Stok</dt>
                    <dd className="mt-0.5 font-medium text-zinc-900">
                      {product.in_stock && product.quantity_available > 0
                        ? "Var"
                        : "Yoxdur"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                Satıcı məlumatı mövcud deyil.
              </p>
            )}
          </section>

          <ProductPurchasePanel product={product} />
        </div>
      </div>
    </div>
  );
}
