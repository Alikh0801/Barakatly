"use client";

/**
 * Two-thumb price slider with typed min/max fields above it. Both edit the
 * same strings: an empty string means "no limit" on that side, so a thumb
 * dragged back to the end of the track clears that side of the filter.
 */

const THUMB =
  // The inputs overhang the track by half a thumb on each side, so a thumb's
  // centre lines up with the filled bar at both ends.
  "pointer-events-none absolute left-[-10px] top-0 m-0 h-full w-[calc(100%+20px)] appearance-none bg-transparent outline-none " +
  "[&::-webkit-slider-runnable-track]:bg-transparent [&::-moz-range-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.3)] active:[&::-webkit-slider-thumb]:cursor-grabbing " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-emerald-600 [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.3)] " +
  "focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-emerald-500/30 focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-emerald-500/30";

const FIELD =
  "w-full min-w-0 rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-7 text-base text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2 sm:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parse(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatBound(value: number) {
  return `${value} ₼`;
}

export function PriceRangeFilter({
  bounds,
  minPrice,
  maxPrice,
  onChange,
}: {
  bounds: { min: number; max: number };
  minPrice: string;
  maxPrice: string;
  onChange: (next: { min: string; max: string }) => void;
}) {
  const span = bounds.max - bounds.min;
  const step = span > 50 ? 1 : 0.5;
  const sliderEnabled = span > 0;

  const low = clamp(parse(minPrice) ?? bounds.min, bounds.min, bounds.max);
  const high = clamp(parse(maxPrice) ?? bounds.max, bounds.min, bounds.max);
  const lowPercent = sliderEnabled ? ((Math.min(low, high) - bounds.min) / span) * 100 : 0;
  const highPercent = sliderEnabled ? ((Math.max(low, high) - bounds.min) / span) * 100 : 100;

  function slideLow(value: number) {
    const next = Math.min(value, high);
    onChange({ min: next <= bounds.min ? "" : String(next), max: maxPrice });
  }

  function slideHigh(value: number) {
    const next = Math.max(value, low);
    onChange({ min: minPrice, max: next >= bounds.max ? "" : String(next) });
  }

  // Typed values are only tidied once the field is left, so typing "1"
  // on the way to "12" is never clamped mid-word. Only the field being left
  // is corrected: a min above the max is pulled down to it, and vice versa.
  function tidy(side: "min" | "max") {
    const own = parse(side === "min" ? minPrice : maxPrice);
    const other = parse(side === "min" ? maxPrice : minPrice);
    let next = own;
    if (next !== null) {
      next = clamp(next, bounds.min, bounds.max);
      if (other !== null) next = side === "min" ? Math.min(next, other) : Math.max(next, other);
    }
    const atEnd = next === null || (side === "min" ? next <= bounds.min : next >= bounds.max);
    const value = atEnd ? "" : String(next);
    onChange(side === "min" ? { min: value, max: maxPrice } : { min: minPrice, max: value });
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs text-zinc-500">Min</span>
          <span className="relative block">
            <input
              type="number"
              inputMode="decimal"
              min={bounds.min}
              max={bounds.max}
              step="any"
              placeholder={String(bounds.min)}
              value={minPrice}
              onChange={(event) => onChange({ min: event.target.value, max: maxPrice })}
              onBlur={() => tidy("min")}
              className={FIELD}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₼</span>
          </span>
        </label>
        <span className="shrink-0 pb-2 text-zinc-400" aria-hidden="true">—</span>
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs text-zinc-500">Max</span>
          <span className="relative block">
            <input
              type="number"
              inputMode="decimal"
              min={bounds.min}
              max={bounds.max}
              step="any"
              placeholder={String(bounds.max)}
              value={maxPrice}
              onChange={(event) => onChange({ min: minPrice, max: event.target.value })}
              onBlur={() => tidy("max")}
              className={FIELD}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₼</span>
          </span>
        </label>
      </div>

      {sliderEnabled ? (
        <>
          <div className="relative mx-2.5 mt-5 h-5">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-200" />
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-600"
              style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
            />
            <input
              type="range"
              aria-label="Minimum qiymət"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={low}
              onChange={(event) => slideLow(Number(event.target.value))}
              // When both thumbs meet at the top end, the low one must stay
              // grabbable or it could never be pulled back down.
              className={`${THUMB} ${lowPercent > 50 ? "z-20" : "z-10"}`}
            />
            <input
              type="range"
              aria-label="Maksimum qiymət"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={high}
              onChange={(event) => slideHigh(Number(event.target.value))}
              className={`${THUMB} z-[15]`}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-400">
            <span>{formatBound(bounds.min)}</span>
            <span>{formatBound(bounds.max)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
