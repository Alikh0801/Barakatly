import { Skeleton } from "@/components/ui/Skeleton";

function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-5 w-20" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8">
        <OrderListSkeleton />
      </div>
    </div>
  );
}
