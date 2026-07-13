import { Skeleton } from "@/components/ui/Skeleton";

export function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-8">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-8 w-32" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-1 h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
