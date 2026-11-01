"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { submitProductReview, type ReviewActionState } from "@/lib/shop/review-actions";
import { Spinner } from "@/components/ui/Spinner";

const initialState: ReviewActionState = {};
const MAX_COMMENT_LENGTH = 1000;

export type ReviewableProduct = {
  productId: string;
  title: string;
  imageUrl: string | null;
  existing: { rating: number; comment: string | null } | null;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`h-6 w-6 ${filled ? "text-amber-400" : "text-zinc-200"}`}>
      <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
    </svg>
  );
}

function ProductReviewRow({ product }: { product: ReviewableProduct }) {
  const [state, action, pending] = useActionState(submitProductReview, initialState);
  const [rating, setRating] = useState(product.existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(product.existing?.comment ?? "");
  const shown = hover || rating;

  // Dispatched by hand so React does not clear the fields after sending.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <li className="border-b border-zinc-100 pb-5 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <p className="min-w-0 flex-1 break-words font-medium text-zinc-900">{product.title}</p>
        {product.existing && !state.success ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            Rəy yazılıb
          </span>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input type="hidden" name="product_id" value={product.productId} />
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
        <textarea
          name="comment"
          rows={3}
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Məhsul haqqında fikriniz"
          aria-label={`${product.title} haqqında rəyiniz`}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 sm:text-sm"
        />

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
          {product.existing ? "Rəyi yenilə" : "Rəyi göndər"}
        </button>
      </form>
    </li>
  );
}

/**
 * On a delivered order: a review for each product the customer received.
 * The reviews go on the product's page; an admin may pick some for the
 * home page.
 */
export function OrderProductReviews({ products }: { products: ReviewableProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Məhsulları qiymətləndirin</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Rəyiniz məhsulun səhifəsində adınızın qısaltması ilə göstərilir.
      </p>
      <ul className="mt-5 space-y-5">
        {products.map((product) => (
          <ProductReviewRow key={product.productId} product={product} />
        ))}
      </ul>
    </section>
  );
}
