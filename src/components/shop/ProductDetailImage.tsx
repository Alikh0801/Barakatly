"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

export function ProductDetailImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return <ProductImagePlaceholder className="min-h-[280px] w-full" />;
  }

  return (
    <div className="relative w-full bg-zinc-50">
      {!loaded ? (
        <Skeleton className="absolute inset-0 min-h-[280px] w-full rounded-none" />
      ) : null}
      {/* Full photo, no crop — natural aspect ratio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={[
          "mx-auto block h-auto w-full object-contain transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
