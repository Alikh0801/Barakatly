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
          "group/header fixed inset-x-0 top-0 z-30 transition-[background-color,border-color,box-shadow] duration-300",
          solid
            ? "border-b border-zinc-200/90 bg-white shadow-sm"
            : "border-b border-transparent bg-transparent",
        ].join(" ")
      // Solid white, no backdrop-filter: a blurred sticky header over a long
      // page left parts of it unpainted (white) in some browsers until a
      // zoom or scroll forced a repaint.
      : "sticky top-0 z-30 border-b border-zinc-200 bg-white";

  return (
    <header className={headerClass} data-scrolled={solid ? "true" : "false"}>
      {children}
    </header>
  );
}
