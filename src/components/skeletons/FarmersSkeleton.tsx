import { Skeleton } from "@/components/ui/Skeleton";
import { ProductGridSkeleton } from "./ShopSkeleton";

function FarmerCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-4 h-3 w-28" />
    </div>
  );
}

/** /farmers while the list loads. */
export function FarmersPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <FarmerCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/** A farmer's profile while it loads: cover, avatar and name, products. */
export function FarmerProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-44 w-full rounded-none sm:h-60" />
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-7">
          <Skeleton className="-mt-12 h-24 w-24 rounded-3xl ring-4 ring-[#faf9f5] sm:-mt-20 sm:h-32 sm:w-32" />
          <div className="flex-1 space-y-2 sm:pb-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
        <div className="mt-8 pb-12">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}

/** /search while results load. */
export function SearchPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-3 h-4 w-60" />
      <div className="mt-8">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
