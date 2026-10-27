"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

export function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  fill = true,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  preload = false,
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  /** Stretch the image to fill the parent box. */
  fill?: boolean;
  sizes?: string;
  preload?: boolean;
}) {
  // Both keyed to the src, so a new image starts over. next/image itself
  // calls onLoad for an image that finished before hydration (it checks
  // img.complete once mounted) and re-fires an error lost before it.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;

  // A failed image (a 402 from the image optimizer, a deleted file) shows the
  // same placeholder as a product without photos, not an endless skeleton.
  if (failedSrc === src) {
    return <ProductImagePlaceholder className={fill ? "h-full w-full" : "h-full w-full min-h-20"} />;
  }

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
        preload={preload}
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(src)}
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
