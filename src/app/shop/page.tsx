import { Suspense } from "react";
import { ShopContent } from "@/components/shop/ShopContent";
import { ProductGridSkeleton, ShopFiltersSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "Mağaza — BARAKATLY",
};

function ShopDataSkeleton() {
  return (
    <>
      <Skeleton className="mt-8 h-12 w-full rounded-xl" />
      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8">
        <div className="mb-6 hidden lg:mb-0 lg:block">
          <ShopFiltersSkeleton />
        </div>
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
