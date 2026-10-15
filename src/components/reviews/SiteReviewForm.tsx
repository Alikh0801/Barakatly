"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AZ_REGIONS } from "@/lib/az/regions";
import {
  SITE_REVIEW_MAX_LENGTH,
  SITE_REVIEW_MIN_LENGTH,
} from "@/lib/reviews/site-constants";
import { submitSiteReview, type SiteReviewActionState } from "@/lib/reviews/site-actions";
import { Spinner } from "@/components/ui/Spinner";
import type { SiteReview } from "@/types";

const initialState: SiteReviewActionState = {};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`h-7 w-7 ${filled ? "text-amber-400" : "text-zinc-200"}`}>
      <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
    </svg>
  );
}

/**
 * "Rate Barakatly" box on a delivered order. One review per customer;
 * sending again edits it, and it waits for an admin before the home page
 * can show it.
 */
export function SiteReviewForm({ existing }: { existing: SiteReview | null }) {
  const [state, action, pending] = useActionState(submitSiteReview, initialState);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const shown = hover || rating;

  // Dispatched by hand so React does not reset the fields after sending.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            {existing ? "Barakatly haqqında rəyiniz" : "Barakatly-ni qiymətləndirin"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Təcrübənizi bölüşün: məhsulların keyfiyyəti, çatdırılma, xidmət. Seçilmiş rəylər ana səhifədə adınızın qısaltması
            və şəhərinizlə göstərilir.
          </p>
        </div>
        {existing?.status === "approved" ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Ana səhifədə dərc olunub
          </span>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              data-static-hover
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              aria-label={`${star} ulduz`}
              aria-pressed={rating === star}
              className="rounded p-0.5"
            >
              <Star filled={star <= shown} />
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="site-review-city" className="block text-sm font-medium text-zinc-700">
            Şəhər / rayon
          </label>
          <select
            id="site-review-city"
            name="city"
            required
            defaultValue={existing?.city ?? ""}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 sm:max-w-xs sm:text-sm"
          >
            <option value="">Seçin</option>
            {AZ_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="site-review-comment" className="block text-sm font-medium text-zinc-700">
            Rəyiniz
          </label>
          <textarea
            id="site-review-comment"
            name="comment"
            required
            rows={4}
            minLength={SITE_REVIEW_MIN_LENGTH}
            maxLength={SITE_REVIEW_MAX_LENGTH}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Barakatly ilə alış-veriş təcrübəniz necə idi?"
            className="mt-1 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 sm:text-sm"
          />
          <p className="mt-1 text-right text-xs text-zinc-400">
            {comment.trim().length}/{SITE_REVIEW_MAX_LENGTH}
          </p>
        </div>

        {state.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">{state.success}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending || rating < 1}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Spinner className="h-4 w-4" /> : null}
          {existing ? "Rəyi yenilə" : "Rəyi göndər"}
        </button>
        {existing ? (
          <p className="text-xs text-zinc-500">Rəyi dəyişsəniz, yenidən yoxlanılana qədər ana səhifədən götürülür.</p>
        ) : null}
      </form>
    </section>
  );
}
