"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
} from "react";
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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_ZOOM = 2.5;

type Zoom = { scale: number; x: number; y: number };
const NO_ZOOM: Zoom = { scale: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Zoom and pan for the lightbox frame: buttons, the mouse wheel (and a
 * trackpad pinch), double-click or double-tap, two-finger pinch, and
 * dragging the zoomed photo. The photo can't be dragged past its edges.
 */
function useZoomPan(frameRef: React.RefObject<HTMLDivElement | null>, open: boolean) {
  const [zoom, setZoom] = useState<Zoom>(NO_ZOOM);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const lastTap = useRef(0);
  const moved = useRef(false);

  const bound = useCallback(
    (next: Zoom): Zoom => {
      const frame = frameRef.current;
      const scale = clamp(next.scale, MIN_ZOOM, MAX_ZOOM);
      if (!frame || scale === 1) return { scale, x: 0, y: 0 };
      const maxX = ((scale - 1) * frame.clientWidth) / 2;
      const maxY = ((scale - 1) * frame.clientHeight) / 2;
      return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
    },
    [frameRef],
  );

  /** Zooms to `scale`, keeping the point under (clientX, clientY) in place. */
  const zoomAt = useCallback(
    (scale: number, clientX?: number, clientY?: number) => {
      setZoom((current) => {
        const frame = frameRef.current;
        const target = clamp(scale, MIN_ZOOM, MAX_ZOOM);
        if (!frame || clientX === undefined || clientY === undefined) {
          const ratio = target / current.scale;
          return bound({ scale: target, x: current.x * ratio, y: current.y * ratio });
        }
        const rect = frame.getBoundingClientRect();
        const px = clientX - rect.left - rect.width / 2;
        const py = clientY - rect.top - rect.height / 2;
        const ratio = target / current.scale;
        return bound({
          scale: target,
          x: px - (px - current.x) * ratio,
          y: py - (py - current.y) * ratio,
        });
      });
    },
    [bound, frameRef],
  );

  const reset = useCallback(() => setZoom(NO_ZOOM), []);

  // A non-passive listener, so a trackpad pinch (ctrl + wheel) zooms the
  // photo instead of the whole page. Attached once the lightbox (and with
  // it the frame) is on screen.
  useEffect(() => {
    const frame = frameRef.current;
    if (!open || !frame) return;
    function onWheel(event: WheelEvent) {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.002));
      setZoom((current) => {
        const rect = frame!.getBoundingClientRect();
        const target = clamp(current.scale * factor, MIN_ZOOM, MAX_ZOOM);
        const px = event.clientX - rect.left - rect.width / 2;
        const py = event.clientY - rect.top - rect.height / 2;
        const ratio = target / current.scale;
        return bound({ scale: target, x: px - (px - current.x) * ratio, y: py - (py - current.y) * ratio });
      });
    }
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [bound, frameRef, open]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: zoom.scale };
    }
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      moved.current = true;
      zoomAt(pinch.current.scale * (distance / pinch.current.distance), (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }

    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) moved.current = true;
    if (zoom.scale > 1) {
      setZoom((current) => bound({ ...current, x: current.x + dx, y: current.y + dy }));
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);

    // Double-tap or double-click: zoom in there, or back out.
    if (!moved.current && event.isPrimary) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        lastTap.current = 0;
        if (zoom.scale > 1) reset();
        else zoomAt(DOUBLE_TAP_ZOOM, event.clientX, event.clientY);
      } else {
        lastTap.current = now;
      }
    }
  }

  return {
    zoom,
    dragging,
    zoomAt,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
}

