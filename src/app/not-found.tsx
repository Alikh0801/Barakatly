import Link from "next/link";
import type { CSSProperties } from "react";
import { PublicShell } from "@/components/layout/PublicShell";

function ConeIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M28 10h8l12 42H16L28 10Z"
        fill="#f59e0b"
        stroke="#b45309"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M26.5 24h11" stroke="#fffbeb" strokeWidth="5" />
      <path d="M24.5 36h15" stroke="#fffbeb" strokeWidth="5" />
      <path d="M12 54h40" stroke="#78716c" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HelmetIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M12 36c0-12 9-22 20-22s20 10 20 22v4H12v-4Z"
        fill="#059669"
        stroke="#065f46"
        strokeWidth="2"
      />
      <path d="M8 42h48v4a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-4Z" fill="#047857" />
      <path d="M30 14h4v8h-4V14Z" fill="#065f46" />
    </svg>
  );
}

function GearIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M28 8h8l2 6 6-2 6 6-2 6 6 2v8l-6 2 2 6-6 6-6-2-2 6h-8l-2-6-6 2-6-6 2-6-6-2v-8l6-2-2-6 6-6 6 2 2-6Z"
        fill="#d4d4d8"
        stroke="#71717a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="8" fill="#fafafa" stroke="#52525b" strokeWidth="2" />
    </svg>
  );
}

function CraneIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d="M14 54h10" stroke="#78716c" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 54V18" stroke="#52525b" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 20h30" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
      <path d="M47 20v16" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
      <rect x="42" y="36" width="10" height="8" rx="1" fill="#059669" />
      <path d="M19 28h8" stroke="#a1a1aa" strokeWidth="2" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14.7 6.3a4.5 4.5 0 0 0-6.2 6.2l-5.2 5.2a1.5 1.5 0 0 0 2.1 2.1l5.2-5.2a4.5 4.5 0 0 0 6.2-6.2l-2.6 2.6-2.1-2.1 2.6-2.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarrierIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 18V8M20 18V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 10h16v4H4z" fill="currentColor" opacity="0.15" />
      <path
        d="M4 10h16M4 14h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_ITEMS = [
  {
    label: "Səhifə aktiv deyil",
    icon: BarrierIcon,
  },
  {
    label: "Hazırlanma mərhələsində",
    icon: WrenchIcon,
  },
  {
    label: "Tezliklə əlçatan olacaq",
    icon: ClockIcon,
  },
] as const;

export default function NotFound() {
  return (
    <PublicShell>
      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.10),transparent_35%),linear-gradient(180deg,#f7f6f1_0%,#ffffff_55%,#f4faf7_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-2 opacity-90"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #f59e0b 0 12px, #18181b 12px 24px)",
            backgroundSize: "28px 28px",
            animation: "not-found-stripe 1.2s linear infinite",
          }}
        />

        <div className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center md:px-6 md:py-20">
          <div
            className="relative mb-8 flex h-36 w-full max-w-md items-end justify-center"
            style={{ animation: "not-found-fade-up 0.55s ease-out both" }}
          >
            <HelmetIcon
              className="absolute left-4 top-2 h-14 w-14 opacity-90 sm:left-10"
              style={{ animation: "not-found-float 3.2s ease-in-out infinite" }}
            />
            <GearIcon
              className="absolute right-6 top-0 h-12 w-12 opacity-80 sm:right-14"
              style={{ animation: "not-found-spin-slow 10s linear infinite" }}
            />
            <ConeIcon
              className="h-28 w-28 drop-shadow-sm"
              style={{ animation: "not-found-float 2.8s ease-in-out infinite" }}
            />
            <CraneIcon
              className="absolute bottom-2 right-2 h-16 w-16 opacity-90 sm:right-8"
              style={{
                animation: "not-found-float 3.6s ease-in-out 0.4s infinite",
              }}
            />
          </div>

          <div style={{ animation: "not-found-fade-up 0.65s ease-out 0.08s both" }}>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              404
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
              Səhifə tapılmadı
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-zinc-600">
              Axtardığınız ünvan mövcud deyil və ya hələ dərc olunmayıb.
              Ana səhifəyə qayıda və ya mağazadan alış-verişə davam edə
              bilərsiniz.
            </p>
          </div>

          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animation: "not-found-fade-up 0.7s ease-out 0.16s both" }}
          >
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Ana səhifə
            </Link>
            <Link
              href="/shop"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              Mağazaya keç
            </Link>
          </div>

          <ul
            className="mt-10 flex w-full max-w-xl flex-col items-stretch gap-3 text-left sm:flex-row sm:justify-between sm:gap-4"
            style={{ animation: "not-found-fade-up 0.75s ease-out 0.22s both" }}
          >
            {STATUS_ITEMS.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-center gap-2 text-sm text-zinc-700 sm:flex-1 sm:flex-col sm:text-center"
              >
                <item.icon className="h-5 w-5 shrink-0 text-emerald-700" />
                <span className="font-medium leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PublicShell>
  );
}
