/** Cache tag of the home page's picked reviews. */
export const FEATURED_REVIEWS_TAG = "featured-product-reviews";

/** Admin tabs on /admin/reviews. */
export const REVIEW_FILTERS = [
  { id: "all", label: "Hamısı" },
  { id: "featured", label: "Ana səhifədə" },
] as const;

export type ReviewFilter = (typeof REVIEW_FILTERS)[number]["id"];
