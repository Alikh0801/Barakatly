import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

function Icon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/15",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold tracking-tight text-white"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/90 ring-1 ring-emerald-300/40">
            <span aria-hidden="true" className="text-base">
              🌿
            </span>
          </span>
          <span className="drop-shadow-sm">Barakatly</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 md:flex">
          <Link className="hover:text-white" href="/shop">
            Mağaza
          </Link>
          <Link className="hover:text-white" href="/farmers">
            Fermerlər
          </Link>
          <Link className="hover:text-white" href="/about">
            Haqqımızda
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="Axtarış">
            <Icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                <path d="M16.5 16.5 21 21" strokeLinecap="round" />
              </svg>
            </Icon>
          </Link>
          <Link href="/cart" aria-label="Səbət">
            <Icon>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path
                  d="M7 7h14l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.5L5 3H2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                <path d="M17.5 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
            </Icon>
          </Link>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}

