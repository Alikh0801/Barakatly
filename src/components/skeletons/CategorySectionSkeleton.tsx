import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "@/components/skeletons/ShopSkeleton";

export function CategorySectionSkeleton() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="mx-auto max-w-md space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-56" />
          <Skeleton className="mx-auto h-4 w-72" />
        </div>
        <div className="mt-10 flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex w-[84px] shrink-0 flex-col items-center gap-2"
            >
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Skeleton className="mb-6 h-6 w-40" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
