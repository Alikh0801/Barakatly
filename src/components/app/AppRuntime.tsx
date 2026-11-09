"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js), which makes the site
 * installable, and marks <html> for older iPhones that report the home
 * screen app through navigator.standalone instead of the display-mode
 * media query the `app:` styles use.
 */
export function AppRuntime() {
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (nav.standalone) document.documentElement.dataset.appMode = "";

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.warn("[sw] registration failed", error);
      });
    }
  }, []);

  return null;
}
