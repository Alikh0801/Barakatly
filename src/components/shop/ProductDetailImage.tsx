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
    return <ProductImagePlaceholder className="h-full min-h-[320px] w-full" />;
  }

  return (
    <ImageWithSkeleton
      src={src}
      alt={alt}
      className="h-full max-h-[520px] w-full object-cover"
      skeletonClassName="rounded-none"
    />
  );
}
