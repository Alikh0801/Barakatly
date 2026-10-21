"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }

    // Shows once the top edge is in the lower part of the screen, or the
    // section is already above it (a reload restored the scroll). This used
    // a 15% threshold, and a section taller than about six screens — the
    // home page products once the shop grew — could never show 15% of
    // itself at once, so it stayed invisible until the page was zoomed out.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delayMs
    ? { transitionDelay: `${delayMs}ms` }
    : undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={[
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
