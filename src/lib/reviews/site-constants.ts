import type { SiteReview } from "@/types";

export const SITE_REVIEW_MIN_LENGTH = 10;
export const SITE_REVIEW_MAX_LENGTH = 500;
export const SITE_REVIEWS_TAG = "site-reviews";

export type ReviewFilter = SiteReview["status"];

/** Admin tabs, one per review status. */
export const REVIEW_FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: "pending", label: "Gözləyən" },
  { id: "approved", label: "Ana səhifədə" },
  { id: "hidden", label: "Gizlədilən" },
];
