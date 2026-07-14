import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import {
  getPublicFarmerById,
  getPublicFarmerProducts,
} from "@/lib/farmers/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farmer = await getPublicFarmerById(id);
  return {
    title: farmer
      ? `${farmer.farm_name} — BARAKATLY`
      : "Fermer — BARAKATLY",
    description: farmer?.description ?? "Təsdiqlənmiş fermer profili",
  };
}

export default async function FarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "apply") {
    notFound();
  }

  const farmer = await getPublicFarmerById(id);
  if (!farmer) notFound();

  const products = await getPublicFarmerProducts(farmer.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <Link
        href="/farmers"
        prefetch
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Fermerlərə qayıt
      </Link>

      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {farmer.farm_name}
          </h1>
          {farmer.verified_at ? <VerifiedIcon className="h-6 w-6" /> : null}
        </div>

        {farmer.location_text ? (
          <p className="mt-2 text-sm text-zinc-600">{farmer.location_text}</p>
        ) : null}

        {farmer.description ? (
          <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">
            {farmer.description}
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-600">
            Bu təsərrüfat haqqında əlavə təsvir hələ əlavə olunmayıb.
          </p>
        )}

        <p className="mt-4 text-sm text-zinc-600">
          {farmer.productCount} təsdiqlənmiş məhsul
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Məhsullar
        </h2>

        {products.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
            Bu fermerin hazırda satışda məhsulu yoxdur.
          </p>
        )}
      </section>
    </div>
  );
}
