import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { Skeleton } from "@/components/ui/Skeleton";

export default function NotificationsLoading() {
  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-12">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </SolidPageShell>
  );
}
