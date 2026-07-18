"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

const LINKS = [
  { href: "/shop", label: "Mağaza" },
  { href: "/search", label: "Axtarış" },
  { href: "/farmers", label: "Fermerlər" },
  { href: "/about", label: "Haqqımızda" },
] as const;

export function MobileNav({
  variant = "hero",
}: {
  variant?: "hero" | "solid" | "adaptive";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const buttonClass =
    variant === "adaptive"
      ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 group-data-[scrolled=true]/header:bg-zinc-100 group-data-[scrolled=true]/header:text-zinc-700 group-data-[scrolled=true]/header:ring-zinc-200 group-data-[scrolled=true]/header:hover:bg-zinc-200"
      : variant === "hero"
        ? "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15"
        : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200";

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Menyunu bağla" : "Menyunu aç"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
          buttonClass,
        ].join(" ")}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Menyunu bağla"
            className="fixed inset-0 z-40 bg-zinc-950/40"
            onClick={() => setOpen(false)}
          />
          <nav
            id={panelId}
            className="fixed inset-x-0 top-[4.25rem] z-50 mx-4 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-zinc-200"
          >
            <ul className="divide-y divide-zinc-100 p-1.5">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : null}
    </div>
  );
}
