import { Skeleton } from "@/components/ui/Skeleton";

export function AccountSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 md:px-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-36 rounded-full" />
    </div>
  );
}
