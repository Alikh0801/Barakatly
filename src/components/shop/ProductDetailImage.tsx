"use client";

import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

export function ProductDetailImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <ProductImagePlaceholder className="aspect-square w-full sm:aspect-[4/5]" />
    );
  }

  return (
    <div className="aspect-square w-full sm:aspect-[4/5]">
      <ImageWithSkeleton
        src={src}
        alt={alt}
        fill
        skeletonClassName="rounded-none"
      />
    </div>
  );
}
