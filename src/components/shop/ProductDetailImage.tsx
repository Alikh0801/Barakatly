"use client";

import Image from "next/image";
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
    <div className="relative w-full min-h-[280px] bg-zinc-50">
      {!loaded ? (
        <Skeleton className="absolute inset-0 min-h-[280px] w-full rounded-none" />
      ) : null}
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={900}
        priority
        sizes="(max-width: 1024px) 100vw, 50vw"
        onLoad={() => setLoaded(true)}
        className={[
          "mx-auto block h-auto w-full object-contain transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
