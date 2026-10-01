"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
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
  // Which lightbox image has finished loading; any other shows a spinner.
  const [lightboxLoadedUrl, setLightboxLoadedUrl] = useState<string | null>(null);

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

  // Lock the page behind the lightbox. The scrollbar gutter is padded back
  // so the page does not jump sideways when the scrollbar disappears.
  useEffect(() => {
    if (!lightboxOpen) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [lightboxOpen]);

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
        className="relative aspect-[4/3] w-full bg-zinc-50"
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
          preload
          sizes="(max-width: 1024px) 100vw, 50vw"
          onLoad={() => setLoaded(true)}
          onClick={() => setLightboxOpen(true)}
          className={[
            "cursor-zoom-in object-contain transition-opacity duration-300",
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

      {/* Portaled to <body>: the gallery sits in a sticky, overflow-hidden
          card, and sticky makes its own stacking context — rendered in
          place, the page header (z-30) painted over the top of the image. */}
      {lightboxOpen
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={alt}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overscroll-contain bg-black/90 px-4 py-16"
              // Anything outside the frame, its thumbnails and the buttons
              // closes the lightbox; on phones the X is the other way out.
              onClick={(event) => {
                if ((event.target as Element).closest("[data-lightbox-keep]")) return;
                setLightboxOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="Bağla"
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <CloseIcon />
              </button>

              {/* One fixed 4:3 frame for every photo, sized to the viewport
                  (leaving room for the X above and the thumbnails below), so
                  a tall photo no longer shows up smaller than a wide one and
                  the arrows never move. The photo itself stays uncropped;
                  a blurred copy fills the bars around it. */}
              <div
                data-lightbox-keep
                className="relative aspect-[4/3] max-w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-white/10"
                style={{
                  width: hasMultiple
                    ? "min(100%, 1100px, calc((100dvh - 13rem) * 4 / 3))"
                    : "min(100%, 1100px, calc((100dvh - 9rem) * 4 / 3))",
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <Image
                  key={`backdrop-${active.url}`}
                  src={active.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="96px"
                  className="scale-110 object-cover opacity-50 blur-2xl"
                />
                <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
                {lightboxLoadedUrl !== active.url ? (
                  <span className="absolute inset-0 flex items-center justify-center text-white/80">
                    <Spinner className="h-6 w-6" />
                  </span>
                ) : null}
                <Image
                  key={active.url}
                  src={active.url}
                  alt={alt}
                  fill
                  sizes="(max-width: 1100px) 100vw, 1100px"
                  onLoad={() => setLightboxLoadedUrl(active.url)}
                  className={[
                    "object-contain transition-opacity duration-300",
                    lightboxLoadedUrl === active.url ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                />

                {hasMultiple ? (
                  <>
                    <button
                      type="button"
                      onClick={() => showImage(activeIndex - 1)}
                      aria-label="Əvvəlki şəkil"
                      data-static-hover
                      className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg ring-1 ring-black/10 transition hover:bg-white"
                    >
                      <ArrowIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showImage(activeIndex + 1)}
                      aria-label="Növbəti şəkil"
                      data-static-hover
                      className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 shadow-lg ring-1 ring-black/10 transition hover:bg-white"
                    >
                      <ArrowIcon direction="right" />
                    </button>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium tabular-nums text-white">
                      {activeIndex + 1} / {sorted.length}
                    </span>
                  </>
                ) : null}
              </div>

              {hasMultiple ? (
                <div
                  data-lightbox-keep
                  className="flex max-w-full gap-2 overflow-x-auto px-1 py-1"
                >
                  {sorted.map((image, index) => (
                    <button
                      key={image.url}
                      type="button"
                      onClick={() => showImage(index)}
                      aria-label={`${alt} — şəkil ${index + 1}`}
                      aria-current={index === activeIndex}
                      className={[
                        "relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition",
                        index === activeIndex
                          ? "opacity-100 ring-white"
                          : "opacity-50 ring-transparent hover:opacity-80",
                      ].join(" ")}
                    >
                      <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
