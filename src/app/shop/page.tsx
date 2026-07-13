import { Suspense } from "react";
import { ShopContent } from "@/components/shop/ShopContent";
import {
  CategoryFilterSkeleton,
  ProductGridSkeleton,
} from "@/components/skeletons";

export const metadata = {
  title: "Mağaza — BARAKATLY",
};

function ShopDataSkeleton() {
  return (
    <>
      <div className="mt-8">
        <CategoryFilterSkeleton />
      </div>
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Mağaza
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Təzə və yerli fermer məhsullarını kəşf edin
        </p>
      </div>

      <Suspense fallback={<ShopDataSkeleton />}>
        <ShopContent categorySlug={params.category} />
      </Suspense>
    </div>
  );
}
