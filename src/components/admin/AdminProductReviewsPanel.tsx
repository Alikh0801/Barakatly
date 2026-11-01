"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteReviewAsAdmin,
  setReviewFeatured,
  type FeaturedReviewActionState,
} from "@/lib/reviews/featured-actions";
import { REVIEW_FILTERS, type ReviewFilter } from "@/lib/reviews/featured-constants";
import type { AdminProductReview } from "@/lib/reviews/featured";
import { formatDateTime } from "@/lib/format/date";
import { FormPendingSpinner } from "@/components/ui/FormPendingSpinner";

const initialState: FeaturedReviewActionState = {};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" role="img" aria-label={`${rating} ulduz`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-zinc-200"}`}>
          <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
        </svg>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: AdminProductReview }) {
  const [featureState, featureAction, featuring] = useActionState(setReviewFeatured, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteReviewAsAdmin, initialState);
  const busy = featuring || deleting;
  const featured = review.featuredAt !== null;
  const hasText = Boolean(review.comment?.trim());
  const error = featureState.error ?? deleteState.error;

  return (
    <article
      className={`flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5 ${
        featured ? "ring-2 ring-emerald-300" : "ring-1 ring-zinc-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} />
        {featured ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Ana səhifədə
          </span>
        ) : null}
      </div>
      <Link
        href={`/shop/${review.productId}`}
        className="mt-2 truncate text-sm font-semibold text-emerald-700 hover:underline"
      >
        {review.productTitle ?? "Məhsul"}
      </Link>
      {hasText ? (
        <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-zinc-800">“{review.comment}”</p>
      ) : (
        <p className="mt-2 text-sm italic text-zinc-400">Mətn yoxdur</p>
      )}
      <p className="mt-3 text-sm font-semibold text-zinc-900">{review.customerName ?? "Müştəri"}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{formatDateTime(review.updatedAt)}</p>

      {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        {featured || hasText ? (
          <form action={featureAction}>
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="featured" value={featured ? "false" : "true"} />
            <button
              type="submit"
              disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold disabled:opacity-60 ${
                featured ? "bg-white text-zinc-700 ring-1 ring-zinc-200" : "bg-emerald-600 text-white"
              }`}
            >
              <FormPendingSpinner />
              {featured ? "Ana səhifədən götür" : "Ana səhifədə göstər"}
            </button>
          </form>
        ) : null}
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm("Bu rəyi silmək istəyirsiniz? Bu geri qaytarılmır.")) event.preventDefault();
          }}
          className="ml-auto"
        >
          <input type="hidden" name="review_id" value={review.id} />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          >
            {deleting ? "Silinir..." : "Sil"}
          </button>
        </form>
      </div>
    </article>
  );
}

export function AdminProductReviewsPanel({
  reviews,
  filter,
}: {
  reviews: AdminProductReview[];
  filter: ReviewFilter;
}) {
  const counts: Record<ReviewFilter, number> = {
    all: reviews.length,
    featured: reviews.filter((review) => review.featuredAt !== null).length,
  };
  const visible = filter === "featured" ? reviews.filter((review) => review.featuredAt !== null) : reviews;

  return (
    <div className="space-y-5">
      <nav aria-label="Rəylər" className="flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((item) => {
          const active = item.id === filter;
          return (
            <Link
              key={item.id}
              href={item.id === "all" ? "/admin/reviews" : `/admin/reviews?filter=${item.id}`}
              data-static-hover
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-zinc-100 text-zinc-600"}`}>
                {counts[item.id]}
              </span>
            </Link>
          );
        })}
      </nav>

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          Bu bölmədə rəy yoxdur.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
