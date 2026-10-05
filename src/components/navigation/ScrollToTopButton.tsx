"use client";

import { useEffect, useRef, useState } from "react";

/** How far down the page before the button appears. */
const SHOW_AFTER_PX = 400;
const RING_RADIUS = 22;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Floating "back to top" button, bottom-right on every page. It slides and
 * fades in once the page is scrolled past SHOW_AFTER_PX, and a ring around
 * it fills as the reader moves down the page.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const ringRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;

    // One read/write per animation frame, however fast the scroll events
    // arrive. The ring is updated directly so scrolling never re-renders.
    const update = () => {
      frame = 0;
      const scrolled = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, scrolled / scrollable) : 0;

      setVisible(scrolled > SHOW_AFTER_PX);
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(RING_LENGTH * (1 - progress));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Also covers a page restored mid-scroll by back/forward navigation.
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    // The enter/leave animation lives on this wrapper, not the button: the
    // global `button { transition: transform }` in globals.css is unlayered
    // and would override any Tailwind transition set on the button itself.
    <div
      className={[
        "fixed right-4 z-40 transition-[opacity,translate,scale] duration-300 ease-out motion-reduce:transition-none sm:right-6",
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-75 opacity-0",
      ].join(" ")}
      style={{ bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Yuxarı qayıt"
        title="Yuxarı qayıt"
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/25 hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        {/* Reading progress: the ring fills as the page scrolls down. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        >
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="2.5"
          />
          <circle
            ref={ringRef}
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            className="transition-[stroke-dashoffset] duration-150 ease-out motion-reduce:transition-none"
          />
        </svg>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative h-5 w-5 transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:transition-none"
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
