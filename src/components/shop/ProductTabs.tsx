"use client";

import { useState } from "react";

type Tab = "description" | "reviews";

type StaticReview = {
  name: string;
  date: string;
  rating: number;
  comment: string;
};

const STATIC_RATING_AVERAGE = 4.8;
const STATIC_RATING_TOTAL = 128;
const STATIC_RATING_BREAKDOWN: { stars: number; count: number }[] = [
  { stars: 5, count: 96 },
  { stars: 4, count: 22 },
  { stars: 3, count: 7 },
  { stars: 2, count: 2 },
  { stars: 1, count: 1 },
];

const STATIC_REVIEWS: StaticReview[] = [
  {
    name: "Nurlan M.",
    date: "12 avqust 2026",
    rating: 5,
    comment: "Məhsul təsvirdə olduğu kimi idi, keyfiyyət əladır. Bağlama da möhkəm gəldi.",
  },
  {
    name: "Sevinc Ə.",
    date: "3 avqust 2026",
    rating: 5,
    comment: "İkinci dəfə sifariş edirəm — hər dəfə eyni keyfiyyət, tövsiyə edirəm.",
  },
  {
    name: "Rəşad Q.",
    date: "28 iyul 2026",
    rating: 4,
    comment: "Keyfiyyət yaxşıdır, çatdırılma bir gün gecikdi.",
  },
];

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

function ReviewsSummary() {
  return (
    <div className="grid gap-6 rounded-2xl bg-zinc-50 p-5 ring-1 ring-zinc-100 sm:grid-cols-[auto_1fr] sm:p-6">
      <div className="text-center sm:border-r sm:border-zinc-200 sm:pr-6">
        <div className="text-4xl font-semibold text-zinc-900">
          {STATIC_RATING_AVERAGE.toFixed(1)}
        </div>
        <StarRow rating={STATIC_RATING_AVERAGE} className="mt-1 justify-center" />
        <p className="mt-1 text-xs text-zinc-500">
          {STATIC_RATING_TOTAL} rəy əsasında
        </p>
      </div>
      <div className="space-y-1.5">
        {STATIC_RATING_BREAKDOWN.map((row) => (
          <div key={row.stars} className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="w-3 shrink-0">{row.stars}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: `${(row.count / STATIC_RATING_TOTAL) * 100}%`,
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-right">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductTabs({ description }: { description: string }) {
  const [tab, setTab] = useState<Tab>("description");

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
          Rəylər ({STATIC_RATING_TOTAL})
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
            <ReviewsSummary />
            <div className="space-y-3">
              {STATIC_REVIEWS.map((review) => (
                <div
                  key={review.name}
                  className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                        {initials(review.name)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {review.name}
                        </div>
                        <div className="text-xs text-zinc-500">{review.date}</div>
                      </div>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
