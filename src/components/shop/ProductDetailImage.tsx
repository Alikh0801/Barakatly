"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

type ProductImage = { url: string; sort_order: number };

const SWIPE_THRESHOLD_PX = 40;

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d={direction === "left" ? "M12.5 5 7.5 10l5 5" : "M7.5 5l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const touchStartX = useRef<number | null>(null);

  if (sorted.length === 0) {
    return <ProductImagePlaceholder className="min-h-[280px] w-full" />;
  }

  const active = sorted[Math.min(activeIndex, sorted.length - 1)];
  const hasMultiple = sorted.length > 1;

  function showImage(index: number) {
    const next = (index + sorted.length) % sorted.length;
    setActiveIndex(next);
    setLoaded(false);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    if (delta < 0) showImage(activeIndex + 1);
    else showImage(activeIndex - 1);
  }

  return (
    <div>
      <div
        className="relative aspect-square w-full max-w-[480px] mx-auto bg-zinc-50 lg:aspect-[4/3]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!loaded ? (
          <Skeleton className="absolute inset-0 rounded-none" />
        ) : null}
        <Image
          key={active.url}
          src={active.url}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 480px"
          onLoad={() => setLoaded(true)}
          className={[
            "object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => showImage(activeIndex - 1)}
              aria-label="Əvvəlki şəkil"
              className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
            >
              <ArrowIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={() => showImage(activeIndex + 1)}
              aria-label="Növbəti şəkil"
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-black/5 transition hover:bg-white"
            >
              <ArrowIcon direction="right" />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {sorted.map((image, index) => (
                <span
                  key={image.url}
                  className={[
                    "h-1.5 w-1.5 rounded-full transition",
                    index === activeIndex ? "bg-emerald-600" : "bg-white/80",
                  ].join(" ")}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="flex gap-2 overflow-x-auto p-3">
          {sorted.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => showImage(index)}
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
