"use client";

import { useEffect, useState } from "react";

export function HeaderShell({
  mode = "static",
  children,
}: {
  mode?: "static" | "scroll";
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (mode !== "scroll") return;

    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  const solid = mode === "static" || scrolled;

  const headerClass =
    mode === "scroll"
      ? [
          "group/header fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
          solid
            ? "border-b border-zinc-200/90 bg-white/95 shadow-sm backdrop-blur"
            : "border-b border-transparent bg-transparent",
        ].join(" ")
      : "sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur";

  return (
    <header className={headerClass} data-scrolled={solid ? "true" : "false"}>
      {children}
    </header>
  );
}
