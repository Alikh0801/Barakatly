import Image from "next/image";
import Link from "next/link";
import type { FeaturedFarmer } from "@/lib/farmers/queries";
import { farmerDisplayName } from "@/lib/farmers/name";

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function StarRow({ className }: { className?: string }) {
  return (
    <span className={`flex ${className ?? ""}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
          <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
        </svg>
      ))}
    </span>
  );
}

/** Five stars filled to the average, e.g. 4.3 fills four and a third. */
function Stars({ average }: { average: number | null }) {
  const filled = average === null ? 0 : Math.max(0, Math.min(5, average)) / 5;
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <StarRow className="text-zinc-200" />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${filled * 100}%` }}>
        <StarRow className="text-amber-400" />
      </span>
    </span>
  );
}

/**
 * A farmer's card: cover, avatar, name, region, rating and product count.
 * Used on the home page and the farmers page.
 */
export function FarmerCard({
  farmer,
  following = false,
  headingLevel: Heading = "h3",
}: {
  farmer: FeaturedFarmer;
  /** Shows an "İzlənilir" badge on the cover. */
  following?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const name = farmerDisplayName(farmer.owner_name);
  const { average, total } = farmer.rating;
  const ratingLabel =
    average === null
      ? "Hələ rəy yoxdur"
      : `Reytinq ${average.toFixed(1).replace(".", ",")}, ${total} rəy`;

  return (
    <Link
      href={`/farmers/${farmer.id}`}
      prefetch
      data-static-hover
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] ring-1 ring-zinc-900/5 transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)]"
    >
      <div className="relative h-28 shrink-0 bg-[#23382b]">
        {farmer.cover_url ? (
          <Image
            src={farmer.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          // No cover yet: a quiet pattern rather than a stock photo that
          // would pass for the farmer's own fields.
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:16px_16px]" />
        )}

        {following ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-3 w-3">
              <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            İzlənilir
          </span>
        ) : null}

        {farmer.verified_at ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.2 2.4 2.4 4.6-4.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Təsdiqlənib
          </span>
        ) : null}

        <div className="absolute -bottom-6 left-4 h-12 w-12 overflow-hidden rounded-xl border-2 border-white bg-[#1f4d2c] shadow-md">
          {farmer.avatar_url ? (
            <Image src={farmer.avatar_url} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-bold text-[#dff3e4]">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-9">
        <Heading className="truncate text-base font-bold text-zinc-900 group-hover:text-[#2f7a3c]">{name}</Heading>
        {farmer.location_text ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
            <PinIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="truncate">{farmer.location_text}</span>
          </p>
        ) : null}
        {/* mt-auto keeps the rating row on one line across cards of different heights. */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5" role="img" aria-label={ratingLabel}>
            <Stars average={average} />
            <span aria-hidden="true">({total})</span>
          </span>
          <span className="shrink-0">{farmer.productCount} məhsul</span>
        </div>
      </div>
    </Link>
  );
}
