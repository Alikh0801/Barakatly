import { Skeleton } from "@/components/ui/Skeleton";

function CartLineSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

function CartSummarySkeleton() {
  return (
    <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-6 w-36" />
      <div className="mt-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="mt-6 h-12 w-full rounded-xl" />
    </aside>
  );
}

export function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <CartLineSkeleton />
        <CartLineSkeleton />
        <Skeleton className="h-4 w-24" />
      </div>
      <CartSummarySkeleton />
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-8">
        <CartSkeleton />
      </div>
    </div>
  );
}
