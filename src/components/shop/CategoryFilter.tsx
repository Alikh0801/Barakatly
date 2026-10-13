"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { CategoryItem } from "@/types/shop";

function CategoryIcon({ category }: { category: CategoryItem }) {
  if (category.image_url) {
    return (
      <Image
        src={category.image_url}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 shrink-0 rounded-full object-cover"
      />
    );
  }
  if (category.icon) {
    return (
      <span aria-hidden="true" className="shrink-0">
        {category.icon}
      </span>
    );
  }
  return null;
}

function AllIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3 w-3">
        <path d="M4 6h4v4H4V6Zm6 0h4v4h-4V6Zm6 0h4v4h-4V6ZM4 14h4v4H4v-4Zm6 0h4v4h-4v-4Zm6 0h4v4h-4v-4Z" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Category picker as a dropdown. Each option is a link, so choosing one is
 * an ordinary navigation (and works without JavaScript once open).
 */
export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: CategoryItem[];
  activeSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const active = categories.find((category) => category.slug === activeSlug) ?? null;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    // Escape closes it wherever focus is, e.g. right after a mouse click.
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function options() {
    return [...(listRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
  }

  function focusOption(index: number) {
    const items = options();
    if (items.length === 0) return;
    items[(index + items.length) % items.length].focus();
  }

  function openAndFocus(index: number) {
    setOpen(true);
    // The list renders on the next frame.
    requestAnimationFrame(() => focusOption(index));
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openAndFocus(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAndFocus(-1);
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const items = options();
    const current = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(current + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(-1);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  const optionClass = (selected: boolean) =>
    [
      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors",
      selected
        ? "bg-emerald-50 text-emerald-800"
        : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 focus-visible:bg-zinc-50",
    ].join(" ");

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        data-static-hover
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left text-sm font-medium text-zinc-900 outline-none transition-colors ${
          open ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        {active ? <CategoryIcon category={active} /> : <AllIcon />}
        <span className="min-w-0 flex-1 truncate">{active?.name_az ?? "Bütün kateqoriyalar"}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          aria-label="Kateqoriyalar"
          onKeyDown={onListKeyDown}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 space-y-0.5 overflow-y-auto rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-zinc-200"
        >
          <li>
            <Link
              href="/shop"
              prefetch
              data-static-hover
              aria-current={!active ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={optionClass(!active)}
            >
              <AllIcon />
              <span className="truncate">Bütün kateqoriyalar</span>
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop?category=${category.slug}`}
                prefetch
                data-static-hover
                aria-current={active?.id === category.id ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={optionClass(active?.id === category.id)}
              >
                <CategoryIcon category={category} />
                <span className="truncate">{category.name_az}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