function ZoomIcon({ direction }: { direction: "in" | "out" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d={direction === "in" ? "M5 10h10M10 5v10" : "M5 10h10"}
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
  // Photos that failed to load (say a 402 from the image optimizer): they
  // show the no-photo placeholder instead of an endless skeleton or spinner.
  const [failedUrls, setFailedUrls] = useState<ReadonlySet<string>>(() => new Set());
  const markFailed = (url: string) => setFailedUrls((current) => new Set(current).add(url));
  const frameRef = useRef<HTMLDivElement>(null);
  const { zoom, dragging, zoomAt, reset: resetZoom, handlers: zoomHandlers } = useZoomPan(frameRef, lightboxOpen);
  const zoomed = zoom.scale > 1;

  function showImage(index: number) {
    const next = (index + sorted.length) % sorted.length;
    setActiveIndex(next);
    setLoaded(false);
    resetZoom();
  }

  function closeLightbox() {
    setLightboxOpen(false);
    resetZoom();
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "+" || event.key === "=") zoomAt(zoom.scale + ZOOM_STEP);
      if (event.key === "-") zoomAt(zoom.scale - ZOOM_STEP);
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex, zoom.scale]);

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
    // Swiping changes the photo only when it isn't zoomed; a second finger
    // means a pinch.
    touchStartX.current = zoomed || event.touches.length > 1 ? null : (event.touches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent) {
    if (touchStartX.current === null || zoomed) return;
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
        {failedUrls.has(active.url) ? (
          <ProductImagePlaceholder className="absolute inset-0 h-full w-full" />
        ) : !loaded ? (
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
          onError={() => markFailed(active.url)}
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
              {failedUrls.has(image.url) ? (
                <ProductImagePlaceholder className="h-full w-full [&_svg]:h-6 [&_svg]:w-6" />
              ) : (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="64px"
                  onError={() => markFailed(image.url)}
                  className="object-cover"
                />
              )}
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
                closeLightbox();
              }}
            >
              <button
                type="button"
                onClick={closeLightbox}
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
                ref={frameRef}
                data-lightbox-keep
                {...zoomHandlers}
                className={[
                  "relative aspect-[4/3] max-w-full touch-none select-none overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl ring-1 ring-white/10",
                  zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
                ].join(" ")}
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
                {failedUrls.has(active.url) ? (
                  <span className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
                    Şəkil yüklənmədi
                  </span>
                ) : lightboxLoadedUrl !== active.url ? (
                  <span className="absolute inset-0 flex items-center justify-center text-white/80">
                    <Spinner className="h-6 w-6" />
                  </span>
                ) : null}
                <div
                  className={`absolute inset-0 ${dragging ? "" : "transition-transform duration-200 ease-out"}`}
                  style={{ transform: `translate3d(${zoom.x}px, ${zoom.y}px, 0) scale(${zoom.scale})` }}
                >
                  <Image
                    key={active.url}
                    src={active.url}
                    alt={alt}
                    fill
                    draggable={false}
                    // A sharper file once zoomed; until then the frame-sized one.
                    sizes={zoomed ? "(max-width: 1100px) 200vw, 2200px" : "(max-width: 1100px) 100vw, 1100px"}
                    onLoad={() => setLightboxLoadedUrl(active.url)}
                    onError={() => markFailed(active.url)}
                    className={[
                      "object-contain transition-opacity duration-300",
                      lightboxLoadedUrl === active.url ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                  />
                </div>

                <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/55 p-1 text-white backdrop-blur">
                  <button
                    type="button"
                    onClick={() => zoomAt(zoom.scale - ZOOM_STEP)}
                    disabled={!zoomed}
                    aria-label="Kiçilt"
                    data-static-hover
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/15 disabled:opacity-40"
                  >
                    <ZoomIcon direction="out" />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label="Əsl ölçü"
                    data-static-hover
                    className="min-w-12 rounded-full px-1.5 text-xs font-semibold tabular-nums transition hover:bg-white/15"
                  >
                    {Math.round(zoom.scale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomAt(zoom.scale + ZOOM_STEP)}
                    disabled={zoom.scale >= MAX_ZOOM}
                    aria-label="Böyüt"
                    data-static-hover
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/15 disabled:opacity-40"
                  >
                    <ZoomIcon direction="in" />
                  </button>
                </div>

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
                      {failedUrls.has(image.url) ? (
                        <ProductImagePlaceholder className="h-full w-full [&_svg]:h-5 [&_svg]:w-5" />
                      ) : (
                        <Image
                          src={image.url}
                          alt=""
                          fill
                          sizes="56px"
                          onError={() => markFailed(image.url)}
                          className="object-cover"
                        />
                      )}
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
