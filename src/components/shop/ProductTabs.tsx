"use client";

import { useActionState, useState } from "react";
import {
  deleteProductReview,
  submitProductReview,
  type ReviewActionState,
} from "@/lib/shop/review-actions";
import type { ProductRatingSummary, ProductReview } from "@/lib/shop/reviews";
import { formatDate } from "@/lib/format/date";
import { Spinner } from "@/components/ui/Spinner";

type Tab = "description" | "reviews";

const initialState: ReviewActionState = {};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? "0" : "1.5"}
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5Z" />
    </svg>
  );
}

function StarRow({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={["flex items-center gap-0.5 text-amber-500", className].join(" ")}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon key={index} filled={index < Math.round(rating)} />
      ))}
    </div>
  );
}

function ReviewsSummary({ summary }: { summary: ProductRatingSummary }) {
  return (
    <div className="grid gap-6 rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100 sm:grid-cols-[auto_1fr] sm:p-6">
      <div className="text-center sm:border-r sm:border-zinc-200 sm:pr-6">
        <div className="text-4xl font-semibold text-zinc-900">
          {summary.average.toFixed(1)}
        </div>
        <StarRow rating={summary.average} className="mt-1 justify-center" />
        <p className="mt-1 text-xs text-zinc-500">
          {summary.total} rəy əsasında
        </p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.breakdown[stars] ?? 0;
          return (
            <div key={stars} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-3 shrink-0">{stars}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{
                    width: `${summary.total ? (count / summary.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-6 shrink-0 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({
  productId,
  existingReview,
}: {
  productId: string;
  existingReview: ProductReview | null;
}) {
  const [state, formAction, pending] = useActionState(
    submitProductReview,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProductReview,
    initialState,
  );
  const [rating, setRating] = useState(existingReview?.rating ?? 0);

  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-5">
      <h3 className="text-sm font-semibold text-zinc-900">
        {existingReview ? "Rəyinizi yeniləyin" : "Rəyinizi yazın"}
      </h3>

      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="rating" value={rating} />

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              aria-label={`${star} ulduz`}
              aria-pressed={rating === star}
              className={[
                "transition",
                star <= rating ? "text-amber-500" : "text-zinc-300 hover:text-amber-300",
              ].join(" ")}
            >
              <StarIcon filled={star <= rating} />
            </button>
          ))}
        </div>

        <textarea
          name="comment"
          rows={3}
          maxLength={1000}
          defaultValue={existingReview?.comment ?? ""}
          placeholder="Məhsul haqqında fikriniz (istəyə bağlı)"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />

        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {state.success}
          </p>
        ) : null}
        {deleteState.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {deleteState.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || rating < 1}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Spinner className="h-4 w-4" /> : null}
          {existingReview ? "Rəyi yenilə" : "Rəyi paylaş"}
        </button>
      </form>

      {existingReview ? (
        <form action={deleteAction} className="mt-2">
          <input type="hidden" name="product_id" value={productId} />
          <button
            type="submit"
            disabled={deletePending}
            className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
          >
            {deletePending ? "Silinir..." : "Rəyimi sil"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function ProductTabs({
  description,
  productId,
  reviews,
  summary,
  canReview,
  currentCustomerId,
}: {
  description: string;
  productId: string;
  reviews: ProductReview[];
  summary: ProductRatingSummary;
  canReview: boolean;
  currentCustomerId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("description");
  const existingReview =
    reviews.find((review) => review.customerId === currentCustomerId) ?? null;

  return (
    <div className="mt-10">
      <div className="flex gap-6 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setTab("description")}
          className={[
            "border-b-2 pb-3 text-sm font-medium transition",
            tab === "description"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-zinc-500 hover:text-zinc-800",
          ].join(" ")}
        >
          Təsvir
        </button>
        <button
          type="button"
          onClick={() => setTab("reviews")}
          className={[
            "border-b-2 pb-3 text-sm font-medium transition",
            tab === "reviews"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-zinc-500 hover:text-zinc-800",
          ].join(" ")}
        >
          Rəylər ({summary.total})
        </button>
      </div>

      <div className="pt-6">
        {tab === "description" ? (
          description ? (
            <p className="whitespace-pre-line text-sm leading-7 text-zinc-600 md:text-base">
              {description}
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Bu məhsul üçün təsvir hələ əlavə olunmayıb.
            </p>
          )
        ) : (
          <div className="space-y-5">
            {summary.total > 0 ? <ReviewsSummary summary={summary} /> : null}

            {canReview ? (
              <ReviewForm productId={productId} existingReview={existingReview} />
            ) : null}

            {reviews.length === 0 ? (
              <p className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-100">
                Bu məhsul üçün hələ rəy yoxdur.
                {canReview ? "" : " Məhsulu alan müştərilər rəy yaza bilər."}
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                          {initials(review.customerName)}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {review.customerName}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatDate(review.created_at)}
                          </div>
                        </div>
                      </div>
                      <StarRow rating={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="mt-3 text-sm leading-6 text-zinc-600">
                        {review.comment}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
