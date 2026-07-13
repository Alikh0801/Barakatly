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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CategoryFilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-24 rounded-full" />
      ))}
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8">
        <CategoryFilterSkeleton />
      </div>
      <div className="mt-8">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
