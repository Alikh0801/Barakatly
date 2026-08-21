import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-2 lg:gap-6 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShopFiltersSkeleton() {
  return (
    <div className="space-y-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-2 border-b border-zinc-100 pb-5">
        <Skeleton className="h-3 w-16" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-7 w-full rounded-lg" />
        ))}
      </div>
      <div className="space-y-2 border-b border-zinc-100 pb-5">
        <Skeleton className="h-3 w-14" />
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-3/4" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mt-8 h-12 w-full rounded-xl" />
      <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8">
        <div className="mb-6 hidden lg:mb-0 lg:block">
          <ShopFiltersSkeleton />
        </div>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
