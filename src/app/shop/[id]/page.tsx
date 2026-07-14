import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButtonLarge } from "@/components/shop/AddToCartButton";
import { ProductDetailImage } from "@/components/shop/ProductDetailImage";
import { getProductById } from "@/lib/shop/queries";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
} from "@/lib/shop/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  return {
    title: product ? `${product.title} — BARAKATLY` : "Məhsul — BARAKATLY",
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Link
        href="/shop"
        prefetch
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Mağazaya qayıt
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200">
          <ProductDetailImage src={imageUrl} alt={product.title} />
        </div>

        <div>
          {product.category ? (
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          ) : null}

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900">
            {product.title}
          </h1>

          <p className="mt-4 text-sm leading-7 text-zinc-600">
            {product.description}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-zinc-900">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-zinc-500">
              {formatUnit(product.unit_type)}
            </span>
          </div>

          <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-zinc-200">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Fermer</span>
              <span className="font-medium text-zinc-900">
                {product.farmer?.farm_name ?? "—"}
              </span>
            </div>
            {product.farmer?.location_text ? (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Yerləşmə</span>
                <span className="font-medium text-zinc-900">
                  {product.farmer.location_text}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500">Mövcud miqdar</span>
              <span className="font-medium text-zinc-900">
                {product.quantity_available}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <AddToCartButtonLarge product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
