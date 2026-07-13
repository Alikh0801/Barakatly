import { Skeleton } from "@/components/ui/Skeleton";

export function AuthNavSkeleton({
  variant = "hero",
}: {
  variant?: "hero" | "solid";
}) {
  const isHero = variant === "hero";

  return (
    <Skeleton
      className={[
        "ml-1 h-9 rounded-full",
        isHero ? "w-24 bg-white/20" : "w-24 bg-zinc-200",
      ].join(" ")}
    />
  );
}
