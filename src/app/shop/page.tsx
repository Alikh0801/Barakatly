import { Suspense } from "react";
import { ShopContent } from "@/components/shop/ShopContent";
import { ProductGridSkeleton, ShopFiltersSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Mağaza",
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
      <PageHeader title="Mağaza" description="Təzə və yerli fermer məhsullarını kəşf edin" />

      <Suspense fallback={<ShopDataSkeleton />}>
        <ShopContent categorySlug={params.category} />
      </Suspense>
    </div>
  );
}
