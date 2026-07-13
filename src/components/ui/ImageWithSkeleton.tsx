"use client";

import { useState } from "react";
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
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {!loaded ? (
        <Skeleton
          className={["absolute inset-0 h-full w-full", skeletonClassName]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={[
          className,
          loaded ? "opacity-100" : "opacity-0",
          "transition-opacity duration-300",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
