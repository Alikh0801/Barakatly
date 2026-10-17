import Image from "next/image";
import { displaySerif as serif } from "@/lib/fonts";
import type { FarmerRatingSummary } from "@/lib/farmers/queries";


const TIME_ZONE = "Asia/Baku";

/** Azerbaijani ordinal suffix for a year: 2024-cü, 2025-ci, 2026-cı, 2030-cu. */
function ordinalSuffix(value: number): string {
  const lastDigit = value % 10;
  if (lastDigit !== 0) {
    return ["", "ci", "ci", "cü", "cü", "ci", "cı", "ci", "ci", "cu"][lastDigit];
  }
  const tens = Math.floor(value / 10) % 10;
  if (tens !== 0) {
    return ["", "cu", "ci", "cu", "cı", "ci", "cı", "ci", "ci", "cı"][tens];
  }
  return Math.floor(value / 100) % 10 !== 0 ? "cü" : "ci";
}

export function memberSinceLabel(createdAt: string): string {
  const year = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, year: "numeric" }).format(
      new Date(createdAt),
    ),
  );
  return Number.isFinite(year) ? `${year}-${ordinalSuffix(year)} ildən üzv` : "Üzv";
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={className}>
      <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5Z" />
    </svg>
  );
}

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Təsdiqlənmiş fermer" title="Təsdiqlənmiş fermer" className={className}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-full w-full">
        <circle cx="12" cy="12" r="9.5" />
        <path d="m8 12.2 2.7 2.7L16.2 9.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * Shown when the farmer has not added a cover photo: an "image missing"
 * panel instead of a stock photo that would pass for their farm.
 */
function CoverPlaceholder({ hint }: { hint?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#23382b] bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:18px_18px]">
      <div className="flex flex-col items-center gap-2 pb-10 text-center text-white/60 sm:pb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-10 w-10">
          <path d="M3 3l18 18" strokeLinecap="round" />
          <path d="M10.4 5H18a3 3 0 0 1 3 3v7.6M19.2 19.2A3 3 0 0 1 18 19H6a3 3 0 0 1-3-3V8a3 3 0 0 1 1.8-2.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m3.5 17 5-5 3 3M14.5 12.5 16 11l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium">Arxa plan şəkli əlavə olunmayıb</p>
        {hint}
      </div>
    </div>
  );
}

function HeaderAvatar({ name, url }: { name: string; url: string | null }) {
  const frame =
    "relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border-4 border-white bg-[#1f4d2c] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] sm:h-[8.25rem] sm:w-[8.25rem] sm:rounded-[1.75rem]";
  if (url) {
    return (
      <div className={frame}>
        <Image src={url} alt={name} fill sizes="(min-width: 640px) 132px, 96px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className={`${frame} flex items-center justify-center`}>
      <span className={`${serif.className} text-4xl text-[#dff3e4] sm:text-5xl`}>
        {name.slice(0, 1).toUpperCase()}
      </span>
    </div>
  );
}

function StatCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-4 text-center ring-1 ring-zinc-200/70 sm:px-4 sm:py-5">
      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{label}</div>
    </div>
  );
}

export type FarmerProfileStats = {
  rating: FarmerRatingSummary;
  productCount: number;
  postCount: number;
  followerCount: number;
};

/**
 * Top of the farmer profile: cover, avatar and name, actions, stat cards and
 * a short about card. Shared by the public page and the farmer's own panel.
 */
export function FarmerProfileHeader({
  farmName,
  avatarUrl,
  coverUrl,
  locationText,
  verified,
  stats,
  actions,
  coverHint,
}: {
  farmName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  locationText: string | null;
  verified: boolean;
  stats: FarmerProfileStats;
  actions?: React.ReactNode;
  /** Extra line under the missing-cover notice, e.g. a link to add one. */
  coverHint?: React.ReactNode;
}) {
  const { rating } = stats;

  return (
    <section>
      <div className="relative h-44 overflow-hidden bg-[#23382b] sm:h-64">
        {coverUrl ? (
          <>
            <Image src={coverUrl} alt="" fill preload sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          </>
        ) : (
          <CoverPlaceholder hint={coverHint} />
        )}

        {/* From sm up the name sits on the cover, beside the avatar. Long
            names grow upwards, so they always stay on the dark photo. */}
        <div className="absolute inset-x-0 bottom-0 hidden sm:block">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2.5 pb-4 pl-[10rem]">
              <h1 className={`${serif.className} min-w-0 break-words text-3xl leading-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] lg:text-4xl`}>
                {farmName}
              </h1>
              {verified ? (
                <VerifiedBadge className="h-7 w-7 shrink-0 text-white drop-shadow" />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-7">
          <div className="-mt-12 sm:-mt-20">
            <HeaderAvatar name={farmName} url={avatarUrl} />
          </div>

          <div className="min-w-0 flex-1 sm:pt-3">
            <div className="flex min-w-0 items-center gap-2 sm:hidden">
              <h1 className={`${serif.className} min-w-0 break-words text-2xl leading-tight text-zinc-900`}>
                {farmName}
              </h1>
              {verified ? (
                <VerifiedBadge className="h-6 w-6 shrink-0 text-[#2f7a3c]" />
              ) : null}
            </div>
            {locationText ? (
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-600 sm:mt-0 sm:text-[15px]">
                <PinIcon className="h-4 w-4 shrink-0 text-[#2f7a3c]" />
                {locationText}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-start gap-2.5 sm:pt-3">{actions}</div>
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <StatCard
            value={
              rating.average !== null ? (
                <>
                  {formatRating(rating.average)}
                  <StarIcon className="h-5 w-5 text-amber-500" />
                </>
              ) : (
                <span className="text-zinc-400">—</span>
              )
            }
            label={rating.total > 0 ? `Reytinq · ${rating.total} rəy` : "Hələ rəy yoxdur"}
          />
          <StatCard value={stats.productCount} label="Məhsul" />
          <StatCard value={stats.postCount} label="Paylaşım" />
          <StatCard value={stats.followerCount} label="İzləyici" />
        </div>

      </div>
    </section>
  );
}

/** Underlined tab strip under the header. */
export function FarmerProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Profil bölmələri"
      className="mt-8 flex gap-1 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none]"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            data-static-hover
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-3 text-[15px] transition-colors sm:px-4 sm:text-base ${
              isActive
                ? "border-[#2f7a3c] font-semibold text-[#2f7a3c]"
                : "border-transparent font-medium text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
