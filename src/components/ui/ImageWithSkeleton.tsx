"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  fill = false,
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  /** Stretch the image to fill the parent box. */
  fill?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden bg-zinc-100",
        fill ? "h-full w-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
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
        className={[
          fill
            ? "absolute inset-0 z-10 h-full w-full object-cover"
            : "relative z-10",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
