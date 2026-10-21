import Link from "next/link";

/**
 * Page numbers with the current one marked: all of them when there are
 * few, otherwise the first, the last and two either side of the current,
 * with "…" for the gaps.
 */
function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const list: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) list.push("gap");
    list.push(page);
  });
  return list;
}

const itemClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition";

export function Pagination({
  current,
  total,
  href,
  label = "Səhifələr",
}: {
  current: number;
  total: number;
  /** The link for a page number. */
  href: (page: number) => string;
  label?: string;
}) {
  if (total <= 1) return null;

  return (
    <nav aria-label={label} className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {current > 1 ? (
        <Link
          href={href(current - 1)}
          prefetch
          aria-label="Əvvəlki səhifə"
          className={`${itemClass} text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50`}
        >
          ←
        </Link>
      ) : null}
      {pageList(current, total).map((page, index) =>
        page === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-zinc-400" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            prefetch
            aria-current={page === current ? "page" : undefined}
            className={`${itemClass} ${
              page === current
                ? "bg-emerald-600 text-white"
                : "text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {page}
          </Link>
        ),
      )}
      {current < total ? (
        <Link
          href={href(current + 1)}
          prefetch
          aria-label="Növbəti səhifə"
          className={`${itemClass} text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50`}
        >
          →
        </Link>
      ) : null}
    </nav>
  );
}
