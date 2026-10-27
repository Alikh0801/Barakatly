"use client";

import { useEffect, useRef, useState } from "react";

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
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

/**
 * The home page's category tiles. From 1024 px they sit in a grid, so
 * every category is on screen. Narrower, they scroll sideways: a fade and
 * an arrow on each side that has more tiles show there is more, and the
 * arrows scroll by most of a screen.
 */
export function CategoryScroller({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const update = () =>
      setMore({
        left: element.scrollLeft > 4,
        right: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
      });
    element.addEventListener("scroll", update, { passive: true });
    // Also fires once right away, with the first measurements.
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollBy(direction: -1 | 1) {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: "smooth" });
  }

  const fade = "pointer-events-none absolute inset-y-0 z-10 w-14 transition-opacity duration-200 lg:hidden";
  const arrow =
    "absolute top-8 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md ring-1 ring-zinc-200 transition hover:bg-zinc-50 sm:top-9 lg:hidden";

  return (
    <div className="relative -mx-4">
      <div
        ref={scrollRef}
        className="overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible"
      >
        <div className="flex w-max min-w-full items-start justify-center gap-4 md:gap-6 lg:grid lg:w-full lg:grid-cols-[repeat(auto-fill,minmax(104px,1fr))] lg:justify-items-center lg:gap-x-4 lg:gap-y-6">
          {children}
        </div>
      </div>

      <span
        aria-hidden="true"
        className={`${fade} left-0 bg-gradient-to-r from-white to-transparent ${more.left ? "opacity-100" : "opacity-0"}`}
      />
      <span
        aria-hidden="true"
        className={`${fade} right-0 bg-gradient-to-l from-white to-transparent ${more.right ? "opacity-100" : "opacity-0"}`}
      />
      {more.left ? (
        <button type="button" onClick={() => scrollBy(-1)} aria-label="Əvvəlki kateqoriyalar" className={`${arrow} left-1`}>
          <ArrowIcon direction="left" />
        </button>
      ) : null}
      {more.right ? (
        <button type="button" onClick={() => scrollBy(1)} aria-label="Növbəti kateqoriyalar" className={`${arrow} right-1`}>
          <ArrowIcon direction="right" />
        </button>
      ) : null}
    </div>
  );
}
