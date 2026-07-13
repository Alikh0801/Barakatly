import { Skeleton } from "@/components/ui/Skeleton";

export function OrderDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-4 w-28" />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <Skeleton className="h-6 w-24" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <Skeleton className="h-6 w-20" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
            <Skeleton className="h-6 w-16" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
