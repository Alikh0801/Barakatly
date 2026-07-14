"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden bg-zinc-100">
      <Skeleton
        className={[
          "absolute inset-0 h-full w-full",
          skeletonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={["relative z-10", className].filter(Boolean).join(" ")}
      />
    </div>
  );
}
