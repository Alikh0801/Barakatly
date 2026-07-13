"use client";

import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";

export function ProductDetailImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <ImageWithSkeleton
      src={src}
      alt={alt}
      className="h-full max-h-[520px] w-full object-cover"
      skeletonClassName="rounded-none"
    />
  );
}
