"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Never leave the bar running longer than this, whatever happened. */
const MAX_VISIBLE_MS = 10_000;

function isModifiedClick(event: MouseEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function shouldHandleLink(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  if (!anchor.href) return false;

  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const failsafe = useRef<number | null>(null);

  // A navigation is over once the URL changes — the path *or* the query.
  // Watching only the path left the bar running forever after query-only
  // links such as the shop's /shop?category=… filters, which the click
  // handler (rightly) treats as navigations.
  const url = `${pathname}?${searchParams.toString()}`;
  useEffect(() => {
    const timeout = window.setTimeout(() => setActive(false), 0);
    return () => window.clearTimeout(timeout);
  }, [url]);

  useEffect(
    () => () => {
      if (failsafe.current !== null) window.clearTimeout(failsafe.current);
    },
    [],
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (isModifiedClick(event)) return;

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor || !shouldHandleLink(anchor, pathname)) return;

      setActive(true);
      // A navigation that never changes the URL (cancelled, or redirected
      // back to this same page) would otherwise keep the bar on for good.
      if (failsafe.current !== null) window.clearTimeout(failsafe.current);
      failsafe.current = window.setTimeout(() => setActive(false), MAX_VISIBLE_MS);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-emerald-100"
    >
      <div className="h-full w-1/3 animate-[navigation-progress_0.9s_ease-in-out_infinite] bg-emerald-600" />
    </div>
  );
}
