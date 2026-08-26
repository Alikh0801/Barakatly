"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

type ProductImage = { url: string; sort_order: number };

const SWIPE_THRESHOLD_PX = 40;

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-5 w-5">
      <path
        d="M5 5l10 10M15 5 5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function showImage(index: number) {
    const next = (index + sorted.length) % sorted.length;
    setActiveIndex(next);
    setLoaded(false);
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex]);

  if (sorted.length === 0) {
    return <ProductImagePlaceholder className="min-h-[280px] w-full" />;
  }

  const active = sorted[Math.min(activeIndex, sorted.length - 1)];
  const hasMultiple = sorted.length > 1;

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent) {
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
        className="relative w-full min-h-[280px] bg-zinc-50"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
          onClick={() => setLightboxOpen(true)}
          className={[
            "mx-auto block h-auto w-full cursor-zoom-in object-contain transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
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

      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Bağla"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <CloseIcon />
          </button>

          <div
            className="relative h-full w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={active.url}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
