import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "@/components/skeletons/ShopSkeleton";

export function FreshProductsSkeleton() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="hidden h-10 w-32 rounded-full sm:block" />
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative isolate min-h-screen min-h-dvh overflow-hidden bg-emerald-950">
      <Skeleton className="absolute inset-0 rounded-none bg-emerald-900/50" />
      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-24 md:px-6">
        <div className="max-w-2xl space-y-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-28 rounded-full bg-white/20" />
            <Skeleton className="h-7 w-32 rounded-full bg-white/20" />
          </div>
          <Skeleton className="h-12 w-full max-w-lg bg-white/20" />
          <Skeleton className="h-12 w-full max-w-md bg-white/20" />
          <Skeleton className="h-5 w-full max-w-xl bg-white/20" />
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-full bg-white/20" />
            <Skeleton className="h-11 w-36 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="absolute inset-x-0 top-0 z-20 px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Skeleton className="h-8 w-32 bg-white/20" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-9 rounded-full bg-white/20" />
            <Skeleton className="h-9 w-24 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
      <HeroSkeleton />
      <section className="bg-[#faf9f5]">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
          <SectionHeaderSkeleton />
          <div className="mt-10">
            <CategoryGridSkeleton />
          </div>
        </div>
      </section>
      <FreshProductsSkeleton />
    </div>
  );
}
