"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_KEY = "barakatly-visitor";

// Module state, so React StrictMode's double effect in development does not
// count a page twice, and the external referrer is only sent for the page
// the visitor landed on.
let lastTrackedPath: string | null = null;
let referrerSent = false;

function visitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Private mode or storage blocked: still count the view.
    return null;
  }
}

/**
 * Reports each page the visitor opens to /api/track for the admin
 * statistics. Uses sendBeacon, so it never delays navigation.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname === lastTrackedPath) return;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return;
    lastTrackedPath = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: referrerSent ? null : document.referrer || null,
      visitorId: visitorId(),
    });
    referrerSent = true;

    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      void fetch("/api/track", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
