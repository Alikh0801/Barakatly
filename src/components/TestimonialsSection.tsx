import { displaySerif } from "@/lib/fonts";
import { getApprovedSiteReviews, type PublicSiteReview } from "@/lib/reviews/site";

// Soft tints for the initial when a reviewer has no photo.
const AVATAR_TINTS = [
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
];

// Columns follow the number of approved reviews, so one or two still sit
// centred. With three, tablets show two: a third would sit alone.
const GRID_BY_COUNT: Record<number, string> = {
  1: "mx-auto max-w-md",
  2: "mx-auto max-w-3xl md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} ulduz`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-zinc-200"}`}
        >
          <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review, index }: { review: PublicSiteReview; index: number }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl bg-[#f8f8f6] p-6 ring-1 ring-zinc-200/70">
      <Stars rating={review.rating} />
      <blockquote className="mt-4 text-[15px] leading-7 text-zinc-700">
        “{review.comment}”
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span
          aria-hidden="true"
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${AVATAR_TINTS[index % AVATAR_TINTS.length]}`}
        >
          {review.display_name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-zinc-900">
            {review.display_name}
          </span>
          <span className="block truncate text-xs text-zinc-500">{review.city}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * "What customers say": reviews of Barakatly that an admin approved. Hidden
 * until there is at least one - never filled with sample quotes.
 */
export async function TestimonialsSection() {
  const reviews = await getApprovedSiteReviews(3);
  if (reviews.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <h2 className={`${displaySerif.className} text-center text-3xl leading-tight text-zinc-900 sm:text-4xl`}>
          Müştərilərimiz nə deyir
        </h2>
        <ul className={`mt-10 grid grid-cols-1 gap-5 ${GRID_BY_COUNT[reviews.length] ?? GRID_BY_COUNT[3]}`}>
          {reviews.map((review, index) => (
            <li key={review.id} className={`min-w-0 ${index === 2 ? "md:max-lg:hidden" : ""}`}>
              <ReviewCard review={review} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
