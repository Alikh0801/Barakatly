"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  fill = true,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  /** Stretch the image to fill the parent box. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={[
        "relative overflow-hidden bg-zinc-100",
        fill ? "h-full w-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!loaded ? (
        <Skeleton
          className={[
            "absolute inset-0 z-0 h-full w-full",
            skeletonClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={[
          fill ? "z-10 object-cover" : "relative z-10",
          loaded ? "opacity-100" : "opacity-0",
          "transition-opacity duration-300",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
