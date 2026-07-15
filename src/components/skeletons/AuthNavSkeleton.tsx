import { Skeleton } from "@/components/ui/Skeleton";

export function AuthNavSkeleton({
  variant = "hero",
}: {
  variant?: "hero" | "solid" | "adaptive";
}) {
  const tone =
    variant === "solid"
      ? "bg-zinc-200"
      : "bg-white/20 group-data-[scrolled=true]/header:bg-zinc-200";

  return (
    <div className="ml-1 inline-flex items-center gap-2">
      <Skeleton className={["h-9 w-9 rounded-full", tone].join(" ")} />
      <Skeleton
        className={["hidden h-4 w-16 rounded-md sm:block", tone].join(" ")}
      />
    </div>
  );
}
