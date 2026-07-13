import { Skeleton } from "@/components/ui/Skeleton";

function FormSectionSkeleton() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-6 w-40" />
      <div className="mt-4 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </section>
  );
}

function BankSectionSkeleton() {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="mt-2 h-4 w-full max-w-md" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </section>
  );
}

function CheckoutSummarySkeleton() {
  return (
    <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <Skeleton className="h-6 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex justify-between gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4">
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

export function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <FormSectionSkeleton />
        <BankSectionSkeleton />
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
          <Skeleton className="mt-4 h-10 w-full rounded-full" />
        </section>
      </div>
      <CheckoutSummarySkeleton />
    </div>
  );
}

export function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-4 h-9 w-28" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-8">
        <CheckoutSkeleton />
      </div>
    </div>
  );
}
