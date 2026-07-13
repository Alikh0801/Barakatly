import { Skeleton } from "@/components/ui/Skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-4 w-32" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
