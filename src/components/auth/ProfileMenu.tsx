"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type ProfileMenuProps = {
  variant?: "hero" | "solid" | "adaptive";
  fullName: string | null;
  email: string | null;
  role: string;
  initials: string;
};

function roleLabel(role: string) {
  switch (role) {
    case "farmer":
      return "Fermer";
    case "courier":
      return "Kuryer";
    case "admin":
      return "Admin";
    default:
      return "Müştəri";
  }
}

function portalLink(role: string): { href: string; label: string } | null {
  switch (role) {
    case "farmer":
      return { href: "/farmer", label: "Fermer paneli" };
    case "courier":
      return { href: "/courier", label: "Kuryer paneli" };
    case "admin":
      return { href: "/admin", label: "Admin paneli" };
    default:
      return null;
  }
}

export function ProfileMenu({
  variant = "hero",
  fullName,
  email,
  role,
  initials,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const displayName = fullName?.trim() || email || "Hesab";
  const portal = portalLink(role);

  const triggerClass =
    variant === "adaptive"
      ? "bg-white/10 ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15 group-data-[scrolled=true]/header:bg-white group-data-[scrolled=true]/header:ring-zinc-200 group-data-[scrolled=true]/header:hover:ring-zinc-300"
      : variant === "hero"
        ? "bg-white/10 ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/15"
        : "bg-white ring-1 ring-zinc-200 hover:ring-zinc-300";

  const nameClass =
    variant === "adaptive"
      ? "text-white group-data-[scrolled=true]/header:text-zinc-800"
      : variant === "hero"
        ? "text-white"
        : "text-zinc-800";

  const caretClass =
    variant === "adaptive"
      ? "text-white group-data-[scrolled=true]/header:text-zinc-500"
      : variant === "hero"
        ? "text-white"
        : "text-zinc-500";

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative ml-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={[
          "group inline-flex items-center gap-2 rounded-full p-0.5 transition",
          triggerClass,
        ].join(" ")}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold tracking-wide text-white ring-2 ring-white/25">
          {initials}
        </span>
        <span
          className={[
            "hidden items-center gap-1.5 pr-2.5 text-sm font-medium sm:inline-flex",
            nameClass,
          ].join(" ")}
        >
          <span className="max-w-[110px] truncate">{displayName.split(" ")[0]}</span>
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={[
              "h-4 w-4 opacity-70 transition duration-200",
              open ? "rotate-180" : "",
              caretClass,
            ].join(" ")}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Profil menyusu"
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_16px_40px_-20px_rgba(24,24,27,0.45)]"
        >
          <div className="border-b border-zinc-100 bg-[linear-gradient(180deg,#f8faf8_0%,#ffffff_100%)] px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-zinc-900">
                  {displayName}
                </div>
                {email ? (
                  <div className="mt-0.5 truncate text-xs text-zinc-500">{email}</div>
                ) : null}
                <div className="mt-2 inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100">
                  {roleLabel(role)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-1.5">
            <MenuLink href="/account" onNavigate={() => setOpen(false)}>
              Hesabım
            </MenuLink>
            <MenuLink href="/orders" onNavigate={() => setOpen(false)}>
              Sifarişlərim
            </MenuLink>
            <MenuLink href="/notifications" onNavigate={() => setOpen(false)}>
              Bildirişlər
            </MenuLink>
            {portal ? (
              <MenuLink href={portal.href} onNavigate={() => setOpen(false)}>
                {portal.label}
              </MenuLink>
            ) : null}
          </div>

          <div className="border-t border-zinc-100 p-1.5">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M15 12H4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M11 8l4 4-4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                    strokeLinecap="round"
                  />
                </svg>
                Çıxış
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      prefetch
      onClick={onNavigate}
      className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
    >
      {children}
    </Link>
  );
}
