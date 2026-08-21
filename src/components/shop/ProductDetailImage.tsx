"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

type ProductImage = { url: string; sort_order: number };

export function ProductDetailImage({
  images,
  alt,
}: {
  images: ProductImage[];
  alt: string;
}) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  if (sorted.length === 0) {
    return <ProductImagePlaceholder className="min-h-[280px] w-full" />;
  }

  const active = sorted[Math.min(activeIndex, sorted.length - 1)];

  return (
    <div>
      <div className="relative w-full min-h-[280px] bg-zinc-50">
        {!loaded ? (
          <Skeleton className="absolute inset-0 min-h-[280px] w-full rounded-none" />
        ) : null}
        <Image
          key={active.url}
          src={active.url}
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

      {sorted.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-3">
          {sorted.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setLoaded(false);
              }}
              aria-label={`${alt} — şəkil ${index + 1}`}
              aria-current={index === activeIndex}
              className={[
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition",
                index === activeIndex
                  ? "ring-emerald-500"
                  : "ring-transparent hover:ring-zinc-200",
              ].join(" ")}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
