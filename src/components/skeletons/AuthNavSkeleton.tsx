import { Skeleton } from "@/components/ui/Skeleton";

export function AuthNavSkeleton({
  variant = "hero",
}: {
  variant?: "hero" | "solid";
}) {
  const isHero = variant === "hero";

  return (
    <div className="ml-1 inline-flex items-center gap-2">
      <Skeleton
        className={[
          "h-9 w-9 rounded-full",
          isHero ? "bg-white/20" : "bg-zinc-200",
        ].join(" ")}
      />
      <Skeleton
        className={[
          "hidden h-4 w-16 rounded-md sm:block",
          isHero ? "bg-white/20" : "bg-zinc-200",
        ].join(" ")}
      />
    </div>
  );
}
