"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteSiteReview,
  moderateSiteReview,
  type SiteReviewActionState,
} from "@/lib/reviews/site-actions";
import { formatDateTime } from "@/lib/format/date";
import { REVIEW_FILTERS, type ReviewFilter } from "@/lib/reviews/site-constants";
import { Spinner } from "@/components/ui/Spinner";
import type { SiteReview } from "@/types";

const initialState: SiteReviewActionState = {};


const STATUS_BADGE: Record<SiteReview["status"], { label: string; className: string }> = {
  pending: { label: "Gözləyir", className: "bg-amber-50 text-amber-800 ring-amber-200" },
  approved: { label: "Ana səhifədə", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  hidden: { label: "Gizlədilib", className: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
};

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

function ReviewCard({ review }: { review: SiteReview }) {
  const [moderateState, moderateAction, moderating] = useActionState(moderateSiteReview, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteSiteReview, initialState);
  const busy = moderating || deleting;
  const badge = STATUS_BADGE[review.status];
  const error = moderateState.error ?? deleteState.error;

  return (
    <article className="flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} />
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}>{badge.label}</span>
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-zinc-800">“{review.comment}”</p>
      <p className="mt-3 text-sm font-semibold text-zinc-900">
        {review.display_name} <span className="font-normal text-zinc-500">· {review.city}</span>
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">{formatDateTime(review.updated_at)}</p>

      {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
        {review.status !== "approved" ? (
          <form action={moderateAction}>
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="status" value="approved" />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {moderating ? <Spinner className="h-3.5 w-3.5" /> : null}
              Ana səhifədə göstər
            </button>
          </form>
        ) : null}
        {review.status !== "hidden" ? (
          <form action={moderateAction}>
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="status" value="hidden" />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 disabled:opacity-60"
            >
              Gizlət
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

export function AdminSiteReviewsPanel({
  reviews,
  filter,
  counts,
}: {
  reviews: SiteReview[];
  filter: ReviewFilter;
  counts: Record<ReviewFilter, number>;
}) {
  const visible = reviews.filter((review) => review.status === filter);

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200">
        Rəyləri çatdırılmış sifarişi olan müştərilər yazır. Ana səhifədə ən son təsdiqlənmiş 3 rəy göstərilir.
        Müştəri rəyini dəyişsə, rəy yenidən “Gözləyən” bölməsinə düşür.
      </p>

      <nav aria-label="Rəy statusu" className="flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((item) => {
          const active = item.id === filter;
          return (
            <Link
              key={item.id}
              href={`/admin/reviews?status=${item.id}`}
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
