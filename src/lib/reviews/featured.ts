import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { FEATURED_REVIEWS_TAG } from "@/lib/reviews/featured-constants";

/** A product review an admin put on the home page. */
export type FeaturedReview = {
  id: string;
  rating: number;
  comment: string;
  /** "Nərgiz H." */
  displayName: string;
  productId: string;
  productTitle: string;
};

async function fetchFeaturedReviews(limit: number): Promise<FeaturedReview[]> {
  const supabase = createPublicClient();
  // Through the security-definer function: the reviewer's name sits in
  // profiles, which RLS hides from visitors.
  const { data, error } = await supabase.rpc("list_featured_product_reviews", { p_limit: limit });

  if (error) {
    console.error("[reviews.getFeaturedReviews]", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    displayName: row.display_name,
    productId: row.product_id,
    productTitle: row.product_title,
  }));
}

/** The product reviews on the home page, newest pick first. */
export function getFeaturedReviews(limit = 3) {
  return unstable_cache(
    async () => fetchFeaturedReviews(limit),
    ["featured-product-reviews", String(limit)],
    { revalidate: 300, tags: [FEATURED_REVIEWS_TAG] },
  )();
}

export type AdminProductReview = {
  id: string;
  rating: number;
  comment: string | null;
  featuredAt: string | null;
  createdAt: string;
  updatedAt: string;
  customerName: string | null;
  productId: string;
  productTitle: string | null;
};

/** Every product review, newest first, for the admin to pick from. */
export async function getAdminProductReviews(): Promise<AdminProductReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      "id, rating, comment, featured_at, created_at, updated_at, product_id, customer:profiles!product_reviews_customer_id_fkey (full_name), product:products!product_reviews_product_id_fkey (title)",
    )
    .order("updated_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[reviews.getAdminProductReviews]", error.message);
    return [];
  }

  type Row = {
    id: string;
    rating: number;
    comment: string | null;
    featured_at: string | null;
    created_at: string;
    updated_at: string;
    product_id: string;
    customer: { full_name: string | null } | null;
    product: { title: string } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    featuredAt: row.featured_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerName: row.customer?.full_name ?? null,
    productId: row.product_id,
    productTitle: row.product?.title ?? null,
  }));
}
